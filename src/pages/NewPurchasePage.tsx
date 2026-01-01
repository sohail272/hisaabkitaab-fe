import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Product, type PurchaseItemInput, type Vendor } from "../api";

type Line = {
  product_id: number | "";
  quantity: number;
  unit_price: string;
};

export default function NewPurchasePage() {
  const nav = useNavigate();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");

  const [lines, setLines] = useState<Line[]>([
    { product_id: "", quantity: 1, unit_price: "0" },
  ]);

  // Search states
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [productSearchQueries, setProductSearchQueries] = useState<Map<number, string>>(new Map());
  const [showProductDropdowns, setShowProductDropdowns] = useState<Map<number, boolean>>(new Map());

  // Price averaging confirmation
  const [priceDiffModal, setPriceDiffModal] = useState<{
    show: boolean;
    product: Product;
    oldPrice: number;
    newPrice: number;
    oldStock: number;
    newQuantity: number;
    averagePrice: number;
    onConfirm: () => void;
  } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [v, p] = await Promise.all([api.listVendors(), api.listProducts()]);
      setVendors(v);
      setProducts(p.filter((x) => x.active));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vendors/products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    if (!vendorId) return false;
    const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
    return validLines.length > 0;
  }, [vendorId, lines]);

  const productById = useMemo(() => {
    const m = new Map<number, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filteredVendors = useMemo(() => {
    const query = vendorSearchQuery.toLowerCase();
    const activeVendors = vendors.filter((v) => v.active);
    if (!query.trim()) return activeVendors;
    return activeVendors.filter((v) => v.name.toLowerCase().includes(query));
  }, [vendors, vendorSearchQuery]);

  const getFilteredProducts = (lineIdx: number) => {
    const query = productSearchQueries.get(lineIdx)?.toLowerCase() || "";
    if (!query.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  };

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (!l.product_id) return sum;
      const qty = l.quantity || 0;
      const price = parseFloat(l.unit_price || "0") || 0;
      return sum + qty * price;
    }, 0);
  }, [lines]);

  const grandTotal = useMemo(() => subtotal, [subtotal]);
  const paid = parseFloat(paidAmount || "0") || 0;
  const remaining = grandTotal - paid;

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", quantity: 1, unit_price: "0" }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function checkPriceDifferences(): boolean {
    // Check each line for price differences
    for (const line of lines) {
      if (!line.product_id) continue;
      const product = productById.get(line.product_id as number);
      if (!product) continue;

      const oldPrice = parseFloat(product.purchase_price || "0");
      const newPrice = parseFloat(line.unit_price || "0");
      const oldStock = product.current_stock || 0;
      const newQuantity = line.quantity || 0;

      // If prices differ and there's existing stock, show confirmation
      if (oldStock > 0 && oldPrice > 0 && newPrice > 0 && Math.abs(oldPrice - newPrice) > 0.01) {
        const totalValue = oldStock * oldPrice + newQuantity * newPrice;
        const totalStock = oldStock + newQuantity;
        const averagePrice = totalValue / totalStock;

        setPriceDiffModal({
          show: true,
          product,
          oldPrice,
          newPrice,
          oldStock,
          newQuantity,
          averagePrice,
          onConfirm: () => {
            setPriceDiffModal(null);
            createPurchase();
          },
        });
        return false;
      }
    }
    return true;
  }

  async function createPurchase() {
    if (!canSubmit || !vendorId) return;
    setError(null);
    setLoading(true);

    const purchase_items_attributes: PurchaseItemInput[] = lines
      .filter((l) => l.product_id && l.quantity > 0)
      .map((l) => ({
        product_id: l.product_id as number,
        quantity: l.quantity,
        unit_price: l.unit_price,
        tax_percent: "0",
      }));

    try {
      await api.createPurchase({
        vendor_id: vendorId as number,
        note: note.trim() || undefined,
        purchase_items_attributes,
        payment: paid > 0
          ? {
              amount: String(paid),
              payment_method: paymentMethod || undefined,
              note: paymentNote.trim() || undefined,
            }
          : undefined,
      });
      nav("/purchases");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create purchase failed");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    if (!canSubmit || !vendorId) return;
    
    // Check for price differences first
    if (!checkPriceDifferences()) {
      return; // Modal will handle confirmation
    }
    
    // No price differences, proceed directly
    await createPurchase();
  }

  return (
    <div className="grid gap-3">
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-5">
          <div>
            <h3 className="m-0 mb-1 text-xl sm:text-2xl font-semibold">New Purchase</h3>
            <div className="text-xs text-gray-600">Create purchase - stock will be added automatically</div>
          </div>
          <Link to="/purchases" className="btn no-underline font-bold w-full sm:w-auto text-center">
            Back
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading...</div>
        ) : null}
        {error ? (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        ) : null}

        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-2">Vendor *</label>
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
                  {filteredVendors.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">No vendors found</div>
                  ) : (
                    filteredVendors.map((v) => (
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
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-2">Note (optional)</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bill no / comments"
          />
        </div>

        <div className="font-extrabold mb-2">Items</div>

        <div className="grid gap-3">
          {lines.map((l, idx) => {
            const p = l.product_id ? productById.get(l.product_id as number) : null;
            const filteredProducts = getFilteredProducts(idx);
            const searchQuery = productSearchQueries.get(idx) || "";
            const selectedProduct = l.product_id ? productById.get(l.product_id as number) : null;
            const showDropdown = showProductDropdowns.get(idx) || false;

            return (
              <div key={idx} className="card border border-gray-200 bg-gray-50 p-4">
                <label className="block text-xs text-gray-600 mb-2">Product</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input"
                    value={selectedProduct ? `${selectedProduct.name} (Stock: ${selectedProduct.current_stock})` : searchQuery}
                    onChange={(e) => {
                      const newQueries = new Map(productSearchQueries);
                      newQueries.set(idx, e.target.value);
                      setProductSearchQueries(newQueries);
                      
                      const newDropdowns = new Map(showProductDropdowns);
                      newDropdowns.set(idx, true);
                      setShowProductDropdowns(newDropdowns);
                      
                      if (l.product_id) {
                        updateLine(idx, { product_id: "" });
                      }
                    }}
                    onFocus={() => {
                      const newDropdowns = new Map(showProductDropdowns);
                      newDropdowns.set(idx, true);
                      setShowProductDropdowns(newDropdowns);
                    }}
                    placeholder="Search product..."
                  />
                  
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                          const newDropdowns = new Map(showProductDropdowns);
                          newDropdowns.set(idx, false);
                          setShowProductDropdowns(newDropdowns);
                        }}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">No products found</div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                updateLine(idx, {
                                  product_id: p.id,
                                  unit_price: p.purchase_price ?? l.unit_price,
                                });
                                const newQueries = new Map(productSearchQueries);
                                newQueries.set(idx, "");
                                setProductSearchQueries(newQueries);
                                const newDropdowns = new Map(showProductDropdowns);
                                newDropdowns.set(idx, false);
                                setShowProductDropdowns(newDropdowns);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                                l.product_id === p.id ? "bg-blue-50" : ""
                              }`}
                            >
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500">
                                Stock: {p.current_stock} {p.sku ? `• SKU: ${p.sku}` : ""}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Qty</label>
                    <input
                      className="input"
                      type="number"
                      value={l.quantity}
                      onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value || "0", 10) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Cost price</label>
                    <input
                      className="input"
                      value={l.unit_price}
                      onChange={(e) => updateLine(idx, { unit_price: e.target.value })}
                    />
                  </div>
                </div>

                {p ? (
                  <div className="mt-2 text-xs text-gray-600">Selected: {p.name}</div>
                ) : null}

                <div className="flex gap-2 mt-3">
                  <button
                    className="btn"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <button className="btn" onClick={addLine}>
            + Add another item
          </button>
        </div>

        <div className="flex justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">Subtotal (client preview):</div>
          <div className="font-extrabold">₹{subtotal.toFixed(2)}</div>
        </div>

        {/* Payment Section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Payment Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-2">Amount Paid (₹)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Payment Method</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-2">Payment Note (optional)</label>
            <input
              className="input"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Transaction ID, cheque number, etc."
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Amount</div>
              <div className="text-lg font-bold text-gray-900">₹{grandTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Remaining</div>
              <div className={`text-lg font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{remaining.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <button
          className={`btn btn-primary mt-4 w-full sm:w-auto ${canSubmit ? "" : "opacity-50"}`}
          disabled={!canSubmit || loading}
          onClick={onCreate}
        >
          {loading ? "Creating Purchase..." : "Create Purchase"}
        </button>

        <div className="mt-3 text-xs text-gray-600">
          Stock will be automatically increased when the purchase is created. If purchase price differs from existing stock price, it will be averaged automatically.
        </div>
      </div>

      {/* Price Difference Confirmation Modal */}
      {priceDiffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Price Difference Detected</h3>
            <div className="space-y-3 mb-6">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Product: {priceDiffModal.product.name}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Current Stock: {priceDiffModal.oldStock} units @ ₹{priceDiffModal.oldPrice.toFixed(2)}</div>
                  <div>New Purchase: {priceDiffModal.newQuantity} units @ ₹{priceDiffModal.newPrice.toFixed(2)}</div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="font-semibold text-gray-900">
                      Average Price: ₹{priceDiffModal.averagePrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ({(priceDiffModal.oldStock + priceDiffModal.newQuantity)} units total)
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
                The product's purchase price will be updated to the average price to reflect the mixed inventory value.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="btn flex-1"
                onClick={() => setPriceDiffModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={priceDiffModal.onConfirm}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
