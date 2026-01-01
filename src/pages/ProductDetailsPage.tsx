import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Product, type Vendor } from "../api";

function money(n?: string) {
  if (!n) return "0.00";
  const num = parseFloat(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProduct(parseInt(id, 10));
        setProduct(data);
        
        // Use vendor from product if available, otherwise fetch separately
        if (data.vendor) {
          setVendor(data.vendor);
        } else if (data.vendor_id) {
          try {
            const v = await api.getVendor(data.vendor_id);
            setVendor(v);
          } catch {
            // Vendor might not exist, ignore
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/products" className="btn">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/products" className="btn">
            ← Back
          </Link>
        </div>
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const stock = Number(product.current_stock) || 0;
  const isLowStock = stock < 10;
  const isOutOfStock = stock === 0;
  const stockColor = isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-600" : "text-green-600";
  const stockBg = isOutOfStock ? "bg-red-50" : isLowStock ? "bg-yellow-50" : "bg-green-50";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link to="/products" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Product Details</h1>
            <p className="text-xs sm:text-sm text-gray-600">View complete product information</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            to={`/products/${product.id}/edit`} 
            className="btn flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Edit Product"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* Product Header Card */}
      <div className="card mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              {product.active ? (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}
          </div>
          <div className={`${stockBg} px-4 md:px-6 py-3 md:py-4 rounded-lg text-center w-full sm:w-auto sm:min-w-[120px]`}>
            <div className={`text-2xl md:text-3xl font-bold mb-1 ${stockColor}`}>{stock}</div>
            <div className="text-xs text-gray-600 font-medium">in stock</div>
            {isOutOfStock && (
              <div className="text-xs text-red-600 font-semibold mt-1">Out of Stock</div>
            )}
            {isLowStock && !isOutOfStock && (
              <div className="text-xs text-yellow-600 font-semibold mt-1">Low Stock</div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Basic Information */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Basic Information
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Product Name</div>
              <div className="font-semibold text-gray-900 text-lg">{product.name}</div>
            </div>
            {product.description && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Description</div>
                <div className="text-gray-700">{product.description}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-600 mb-1">Status</div>
              {product.active ? (
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

        {/* Pricing Information */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Pricing Information
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Cost Price</div>
              <div className="text-2xl font-bold text-gray-900">₹{money(product.purchase_price)}</div>
              <div className="text-xs text-gray-500 mt-1">Price you pay per unit</div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-600 mb-1">Selling Price</div>
              <div className="text-2xl font-bold text-blue-600">₹{money(product.selling_price)}</div>
              <div className="text-xs text-gray-500 mt-1">MRP / selling price per unit</div>
            </div>
            {parseFloat(product.selling_price) > parseFloat(product.purchase_price) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-1">Profit Margin</div>
                <div className="text-lg font-semibold text-green-600">
                  ₹{money(String(parseFloat(product.selling_price) - parseFloat(product.purchase_price)))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({((parseFloat(product.selling_price) - parseFloat(product.purchase_price)) / parseFloat(product.purchase_price) * 100).toFixed(1)}% margin)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Identification */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Identification
          </div>
          <div className="space-y-4">
            {product.sku ? (
              <div>
                <div className="text-xs text-gray-600 mb-1">SKU</div>
                <div className="font-mono font-medium text-gray-900">{product.sku}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No SKU assigned</div>
            )}
            {product.barcode ? (
              <div>
                <div className="text-xs text-gray-600 mb-1">Barcode</div>
                <div className="font-mono font-medium text-gray-900">{product.barcode}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No barcode assigned</div>
            )}
          </div>
        </div>

        {/* Vendor Information */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Vendor Information
          </div>
          {vendor ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Vendor Name</div>
                <Link
                  to={`/vendors/${vendor.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {vendor.name}
                </Link>
              </div>
              {vendor.phone && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Phone</div>
                  <div className="font-medium text-gray-900">{vendor.phone}</div>
                </div>
              )}
              {vendor.email && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Email</div>
                  <div className="font-medium text-gray-900">{vendor.email}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No vendor assigned</div>
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="card">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Stock Information
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${stockBg} p-4 rounded-lg`}>
            <div className="text-xs text-gray-600 mb-1">Current Stock</div>
            <div className={`text-2xl font-bold ${stockColor}`}>{stock}</div>
            <div className="text-xs text-gray-500 mt-1">units available</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Stock Value (Cost)</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{money(String(stock * parseFloat(product.purchase_price)))}
            </div>
            <div className="text-xs text-gray-500 mt-1">at cost price</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Stock Value (Selling)</div>
            <div className="text-xl font-bold text-blue-600">
              ₹{money(String(stock * parseFloat(product.selling_price)))}
            </div>
            <div className="text-xs text-gray-500 mt-1">at selling price</div>
          </div>
        </div>
      </div>
    </div>
  );
}

