import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, type Vendor } from "../api";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

export default function VendorsPage() {
  const { currentStore } = useAuth();
  const [items, setItems] = useState<Vendor[]>([]);
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
      const data = await api.listVendors();
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vendors");
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
    return items.filter((v) => {
      return (
        v.name.toLowerCase().includes(q) ||
        (v.phone && v.phone.includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.address && v.address.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((v) => v.id)));
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
    // Don't clear main error - it's separate from delete error
    try {
      await api.deleteVendor(deleteTarget.id);
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
      await Promise.all(idsArray.map((id) => api.deleteVendor(id)));
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Vendors</h1>
          <p className="text-xs md:text-sm text-gray-600">Manage your suppliers and vendors</p>
        </div>
        <Link
          to="/vendors/new"
          className="btn btn-primary w-full sm:w-auto whitespace-nowrap no-underline"
        >
          + New Vendor
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900">Vendors</h2>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDeleteClick}
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
              placeholder="Search vendors..."
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
          <div className="py-10 text-center text-gray-600">Loading vendors...</div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            <div className="text-base mb-2">No vendors found</div>
            <div className="text-xs text-gray-600 mb-4">
              {searchQuery ? "Try adjusting your search query" : "Get started by creating your first vendor"}
            </div>
            {!searchQuery && (
              <Link to="/vendors/new" className="btn btn-primary w-auto inline-block no-underline">
                Create Vendor
              </Link>
            )}
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
                    Vendor
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
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
                {filteredItems.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={(e) => handleSelectOne(v.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <Link
                        to={`/vendors/${v.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-xs md:text-sm"
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {v.phone || "-"}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {v.email || "-"}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-500 max-w-xs truncate">
                      {v.address || "-"}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      {v.active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/vendors/${v.id}/edit`}
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
                            handleDeleteClick(v.id, v.name);
                          }}
                          disabled={deletingId === v.id}
                          title={deletingId === v.id ? "Deleting..." : "Delete"}
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
        )}

        {filteredItems.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {filteredItems.length} vendor{filteredItems.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Vendor"
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
        confirmText={deletingId ? "Deleting..." : "Delete"}
        isLoading={!!deletingId}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Vendors"
        message={`Are you sure you want to delete ${selectedIds.size} vendor(s)? This action cannot be undone.`}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
}
