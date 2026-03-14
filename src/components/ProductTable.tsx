import { ProductRow } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductTable({ data, isLoading = false }: { data: ProductRow[]; isLoading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitored Products</CardTitle>
      </CardHeader>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Loading product data...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No products added yet. Use the form above to add your first product.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-300">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{product.product}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{product.platform}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">${product.price}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{product.rating}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{product.reviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
