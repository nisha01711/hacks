import { ProductResearchRow } from "@/lib/research-agent";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function displayText(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

export function ProductTable({ data, isLoading = false, recommendedPlatform = null }: { data: ProductResearchRow[]; isLoading?: boolean; recommendedPlatform?: string | null }) {
  const priceBandOrder = { Low: 0, Medium: 1, High: 2 } as const;
  const orderedData = [...data].sort((a, b) => {
    if (a.platform !== b.platform) {
      return a.platform.localeCompare(b.platform);
    }
    return priceBandOrder[a.priceBand] - priceBandOrder[b.priceBand];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Research Output Across Platforms</CardTitle>
      </CardHeader>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Loading product data...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No research results yet. Search for a product keyword to generate cross-platform output.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-300">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Price</th>
                <th className="hidden px-3 py-2 sm:table-cell">Rating</th>
                <th className="hidden px-3 py-2 md:table-cell">Size</th>
                <th className="hidden px-3 py-2 md:table-cell">Category</th>
                <th className="hidden px-3 py-2 lg:table-cell">Source</th>
                <th className="hidden px-3 py-2 lg:table-cell">Reviews</th>
                <th className="hidden px-3 py-2 xl:table-cell">SPF</th>
                <th className="hidden px-3 py-2 xl:table-cell">Form</th>
                <th className="hidden px-3 py-2 xl:table-cell">Use Case</th>
                <th className="hidden px-3 py-2 xl:table-cell">Sentiment</th>
                <th className="hidden px-3 py-2 xl:table-cell">Signal</th>
              </tr>
            </thead>
            <tbody>
              {orderedData.map((product) => {
                const isRecommended = recommendedPlatform === product.platform;
                return (
                <tr key={product.id} className={isRecommended ? "border-b border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-b border-slate-100 dark:border-slate-800"}>
                  <td className="max-w-35 truncate px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{product.product}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span>{product.platform}</span>
                      {isRecommended ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Best Buy</span> : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">{product.priceBand}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">{product.price > 0 ? formatInr(product.price) : "N/A"}</td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 sm:table-cell dark:text-slate-300">{displayText(product.rating)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 md:table-cell dark:text-slate-300">{product.size}</td>
                  <td className="hidden px-3 py-3 text-slate-600 md:table-cell dark:text-slate-300">{displayText(product.category)}</td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      View
                    </a>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 lg:table-cell dark:text-slate-300">{displayText(product.reviews)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 xl:table-cell dark:text-slate-300">{displayText(product.spf)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 xl:table-cell dark:text-slate-300">{displayText(product.form)}</td>
                  <td className="hidden px-3 py-3 text-slate-600 xl:table-cell dark:text-slate-300">{displayText(product.useCase)}</td>
                  <td className="hidden px-3 py-3 text-slate-600 xl:table-cell dark:text-slate-300">{displayText(product.sentiment)}</td>
                  <td className="hidden px-3 py-3 text-slate-600 xl:table-cell dark:text-slate-300">{product.signal}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
