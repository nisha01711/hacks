"""
Pricing Spider
==============
Crawls product listing / detail pages to capture competitor pricing.

Usage:
    scrapy crawl pricing -a platform=amazon -a keyword="wireless earbuds"
    scrapy crawl pricing -a urls_file=urls.txt
"""

import json
import os
import re
from datetime import datetime, timezone
from urllib.parse import quote_plus

import scrapy
from price_parser import Price
from scrapy_playwright.page import PageMethod

from scrapy_collectors.items import PricingItem


class PricingSpider(scrapy.Spider):
    name = "pricing"
    handle_httpstatus_list = [403, 429, 503]
    custom_settings = {
        "FEEDS": {
            "data/pricing_%(time)s.json": {"format": "json", "overwrite": False},
        }
    }

    # ------------------------------------------------------------------ #
    # Entry points                                                         #
    # ------------------------------------------------------------------ #

    def __init__(self, platform="amazon", keyword=None, urls_file=None, max_products=20, job_id=None, **kwargs):
        super().__init__(**kwargs)
        self.platform = platform.lower()
        self.keyword = keyword
        self.urls_file = urls_file
        self.max_products = int(max_products)
        self.job_id = job_id
        self._collected_links = 0

    def start_requests(self):
        # Option 1 — crawl from a keyword search
        if self.keyword:
            for url in self._search_urls(self.keyword):
                meta = self._request_meta()
                meta["platform"] = self.platform
                yield scrapy.Request(url, callback=self.parse_search, meta=meta)

        # Option 2 — crawl from a pre-built URL list (one URL per line)
        if self.urls_file:
            with open(self.urls_file) as f:
                for line in f:
                    url = line.strip()
                    if url:
                        meta = self._request_meta()
                        meta["platform"] = self.platform
                        yield scrapy.Request(url, callback=self.parse_product, meta=meta)

    def _request_meta(self):
        if os.name == "nt":
            return {}

        # Major marketplaces frequently render dynamic DOM/content.
        if self.platform in {"amazon", "flipkart", "meesho"}:
            return {
                "playwright": True,
                "playwright_include_page": False,
                "playwright_page_methods": [
                    PageMethod("wait_for_load_state", "networkidle"),
                    PageMethod("wait_for_timeout", 1800),
                ],
            }
        return {}

    def _search_urls(self, keyword):
        keyword_enc = quote_plus(keyword)
        routes = {
            "amazon": [
                f"https://www.amazon.in/s?k={keyword_enc}",
            ],
            "flipkart": [
                f"https://www.flipkart.com/search?q={keyword_enc}",
                f"https://www.flipkart.com/search?q={keyword_enc}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off",
                f"https://www.google.com/search?q=site:flipkart.com+{keyword_enc}",
            ],
            "meesho": [
                f"https://www.meesho.com/search?q={keyword_enc}",
                f"https://www.google.com/search?q=site:meesho.com+{keyword_enc}",
            ],
            # Google index is used to discover public Shopify stores by keyword.
            "shopify": [
                f"https://www.google.com/search?q=site:myshopify.com+{keyword_enc}+products",
            ],
        }
        urls = routes.get(self.platform)
        if urls:
            return urls
        self.logger.warning(f"Unknown platform '{self.platform}'. Add its search URL in _search_urls().")
        return []

    # ------------------------------------------------------------------ #
    # Search results page — extract product links                          #
    # ------------------------------------------------------------------ #

    def parse_search(self, response):
        if response.status in {403, 429, 503}:
            self.logger.warning("Search blocked (%s) on %s", response.status, response.url)
            return

        # First, try to capture listing-level data directly from search cards.
        # This is more resilient than relying only on product detail pages.
        yield from self._extract_listing_items(response)

        selectors = {
            "amazon": "div[data-component-type='s-search-result'] h2 a::attr(href)",
            "flipkart": "a.CGtC98::attr(href), a._1fQZEK::attr(href), a.IRpwTa::attr(href), a[href*='/p/']::attr(href), a[href*='/itm']::attr(href)",
            "meesho": "a[href*='/p/']::attr(href), a[href*='/products/']::attr(href)",
            "shopify": "div.yuRUbf a::attr(href), a[href]::attr(href)",
        }
        link_sel = selectors.get(self.platform, "a[href]::attr(href)")
        links = response.css(link_sel).getall()
        for link in links:
            if self._collected_links >= self.max_products:
                break
            self._collected_links += 1
            yield response.follow(link, callback=self.parse_product, meta=self._request_meta())

        # Pagination — follow "next page" if present
        next_page_selectors = {
            "amazon": "a.s-pagination-next::attr(href)",
            "flipkart": "a._1LKTO3[rel='next']::attr(href)",
            "meesho": "a[aria-label='Next']::attr(href)",
            "shopify": "a#pnnext::attr(href)",
        }
        next_page = response.css(next_page_selectors.get(self.platform, "")).get()
        if next_page:
            yield response.follow(next_page, callback=self.parse_search, meta=self._request_meta())

    def _extract_listing_items(self, response):
        emitted = 0

        if self.platform == "amazon":
            cards = response.css("div[data-component-type='s-search-result']")
            for card in cards:
                if emitted >= self.max_products:
                    break

                title = card.css("h2 span::text").get("").strip()
                link = card.css("h2 a::attr(href)").get()
                price = card.css("span.a-price > span.a-offscreen::text").get("")
                rating = card.css("span.a-icon-alt::text").re_first(r"([\d.]+)")
                reviews = card.css("span.a-size-base.s-underline-text::text").re_first(r"([\d,]+)")

                item = self._build_search_item(response, title, link, price, rating, reviews)
                if item:
                    emitted += 1
                    yield item

        elif self.platform == "flipkart":
            cards = response.css("div[data-id]")
            for card in cards:
                if emitted >= self.max_products:
                    break

                title = (
                    card.css("a.CGtC98::text").get("").strip()
                    or card.css("a.IRpwTa::text").get("").strip()
                    or card.css("a._1fQZEK::text").get("").strip()
                )
                link = (
                    card.css("a.CGtC98::attr(href)").get()
                    or card.css("a.IRpwTa::attr(href)").get()
                    or card.css("a._1fQZEK::attr(href)").get()
                )
                price = (
                    card.css("div.Nx9bqj.CxhGGd::text").get("")
                    or card.css("div._30jeq3::text").get("")
                )
                rating = card.css("div.XQDdHH::text").re_first(r"([\d.]+)")
                reviews = card.css("span.Wphh3N::text").re_first(r"([\d,]+)")

                item = self._build_search_item(response, title, link, price, rating, reviews)
                if item:
                    emitted += 1
                    yield item

        elif self.platform == "meesho":
            cards = response.css("a[href*='/p/'], a[href*='/products/']")
            for card in cards:
                if emitted >= self.max_products:
                    break

                title = card.css("h5::text, h4::text").get("").strip()
                link = card.attrib.get("href")
                text_blob = " ".join(card.css("*::text").getall())
                price = re.search(r"₹\s?[\d,]+", text_blob)
                price_value = price.group(0) if price else ""

                item = self._build_search_item(response, title, link, price_value, None, None)
                if item:
                    emitted += 1
                    yield item

    def _build_search_item(self, response, title, link, price_text, rating_text, reviews_text):
        parsed_price = Price.fromstring(price_text or "")
        if not parsed_price.amount:
            return None

        item = PricingItem()
        item["platform"] = self.platform
        item["url"] = response.urljoin(link) if link else response.url
        item["keyword"] = self.keyword
        item["job_id"] = self.job_id
        item["scraped_at"] = datetime.now(timezone.utc).isoformat()
        item["title"] = (title or "").strip()
        item["category"] = self._infer_category(item["title"], self.keyword)
        item["price"] = float(parsed_price.amount)
        item["currency"] = parsed_price.currency or "INR"
        item["original_price"] = None
        item["discount_pct"] = None

        if rating_text:
            try:
                item["rating"] = float(str(rating_text).replace(",", ""))
            except ValueError:
                pass

        if reviews_text:
            try:
                item["reviews"] = int(str(reviews_text).replace(",", ""))
            except ValueError:
                pass

        return item

    # ------------------------------------------------------------------ #
    # Product detail page — extract pricing data                          #
    # ------------------------------------------------------------------ #

    def parse_product(self, response):
        item = PricingItem()
        item["platform"]   = self.platform
        item["url"]        = response.url
        item["keyword"]    = self.keyword
        item["job_id"]     = self.job_id
        item["scraped_at"] = datetime.now(timezone.utc).isoformat()

        if self.platform == "amazon":
            self._parse_amazon(response, item)
        elif self.platform == "flipkart":
            self._parse_flipkart(response, item)
        elif self.platform == "meesho":
            self._parse_meesho(response, item)
        elif self.platform == "shopify":
            self._parse_shopify(response, item)
        else:
            self._parse_generic(response, item)

        yield item

    # ---- Amazon --------------------------------------------------------

    def _parse_amazon(self, response, item):
        item["product_id"] = self._amazon_asin(response.url)
        item["title"]      = response.css("#productTitle::text").get("").strip()
        item["seller"]     = response.css("#bylineInfo::text").get("").strip()
        item["category"]   = response.css("#wayfinding-breadcrumbs_feature_div span.a-list-item::text").get("").strip()
        if not item["category"]:
            item["category"] = self._infer_category(item.get("title", ""), self.keyword)

        price_str = (
            response.css("span.a-price > span.a-offscreen::text").get()
            or response.css("#priceblock_ourprice::text").get()
            or ""
        )
        original_str = response.css("span.a-text-price > span.a-offscreen::text").get() or ""
        self._fill_price(item, price_str, original_str)

        availability_raw = response.css("#availability span::text").get("").strip()
        item["availability"] = "In Stock" if "in stock" in availability_raw.lower() else availability_raw

    # ---- Flipkart ------------------------------------------------------

    def _parse_flipkart(self, response, item):
        item["product_id"] = self._flipkart_pid(response.url)
        item["title"] = (
            response.css("span.B_NuCI::text").get("").strip()
            or response.css("h1.yhB1nd span::text").get("").strip()
        )
        item["seller"] = response.css("span#sellerName span::text").get("").strip()
        item["category"] = self._infer_category(item.get("title", ""), self.keyword)

        price_str = (
            response.css("div._30jeq3._16Jk6d::text").get()
            or response.css("div.Nx9bqj.CxhGGd::text").get()
            or response.css("div._30jeq3::text").get()
            or ""
        )
        original_str = (
            response.css("div._3I9_wc._2p6lqe::text").get()
            or response.css("div.yRaY8j.A6+E6v::text").get()
            or response.css("div._3I9_wc::text").get()
            or ""
        )
        self._fill_price(item, price_str, original_str)

        availability_raw = (
            response.css("button._2KpZ6l._2U9uOA._3v1-ww::text").get("")
            or response.css("div._16FRp0::text").get("")
        )
        item["availability"] = availability_raw.strip() or "Unknown"

    # ---- Shopify -------------------------------------------------------

    def _parse_shopify(self, response, item):
        item["product_id"] = self._shopify_handle(response.url)
        self._parse_generic(response, item)
        item["title"] = item.get("title") or response.css("title::text").get("").strip()
        item["seller"] = item.get("seller") or self._extract_hostname(response.url)
        item["availability"] = item.get("availability") or "Unknown"
        item["category"] = item.get("category") or self._infer_category(item.get("title", ""), self.keyword)

    # ---- Meesho --------------------------------------------------------

    def _parse_meesho(self, response, item):
        item["product_id"] = self._meesho_pid(response.url)
        item["title"] = (
            response.css("h1::text").get("").strip()
            or response.css("title::text").get("").strip()
        )

        price_str = (
            response.css("h4::text").re_first(r"\u20b9\s?[\d,]+")
            or response.css("span::text").re_first(r"\u20b9\s?[\d,]+")
            or ""
        )
        original_str = (
            response.css("span::text").re_first(r"\u20b9\s?[\d,]+")
            or ""
        )
        self._fill_price(item, price_str, original_str)

        item["currency"] = item.get("currency") or "INR"
        item["seller"] = item.get("seller") or "Meesho Seller"
        item["availability"] = item.get("availability") or "In Stock"
        item["category"] = self._infer_category(item.get("title", ""), self.keyword)

    # ---- Generic fallback ----------------------------------------------

    def _parse_generic(self, response, item):
        # JSON-LD Product schema — works on many e-commerce sites
        json_ld = response.css('script[type="application/ld+json"]::text').getall()
        for blob in json_ld:
            try:
                data = json.loads(blob)
                if isinstance(data, list):
                    data = next((entry for entry in data if isinstance(entry, dict)), {})
                if data.get("@type") == "Product":
                    item["title"]      = data.get("name", "")
                    item["product_id"] = data.get("sku", data.get("mpn", ""))
                    offers = data.get("offers", {})
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    item["price"]      = float(offers.get("price", 0) or 0)
                    item["currency"]   = offers.get("priceCurrency", "USD")
                    item["availability"] = offers.get("availability", "")
                    brand = data.get("brand", {})
                    if isinstance(brand, dict):
                        item["seller"] = brand.get("name", "")
                    elif isinstance(brand, str):
                        item["seller"] = brand
                    item["category"] = (
                        data.get("category")
                        or item.get("category")
                        or self._infer_category(item.get("title", ""), self.keyword)
                    )
                    break
            except (json.JSONDecodeError, TypeError):
                continue

    @staticmethod
    def _infer_category(title, keyword):
        text = f"{title or ''} {keyword or ''}".lower()
        if "sunscreen" in text or "spf" in text:
            return "Sunscreen"
        if "serum" in text:
            return "Serum"
        if "moistur" in text:
            return "Moisturizer"
        if "face wash" in text or "cleanser" in text:
            return "Cleanser"
        if keyword:
            return str(keyword).strip().title()
        return "General"

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _amazon_asin(url):
        match = re.search(r"/dp/([A-Z0-9]{10})", url)
        return match.group(1) if match else ""

    @staticmethod
    def _flipkart_pid(url):
        match = re.search(r"[?&]pid=([A-Z0-9]+)", url)
        return match.group(1) if match else ""

    @staticmethod
    def _shopify_handle(url):
        match = re.search(r"/products/([^/?#]+)", url)
        return match.group(1) if match else ""

    @staticmethod
    def _meesho_pid(url):
        match = re.search(r"/(?:p|products)/([^/?#]+)", url)
        return match.group(1) if match else ""

    @staticmethod
    def _extract_hostname(url):
        match = re.search(r"https?://([^/]+)", url)
        return match.group(1) if match else ""

    @staticmethod
    def _fill_price(item, price_str, original_str):
        parsed = Price.fromstring(price_str)
        item["price"]          = float(parsed.amount) if parsed.amount else None
        item["currency"]       = parsed.currency or "USD"
        orig = Price.fromstring(original_str)
        item["original_price"] = float(orig.amount) if orig.amount else None

        if item.get("price") and item.get("original_price"):
            item["discount_pct"] = round(
                (1 - item["price"] / item["original_price"]) * 100, 2
            )
        else:
            item["discount_pct"] = None
