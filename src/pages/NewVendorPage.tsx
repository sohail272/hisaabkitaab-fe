import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Vendor } from "../api";

export default function NewVendorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  async function onCreate() {
    if (!canCreate) return;

    setLoading(true);
    setError(null);
    try {
      await api.createVendor({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        active,
      } as Partial<Vendor>);

      navigate("/vendors");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Vendor</h1>
          <p className="text-sm text-gray-600">Create a new vendor in your system</p>
        </div>
        <Link to="/vendors" className="btn">
          ← Back
        </Link>
      </div>

      {/* Form */}
      <div className="card">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        )}

        <div className="grid gap-4 md:gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. ABC Suppliers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
            <input
              className="input"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-1.5">Optional contact number</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              className="input"
              type="email"
              placeholder="e.g. contact@vendor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-1.5">Optional email address</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <div className="p-3 border border-gray-300 rounded-lg bg-white">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="font-medium">Active</span>
              </label>
              <div className="text-xs text-gray-600 mt-1.5 ml-7">
                Inactive vendors won't appear in product creation
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              className={`btn-primary flex-1 ${canCreate ? "" : "opacity-60 bg-gray-400"}`}
              disabled={!canCreate || loading}
              onClick={onCreate}
            >
              {loading ? "Creating..." : "Create Vendor"}
            </button>
            <Link to="/vendors" className="btn">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

