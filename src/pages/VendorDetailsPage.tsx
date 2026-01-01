import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Vendor } from "../api";

export default function VendorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getVendor(parseInt(id, 10));
        setVendor(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load vendor");
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
          <Link to="/vendors" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading vendor...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/vendors" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">
          {error || "Vendor not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link to="/vendors" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Vendor Details</h1>
            <p className="text-xs sm:text-sm text-gray-600">View complete vendor information</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            to={`/vendors/${vendor.id}/edit`} 
            className="btn flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Edit Vendor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* Vendor Header Card */}
      <div className="card mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{vendor.name}</h2>
              {vendor.active ? (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Contact Information */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Contact Information
          </div>
          <div className="space-y-4">
            {vendor.phone ? (
              <div>
                <div className="text-xs text-gray-600 mb-1">Phone Number</div>
                <div className="font-semibold text-gray-900 text-lg">
                  <a
                    href={`tel:${vendor.phone}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {vendor.phone}
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No phone number provided</div>
            )}

            {vendor.email ? (
              <div>
                <div className="text-xs text-gray-600 mb-1">Email Address</div>
                <div className="font-semibold text-gray-900">
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {vendor.email}
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No email address provided</div>
            )}

            {vendor.address ? (
              <div>
                <div className="text-xs text-gray-600 mb-1">Address</div>
                <div className="text-gray-700 whitespace-pre-line">{vendor.address}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No address provided</div>
            )}
          </div>
        </div>

        {/* Status Information */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Status Information
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Status</div>
              {vendor.active ? (
                <div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                  <div className="text-xs text-gray-500 mt-2">
                    Active vendors appear in product creation dropdowns
                  </div>
                </div>
              ) : (
                <div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                  <div className="text-xs text-gray-500 mt-2">
                    Inactive vendors won't appear in product creation
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card mt-4 md:mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-xl">
            ℹ️
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-900">About This Vendor</div>
            <div className="text-xs text-gray-700">
              This vendor can be used when creating products and purchases. You can edit the vendor
              information or manage purchases from this vendor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

