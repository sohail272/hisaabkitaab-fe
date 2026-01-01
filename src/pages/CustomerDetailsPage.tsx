import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, type Customer } from "../api";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getCustomer(parseInt(id, 10));
        setCustomer(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customer");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
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

  if (error || !customer) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/customers" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="m-0 mb-1 text-2xl sm:text-3xl font-bold">Customer Details</h2>
          <div className="text-xs text-gray-600">View customer information</div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link to="/customers" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
          <Link to={`/customers/${customer.id}/edit`} className="btn btn-primary w-full sm:w-auto text-center flex items-center justify-center gap-2 no-underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <div className="text-base font-medium text-gray-900">{customer.name}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <div className="text-base text-gray-900">{customer.phone || "-"}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <div className="text-base text-gray-900">{customer.email || "-"}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  customer.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {customer.active ? "Active" : "Inactive"}
              </span>
            </div>
            {customer.address && (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Address</label>
                <div className="text-base text-gray-900 whitespace-pre-line">{customer.address}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

