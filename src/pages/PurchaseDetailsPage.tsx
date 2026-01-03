import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Purchase } from "../api";

function money(n?: string) {
  if (!n) return "0.00";
  const num = parseFloat(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PurchaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPurchase(parseInt(id, 10));
        setPurchase(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load purchase");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/purchases" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading purchase...</div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/purchases" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">
          {error || "Purchase not found"}
        </div>
      </div>
    );
  }

  const items = purchase.purchase_items || [];
  const payments = purchase.purchase_payments || [];
  const paid = purchase.paid_total ? parseFloat(purchase.paid_total) : 0;
  const due = purchase.balance_due ? parseFloat(purchase.balance_due) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link to="/purchases" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Purchase Details</h1>
            <p className="text-xs sm:text-sm text-gray-600">View complete purchase information</p>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Purchase Number</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">{purchase.purchase_no}</div>
        </div>
      </div>

      {/* Purchase Header Card */}
      <div className="card mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Vendor Info */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Vendor Information
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600">Vendor Name</div>
                {purchase.vendor ? (
                  <Link
                    to={`/vendors/${purchase.vendor.id}`}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline text-lg"
                  >
                    {purchase.vendor.name}
                  </Link>
                ) : (
                  <div className="font-semibold text-gray-900 text-lg">
                    Vendor #{purchase.vendor_id}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Purchase Information
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600">Date & Time</div>
                <div className="font-medium text-gray-900">{formatDate(purchase.purchased_at)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Status</div>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
            </div>
          </div>
        </div>
        {purchase.note && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600 mb-1">Note</div>
            <div className="text-gray-700">{purchase.note}</div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="card mb-4 md:mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Items ({items.length})
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No items in this purchase</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Tax
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {item.product?.name || `Product #${item.product_id}`}
                      </div>
                      {item.product?.sku && (
                        <div className="text-xs text-gray-500 mt-1">SKU: {item.product.sku}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-700">₹{money(item.unit_price)}</td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {parseFloat(item.tax_percent || "0") > 0 ? (
                        <>
                          {item.tax_percent}%<br />
                          <span className="text-xs">₹{money(item.tax_amount)}</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      ₹{money(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals and Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Totals Card */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Totals
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">₹{money(purchase.subtotal)}</span>
            </div>

            {parseFloat(purchase.tax_total || "0") > 0 && (
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">₹{money(purchase.tax_total)}</span>
              </div>
            )}

            {parseFloat(purchase.discount_total || "0") > 0 && (
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-₹{money(purchase.discount_total)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
              <span className="text-lg font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-bold text-gray-900">₹{money(purchase.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Payment Summary
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="font-medium text-gray-900">₹{money(purchase.grand_total)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Paid</span>
              <span className="font-medium text-green-600">₹{money(String(paid))}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
              <span className="text-lg font-bold text-gray-900">Balance Due</span>
              <span className={`text-2xl font-bold ${due > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{money(String(due))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments History */}
      {payments.length > 0 && (
        <div className="card mb-4 md:mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Payment History ({payments.length})
          </div>
          <div className="space-y-3">
            {payments.map((payment: { id: number; amount: string; payment_method?: string | null; paid_at?: string | null; note?: string | null }) => (
              <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">₹{money(String(payment.amount))}</div>
                  <div className="text-xs text-gray-500">
                    {payment.payment_method && `${payment.payment_method} • `}
                    {formatDate(payment.paid_at)}
                  </div>
                  {payment.note && (
                    <div className="text-xs text-gray-600 mt-1">{payment.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-xl">
            ℹ️
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-900">About This Purchase</div>
            <div className="text-xs text-gray-700">
              This purchase was automatically finalized when created. Product stock was increased in
              inventory at the time of creation. You can track vendor payments and see pending credit amounts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

