import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Customer } from "../api";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

export default function CustomersPage() {
  const nav = useNavigate();
  const { currentStore } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCustomers();
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentStore?.id]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((c) => c.id)));
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

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await api.deleteCustomer(deleteTarget.id);
      // Only close modal and reload on success
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteError(null);
      await load();
      setSelectedIds(new Set());
    } catch (e: unknown) {
      // Keep modal open and show error - DO NOT reload data
      const errorMessage = e instanceof Error ? e.message : "Delete failed";
      setDeleteError(errorMessage);
      // Don't clear items - they should remain in the table
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setShowBulkDeleteModal(false);
    setError(null);
    const idsArray = Array.from(selectedIds);
    try {
      await Promise.all(idsArray.map((id) => api.deleteCustomer(id)));
      await load();
      setSelectedIds(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bulk delete failed");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="m-0 mb-1 text-2xl sm:text-3xl font-bold">Customers</h2>
          <div className="text-xs text-gray-600">Manage customer information</div>
        </div>
        <Link to="/customers/new" className="btn btn-primary w-full sm:w-auto text-center no-underline">
          + New Customer
        </Link>
      </div>

      {error ? (
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
      ) : null}

      {/* Search and Actions Bar */}
      <div className="card mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search customers..."
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
          {selectedIds.size > 0 && (
            <button
                onClick={handleBulkDeleteClick}
              className="btn btn-danger whitespace-nowrap"
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card py-10 text-center text-gray-600">Loading customers...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card py-10 text-center text-gray-600">
          {searchQuery ? "No customers found matching your search." : "No customers yet. Create your first customer!"}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Address</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-700 uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => nav(`/customers/${customer.id}`)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={(e) => handleSelectOne(customer.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900 text-xs md:text-sm">{customer.name}</div>
                    </td>
                    <td className="p-3 text-gray-700 text-xs md:text-sm">{customer.phone || "-"}</td>
                    <td className="p-3 text-gray-700 text-xs md:text-sm">{customer.email || "-"}</td>
                    <td className="p-3 text-gray-700 text-xs md:text-sm">
                      {customer.address ? (customer.address.length > 50 ? `${customer.address.substring(0, 50)}...` : customer.address) : "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          customer.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/customers/${customer.id}/edit`}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(customer.id, customer.name);
                          }}
                          disabled={deletingId === customer.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Customer"
        message={
          deleteError && deleteTarget
            ? deleteError
            : deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        isLoading={!!deletingId}
        error={deleteError}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Customers"
        message={`Are you sure you want to delete ${selectedIds.size} customer(s)? This action cannot be undone.`}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
}

