import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, Store } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function StoresPage() {
  const { isOrgAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOrgAdmin) {
      setError("Only organization admins can manage stores");
      setLoading(false);
      return;
    }

    loadStores();
  }, [isOrgAdmin]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await api.listStores();
      setStores(data);
      setError("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stores";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (storeId: number, currentStatus: boolean) => {
    try {
      const store = stores.find((s) => s.id === storeId);
      if (!store) return;

      await api.updateStore(storeId, {
        active: !currentStatus,
      });
      await loadStores();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update store status";
      setError(errorMessage);
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="page-container">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stores</h1>
          <p className="text-gray-600">Only organization admins can manage stores.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Stores</h1>
          <p className="text-xs md:text-sm text-gray-600">Manage your organization's stores</p>
        </div>
        <Link to="/stores/new" className="btn btn-primary w-full sm:w-auto text-center">
          + New Store
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            <div className="text-base mb-2">No stores found</div>
            <div className="text-xs text-gray-600 mb-4">
              Get started by creating your first store
            </div>
            <Link to="/stores/new" className="btn btn-primary w-auto inline-block no-underline">
              Create Store
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
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
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-xs md:text-sm">
                          {store.name}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {store.code}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {store.phone || "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-500 max-w-xs truncate">
                        {store.address || "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {store.active ? (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(store.id, store.active);
                            }}
                            className={`transition-colors ${
                              store.active
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={store.active ? "Disable Store" : "Enable Store"}
                          >
                            {store.active ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <Link
                            to={`/stores/${store.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {stores.map((store) => (
              <div key={store.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                    {store.address && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.address}</p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {store.active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Code</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {store.code}
                    </span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Phone</span>
                      <span className="text-sm text-gray-900">{store.phone}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handleToggleActive(store.id, store.active)}
                      className={`btn btn-sm w-full ${
                        store.active ? "btn-warning" : "btn-success"
                      }`}
                    >
                      {store.active ? "Disable Store" : "Enable Store"}
                    </button>
                    <Link
                      to={`/stores/${store.id}/edit`}
                      className="btn btn-sm w-full text-center"
                    >
                      Edit Store
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
        )}

        {stores.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {stores.length} store{stores.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

