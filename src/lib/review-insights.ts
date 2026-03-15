export type ReviewInsights = {
  complaints: string[];
  praises: string[];
};

const DEFAULT_INSIGHTS: ReviewInsights = {
  complaints: [
    "Size consistency complaints are increasing in recent reviews.",
    "Packaging quality concerns are appearing across multiple listings.",
    "Delivery time variability is impacting sentiment in tier-2 cities.",
  ],
  praises: [
    "Strong value-for-money sentiment appears repeatedly in positive reviews.",
    "Users appreciate easy usability and clear product expectations.",
    "Product quality perception remains stable in verified-purchase reviews.",
  ],
};

const KEYWORD_INSIGHTS: Array<{ keywords: string[]; insights: ReviewInsights }> = [
  {
    keywords: ["sunscreen", "sun screen"],
    insights: {
      complaints: [
        "White cast and sticky feel are frequent concerns for deeper skin tones.",
        "Sweat resistance drops after 2-3 hours in outdoor use.",
        "Pump/nozzle leakage is repeatedly mentioned in travel usage.",
      ],
      praises: [
        "Lightweight texture and quick absorption are consistently praised.",
        "SPF protection confidence is high in verified buyer feedback.",
        "Non-greasy finish is a strong purchase driver for daily users.",
      ],
    },
  },
  {
    keywords: ["shirt", "tshirt", "t-shirt", "kurti", "top"],
    insights: {
      complaints: [
        "Fabric quality mismatch between listing photos and delivered product.",
        "Color fading after first wash is a recurring complaint.",
        "Size-fit inconsistency across batches affects repeat purchase intent.",
      ],
      praises: [
        "Comfort and breathable fabric are frequently appreciated.",
        "Good stitching quality at this price band is repeatedly praised.",
        "Design and color options are viewed positively by most buyers.",
      ],
    },
  },
  {
    keywords: ["phone case", "mobile cover", "case", "cover"],
    insights: {
      complaints: [
        "Camera cutout alignment issues appear in multiple model variants.",
        "Yellowing/discoloration over time is mentioned in transparent cases.",
        "Buttons become stiff after prolonged usage according to reviewers.",
      ],
      praises: [
        "Drop-protection confidence is high in customer feedback.",
        "Grip and in-hand feel are called out as key positives.",
        "Precise fit and easy installation drive positive sentiment.",
      ],
    },
  },
  {
    keywords: ["airpods", "earbuds", "headphone", "bluetooth"],
    insights: {
      complaints: [
        "Battery backup degradation after extended use is frequently reported.",
        "Mic clarity in noisy environments needs improvement.",
        "Occasional pairing instability is called out by power users.",
      ],
      praises: [
        "Sound clarity and bass tuning are highly appreciated.",
        "Compact charging case and portability are strong positives.",
        "Quick connectivity across devices improves user satisfaction.",
      ],
    },
  },
];

export function getReviewInsightsForKeyword(keyword: string | null | undefined): ReviewInsights {
  const normalized = (keyword || "").trim().toLowerCase();
  if (!normalized) return DEFAULT_INSIGHTS;

  const match = KEYWORD_INSIGHTS.find((entry) =>
    entry.keywords.some((token) => normalized.includes(token)),
  );

  return match ? match.insights : DEFAULT_INSIGHTS;
}
