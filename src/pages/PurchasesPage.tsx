import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Purchase, type Vendor } from "../api";

function money(n?: string) {
  if (!n) return "0";
  return n;
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
  
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PurchasesPage() {
  const [items, setItems] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const vendorNameById = useMemo(() => {
    const map = new Map<number, string>();
    vendors.forEach((v) => map.set(v.id, v.name));
    return map;
  }, [vendors]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, v] = await Promise.all([api.listPurchases(), api.listVendors()]);
      setItems(p);
      setVendors(v);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((p) => {
      const vendorName = p.vendor?.name || vendorNameById.get(p.vendor_id) || "";
      return (
        p.purchase_no.toLowerCase().includes(q) ||
        vendorName.toLowerCase().includes(q) ||
        (p.note && p.note.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, vendorNameById]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((p) => p.id)));
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

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

  async function handleDelete(id: number, purchaseNo: string) {
    if (!confirm(`Are you sure you want to delete purchase "${purchaseNo}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      await api.deletePurchase(id);
      await load();
      setSelectedIds(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} purchase(s)? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    const idsArray = Array.from(selectedIds);
    try {
      await Promise.all(idsArray.map((id) => api.deletePurchase(id)));
      await load();
      setSelectedIds(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bulk delete failed");
    }
  };

  return (
    <div>
      {/* Header with New button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Purchases</h1>
          <p className="text-xs md:text-sm text-gray-600">Buy from vendors - stock is added automatically when created</p>
        </div>
        <Link
          to="/purchases/new"
          className="btn btn-primary w-full sm:w-auto whitespace-nowrap no-underline"
        >
          + New Purchase
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900">Purchases</h2>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn btn-danger btn-sm text-center"
              >
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search purchases..."
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

        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading purchases...</div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            <div className="text-base mb-2">No purchases found</div>
            <div className="text-xs text-gray-600">Create your first purchase to get started</div>
          </div>
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
                    Purchase
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date ↓
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due
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
                {filteredItems.map((p) => {
                  const vendorName = p.vendor?.name || vendorNameById.get(p.vendor_id) || `Vendor #${p.vendor_id}`;
                  const paid = p.paid_total ? parseFloat(p.paid_total) : 0;
                  const due = p.balance_due ? parseFloat(p.balance_due) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <Link
                          to={`/purchases/${p.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-xs md:text-sm"
                        >
                          {p.purchase_no}
                        </Link>
                        {p.note && (
                          <div className="text-xs text-gray-500 mt-1">{p.note}</div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {formatTime(p.purchased_at)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {vendorName}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-semibold text-gray-900">
                        ₹{money(p.grand_total)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-xs md:text-sm text-gray-900">
                        ₹{paid.toFixed(2)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-semibold text-red-600">
                        ₹{due.toFixed(2)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/purchases/${p.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id, p.purchase_no);
                            }}
                            disabled={deletingId === p.id}
                            title={deletingId === p.id ? "Deleting..." : "Delete"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {filteredItems.length} purchase{filteredItems.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
