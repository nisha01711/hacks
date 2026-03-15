# Scrapy settings for scrapy_collectors

import os

BOT_NAME = "scrapy_collectors"

SPIDER_MODULES = ["scrapy_collectors.spiders"]
NEWSPIDER_MODULE = "scrapy_collectors.spiders"

# Keep this strict for real-world targets only if legally/compliantly permitted.
ROBOTSTXT_OBEY = False

DOWNLOADER_MIDDLEWARES = {
    "scrapy_collectors.middlewares.RotateUserAgentMiddleware": 400,
    "scrapy_collectors.middlewares.SmartRequestHeadersMiddleware": 410,
    "scrapy_collectors.middlewares.RetryBlockedResponseMiddleware": 540,
    "scrapy.downloadermiddlewares.retry.RetryMiddleware": 550,
}

USE_PLAYWRIGHT = os.getenv("USE_PLAYWRIGHT", "1") == "1" and os.name != "nt"

if USE_PLAYWRIGHT:
    DOWNLOAD_HANDLERS = {
        "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    }

    PLAYWRIGHT_BROWSER_TYPE = "chromium"
    PLAYWRIGHT_LAUNCH_OPTIONS = {
        "headless": True,
    }

DOWNLOAD_DELAY = 2
RANDOMIZE_DOWNLOAD_DELAY = True
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 2
RETRY_TIMES = 3
RETRY_HTTP_CODES = [403, 429, 500, 502, 503, 504]
COOKIES_ENABLED = False

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0

ITEM_PIPELINES = {
    "scrapy_collectors.pipelines.ValidateItemPipeline": 100,
    "scrapy_collectors.mongo_pipeline.MongoPipeline": 300,
    "scrapy_collectors.pipelines.JsonExportPipeline": 400,
}

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
LOG_LEVEL = "INFO"
