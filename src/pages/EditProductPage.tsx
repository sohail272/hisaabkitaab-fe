import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Product, type Vendor } from "../api";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState<number | "">("");
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<string>("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [active, setActive] = useState(true);

  const filteredVendors = useMemo(() => {
    const query = vendorSearchQuery.toLowerCase();
    const activeVendors = vendors.filter((v) => v.active);
    if (!query.trim()) return activeVendors;
    return activeVendors.filter((v) => v.name.toLowerCase().includes(query));
  }, [vendors, vendorSearchQuery]);

  const canUpdate = useMemo(() => {
    if (!name.trim()) return false;
    const pp = purchasePrice.trim() === "" ? 0 : Number(purchasePrice);
    const sp = sellingPrice.trim() === "" ? 0 : Number(sellingPrice);
    const st = currentStock.trim() === "" ? 0 : Number(currentStock);

    if (Number.isNaN(pp) || pp < 0) return false;
    if (Number.isNaN(sp) || sp < 0) return false;
    if (Number.isNaN(st) || st < 0) return false;

    return true;
  }, [name, purchasePrice, sellingPrice, currentStock]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      setLoadingProduct(true);
      setError(null);
      try {
        const [product, v] = await Promise.all([
          api.getProduct(parseInt(id, 10)),
          api.listVendors(),
        ]);
        
        setVendors(v);
        
        // Populate form with product data
        setName(product.name || "");
        setDescription(product.description || "");
        setVendorId(product.vendor_id || "");
        setVendorSearchQuery(product.vendor?.name || "");
        setPurchasePrice(product.purchase_price || "");
        setSellingPrice(product.selling_price || "");
        setCurrentStock(String(product.current_stock || 0));
        setSku(product.sku || "");
        setBarcode(product.barcode || "");
        setActive(product.active ?? true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        setLoadingProduct(false);
      }
    }
    loadData();
  }, [id]);

  async function onUpdate() {
    if (!canUpdate || !id) return;

    setLoading(true);
    setError(null);

    const pp = purchasePrice.trim() === "" ? "0" : purchasePrice.trim();
    const sp = sellingPrice.trim() === "" ? "0" : sellingPrice.trim();
    const st = currentStock.trim() === "" ? 0 : parseInt(currentStock.trim(), 10);

    try {
      await api.updateProduct(parseInt(id, 10), {
        name: name.trim(),
        description: description.trim() || undefined,
        purchase_price: pp,
        selling_price: sp,
        current_stock: st,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        active,
        vendor_id: vendorId ? (vendorId as number) : undefined,
      });

      navigate("/products");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (loadingProduct) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Edit Product</h1>
            <p className="text-xs sm:text-sm text-gray-600">Loading product...</p>
          </div>
          <Link to="/products" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Edit Product</h1>
          <p className="text-xs sm:text-sm text-gray-600">Update product information</p>
        </div>
        <Link to="/products" className="btn w-full sm:w-auto text-center">
          ← Back
        </Link>
      </div>

      {/* Form */}
      <div className="card">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        )}

        <div className="grid gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Cotton Shirt - Blue (M)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <input
              className="input"
              placeholder="e.g. Slim fit, full sleeves"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-1.5">Optional product description</div>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Vendor
            </label>
            <div className="relative">
              <input
                type="text"
                className="input"
                value={vendorId ? vendors.find((v) => v.id === vendorId)?.name || "" : vendorSearchQuery}
                onChange={(e) => {
                  setVendorSearchQuery(e.target.value);
                  setShowVendorDropdown(true);
                  if (vendorId) setVendorId("");
                }}
                onFocus={() => setShowVendorDropdown(true)}
                placeholder="Search vendor..."
              />
              
              {showVendorDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVendorDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setVendorId("");
                        setVendorSearchQuery("");
                        setShowVendorDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                    >
                      <div className="font-medium text-gray-900">No vendor (e.g., dead stock)</div>
                    </button>
                    {filteredVendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVendorId(v.id);
                          setVendorSearchQuery("");
                          setShowVendorDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          vendorId === v.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">{v.name}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Optional - Select the main supplier for this product</div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Cost Price (₹)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
              <div className="text-xs text-gray-600 mt-1.5">Price you pay per unit</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Selling Price (₹)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
              <div className="text-xs text-gray-600 mt-1.5">MRP / selling price per unit</div>
            </div>
          </div>

          {/* Stock + Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Current Stock (units)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
              />
              <div className="text-xs text-gray-600 mt-1.5">
                Current stock quantity. Use Purchases to add more stock.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <div className="p-3 border border-gray-300 rounded-lg bg-white">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  <span className="font-medium">Active</span>
                </label>
                <div className="text-xs text-gray-600 mt-1.5 ml-7">
                  Inactive products won't appear in billing
                </div>
              </div>
            </div>
          </div>

          {/* SKU / Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">SKU</label>
              <input
                className="input"
                placeholder="e.g. SHIRT-BLU-M"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Barcode</label>
              <input
                className="input"
                placeholder="e.g. 8901234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              className={`btn btn-primary flex-1 ${canUpdate ? "" : "opacity-60"}`}
              disabled={!canUpdate || loading}
              onClick={onUpdate}
            >
              {loading ? "Updating..." : "Update Product"}
            </button>
            <Link to="/products" className="btn">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

