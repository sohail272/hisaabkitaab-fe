import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Customer, type InvoiceItemInput, type Product } from "../api";

type Line = {
  id?: number;
  product_id: number | "";
  quantity: number;
  unit_price: string;
};

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Customer conflict state
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  // Discount state
  const [discountType, setDiscountType] = useState<"percent" | "amount">("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [roundoff, setRoundoff] = useState("");

  // Payment and date state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [lines, setLines] = useState<Line[]>([{ product_id: "", quantity: 1, unit_price: "0" }]);

  // Product search state for each line
  const [productSearchQueries, setProductSearchQueries] = useState<Map<number, string>>(new Map());
  const [showProductDropdowns, setShowProductDropdowns] = useState<Map<number, boolean>>(new Map());

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoadingInvoice(true);
    setError(null);
    try {
      const [invoice, p] = await Promise.all([
        api.getInvoice(parseInt(id, 10)),
        api.listProducts(),
      ]);

      setProducts(p.filter((x) => x.active));

      // Populate form with invoice data
      setCustomerName(invoice.customer?.name || invoice.customer_name || "");
      setCustomerPhone(invoice.customer?.phone || invoice.customer_phone || "");

      // Set discount
      const discountTotal = parseFloat(invoice.discount_total || "0");
      const subtotal = parseFloat(invoice.subtotal || "0");
      if (discountTotal > 0 && subtotal > 0) {
        const percent = (discountTotal / subtotal) * 100;
        if (Math.abs(percent - Math.round(percent)) < 0.01) {
          // Likely a percentage discount
          setDiscountType("percent");
          setDiscountValue(percent.toFixed(2));
        } else {
          // Likely a fixed amount
          setDiscountType("amount");
          setDiscountValue(discountTotal.toFixed(2));
        }
      }

      // Set roundoff
      if (invoice.roundoff) {
        setRoundoff(invoice.roundoff);
      }

      // Set payment method and date
      if (invoice.payment_method) {
        setPaymentMethod(invoice.payment_method);
      }
      if (invoice.billed_at) {
        const date = new Date(invoice.billed_at);
        setInvoiceDate(date.toISOString().split('T')[0]);
      }

      // Set invoice items
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        setLines(
          invoice.invoice_items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoadingInvoice(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for existing customer by phone when phone is entered
  useEffect(() => {
    if (customerPhone.trim().length >= 10) {
      const checkExistingCustomer = async () => {
        try {
          const existing = await api.findCustomerByPhone(customerPhone.trim());
          if (existing) {
            setExistingCustomer(existing);
            if (!customerName.trim() || customerName.trim() === existing.name) {
              setCustomerName(existing.name);
            }
          } else {
            setExistingCustomer(null);
          }
        } catch {
          // Silently fail
        }
      };
      
      const timeoutId = setTimeout(checkExistingCustomer, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setExistingCustomer(null);
    }
  }, [customerPhone, customerName]);

  const productById = useMemo(() => {
    const m = new Map<number, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const getFilteredProducts = (lineIdx: number) => {
    const query = productSearchQueries.get(lineIdx)?.toLowerCase() || "";
    if (!query.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  };

  const canSubmit = useMemo(() => {
    const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
    if (validLines.length === 0) return false;
    
    return customerName.trim().length > 0 && customerPhone.trim().length > 0;
  }, [lines, customerName, customerPhone]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (!l.product_id) return sum;
      const qty = l.quantity || 0;
      const price = parseFloat(l.unit_price || "0") || 0;
      return sum + qty * price;
    }, 0);
  }, [lines]);

  const discountAmount = useMemo(() => {
    if (!discountValue.trim()) return 0;
    const value = parseFloat(discountValue) || 0;
    if (discountType === "percent") {
      return (subtotal * value) / 100;
    } else {
      return value;
    }
  }, [discountValue, discountType, subtotal]);

  const roundoffAmount = useMemo(() => {
    if (!roundoff.trim()) return 0;
    return parseFloat(roundoff) || 0;
  }, [roundoff]);

  const grandTotal = useMemo(() => {
    const baseTotal = Math.max(0, subtotal - discountAmount);
    return baseTotal + roundoffAmount;
  }, [subtotal, discountAmount, roundoffAmount]);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", quantity: 1, unit_price: "0" }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onUpdate() {
    if (!canSubmit || !id) return;
    setError(null);
    setLoading(true);

    const invoice_items_attributes: InvoiceItemInput[] = lines
      .filter((l) => l.product_id && l.quantity > 0)
      .map((l) => ({
        id: l.id,
        product_id: l.product_id as number,
        quantity: l.quantity,
        unit_price: l.unit_price,
        tax_percent: "0",
      }));

    try {
      const customerData: { 
        customer_name?: string; 
        customer_phone?: string;
        update_customer_name?: boolean;
      } = {};
      
      customerData.customer_name = customerName.trim() || undefined;
      customerData.customer_phone = customerPhone.trim() || undefined;
      if (existingCustomer && existingCustomer.name !== customerName.trim()) {
        customerData.update_customer_name = true;
      }

      const billedAt = invoiceDate ? new Date(invoiceDate).toISOString() : undefined;

      await api.updateInvoice(parseInt(id, 10), {
        ...customerData,
        discount_total: discountAmount > 0 ? discountAmount.toFixed(2) : undefined,
        roundoff: roundoffAmount !== 0 ? roundoffAmount.toFixed(2) : undefined,
        payment_method: paymentMethod,
        billed_at: billedAt,
        invoice_items_attributes,
      });
      nav("/invoices");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update invoice failed");
    } finally {
      setLoading(false);
    }
  }


  if (loadingInvoice) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/invoices" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-5">
          <div>
            <h3 className="m-0 mb-1 text-xl sm:text-2xl font-semibold">Edit Invoice</h3>
            <div className="text-xs text-gray-600">Update invoice details</div>
          </div>
          <Link to="/invoices" className="btn no-underline font-bold w-full sm:w-auto text-center">
            Back
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-600">Saving...</div>
        ) : null}
        {error ? (
          <div className="p-3 rounded-lg bg-red-100 text-red-800 mb-4 text-sm">{error}</div>
        ) : null}

        {/* Customer Selection Section */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Customer</label>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Customer name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
            </div>
            {(!customerName.trim() || !customerPhone.trim()) && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                ⚠️ Customer name and phone number are required
              </div>
            )}
            {existingCustomer && (
              <div className="text-xs text-green-700 bg-green-50 p-3 rounded border border-green-200">
                ✓ Found existing customer: <strong>{existingCustomer.name}</strong>. Name auto-filled. You can update it if needed.
              </div>
            )}
            {existingCustomer && existingCustomer.name !== customerName.trim() && customerName.trim() && (
              <div className="text-xs text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                ⚠️ You've changed the name from "{existingCustomer.name}" to "{customerName.trim()}". The customer name will be updated.
              </div>
            )}
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Enter phone number first - if customer exists, name will auto-fill. Customer will be automatically saved.
            </div>
          </div>
        </div>

        <div className="font-extrabold mb-2">Items</div>

        <div className="grid gap-3">
          {lines.map((l, idx) => {
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
                                  unit_price: p.selling_price ?? l.unit_price,
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
                    <label className="block text-xs text-gray-600 mb-2">Selling price</label>
                    <input
                      className="input"
                      value={l.unit_price}
                      onChange={(e) => updateLine(idx, { unit_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-sm text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="btn btn-primary" onClick={addLine}>
            + Add another item
          </button>
        </div>

        {/* Totals Section - Same as NewInvoicePage */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between gap-3">
            <div className="text-xs text-gray-600">Subtotal:</div>
            <div className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Discount</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("percent");
                    setDiscountValue("");
                  }}
                  className={`btn btn-xs ${
                    discountType === "percent"
                      ? "btn-primary"
                      : ""
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("amount");
                    setDiscountValue("");
                  }}
                  className={`btn btn-xs ${
                    discountType === "amount"
                      ? "btn-primary"
                      : ""
                  }`}
                >
                  ₹
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "Enter %" : "Enter amount"}
                className="input flex-1 text-sm"
              />
              {discountAmount > 0 && (
                <div className="text-xs text-gray-600 flex items-center">
                  = ₹{discountAmount.toFixed(2)}
                </div>
              )}
            </div>
            {/* Roundoff - available for all discount types */}
            <div className="mt-2">
              <label className="block text-xs text-gray-600 mb-1">Roundoff (optional)</label>
              <input
                type="number"
                step="0.01"
                value={roundoff}
                onChange={(e) => setRoundoff(e.target.value)}
                placeholder="Enter roundoff amount (+/-)"
                className="input w-full text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-2 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Grand Total:</div>
            <div className="text-lg font-extrabold text-gray-900">₹{grandTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Payment Method and Date Section */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                className="input w-full"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="credit">Credit</option>
                <option value="purchase_order">Purchase Order</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                className="input w-full"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary mt-4 w-full sm:w-auto"
          disabled={!canSubmit || loading}
          onClick={onUpdate}
        >
          {loading ? "Updating Invoice..." : "Update Invoice"}
        </button>
      </div>
    </div>
  );
}

