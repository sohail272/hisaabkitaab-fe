import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, type Customer } from "../api";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const customer = await api.getCustomer(parseInt(id, 10));
        setName(customer.name);
        setPhone(customer.phone || "");
        setEmail(customer.email || "");
        setAddress(customer.address || "");
        setActive(customer.active);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customer");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.updateCustomer(parseInt(id, 10), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        active,
      });
      nav(`/customers/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !name) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/customers" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading customer...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="m-0 mb-1 text-2xl sm:text-3xl font-bold">Edit Customer</h2>
          <div className="text-xs text-gray-600">Update customer information</div>
        </div>
        <Link to={`/customers/${id}`} className="btn w-full sm:w-auto text-center">
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
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? "Updating..." : "Update Customer"}
            </button>
            <Link to={`/customers/${id}`} className="btn">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

