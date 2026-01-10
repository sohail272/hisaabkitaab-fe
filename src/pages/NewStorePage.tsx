import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function NewStorePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isOrgAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [error, setError] = useState("");
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    active: true,
  });

  const loadStore = useCallback(async () => {
    if (!id) return;
    setLoadingStore(true);
    setError("");
    try {
      const store = await api.getStore(parseInt(id, 10));
      setFormData({
        name: store.name,
        code: store.code,
        address: store.address || "",
        phone: store.phone || "",
        email: store.email || "",
        active: store.active,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load store";
      setError(errorMessage);
    } finally {
      setLoadingStore(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode && id) {
      loadStore();
    }
  }, [id, isEditMode, loadStore]);

  if (!isOrgAdmin) {
    return (
      <div>
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{isEditMode ? "Edit Store" : "New Store"}</h1>
          <p className="text-gray-600">Only organization admins can manage stores.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditMode && id) {
        await api.updateStore(parseInt(id, 10), {
          ...formData,
          code: formData.code.toUpperCase().trim(),
        });
      } else {
        await api.createStore({
          ...formData,
          code: formData.code.toUpperCase().trim(),
        });
      }
      navigate("/stores");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? "update" : "create"} store`;
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loadingStore) {
    return (
      <div>
        <div className="card">
          <p className="text-gray-600 py-4 text-center">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {isEditMode ? "Edit Store" : "New Store"}
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            {isEditMode ? "Update store information" : "Create a new store for your organization"}
          </p>
        </div>
        <Link to="/stores" className="btn w-full sm:w-auto text-center">
          ← Back
        </Link>
      </div>
      
      <div className="max-w-2xl">

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., SMK Clothing - Downtown Branch"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SMK-DT-001"
              required
              disabled={loading}
              pattern="[A-Z0-9-]+"
              title="Store code must contain only uppercase letters, numbers, and hyphens"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in invoice numbers (e.g., SMK-DT-INV-001). Only uppercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              className="input"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Store address"
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
              placeholder="Store phone number"
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
              Active (store is operational)
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              className="btn w-full sm:w-auto"
              onClick={() => navigate("/stores")}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Store" : "Create Store")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

