from typing import Literal

from pydantic import BaseModel, Field


PlatformCode = Literal["amazon", "flipkart", "meesho", "shopify"]
PlatformName = Literal["Amazon", "Flipkart", "Meesho", "Shopify"]
SentimentLabel = Literal["Positive", "Neutral", "Negative"]
PriceBand = Literal["Low", "Medium", "High"]


class ResearchRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=120)
    platforms: list[PlatformCode] = Field(default_factory=lambda: ["amazon", "flipkart", "meesho"])
    max_products: int = Field(default=15, ge=3, le=40)


class ProductResearchRow(BaseModel):
    id: str
    product: str
    platform: PlatformName
    priceBand: PriceBand
    size: str
    category: str | None = None
    spf: str | None = None
    form: str | None = None
    useCase: str | None = None
    sourceUrl: str
    price: float
    rating: float | None = None
    reviews: int | None = None
    sentiment: SentimentLabel | None = None
    signal: str


class ResearchSummary(BaseModel):
    searchedKeyword: str
    bestPricePlatform: PlatformName | None = None
    bestRatedPlatform: PlatformName | None = None
    bestBuyPlatform: PlatformName | None = None
    bestBuyReason: str = ""
    avgPrice: float
    totalProducts: int = 0
    catalogCoverage: str = ""
    recommendation: str


class ResearchResult(BaseModel):
    rows: list[ProductResearchRow]
    summary: ResearchSummary


class CreateJobResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: ResearchResult | None = None
    errors: list[str] = Field(default_factory=list)


class DashboardMetric(BaseModel):
    label: str
    value: str
    change: str


class PriceTrendPoint(BaseModel):
    period: str
    amazon: float = 0.0
    flipkart: float = 0.0
    meesho: float = 0.0


class SentimentPoint(BaseModel):
    name: str
    value: int


class OpportunityPoint(BaseModel):
    category: str
    score: int


class DashboardSnapshot(BaseModel):
    metrics: list[DashboardMetric] = Field(default_factory=list)
    priceTrendData: list[PriceTrendPoint] = Field(default_factory=list)
    sentimentData: list[SentimentPoint] = Field(default_factory=list)
    opportunityData: list[OpportunityPoint] = Field(default_factory=list)
    recentAlerts: list[str] = Field(default_factory=list)
    competitorActivity: list[str] = Field(default_factory=list)
    strategyRecommendations: list[str] = Field(default_factory=list)
    generatedAt: str
    hasLiveData: bool = False


class PlatformSentimentStat(BaseModel):
    platform: str
    sentimentScore: float
    confidence: float
    positivePct: int
    neutralPct: int
    negativePct: int
    sampleSize: int


class SentimentSnapshot(BaseModel):
    keyword: str
    overallScore: float
    confidence: float
    distribution: list[SentimentPoint] = Field(default_factory=list)
    platformStats: list[PlatformSentimentStat] = Field(default_factory=list)
    topPositiveThemes: list[str] = Field(default_factory=list)
    topNegativeThemes: list[str] = Field(default_factory=list)
    verdict: str
    recommendation: str
    generatedAt: str
    hasLiveData: bool = False


class DatabaseCollectionStat(BaseModel):
    collection: str
    documents: int
    latestScrapedAt: str | None = None


class DatabaseCoveragePoint(BaseModel):
    name: str
    value: int


class DatabaseHealthSnapshot(BaseModel):
    status: Literal["ok", "degraded", "down"]
    database: str
    responseMs: float
    pricingDocuments: int = 0
    uniqueKeywords: int = 0
    uniqueJobIds: int = 0
    liveSignalRows: int = 0
    fallbackRows: int = 0
    recentKeywords: list[str] = Field(default_factory=list)
    platformCoverage: list[DatabaseCoveragePoint] = Field(default_factory=list)
    collections: list[DatabaseCollectionStat] = Field(default_factory=list)
    generatedAt: str


class PersistFinalOutputRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=120)
    result: ResearchResult
    source: Literal["frontend", "backend"] = "frontend"
    isAiEnriched: bool = False


class PersistFinalOutputResponse(BaseModel):
    status: str
    job_id: str
    storedAt: str
