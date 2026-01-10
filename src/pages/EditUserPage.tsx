import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, Store, User } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isOrgAdmin, user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "store_worker" as "store_worker" | "store_manager" | "org_admin",
    store_id: "",
    active: true,
  });

  const loadStores = useCallback(async () => {
    try {
      const data = await api.listStores();
      setStores(data);
    } catch (err: unknown) {
      console.error("Failed to load stores:", err);
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getUser(parseInt(id));
      setUser(data);
      setFormData({
        name: data.name,
        email: data.email,
        password: "",
        confirmPassword: "",
        phone: data.phone || "",
        role: data.role,
        store_id: data.store?.id?.toString() || "",
        active: data.active,
      });
      setError("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isOrgAdmin) {
      return;
    }

    loadStores();
    if (id) {
      loadUser();
    }
  }, [id, isOrgAdmin, loadStores, loadUser]);

  if (!isOrgAdmin) {
    return (
      <div className="page-container">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit User</h1>
          <p className="text-gray-600">Only organization admins can edit users.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validation
    if (formData.password && formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setSaving(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }

    if ((formData.role === "store_worker" || formData.role === "store_manager") && !formData.store_id) {
      setError("Store workers and managers must be assigned to a store");
      setSaving(false);
      return;
    }

    if (formData.role === "org_admin" && formData.store_id) {
      setError("Organization admins cannot be assigned to a store");
      setSaving(false);
      return;
    }

    try {
      const updateData: Partial<User & { password?: string }> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        store_id: formData.store_id ? parseInt(formData.store_id) : undefined,
        active: formData.active,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.updateUser(parseInt(id!), updateData);
      navigate("/users");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update user";
      setError(errorMessage);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="card">
          <p className="text-gray-600">User not found.</p>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === user.id;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Edit User</h1>
          <p className="text-xs md:text-sm text-gray-600">Update user information and permissions</p>
        </div>
        <Link to="/users" className="btn w-full sm:w-auto text-center">
          ← Back
        </Link>
      </div>
      
      <div className="max-w-2xl">

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isCurrentUser && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            You cannot change your own role.
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User's full name"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="User's phone number"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as "store_worker" | "store_manager" | "org_admin";
                setFormData({
                  ...formData,
                  role: newRole,
                  store_id: newRole === "org_admin" ? "" : formData.store_id,
                });
              }}
              required
              disabled={saving || isCurrentUser}
            >
              <option value="store_worker">Store Worker (Can only create invoices)</option>
              <option value="store_manager">Store Manager (Full access to their store)</option>
              <option value="org_admin">Organization Admin (Full access to all stores)</option>
            </select>
            {isCurrentUser && (
              <p className="text-xs text-yellow-600 mt-1">You cannot change your own role</p>
            )}
          </div>

          {(formData.role === "store_worker" || formData.role === "store_manager") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                required
                disabled={saving}
              >
                <option value="">Select a store</option>
                {stores
                  .filter((store) => store.active)
                  .map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current password"
              disabled={saving}
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
          </div>

          {formData.password && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                disabled={saving}
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={saving}
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Active (user can login)
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              className="btn w-full sm:w-auto"
              onClick={() => navigate("/users")}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

