import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function NewCustomerPage() {
  const nav = useNavigate();
  const { currentStore, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [active, setActive] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // Get store_id - use currentStore for org admins, or user's store
      const storeId = currentStore?.id || user?.store?.id;
      
      // Check for duplicate customer phone (backend will also validate, but this gives immediate feedback)
      try {
        const existingCustomers = await api.listCustomers();
        const duplicate = existingCustomers.find(
          (c) => c.phone && c.phone === phone.trim()
        );
        if (duplicate) {
          setError(`A customer with phone number "${phone.trim()}" already exists in this store`);
          setLoading(false);
          return;
        }
      } catch {
        // If check fails, proceed - backend will validate
      }
      
      const customer = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        active,
        store_id: storeId,
      });
      nav(`/customers/${customer.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="m-0 mb-1 text-2xl sm:text-3xl font-bold">New Customer</h2>
          <div className="text-xs text-gray-600">Create a new customer</div>
        </div>
        <Link to="/customers" className="btn w-full sm:w-auto text-center">
          ← Back
        </Link>
      </div>

      {error ? (
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
      ) : null}

      <form onSubmit={onSubmit} className="card">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
            <textarea
              className="input"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Customer address"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-end">
            <Link to="/customers" className="btn w-full sm:w-auto text-center no-underline">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

