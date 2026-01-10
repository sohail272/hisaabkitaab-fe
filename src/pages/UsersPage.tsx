import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

export default function UsersPage() {
  const { isOrgAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOrgAdmin) {
      setError("Only organization admins can manage users");
      setLoading(false);
      return;
    }

    loadUsers();
  }, [isOrgAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.listUsers();
      setUsers(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId: number, userName: string) => {
    setDeleteTarget({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await api.deleteUser(deleteTarget.id);
      // Only close modal and reload on success
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteError(null);
      await loadUsers();
    } catch (err: any) {
      // Keep modal open and show error - DO NOT reload data
      const errorMessage = err.message || "Delete failed";
      setDeleteError(errorMessage);
      // Don't clear items - they should remain in the table
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      setError("");
      await api.updateUser(userId, {
        active: !currentStatus,
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "org_admin":
        return "bg-purple-100 text-purple-800";
      case "store_manager":
        return "bg-blue-100 text-blue-800";
      case "store_worker":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "org_admin":
        return "Organization Admin";
      case "store_manager":
        return "Store Manager";
      case "store_worker":
        return "Store Worker";
      default:
        return role;
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="page-container">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Users</h1>
          <p className="text-gray-600">Only organization admins can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Users</h1>
          <p className="text-xs md:text-sm text-gray-600">Manage organization users and permissions</p>
        </div>
        <Link to="/users/new" className="btn btn-primary w-full sm:w-auto text-center">
          + New User
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            <div className="text-base mb-2">No users found</div>
            <div className="text-xs text-gray-600 mb-4">
              Get started by creating your first user
            </div>
            <Link to="/users/new" className="btn btn-primary w-auto inline-block no-underline">
              Create User
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
                      User
                    </th>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs md:text-sm">{user.name}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-500 mt-1">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {user.store ? (
                          <div>
                            <div className="text-xs md:text-sm text-gray-900">{user.store.name}</div>
                            <div className="text-xs text-gray-500">{user.store.code}</div>
                          </div>
                        ) : (
                          <span className="text-xs md:text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {user.active ? (
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
                              handleToggleActive(user.id, user.active);
                            }}
                            className={`transition-colors ${
                              user.active
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={user.active ? "Disable User" : "Enable User"}
                          >
                            {user.active ? (
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
                            to={`/users/${user.id}/edit`}
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
                              handleDeleteClick(user.id, user.name);
                            }}
                            disabled={deletingId === user.id}
                            title={deletingId === user.id ? "Deleting..." : "Delete"}
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                    {user.phone && (
                      <p className="text-sm text-gray-500 mt-1">{user.phone}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1 truncate">{user.email}</p>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2 flex-shrink-0">
                    {user.active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {user.store && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Store</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{user.store.name}</div>
                        <div className="text-xs text-gray-500">{user.store.code}</div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleToggleActive(user.id, user.active)}
                      className={`btn btn-sm w-full ${
                        user.active ? "btn-warning" : "btn-success"
                      }`}
                    >
                      {user.active ? "Disable User" : "Enable User"}
                    </button>
                    <div className="flex gap-2">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="btn btn-sm flex-1 text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="btn btn-sm btn-danger flex-1"
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
        )}

        {users.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Showing {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete User"
        message={
          deleteError && deleteTarget
            ? deleteError
            : deleteTarget
            ? `Are you sure you want to delete user "${deleteTarget.name}"? This action cannot be undone.`
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
    </div>
  );
}

