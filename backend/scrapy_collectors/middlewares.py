"""
Middlewares
===========
RotateUserAgentMiddleware — cycles through a pool of realistic user agents.
SmartRequestHeadersMiddleware — adds browser-like headers and referers.
RetryBlockedResponseMiddleware — retries blocked responses (403/429/503) with
fresh request fingerprints.
"""

import random
from urllib.parse import quote_plus

from scrapy import signals


DESKTOP_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) "
    "Gecko/20100101 Firefox/123.0",

    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:123.0) "
    "Gecko/20100101 Firefox/123.0",
]

BLOCKED_STATUS_CODES = {403, 429, 503}


def _detect_platform(url: str) -> str | None:
    lowered = url.lower()
    if "amazon." in lowered:
        return "amazon"
    if "flipkart.com" in lowered:
        return "flipkart"
    if "meesho.com" in lowered:
        return "meesho"
    if "myshopify.com" in lowered:
        return "shopify"
    return None


def _build_referer(platform: str | None, keyword: str | None) -> str:
    keyword_enc = quote_plus((keyword or "").strip())
    if platform == "amazon":
        return f"https://www.amazon.in/s?k={keyword_enc}" if keyword_enc else "https://www.amazon.in/"
    if platform == "flipkart":
        return f"https://www.flipkart.com/search?q={keyword_enc}" if keyword_enc else "https://www.flipkart.com/"
    if platform == "meesho":
        return f"https://www.meesho.com/search?q={keyword_enc}" if keyword_enc else "https://www.meesho.com/"
    if platform == "shopify":
        return "https://www.google.com/"
    return "https://www.google.com/"


class RotateUserAgentMiddleware:
    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        crawler.signals.connect(middleware.spider_opened, signal=signals.spider_opened)
        return middleware

    def process_request(self, request, spider):
        request.headers["User-Agent"] = random.choice(DESKTOP_USER_AGENTS)

    def spider_opened(self, spider):
        spider.logger.info("RotateUserAgentMiddleware active on %s", spider.name)


class SmartRequestHeadersMiddleware:
    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        crawler.signals.connect(middleware.spider_opened, signal=signals.spider_opened)
        return middleware

    def process_request(self, request, spider):
        keyword = getattr(spider, "keyword", "")
        platform = request.meta.get("platform") or _detect_platform(request.url)
        request.headers.setdefault("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        request.headers.setdefault("Accept-Language", "en-IN,en-US;q=0.9,en;q=0.8")
        request.headers.setdefault("Cache-Control", "no-cache")
        request.headers.setdefault("Pragma", "no-cache")
        request.headers.setdefault("DNT", "1")
        request.headers.setdefault("Upgrade-Insecure-Requests", "1")
        request.headers.setdefault("Sec-Fetch-Dest", "document")
        request.headers.setdefault("Sec-Fetch-Mode", "navigate")
        request.headers.setdefault("Sec-Fetch-Site", "same-origin")
        request.headers.setdefault("Sec-Fetch-User", "?1")
        request.headers.setdefault("Referer", _build_referer(platform, keyword))

    def spider_opened(self, spider):
        spider.logger.info("SmartRequestHeadersMiddleware active on %s", spider.name)


class RetryBlockedResponseMiddleware:
    MAX_RETRY = 2

    def process_response(self, request, response, spider):
        if response.status not in BLOCKED_STATUS_CODES:
            return response

        retry_count = int(request.meta.get("anti_block_retry", 0))
        if retry_count >= self.MAX_RETRY:
            spider.logger.warning(
                "Blocked response persisted after retries (status=%s, url=%s)",
                response.status,
                request.url,
            )
            return response

        retry_request = request.copy()
        retry_request.dont_filter = True
        retry_request.meta["anti_block_retry"] = retry_count + 1
        retry_request.headers["User-Agent"] = random.choice(DESKTOP_USER_AGENTS)
        retry_request.headers["Accept-Language"] = random.choice(
            [
                "en-IN,en-US;q=0.9,en;q=0.8",
                "en-GB,en-US;q=0.9,en;q=0.8",
                "en-US,en;q=0.9",
            ]
        )
        retry_request.headers["Cache-Control"] = "max-age=0"

        spider.logger.info(
            "Retrying blocked response (%s/%s, status=%s): %s",
            retry_count + 1,
            self.MAX_RETRY,
            response.status,
            request.url,
        )
        return retry_request
