"""
Pipelines
=========
1. ValidateItemPipeline  — drops incomplete / malformed items
2. MongoDBPipeline       — upserts items to MongoDB (dedup by product_id + scraped_at date)
3. JsonExportPipeline    — appends raw items to a newline-delimited JSON file
"""

import json
import logging
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from itemadapter import ItemAdapter

load_dotenv()

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# 1. Validate                                                                   #
# --------------------------------------------------------------------------- #

class ValidateItemPipeline:
    REQUIRED_FIELDS = {
        "PricingItem": ["url", "platform"],
        "ReviewItem":  ["product_id", "platform", "body"],
    }

    def process_item(self, item, spider):
        item_type = type(item).__name__
        required  = self.REQUIRED_FIELDS.get(item_type, [])
        adapter   = ItemAdapter(item)

        for field in required:
            if not adapter.get(field):
                raise DropItem(f"[{item_type}] Missing required field: {field}")

        return item


# --------------------------------------------------------------------------- #
# 2. MongoDB                                                                    #
# --------------------------------------------------------------------------- #

class MongoDBPipeline:
    def open_spider(self, spider):
        try:
            import pymongo
            uri     = os.getenv("MONGO_URI", "mongodb://localhost:27017")
            db_name = os.getenv("MONGO_DB",  "competitive_intel")
            self.client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
            self.db     = self.client[db_name]
            self.client.admin.command("ping")  # fail fast if Mongo is unreachable
            logger.info("MongoDB connected: %s / %s", uri, db_name)
        except Exception as exc:
            logger.warning("MongoDB unavailable (%s). Items will NOT be stored in Mongo.", exc)
            self.db = None

    def close_spider(self, spider):
        if hasattr(self, "client") and self.client:
            self.client.close()

    def process_item(self, item, spider):
        if not self.db:
            return item

        item_type  = type(item).__name__
        collection = self.db["pricing"] if item_type == "PricingItem" else self.db["reviews"]
        adapter    = ItemAdapter(item)
        doc        = dict(adapter)

        # Upsert key: product_id + date portion of scraped_at (one record per product per day)
        scraped_date = doc.get("scraped_at", "")[:10]
        filter_key   = {
            "product_id": doc.get("product_id") or doc.get("url"),
            "platform":   doc.get("platform"),
            "job_id":     doc.get("job_id"),
            "_date":      scraped_date,
        }
        doc["_date"] = scraped_date

        collection.update_one(filter_key, {"$set": doc}, upsert=True)
        return item


# --------------------------------------------------------------------------- #
# 3. JSON Export                                                                #
# --------------------------------------------------------------------------- #

class JsonExportPipeline:
    def open_spider(self, spider):
        os.makedirs("data", exist_ok=True)
        date_str        = datetime.now(timezone.utc).strftime("%Y%m%d")
        fname           = f"data/{spider.name}_{date_str}.jsonl"
        self.file       = open(fname, "a", encoding="utf-8")
        logger.info("JsonExportPipeline writing to %s", fname)

    def close_spider(self, spider):
        self.file.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        line    = json.dumps(dict(adapter), ensure_ascii=False)
        self.file.write(line + "\n")
        return item


# --------------------------------------------------------------------------- #
# Import DropItem here so pipelines above can use it without circular imports  #
# --------------------------------------------------------------------------- #
from scrapy.exceptions import DropItem  # noqa: E402 — intentional late import
