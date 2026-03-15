import os

from itemadapter import ItemAdapter
from pymongo import MongoClient


class MongoPipeline:
    def open_spider(self, spider):
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        mongo_db = os.getenv("MONGO_DB", "competitive_intel")
        self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        self.db = self.client[mongo_db]
        self.db.client.admin.command("ping")
        spider.logger.info("MongoPipeline connected: %s / %s", mongo_uri, mongo_db)

    def close_spider(self, spider):
        if getattr(self, "client", None):
            self.client.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        item_type = type(item).__name__
        doc = dict(adapter)

        collection = self.db["pricing"] if item_type == "PricingItem" else self.db["reviews"]

        # Deduplicate by job + platform + URL to avoid duplicate cards/details in a single run.
        filter_key = {
            "job_id": doc.get("job_id"),
            "platform": doc.get("platform"),
            "url": doc.get("url"),
        }
        collection.update_one(filter_key, {"$set": doc}, upsert=True)
        return item