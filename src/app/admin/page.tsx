import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { adminProducts, adminUsers } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Admin Panel"
        subtitle="Monitor platform usage, data operations, and account health."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader><CardTitle>Total Users: 1,284</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardTitle>Products Monitored: 8,429</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardTitle>AI Insights Generated: 94,202</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardTitle>System Uptime: 99.96%</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.email} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3">{user.name}</td>
                    <td className="px-3 py-3">{user.email}</td>
                    <td className="px-3 py-3">{user.plan}</td>
                    <td className="px-3 py-3">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Products</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Tracked</th>
                </tr>
              </thead>
              <tbody>
                {adminProducts.map((product) => (
                  <tr key={product.sku} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3">{product.sku}</td>
                    <td className="px-3 py-3">{product.name}</td>
                    <td className="px-3 py-3">{product.owner}</td>
                    <td className="px-3 py-3">{product.tracked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
