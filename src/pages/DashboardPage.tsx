import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type DashboardData = {
  today_sales: { count: number; total: number };
  month_sales: { total: number };
  latest_invoice: {
    id: number;
    invoice_no: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    grand_total: number;
    billed_at?: string | null;
  } | null;
  recent_customers: Array<{
    name: string;
    phone?: string | null;
    last_purchase: string;
  }>;
  recent_invoices: Array<{
    id: number;
    invoice_no: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    grand_total: number;
    billed_at?: string | null;
    created_at: string;
  }>;
  low_stock_products: Array<{
    id: number;
    name: string;
    current_stock: number;
    sku?: string | null;
  }>;
  recent_purchases: Array<{
    id: number;
    purchase_no: string;
    vendor_name?: string | null;
    grand_total: number;
    purchased_at?: string | null;
  }>;
  outstanding_purchases: Array<{
    id: number;
    purchase_no: string;
    grand_total: number;
    paid_total: number;
    balance_due: number;
  }>;
  totals: {
    products: number;
    vendors: number;
    invoices: number;
    purchases: number;
  };
};

function money(n: number) {
  return n.toFixed(2);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase()}`;
  }
  
  return formatDateTime(dateStr);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dashboardData = await api.getDashboard();
        setData(dashboardData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!data?.recent_invoices) return [];
    if (!searchQuery.trim()) return data.recent_invoices;

    const query = searchQuery.toLowerCase();
    return data.recent_invoices.filter((inv) => {
      return (
        inv.invoice_no.toLowerCase().includes(query) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(query)) ||
        (inv.customer_phone && inv.customer_phone.includes(query))
      );
    });
  }, [data?.recent_invoices, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected = filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredInvoices.length;

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} invoice(s)? This action cannot be undone.`)) {
      return;
    }
    // TODO: Implement bulk delete API call
    alert("Bulk delete functionality will be implemented");
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="card py-10 text-center text-gray-600">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">{error}</div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-xs md:text-sm text-gray-600">Overview of your business today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Today's Sales */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Today's Sales</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">₹{money(data.today_sales.total)}</div>
          <div className="text-xs text-gray-600">{data.today_sales.count} invoices</div>
        </div>

        {/* Month's Sales */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-xs text-gray-600 mb-1">This Month</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">₹{money(data.month_sales.total)}</div>
          <div className="text-xs text-gray-600">Total revenue</div>
        </div>

        {/* Total Products */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Active Products</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{data.totals.products}</div>
          <div className="text-xs text-gray-600">{data.totals.vendors} vendors</div>
        </div>

        {/* Total Transactions */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-xs text-gray-600 mb-1">Transactions</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{data.totals.invoices + data.totals.purchases}</div>
          <div className="text-xs text-gray-600">{data.totals.invoices} invoices, {data.totals.purchases} purchases</div>
        </div>
      </div>

      {/* Invoices Listing Table */}
      <div className="card mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900">Recent Invoices</h2>
          <div className="flex items-center gap-2 flex-nowrap">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn btn-danger btn-sm flex items-center justify-center whitespace-nowrap"
              >
                Delete ({selectedIds.size})
              </button>
            )}
            <Link to="/invoices" className="btn text-sm px-3 py-1.5 flex items-center justify-center whitespace-nowrap">
              View All
            </Link>
            <Link to="/invoices/new" className="btn btn-primary btn-sm flex items-center justify-center whitespace-nowrap no-underline">
              + New Invoice
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-12"
            />
            <svg
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date ↓
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(invoice.id)}
                        onChange={(e) => handleSelectOne(invoice.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-xs md:text-sm"
                      >
                        {invoice.invoice_no}
                      </Link>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {formatTime(invoice.billed_at || invoice.created_at)}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="text-xs md:text-sm font-medium text-gray-900">
                        {invoice.customer_name || "Walk-in Customer"}
                      </div>
                      {invoice.customer_phone && (
                        <div className="text-xs text-gray-500">{invoice.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-semibold text-gray-900">
                      ₹{money(invoice.grand_total)}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Info */}
        {filteredInvoices.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Low Stock Products */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alert</h2>
            <Link to="/products" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          {data.low_stock_products && data.low_stock_products.length > 0 ? (
            <div className="space-y-3">
              {data.low_stock_products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.sku && (
                      <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                    )}
                  </div>
                  <div className={`font-bold ${product.current_stock === 0 ? "text-red-600" : "text-yellow-600"}`}>
                    {product.current_stock} units
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-4 text-center">All products well stocked</div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Purchases</h2>
            <Link to="/purchases" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          {data.recent_purchases && data.recent_purchases.length > 0 ? (
            <div className="space-y-3">
              {data.recent_purchases.map((purchase) => (
                <Link
                  key={purchase.id}
                  to={`/purchases/${purchase.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">{purchase.purchase_no}</div>
                    {purchase.vendor_name && (
                      <div className="text-xs text-gray-500">{purchase.vendor_name}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₹{money(purchase.grand_total)}</div>
                    <div className="text-xs text-gray-500">{formatDate(purchase.purchased_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-4 text-center">No purchases yet</div>
          )}
        </div>
      </div>

      {/* Outstanding Payments */}
      {data.outstanding_purchases && data.outstanding_purchases.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Outstanding Payments</h2>
            <Link to="/purchases" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {data.outstanding_purchases.map((purchase) => (
              <Link
                key={purchase.id}
                to={`/purchases/${purchase.id}`}
                className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-3 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{purchase.purchase_no}</div>
                  <div className="text-xs text-gray-500">Due: ₹{money(purchase.balance_due)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">₹{money(purchase.grand_total)}</div>
                  <div className="text-xs text-gray-500">Paid: ₹{money(purchase.paid_total)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
