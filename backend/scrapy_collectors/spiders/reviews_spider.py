"""
Reviews Spider
==============
Collects product reviews for sentiment analysis and material-complaint detection.

Usage:
    scrapy crawl reviews -a platform=amazon -a asin=B09G9HD6PD
    scrapy crawl reviews -a platform=amazon -a asin=B09G9HD6PD -a max_pages=10
"""

import hashlib
import re
from datetime import datetime, timezone

import scrapy

from scrapy_collectors.items import ReviewItem


class ReviewsSpider(scrapy.Spider):
    name = "reviews"
    custom_settings = {
        "FEEDS": {
            "data/reviews_%(time)s.json": {"format": "json", "overwrite": False},
        }
    }

    def __init__(self, platform="amazon", asin=None, max_pages=20, **kwargs):
        super().__init__(**kwargs)
        self.platform  = platform.lower()
        self.asin      = asin
        self.max_pages = int(max_pages)
        self.page      = 1

    # ------------------------------------------------------------------ #
    # Entry point                                                          #
    # ------------------------------------------------------------------ #

    def start_requests(self):
        if not self.asin:
            self.logger.error("Provide -a asin=<product_id>")
            return

        url = self._first_page_url()
        if url:
            yield scrapy.Request(url, callback=self.parse_reviews, meta={"page": 1})

    def _first_page_url(self):
        routes = {
            "amazon": f"https://www.amazon.com/product-reviews/{self.asin}/"
                      "?reviewerType=all_reviews&sortBy=recent&pageNumber=1",
        }
        url = routes.get(self.platform)
        if not url:
            self.logger.warning(f"Platform '{self.platform}' not yet configured in ReviewsSpider.")
        return url

    # ------------------------------------------------------------------ #
    # Parse reviews listing page                                           #
    # ------------------------------------------------------------------ #

    def parse_reviews(self, response):
        page = response.meta["page"]

        if self.platform == "amazon":
            yield from self._parse_amazon_reviews(response)
        # Add elif blocks here for new platforms

        # Pagination
        if page < self.max_pages:
            next_url = self._next_page_url(response, page + 1)
            if next_url:
                yield scrapy.Request(
                    next_url,
                    callback=self.parse_reviews,
                    meta={"page": page + 1},
                )

    # ------------------------------------------------------------------ #
    # Platform parsers                                                     #
    # ------------------------------------------------------------------ #

    def _parse_amazon_reviews(self, response):
        """
        Each review block is wrapped in div[data-hook='review'].
        We extract every sub-element with explicit data-hook attributes.
        """
        for review in response.css("div[data-hook='review']"):
            item = ReviewItem()
            item["platform"]   = "amazon"
            item["product_id"] = self.asin
            item["scraped_at"] = datetime.now(timezone.utc).isoformat()

            raw_id = review.attrib.get("id", "")
            item["review_id"] = raw_id or self._hash(review.css("::text").get(""))

            item["title"] = review.css(
                "a[data-hook='review-title'] span:not([class])::text"
            ).get("").strip()

            item["body"] = " ".join(
                review.css("span[data-hook='review-body'] span::text").getall()
            ).strip()

            rating_raw = review.css("i[data-hook='review-star-rating'] span::text").get("")
            item["rating"] = self._parse_rating(rating_raw)

            item["verified"] = bool(
                review.css("span[data-hook='avp-badge']").get()
            )

            helpful_raw = review.css(
                "span[data-hook='helpful-vote-statement']::text"
            ).get("0")
            item["helpful_votes"] = self._parse_helpful(helpful_raw)

            item["reviewer"] = review.css(
                "span.a-profile-name::text"
            ).get("").strip()

            item["date"] = review.css(
                "span[data-hook='review-date']::text"
            ).get("").strip()

            yield item

    # ------------------------------------------------------------------ #
    # Pagination helpers                                                   #
    # ------------------------------------------------------------------ #

    def _next_page_url(self, response, next_page):
        if self.platform == "amazon":
            return (
                f"https://www.amazon.com/product-reviews/{self.asin}/"
                f"?reviewerType=all_reviews&sortBy=recent&pageNumber={next_page}"
            )
        return None

    # ------------------------------------------------------------------ #
    # Static helpers                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_rating(raw: str) -> float:
        """'4.0 out of 5 stars' → 4.0"""
        match = re.search(r"(\d+\.?\d*)", raw)
        return float(match.group(1)) if match else 0.0

    @staticmethod
    def _parse_helpful(raw: str) -> int:
        """'42 people found this helpful' → 42"""
        match = re.search(r"(\d+)", raw.replace(",", ""))
        return int(match.group(1)) if match else 0

    @staticmethod
    def _hash(text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()[:12]
