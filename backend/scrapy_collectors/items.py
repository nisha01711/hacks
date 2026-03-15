import scrapy


class PricingItem(scrapy.Item):
    """Captures a product's pricing snapshot from a competitor page."""
    product_id       = scrapy.Field()   # unique identifier (ASIN, SKU, etc.)
    title            = scrapy.Field()   # product title
    platform         = scrapy.Field()   # e.g. "amazon", "walmart"
    url              = scrapy.Field()   # source URL
    price            = scrapy.Field()   # float, current price
    original_price   = scrapy.Field()   # float, before discount
    discount_pct     = scrapy.Field()   # float, e.g. 15.0 for 15%
    currency         = scrapy.Field()   # e.g. "USD"
    availability     = scrapy.Field()   # "In Stock" / "Out of Stock"
    seller           = scrapy.Field()   # seller / brand name
    category         = scrapy.Field()   # product category
    rating           = scrapy.Field()   # float, if available
    reviews          = scrapy.Field()   # int, if available
    keyword          = scrapy.Field()   # searched keyword for this crawl run
    job_id           = scrapy.Field()   # backend job id for traceability
    scraped_at       = scrapy.Field()   # ISO timestamp


class ReviewItem(scrapy.Item):
    """Captures a single product review for sentiment analysis."""
    review_id        = scrapy.Field()   # platform unique review ID
    product_id       = scrapy.Field()   # links back to PricingItem
    platform         = scrapy.Field()
    title            = scrapy.Field()   # review headline
    body             = scrapy.Field()   # full review text
    rating           = scrapy.Field()   # float  1.0–5.0
    verified         = scrapy.Field()   # bool — verified purchase
    helpful_votes    = scrapy.Field()   # int
    reviewer         = scrapy.Field()   # anonymised username
    date             = scrapy.Field()   # review date string
    scraped_at       = scrapy.Field()
