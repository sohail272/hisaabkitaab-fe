import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, Store } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function NewUserPage() {
  const navigate = useNavigate();
  const { isOrgAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stores, setStores] = useState<Store[]>([]);

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

  useEffect(() => {
    if (!isOrgAdmin) {
      return;
    }

    loadStores();
  }, [isOrgAdmin]);

  const loadStores = async () => {
    try {
      const data = await api.listStores();
      setStores(data);
    } catch (err: unknown) {
      console.error("Failed to load stores:", err);
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="page-container">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">New User</h1>
          <p className="text-gray-600">Only organization admins can create users.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if ((formData.role === "store_worker" || formData.role === "store_manager") && !formData.store_id) {
      setError("Store workers and managers must be assigned to a store");
      setLoading(false);
      return;
    }

    if (formData.role === "org_admin" && formData.store_id) {
      setError("Organization admins cannot be assigned to a store");
      setLoading(false);
      return;
    }

    try {
      await api.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: formData.role,
        store_id: formData.store_id ? parseInt(formData.store_id) : undefined,
        active: formData.active,
      });
      navigate("/users");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">New User</h1>
          <p className="text-xs md:text-sm text-gray-600">Create a new user account</p>
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              <option value="store_worker">Store Worker (Can only create invoices)</option>
              <option value="store_manager">Store Manager (Full access to their store)</option>
              <option value="org_admin">Organization Admin (Full access to all stores)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === "store_worker" && "Can only create invoices, cannot view/edit vendors, customers, or purchases"}
              {formData.role === "store_manager" && "Full access to manage their assigned store's data"}
              {formData.role === "org_admin" && "Full access to all stores and can manage users and stores"}
            </p>
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
                disabled={loading}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

