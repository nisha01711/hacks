import json
import math
import os
import re
import subprocess
import sys
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from api.schemas import ResearchResult
from dotenv import load_dotenv
from pymongo import MongoClient

PLATFORM_LABELS = {
    "amazon": "Amazon",
    "flipkart": "Flipkart",
    "meesho": "Meesho",
    "shopify": "Shopify",
}

PLATFORM_SEARCH_URL = {
    "amazon": "https://www.amazon.in/s?k={keyword}",
    "flipkart": "https://www.flipkart.com/search?q={keyword}",
    "meesho": "https://www.meesho.com/search?q={keyword}",
    "shopify": "https://www.google.com/search?q=site:myshopify.com+{keyword}",
}


class ResearchQueueRunner:
    """In-memory job queue with background worker execution for real-time research jobs."""

    def __init__(self, backend_root: Path):
        self.backend_root = backend_root
        self.scrapy_root = backend_root / "scrapy_collectors"
        self.jobs_dir = backend_root / "data" / "jobs"
        self.jobs_dir.mkdir(parents=True, exist_ok=True)

        load_dotenv(backend_root / ".env")
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        mongo_db = os.getenv("MONGO_DB", "competitive_intel")
        self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        self.mongo_db = self.mongo_client[mongo_db]
        self._ensure_indexes()

        self._jobs: dict[str, dict] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=3)

    def _ensure_indexes(self) -> None:
        pricing = self.mongo_db["pricing"]
        pricing.create_index(
            [("job_id", 1), ("platform", 1), ("url", 1)],
            unique=True,
            name="uniq_job_platform_url",
        )
        pricing.create_index([("keyword", 1), ("scraped_at", -1)], name="keyword_scraped_at")
        pricing.create_index([("platform", 1), ("scraped_at", -1)], name="platform_scraped_at")
        pricing.create_index([("scraped_at", -1)], name="scraped_at_desc")
        final_outputs = self.mongo_db["final_outputs"]
        final_outputs.create_index([("job_id", 1)], unique=True, name="uniq_final_output_job")
        final_outputs.create_index([("updated_at", -1)], name="final_output_updated_at")
        reviews = self.mongo_db["reviews"]
        reviews.create_index(
            [("job_id", 1), ("platform", 1), ("product_name", 1), ("price_band", 1)],
            unique=True,
            name="uniq_review_row",
        )
        insights = self.mongo_db["insights"]
        insights.create_index([("job_id", 1)], unique=True, name="uniq_insight_job")
        crawl_jobs = self.mongo_db["crawl_jobs"]
        crawl_jobs.create_index(
            [("job_id", 1), ("platform", 1)],
            unique=True,
            name="uniq_crawl_job_platform",
        )

    def create_job(self, keyword: str, platforms: list[str], max_products: int) -> str:
        job_id = uuid.uuid4().hex[:12]
        with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "status": "queued",
                "keyword": keyword,
                "platforms": platforms,
                "max_products": max_products,
                "result": None,
                "errors": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        self._executor.submit(self._run_job, job_id)
        return job_id

    def get_job(self, job_id: str) -> dict | None:
        with self._lock:
            return self._jobs.get(job_id)

    def get_sentiment_snapshot(self, keyword: str) -> dict:
        collection = self.mongo_db["pricing"]
        query: dict = {"price": {"$gt": 0}}
        if keyword.strip():
            query["keyword"] = keyword.strip()

        docs = list(collection.find(query, {"_id": 0}).sort("scraped_at", -1).limit(300))
        generated_at = datetime.now(timezone.utc).isoformat()

        if not docs:
            return {
                "keyword": keyword,
                "overallScore": 0.0,
                "confidence": 0.0,
                "distribution": [
                    {"name": "Positive", "value": 0},
                    {"name": "Neutral", "value": 0},
                    {"name": "Negative", "value": 0},
                ],
                "platformStats": [],
                "topPositiveThemes": [],
                "topNegativeThemes": [],
                "verdict": "No live review sentiment data available for this keyword yet.",
                "recommendation": "Run product research for this keyword to generate sentiment insights.",
                "generatedAt": generated_at,
                "hasLiveData": False,
            }

        analyzed_rows = [self._analyze_row_sentiment(doc) for doc in docs]
        distribution_counter = Counter(row["label"] for row in analyzed_rows)
        distribution = [
            {"name": "Positive", "value": int(distribution_counter.get("Positive", 0))},
            {"name": "Neutral", "value": int(distribution_counter.get("Neutral", 0))},
            {"name": "Negative", "value": int(distribution_counter.get("Negative", 0))},
        ]

        overall_score = round(sum(row["score"] for row in analyzed_rows) / len(analyzed_rows), 3)
        confidence = round(sum(row["confidence"] for row in analyzed_rows) / len(analyzed_rows), 3)

        by_platform: dict[str, list[dict]] = {}
        for row in analyzed_rows:
            by_platform.setdefault(row["platform"], []).append(row)

        platform_stats = []
        for platform, rows in by_platform.items():
            count = len(rows)
            labels = Counter(row["label"] for row in rows)
            platform_stats.append(
                {
                    "platform": platform,
                    "sentimentScore": round(sum(row["score"] for row in rows) / count, 3),
                    "confidence": round(sum(row["confidence"] for row in rows) / count, 3),
                    "positivePct": round((labels.get("Positive", 0) / count) * 100),
                    "neutralPct": round((labels.get("Neutral", 0) / count) * 100),
                    "negativePct": round((labels.get("Negative", 0) / count) * 100),
                    "sampleSize": count,
                }
            )

        platform_stats = sorted(platform_stats, key=lambda row: row["sentimentScore"], reverse=True)

        top_positive_themes = self._extract_themes(analyzed_rows, positive=True)
        top_negative_themes = self._extract_themes(analyzed_rows, positive=False)

        if overall_score >= 0.2:
            verdict = "Overall customer sentiment is positive with strong buying confidence."
            recommendation = "Prioritize products with high positive theme overlap and strong review confidence."
        elif overall_score <= -0.2:
            verdict = "Overall customer sentiment is negative and risk indicators are elevated."
            recommendation = "Avoid immediate purchase and inspect negative themes before buying."
        else:
            verdict = "Customer sentiment is mixed, so quality consistency differs across listings."
            recommendation = "Compare top-rated listings and avoid entries showing repeated negative themes."

        return {
            "keyword": keyword,
            "overallScore": overall_score,
            "confidence": confidence,
            "distribution": distribution,
            "platformStats": platform_stats,
            "topPositiveThemes": top_positive_themes,
            "topNegativeThemes": top_negative_themes,
            "verdict": verdict,
            "recommendation": recommendation,
            "generatedAt": generated_at,
            "hasLiveData": True,
        }

    def get_database_health_snapshot(self) -> dict:
        generated_at = datetime.now(timezone.utc).isoformat()
        start = datetime.now(timezone.utc)
        pricing = self.mongo_db["pricing"]

        try:
            self.mongo_client.admin.command("ping")
        except Exception:
            return {
                "status": "down",
                "database": self.mongo_db.name,
                "responseMs": 0.0,
                "pricingDocuments": 0,
                "uniqueKeywords": 0,
                "uniqueJobIds": 0,
                "liveSignalRows": 0,
                "fallbackRows": 0,
                "recentKeywords": [],
                "platformCoverage": [],
                "collections": [],
                "generatedAt": generated_at,
            }

        pricing_documents = int(pricing.count_documents({}))
        live_signal_rows = int(pricing.count_documents({"signal": {"$not": re.compile("fallback", re.IGNORECASE)}}))
        fallback_rows = int(pricing.count_documents({"signal": re.compile("fallback", re.IGNORECASE)}))

        unique_keywords = len(pricing.distinct("keyword"))
        unique_job_ids = len(pricing.distinct("job_id"))

        keyword_docs = list(
            pricing.find({"keyword": {"$exists": True, "$ne": ""}}, {"_id": 0, "keyword": 1, "scraped_at": 1})
            .sort("scraped_at", -1)
            .limit(20)
        )
        recent_keywords = []
        for doc in keyword_docs:
            kw = str(doc.get("keyword", "")).strip()
            if kw and kw not in recent_keywords:
                recent_keywords.append(kw)
            if len(recent_keywords) >= 8:
                break

        platform_pipeline = [
            {"$group": {"_id": "$platform", "value": {"$sum": 1}}},
            {"$sort": {"value": -1}},
        ]
        platform_coverage = [
            {
                "name": PLATFORM_LABELS.get(str(row.get("_id", "")).lower(), str(row.get("_id", "Unknown")).title()),
                "value": int(row.get("value", 0)),
            }
            for row in pricing.aggregate(platform_pipeline)
        ]

        collections = []
        for name in sorted(self.mongo_db.list_collection_names()):
            latest_doc = self.mongo_db[name].find_one({}, {"_id": 0, "scraped_at": 1}, sort=[("scraped_at", -1)])
            collections.append(
                {
                    "collection": name,
                    "documents": int(self.mongo_db[name].count_documents({})),
                    "latestScrapedAt": str(latest_doc.get("scraped_at")) if latest_doc and latest_doc.get("scraped_at") else None,
                }
            )

        response_ms = round((datetime.now(timezone.utc) - start).total_seconds() * 1000, 2)
        status = "ok" if pricing_documents > 0 else "degraded"

        return {
            "status": status,
            "database": self.mongo_db.name,
            "responseMs": response_ms,
            "pricingDocuments": pricing_documents,
            "uniqueKeywords": unique_keywords,
            "uniqueJobIds": unique_job_ids,
            "liveSignalRows": live_signal_rows,
            "fallbackRows": fallback_rows,
            "recentKeywords": recent_keywords,
            "platformCoverage": platform_coverage,
            "collections": collections,
            "generatedAt": generated_at,
        }

    def get_dashboard_snapshot(self) -> dict:
        collection = self.mongo_db["pricing"]
        docs = list(
            collection.find({"price": {"$gt": 0}}, {"_id": 0}).sort("scraped_at", -1).limit(200)
        )

        generated_at = datetime.now(timezone.utc).isoformat()
        if not docs:
            return {
                "metrics": [
                    {"label": "Products Compared", "value": "0", "change": "Live"},
                    {"label": "Deals Tracked", "value": "0", "change": "Live"},
                    {"label": "Price Drop Alerts", "value": "0", "change": "Live"},
                    {"label": "Smart Tips Generated", "value": "0", "change": "Live"},
                ],
                "priceTrendData": [],
                "sentimentData": [
                    {"name": "Positive", "value": 0},
                    {"name": "Neutral", "value": 0},
                    {"name": "Negative", "value": 0},
                ],
                "opportunityData": [
                    {"category": "Savings", "score": 0},
                    {"category": "Quality", "score": 0},
                    {"category": "Value", "score": 0},
                    {"category": "Trust", "score": 0},
                ],
                "recentAlerts": ["No live dashboard data yet. Run a product comparison to populate this page."],
                "competitorActivity": ["Waiting for live marketplace data from MongoDB."],
                "strategyRecommendations": ["Search for a product first to generate real-time buying insights."],
                "generatedAt": generated_at,
                "hasLiveData": False,
            }

        docs = list(reversed(docs))
        latest_half = docs[len(docs) // 2 :] if len(docs) > 1 else docs
        previous_half = docs[: len(docs) // 2]

        unique_titles = {str(doc.get("title", "")).strip() for doc in docs if str(doc.get("title", "")).strip()}
        live_docs = [doc for doc in docs if "fallback" not in str(doc.get("signal", "")).lower()]
        price_drop_alerts = self._build_price_drop_alerts(docs)
        recommendations = self._build_dashboard_recommendations(docs)

        metrics = [
            {
                "label": "Products Compared",
                "value": str(len(unique_titles) or len(docs)),
                "change": self._format_metric_change(len({str(doc.get('title', '')).strip() for doc in latest_half if str(doc.get('title', '')).strip()}), len({str(doc.get('title', '')).strip() for doc in previous_half if str(doc.get('title', '')).strip()})),
            },
            {
                "label": "Deals Tracked",
                "value": str(len(live_docs)),
                "change": self._format_metric_change(len([doc for doc in latest_half if "fallback" not in str(doc.get("signal", "")).lower()]), len([doc for doc in previous_half if "fallback" not in str(doc.get("signal", "")).lower()])),
            },
            {
                "label": "Price Drop Alerts",
                "value": str(len(price_drop_alerts)),
                "change": self._format_metric_change(len(self._build_price_drop_alerts(latest_half)), len(self._build_price_drop_alerts(previous_half))),
            },
            {
                "label": "Smart Tips Generated",
                "value": str(len(recommendations)),
                "change": self._format_metric_change(len(recommendations), len(self._build_dashboard_recommendations(previous_half))),
            },
        ]

        snapshot = {
            "metrics": metrics,
            "priceTrendData": self._build_price_trend(docs),
            "sentimentData": self._build_sentiment_breakdown(docs),
            "opportunityData": self._build_opportunity_scores(docs),
            "recentAlerts": price_drop_alerts,
            "competitorActivity": self._build_marketplace_activity(docs),
            "strategyRecommendations": recommendations,
            "generatedAt": generated_at,
            "hasLiveData": True,
        }
        return snapshot

    def _run_job(self, job_id: str) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            job["status"] = "running"

        keyword = job["keyword"]
        platforms = job["platforms"]
        max_products = job["max_products"]

        platform_payload: dict[str, list[dict]] = {platform: [] for platform in platforms}
        errors: list[str] = []

        futures = {
            self._executor.submit(
                self._run_platform_crawl, job_id, platform, keyword, max_products
            ): platform
            for platform in platforms
        }

        for future in as_completed(futures):
            platform = futures[future]
            try:
                platform_payload[platform] = future.result()
            except Exception as exc:  # noqa: BLE001 - keep job alive for partial output
                errors.append(f"{platform}: {exc}")

        with self._lock:
            job_ref = self._jobs.get(job_id)

        if not job_ref:
            return

        try:
            result = self._build_result(job_id, keyword, platforms)
            status = "completed"
        except Exception as exc:  # noqa: BLE001 - report clear failure to API consumers
            errors.append(str(exc))
            result = None
            status = "failed"

        self._persist_crawl_job_docs(
            job_id=job_id,
            keyword=keyword,
            platforms=platforms,
            platform_payload=platform_payload,
            errors=errors,
        )

        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]["status"] = status
                self._jobs[job_id]["result"] = result
                self._jobs[job_id]["errors"] = errors

    def persist_final_output(
        self,
        job_id: str,
        keyword: str,
        result: dict,
        source: str,
        is_ai_enriched: bool,
    ) -> dict:
        now_iso = datetime.now(timezone.utc).isoformat()
        validated = ResearchResult.model_validate(result).model_dump()
        collection = self.mongo_db["final_outputs"]

        collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "job_id": job_id,
                    "keyword": keyword.strip(),
                    "result": validated,
                    "source": source,
                    "is_ai_enriched": bool(is_ai_enriched),
                    "updated_at": now_iso,
                },
                "$setOnInsert": {
                    "created_at": now_iso,
                },
            },
            upsert=True,
        )

        # Mirror finalized row-level fields back into pricing for easier auditing in Compass.
        pricing = self.mongo_db["pricing"]
        for row in validated.get("rows", []):
            source_url = str(row.get("sourceUrl") or "").strip()
            if not source_url:
                continue

            platform_name = str(row.get("platform") or "").strip()
            platform_code = platform_name.lower()
            timestamp_date = now_iso[:10]

            pricing.update_one(
                {"job_id": job_id, "platform": platform_code, "url": source_url},
                {
                    "$set": {
                        "job_id": job_id,
                        "keyword": keyword.strip(),
                        "platform": platform_code,
                        "url": source_url,
                        "product_name": row.get("product"),
                        "price": row.get("price"),
                        "rating": row.get("rating"),
                        "review_count": row.get("reviews"),
                        "product_url": source_url,
                        "timestamp": timestamp_date,
                        "finalized": True,
                        "finalized_at": now_iso,
                        "final_category": row.get("category"),
                        "final_spf": row.get("spf"),
                        "final_form": row.get("form"),
                        "final_use_case": row.get("useCase"),
                        "final_sentiment": row.get("sentiment"),
                    }
                },
                upsert=True,
            )

            self.mongo_db["reviews"].update_one(
                {
                    "job_id": job_id,
                    "platform": platform_name,
                    "product_name": row.get("product"),
                    "price_band": row.get("priceBand"),
                },
                {
                    "$set": {
                        "job_id": job_id,
                        "product_name": row.get("product"),
                        "platform": platform_name,
                        "review_text": row.get("signal") or "No detailed review text available",
                        "rating": row.get("rating"),
                        "sentiment": str((row.get("sentiment") or "neutral")).lower(),
                        "timestamp": timestamp_date,
                    },
                    "$setOnInsert": {
                        "created_at": now_iso,
                    },
                },
                upsert=True,
            )

        summary = validated.get("summary", {})
        insight_confidence = 0.87 if is_ai_enriched else 0.74
        self.mongo_db["insights"].update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "job_id": job_id,
                    "product_name": str(summary.get("searchedKeyword") or keyword).strip().title(),
                    "insight": summary.get("bestBuyReason") or "No strategic insight generated.",
                    "suggested_strategy": summary.get("recommendation") or "Run another crawl for better confidence.",
                    "confidence": round(insight_confidence, 2),
                    "generated_at": now_iso,
                },
                "$setOnInsert": {
                    "created_at": now_iso,
                },
            },
            upsert=True,
        )

        return {
            "status": "stored",
            "job_id": job_id,
            "storedAt": now_iso,
        }

    def _persist_crawl_job_docs(
        self,
        job_id: str,
        keyword: str,
        platforms: list[str],
        platform_payload: dict[str, list[dict]],
        errors: list[str],
    ) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()
        timestamp_date = now_iso[:10]
        collection = self.mongo_db["crawl_jobs"]
        errors_text = " | ".join(errors).lower()

        for platform in platforms:
            items_scraped = len(platform_payload.get(platform, []))
            has_error = f"{platform}:" in errors_text
            status = "failed" if has_error else "completed"
            collection.update_one(
                {"job_id": job_id, "platform": PLATFORM_LABELS.get(platform, platform.title())},
                {
                    "$set": {
                        "job_id": job_id,
                        "platform": PLATFORM_LABELS.get(platform, platform.title()),
                        "search_query": keyword,
                        "status": status,
                        "items_scraped": items_scraped,
                        "timestamp": timestamp_date,
                        "updated_at": now_iso,
                    },
                    "$setOnInsert": {
                        "created_at": now_iso,
                    },
                },
                upsert=True,
            )

    def _run_platform_crawl(
        self,
        job_id: str,
        platform: str,
        keyword: str,
        max_products: int,
    ) -> list[dict]:
        output_file = self.jobs_dir / f"{job_id}_{platform}.json"
        if output_file.exists():
            output_file.unlink()

        command = [
            sys.executable,
            "-m",
            "scrapy",
            "crawl",
            "pricing",
            "-a",
            f"platform={platform}",
            "-a",
            f"keyword={keyword}",
            "-a",
            f"job_id={job_id}",
            "-a",
            f"max_products={max_products}",
            "-O",
            str(output_file),
        ]

        completed = subprocess.run(
            command,
            cwd=self.scrapy_root,
            env={
                **os.environ,
                "PYTHONPATH": str(self.backend_root),
            },
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )

        if completed.returncode != 0:
            stderr_preview = (completed.stderr or completed.stdout)[-300:]
            raise RuntimeError(f"crawl failed (code={completed.returncode}) {stderr_preview}")

        if not output_file.exists():
            return []

        try:
            with output_file.open("r", encoding="utf-8") as file:
                parsed = json.load(file)
                if isinstance(parsed, list):
                    return [entry for entry in parsed if isinstance(entry, dict)]
        except json.JSONDecodeError:
            return []

        return []

    def _build_result(self, job_id: str, keyword: str, platforms: list[str]) -> dict:
        platform_payload = self._read_pricing_rows_from_db(job_id, keyword, platforms)
        rows = []

        for platform in platforms:
            entries = platform_payload.get(platform, [])
            rows.extend(self._to_frontend_rows_for_platform(keyword, platform, entries))

        priced_rows = [row for row in rows if isinstance(row.get("price"), (int, float)) and row.get("price", 0) > 0]
        rated_rows = [row for row in rows if isinstance(row.get("rating"), (int, float))]

        best_price_row = min(priced_rows, key=lambda row: row["price"]) if priced_rows else None
        best_rating_row = max(rated_rows, key=lambda row: row["rating"]) if rated_rows else None
        avg_price = round(sum(row["price"] for row in priced_rows) / len(priced_rows), 2) if priced_rows else 0.0
        best_buy = self._derive_best_buy(rows)

        result = {
            "rows": rows,
            "summary": {
                "searchedKeyword": keyword,
                "bestPricePlatform": best_price_row["platform"] if best_price_row else None,
                "bestRatedPlatform": best_rating_row["platform"] if best_rating_row else None,
                "bestBuyPlatform": best_buy["platform"],
                "bestBuyReason": best_buy["reason"],
                "avgPrice": avg_price,
                "totalProducts": len(rows),
                "catalogCoverage": best_buy["coverage"],
                "recommendation": best_buy["recommendation"],
            },
        }

        # Validate outgoing schema so frontend always receives expected structure.
        return ResearchResult.model_validate(result).model_dump()

    def _read_pricing_rows_from_db(self, job_id: str, keyword: str, platforms: list[str]) -> dict[str, list[dict]]:
        collection = self.mongo_db["pricing"]
        payload: dict[str, list[dict]] = {platform: [] for platform in platforms}

        cursor = collection.find(
            {
                "job_id": job_id,
                "keyword": keyword,
                "platform": {"$in": platforms},
                "price": {"$gt": 0},
            },
            {
                "_id": 0,
            },
        ).sort("scraped_at", -1)

        for doc in cursor:
            platform = str(doc.get("platform", "")).lower()
            if platform in payload:
                payload[platform].append(doc)

        return payload

    @staticmethod
    def _pick_price_tier_entries(entries: list[dict]) -> dict[str, dict]:
        priced_entries = [
            entry
            for entry in entries
            if isinstance(entry.get("price"), (int, float)) and float(entry.get("price", 0)) > 0
        ]
        if not priced_entries:
            return {}

        sorted_entries = sorted(priced_entries, key=lambda entry: float(entry.get("price", 0)))
        if len(sorted_entries) == 1:
            return {"Low": sorted_entries[0]}
        if len(sorted_entries) == 2:
            return {"Low": sorted_entries[0], "High": sorted_entries[-1]}
        low = sorted_entries[0]
        medium = sorted_entries[len(sorted_entries) // 2]
        high = sorted_entries[-1]
        return {"Low": low, "Medium": medium, "High": high}

    def _to_frontend_rows_for_platform(self, keyword: str, platform: str, entries: list[dict]) -> list[dict]:
        tiers = self._pick_price_tier_entries(entries)
        rows = []
        size_by_band = {
            "Low": "Small",
            "Medium": "Medium",
            "High": "Large",
        }

        for band in ["Low", "Medium", "High"]:
            entry = tiers.get(band)
            if entry is None:
                continue

            row = self._to_frontend_row(keyword, platform, entry, band)
            row["size"] = size_by_band[band]

            rows.append(row)

        return rows

    @staticmethod
    def _hash_int(value: str) -> int:
        total = 0
        for idx, char in enumerate(value, start=1):
            total += idx * ord(char)
        return abs(total)

    def _to_frontend_row(self, keyword: str, platform: str, entry: dict | None, price_band: str) -> dict:
        platform_label = PLATFORM_LABELS[platform]
        title = str((entry or {}).get("title") or "").strip()
        raw_category = str((entry or {}).get("category") or "").strip()
        category = raw_category or self._derive_category(keyword, title)
        parsed_attributes = self._extract_product_attributes(title)
        source_url = (
            str((entry or {}).get("url") or "")
            or PLATFORM_SEARCH_URL[platform].format(keyword=keyword.replace(" ", "+"))
        )

        price = self._safe_float((entry or {}).get("price"), fallback=0.0)
        rating = self._safe_float((entry or {}).get("rating"), fallback=None)
        reviews = self._safe_int((entry or {}).get("reviews"), fallback=None)

        availability = str((entry or {}).get("availability", "")).lower()
        discount_pct = self._safe_float((entry or {}).get("discount_pct"), fallback=0.0)

        if "out" in availability:
            signal = "Stock pressure observed in listings"
        elif discount_pct >= 8:
            signal = "Price dropped in top listings"
        elif (entry or {}).get("seller"):
            signal = "Live listing captured from marketplace"
        else:
            signal = "Live listing signal unavailable"

        row = {
            "id": f"{platform_label}-{keyword.strip().lower().replace(' ', '-')}-{price_band.lower()}",
            "product": title or f"{keyword} ({platform_label})",
            "platform": platform_label,
            "priceBand": price_band,
            "size": "Medium",
            "category": category,
            "spf": parsed_attributes["spf"],
            "form": parsed_attributes["form"],
            "useCase": parsed_attributes["useCase"],
            "sourceUrl": source_url,
            "price": round(price, 2),
            "rating": round(rating, 1) if isinstance(rating, float) else None,
            "reviews": reviews,
            "sentiment": self._infer_sentiment(rating) if isinstance(rating, float) else None,
            "signal": signal,
        }
        return row

    @staticmethod
    def _derive_category(keyword: str, title: str) -> str | None:
        text = f"{keyword or ''} {title or ''}".lower()
        if not text.strip():
            return None

        category_rules = [
            ("sunscreen", "Sunscreen"),
            ("spf", "Sunscreen"),
            ("face wash", "Cleanser"),
            ("cleanser", "Cleanser"),
            ("serum", "Serum"),
            ("moistur", "Moisturizer"),
            ("shampoo", "Shampoo"),
            ("conditioner", "Conditioner"),
            ("earbud", "Earbuds"),
            ("headphone", "Headphones"),
            ("shoe", "Footwear"),
        ]
        for needle, label in category_rules:
            if needle in text:
                return label

        normalized = str(keyword or "").strip().title()
        return normalized or None

    @staticmethod
    def _extract_product_attributes(title: str) -> dict:
        text = (title or "").strip()
        text_lower = text.lower()

        spf_match = re.search(r"\bSPF\s*\d{1,3}\+?\b", text, flags=re.IGNORECASE)
        spf = spf_match.group(0).upper().replace("  ", " ") if spf_match else None

        form = None
        form_patterns = [
            r"\b(cream|gel|lotion|serum|spray|stick|powder|mist|fluid)\b",
        ]
        for pattern in form_patterns:
            match = re.search(pattern, text_lower)
            if match:
                form = match.group(1).title()
                break

        use_case = None
        use_case_patterns = [
            (r"\b(oily skin|dry skin|sensitive skin|acne[-\s]?prone)\b", "Skin Type"),
            (r"\b(kids|children|baby)\b", "Kids"),
            (r"\b(sport|outdoor|travel|daily use|daily wear)\b", "Daily/Outdoor"),
        ]
        for pattern, label in use_case_patterns:
            if re.search(pattern, text_lower):
                use_case = label
                break

        return {
            "spf": spf,
            "form": form,
            "useCase": use_case,
        }

    def _derive_best_buy(self, rows: list[dict]) -> dict:
        by_platform: dict[str, list[dict]] = {}
        for row in rows:
            platform = str(row.get("platform", ""))
            by_platform.setdefault(platform, []).append(row)

        if not by_platform:
            return {
                "platform": None,
                "reason": "No live or fallback listings were available to score.",
                "coverage": "0 vendors compared",
                "recommendation": "Search again with a more specific product name.",
            }

        avg_prices = []
        for entries in by_platform.values():
            priced = [float(entry["price"]) for entry in entries if isinstance(entry.get("price"), (int, float)) and float(entry.get("price", 0)) > 0]
            if priced:
                avg_prices.append(sum(priced) / len(priced))
        market_lowest_avg = min(avg_prices) if avg_prices else 0.0

        scored: list[dict] = []
        total_live_rows = 0
        total_fallback_rows = 0

        for platform, entries in by_platform.items():
            priced = [float(entry["price"]) for entry in entries if isinstance(entry.get("price"), (int, float)) and float(entry.get("price", 0)) > 0]
            avg_price = sum(priced) / len(priced) if priced else 0.0

            ratings = [float(entry["rating"]) for entry in entries if isinstance(entry.get("rating"), (int, float))]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

            total_reviews = sum(int(entry.get("reviews") or 0) for entry in entries if isinstance(entry.get("reviews"), int))
            review_confidence = min(math.log10(total_reviews + 1) / 4, 1.0)

            live_rows = [entry for entry in entries if "fallback" not in str(entry.get("signal", "")).lower()]
            fallback_rows = [entry for entry in entries if "fallback" in str(entry.get("signal", "")).lower()]
            stock_pressure_rows = [entry for entry in entries if "stock pressure" in str(entry.get("signal", "")).lower()]
            total_live_rows += len(live_rows)
            total_fallback_rows += len(fallback_rows)

            live_ratio = len(live_rows) / len(entries) if entries else 0.0
            delivery_readiness = 1 - (len(stock_pressure_rows) / len(entries) if entries else 0.0)
            price_score = (market_lowest_avg / avg_price) if avg_price > 0 and market_lowest_avg > 0 else 0.0
            rating_score = avg_rating / 5 if avg_rating > 0 else 0.0

            score = (
                price_score * 40
                + rating_score * 30
                + review_confidence * 12
                + live_ratio * 13
                + delivery_readiness * 5
            )

            scored.append(
                {
                    "platform": platform,
                    "avg_price": avg_price,
                    "avg_rating": avg_rating,
                    "total_reviews": total_reviews,
                    "live_ratio": live_ratio,
                    "delivery_readiness": delivery_readiness,
                    "fallback_count": len(fallback_rows),
                    "score": score,
                }
            )

        winner = max(scored, key=lambda entry: entry["score"])
        coverage = f"{len(by_platform)} vendors compared, {total_live_rows} live rows, {total_fallback_rows} fallback rows"

        reason_parts = []
        if winner["avg_price"] > 0:
            reason_parts.append(f"average price {winner['avg_price']:.0f} INR")
        if winner["avg_rating"] > 0:
            reason_parts.append(f"rating confidence {winner['avg_rating']:.1f}/5")
        if winner["live_ratio"] > 0:
            reason_parts.append(f"{round(winner['live_ratio'] * 100)}% live listing coverage")
        if winner["delivery_readiness"] >= 0.99:
            reason_parts.append("no stock-pressure signal detected")

        reason = f"{winner['platform']} is recommended because it has the strongest combined score across price, rating confidence, live listing coverage, and delivery readiness"
        if reason_parts:
            reason += f" with {'; '.join(reason_parts)}"
        reason += "."

        recommendation = (
            f"Prefer {winner['platform']} for this search because it currently offers the strongest balance of value and confidence."
            if winner["fallback_count"] == 0
            else f"Prefer {winner['platform']} for now, but re-check before purchase because some comparison rows still rely on fallback estimates."
        )

        return {
            "platform": winner["platform"],
            "reason": reason,
            "coverage": coverage,
            "recommendation": recommendation,
        }

    @staticmethod
    def _safe_float(value, fallback: float | None):
        if isinstance(value, (int, float)):
            return float(value)
        try:
            return float(str(value))
        except (TypeError, ValueError):
            return fallback

    @staticmethod
    def _safe_int(value, fallback: int | None):
        if isinstance(value, int):
            return value
        try:
            return int(float(str(value)))
        except (TypeError, ValueError):
            return fallback

    @staticmethod
    def _infer_sentiment(rating: float) -> str:
        if rating >= 4.3:
            return "Positive"
        if rating >= 3.8:
            return "Neutral"
        return "Negative"

    @staticmethod
    def _format_metric_change(current: int, previous: int) -> str:
        if previous <= 0:
            return "+100%" if current > 0 else "0%"
        delta = ((current - previous) / previous) * 100
        prefix = "+" if delta >= 0 else ""
        return f"{prefix}{round(delta)}%"

    def _build_price_drop_alerts(self, docs: list[dict]) -> list[str]:
        alerts: list[str] = []
        by_platform: dict[str, list[dict]] = {}
        for doc in docs:
            platform = PLATFORM_LABELS.get(str(doc.get("platform", "")).lower(), str(doc.get("platform", "Unknown")).title())
            by_platform.setdefault(platform, []).append(doc)

        for platform, entries in by_platform.items():
            prices = [float(entry["price"]) for entry in entries if isinstance(entry.get("price"), (int, float)) and float(entry.get("price", 0)) > 0]
            if len(prices) < 2:
                continue
            avg_price = sum(prices) / len(prices)
            lowest = min(prices)
            if avg_price > 0 and lowest <= avg_price * 0.9:
                alerts.append(f"{platform} currently shows a strong discount window with prices about {round((1 - lowest / avg_price) * 100)}% below its tracked average.")

        stock_pressure = [doc for doc in docs if "stock pressure" in str(doc.get("signal", "")).lower()]
        if stock_pressure:
            platform_counts = Counter(PLATFORM_LABELS.get(str(doc.get("platform", "")).lower(), str(doc.get("platform", "")).title()) for doc in stock_pressure)
            platform, count = platform_counts.most_common(1)[0]
            alerts.append(f"{platform} is showing stock-pressure signals on {count} tracked listing{'s' if count > 1 else ''}.")

        return alerts[:4]

    def _build_price_trend(self, docs: list[dict]) -> list[dict]:
        platform_docs: dict[str, list[dict]] = {"amazon": [], "flipkart": [], "meesho": []}
        for doc in docs:
            platform = str(doc.get("platform", "")).lower()
            if platform in platform_docs:
                platform_docs[platform].append(doc)

        trend_points: list[dict] = []
        for index in range(5):
            point = {"period": f"T{index + 1}", "amazon": 0.0, "flipkart": 0.0, "meesho": 0.0}
            for platform, entries in platform_docs.items():
                if not entries:
                    continue
                bucket_size = max(1, math.ceil(len(entries) / 5))
                start = min(index * bucket_size, max(len(entries) - 1, 0))
                bucket = entries[start : start + bucket_size]
                prices = [float(entry["price"]) for entry in bucket if isinstance(entry.get("price"), (int, float))]
                if prices:
                    point[platform] = round(sum(prices) / len(prices), 2)
            trend_points.append(point)
        return trend_points

    def _build_sentiment_breakdown(self, docs: list[dict]) -> list[dict]:
        counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for doc in docs:
            rating = doc.get("rating")
            if isinstance(rating, (int, float)):
                counts[self._infer_sentiment(float(rating))] += 1
        return [{"name": name, "value": value} for name, value in counts.items()]

    def _build_opportunity_scores(self, docs: list[dict]) -> list[dict]:
        priced = [float(doc["price"]) for doc in docs if isinstance(doc.get("price"), (int, float)) and float(doc.get("price", 0)) > 0]
        ratings = [float(doc["rating"]) for doc in docs if isinstance(doc.get("rating"), (int, float))]
        live_ratio = len([doc for doc in docs if "fallback" not in str(doc.get("signal", "")).lower()]) / len(docs) if docs else 0
        trust_ratio = len([doc for doc in docs if "stock pressure" not in str(doc.get("signal", "")).lower()]) / len(docs) if docs else 0

        lowest = min(priced) if priced else 0
        avg_price = (sum(priced) / len(priced)) if priced else 0
        savings_score = int(min(((1 - (lowest / avg_price)) * 100) if avg_price > 0 else 0, 100))
        quality_score = int(min(((sum(ratings) / len(ratings)) / 5) * 100 if ratings else 0, 100))
        value_score = int(min((quality_score * 0.45) + (savings_score * 0.35) + (live_ratio * 20), 100))
        trust_score = int(min((trust_ratio * 100), 100))

        return [
            {"category": "Savings", "score": savings_score},
            {"category": "Quality", "score": quality_score},
            {"category": "Value", "score": value_score},
            {"category": "Trust", "score": trust_score},
        ]

    def _build_marketplace_activity(self, docs: list[dict]) -> list[str]:
        activity: list[str] = []
        by_platform: dict[str, list[dict]] = {}
        for doc in docs:
            platform = PLATFORM_LABELS.get(str(doc.get("platform", "")).lower(), str(doc.get("platform", "Unknown")).title())
            by_platform.setdefault(platform, []).append(doc)

        for platform, entries in by_platform.items():
            avg_price = sum(float(entry["price"]) for entry in entries if isinstance(entry.get("price"), (int, float))) / max(len(entries), 1)
            rating_values = [float(entry["rating"]) for entry in entries if isinstance(entry.get("rating"), (int, float))]
            avg_rating = (sum(rating_values) / len(rating_values)) if rating_values else 0.0
            activity.append(f"{platform} has {len(entries)} tracked live pricing rows with an average price near {round(avg_price)} INR and average rating {avg_rating:.1f}.")

        return activity[:3]

    def _build_dashboard_recommendations(self, docs: list[dict]) -> list[str]:
        if not docs:
            return []

        rows = []
        for doc in docs:
            rows.append(
                {
                    "platform": PLATFORM_LABELS.get(str(doc.get("platform", "")).lower(), str(doc.get("platform", "")).title()),
                    "price": float(doc.get("price") or 0),
                    "rating": float(doc.get("rating") or 0) if isinstance(doc.get("rating"), (int, float)) else None,
                    "reviews": int(doc.get("reviews") or 0) if isinstance(doc.get("reviews"), int) else 0,
                    "signal": str(doc.get("signal") or "Live listing captured from marketplace"),
                }
            )

        best_buy = self._derive_best_buy(rows)
        recommendations = [best_buy["recommendation"], best_buy["reason"]]

        positive_count = len([doc for doc in docs if isinstance(doc.get("rating"), (int, float)) and float(doc.get("rating")) >= 4.3])
        if positive_count:
            recommendations.append(f"Prioritize listings with stronger rating confidence because {positive_count} tracked rows are currently in the positive sentiment band.")

        fallback_count = len([doc for doc in docs if "fallback" in str(doc.get("signal", "")).lower()])
        if fallback_count:
            recommendations.append(f"Some dashboard insights still depend on fallback estimates for {fallback_count} rows, so refresh product research before final purchase.")

        return recommendations[:4]

    def _analyze_row_sentiment(self, doc: dict) -> dict:
        platform_raw = str(doc.get("platform", "")).lower()
        platform = PLATFORM_LABELS.get(platform_raw, platform_raw.title() or "Unknown")
        rating = float(doc.get("rating")) if isinstance(doc.get("rating"), (int, float)) else None
        title = str(doc.get("title", ""))
        signal = str(doc.get("signal", ""))
        text = f"{title}. {signal}".strip()

        polarity = 0.0
        try:
            from textblob import TextBlob

            polarity = float(TextBlob(text).sentiment.polarity)
        except Exception:
            polarity = 0.0

        rating_component = ((rating - 3.0) / 2.0) if rating is not None else 0.0
        score = (rating_component * 0.65) + (polarity * 0.35)

        if score >= 0.15:
            label = "Positive"
        elif score <= -0.15:
            label = "Negative"
        else:
            label = "Neutral"

        confidence = min(1.0, abs(score) * 1.6 + (0.18 if rating is not None else 0.0))
        return {
            "platform": platform,
            "score": score,
            "label": label,
            "confidence": confidence,
            "text": text,
        }

    def _extract_themes(self, rows: list[dict], positive: bool) -> list[str]:
        stopwords = {
            "with",
            "this",
            "that",
            "from",
            "have",
            "your",
            "were",
            "been",
            "more",
            "than",
            "very",
            "into",
            "when",
            "where",
            "price",
            "rating",
            "live",
            "listing",
            "marketplace",
            "captured",
            "signal",
            "unavailable",
            "fallback",
        }

        counter: Counter[str] = Counter()
        for row in rows:
            score = row["score"]
            if positive and score <= 0:
                continue
            if not positive and score >= 0:
                continue

            weight = abs(score)
            tokens = re.findall(r"[a-zA-Z]{4,}", row["text"].lower())
            for token in tokens:
                if token in stopwords:
                    continue
                counter[token] += weight

        return [word for word, _ in counter.most_common(6)]
