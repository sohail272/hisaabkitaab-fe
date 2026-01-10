import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Invoice } from "../api";
import ConfirmModal from "../components/ConfirmModal";

function money(n?: string) {
  if (!n) return "0.00";
  const num = parseFloat(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getInvoice(parseInt(id, 10));
        setInvoice(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load invoice");
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
          <Link to="/invoices" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card py-10 text-center text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Link to="/invoices" className="btn w-full sm:w-auto text-center">
            ← Back
          </Link>
        </div>
        <div className="card p-3 rounded-lg bg-red-100 text-red-800 text-sm">
          {error || "Invoice not found"}
        </div>
      </div>
    );
  }

  const items = invoice.invoice_items || [];

  const handleDeleteConfirm = async () => {
    if (!invoice) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteInvoice(invoice.id);
      nav("/invoices");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Delete failed";
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    
    setSharing(true);
    try {
      const invoiceText = `Invoice ${invoice.invoice_no}\n` +
        `Customer: ${invoice.customer_name || "Walk-in Customer"}\n` +
        `Date: ${formatDate(invoice.billed_at)}\n` +
        `Total: ₹${money(invoice.grand_total)}\n\n` +
        `View full invoice: ${window.location.href}`;

      // Check if Web Share API is available (requires HTTPS or localhost)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          // Try sharing with just text and URL (simpler, more compatible)
          const shareData: ShareData = {
            title: `Invoice ${invoice.invoice_no}`,
            text: invoiceText,
          };

          // Add URL only if it's a valid URL
          if (window.location.href.startsWith("http")) {
            shareData.url = window.location.href;
          }

          await navigator.share(shareData);
          // Successfully shared
          setSharing(false);
          return;
        } catch (shareErr: unknown) {
          // User cancelled (AbortError) - don't show error, just return
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            setSharing(false);
            return;
          }
          // Other share errors - fall through to clipboard
          console.log("Share API failed, using clipboard fallback:", shareErr);
        }
      }

      // Fallback: Copy to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(invoiceText);
          alert("Invoice details copied to clipboard! You can now paste it in any app.");
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = invoiceText;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand("copy");
            if (successful) {
              alert("Invoice details copied to clipboard! You can now paste it in any app.");
            } else {
              throw new Error("execCommand failed");
            }
          } catch {
            // Last resort: show text for manual copy
            prompt("Copy this invoice information:", invoiceText);
          }
          
          document.body.removeChild(textArea);
        }
      } catch (clipboardErr) {
        console.error("Clipboard failed:", clipboardErr);
        // Last resort: show text for manual copy
        prompt("Copy this invoice information:", invoiceText);
      }
    } catch (err) {
      console.error("Share error:", err);
      alert("Failed to share invoice. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen py-4 md:py-8">
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link to="/invoices" className="btn w-full sm:w-auto text-center whitespace-nowrap">
            ← Back to Invoices
          </Link>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="btn btn-success flex-1 sm:flex-initial text-center flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{sharing ? "Sharing..." : "Share"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn flex-1 sm:flex-initial text-center flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
            <Link to={`/invoices/${invoice.id}/edit`} className="btn btn-primary flex-1 sm:flex-initial text-center flex items-center justify-center gap-2 whitespace-nowrap no-underline">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="btn btn-danger flex-1 sm:flex-initial text-center flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF-like Invoice Container */}
      <div className="max-w-4xl mx-auto px-4">
        <div
          ref={invoiceRef}
          className="bg-white shadow-lg rounded-lg p-6 md:p-8 print:shadow-none print:rounded-none print:p-6 relative overflow-hidden"
          style={{
            maxWidth: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
          }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="text-9xl font-bold text-yellow-400 transform rotate-12">26</div>
          </div>

          {/* Header Section */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300 relative">
            <div className="flex justify-between items-start">
              {/* Logo/Company Name Section */}
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  SMK Clothing
                </div>
                <div className="text-xs md:text-sm text-gray-600 italic">Stay Classy</div>
              </div>
              
              {/* Invoice Title */}
              <div className="text-right">
                <div className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                  BILL OF SUPPLY ORIGINAL
                </div>
              </div>
            </div>
          </div>

          {/* Vendor/Company Information */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="text-sm">
              {invoice.store?.phone && (
                <div className="text-gray-700">Mobile: <span className="font-semibold">{invoice.store.phone}</span></div>
              )}
              {invoice.store?.email && (
                <div className="text-gray-700">Email: <span className="font-semibold">{invoice.store.email}</span></div>
              )}
            </div>
          </div>

          {/* Invoice Number and Date */}
          <div className="mb-6 pb-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">Invoice No.: </span>
              <span className="text-sm font-semibold text-gray-900">{invoice.invoice_no}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Invoice Date: </span>
              <span className="text-sm font-semibold text-gray-900">{formatDate(invoice.billed_at)}</span>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Bill To
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">
                {invoice.customer_name || "Walk-in Customer"}
              </div>
              {invoice.customer_phone && (
                <div className="text-gray-700 mt-1">Mobile: {invoice.customer_phone}</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No items in this invoice</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-50">
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                        S.NO.
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                        ITEMS
                      </th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                        QTY.
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">
                        RATE
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 uppercase">
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="text-center py-2 px-3 border-r border-gray-200 text-gray-700">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-gray-200">
                          <div className="font-medium text-gray-900">
                            {item.product?.name || `Product #${item.product_id}`}
                          </div>
                        </td>
                        <td className="text-center py-2 px-3 border-r border-gray-200 text-gray-700">
                          {item.quantity} PCS
                        </td>
                        <td className="text-right py-2 px-3 border-r border-gray-200 text-gray-700">
                          ₹{money(item.unit_price)}
                        </td>
                        <td className="text-right py-2 px-3 font-semibold text-gray-900">
                          ₹{money(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">TOTAL (QTY.)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} PCS
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">₹{money(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.tax_total || "0") > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm text-gray-900">₹{money(invoice.tax_total)}</span>
                  </div>
                )}
                {parseFloat(invoice.discount_total || "0") > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm text-gray-900">-₹{money(invoice.discount_total)}</span>
                  </div>
                )}
                {invoice.roundoff && parseFloat(invoice.roundoff) !== 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Round Off:</span>
                    <span className="text-sm text-gray-900">
                      {parseFloat(invoice.roundoff) > 0 ? "+" : "-"}₹{money(String(Math.abs(parseFloat(invoice.roundoff))))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-400 pt-2 mt-2">
                  <span className="text-sm font-semibold text-gray-700">TOTAL (AMOUNT)</span>
                  <span className="text-sm font-semibold text-gray-900">₹{money(invoice.grand_total)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Received Amount</span>
                  <span className="text-sm font-semibold text-gray-900">₹{money(invoice.grand_total)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-700">Balance Amount</span>
                  <span className="text-sm font-semibold text-gray-900">₹0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-xs font-semibold text-gray-700 mb-2">Terms and Conditions:</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>1. Goods once sold will not be taken back or exchanged</div>
              <div>2. Exchange Time: 1pm to 3pm</div>
              <div>3. No Guarantee for Colour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .max-w-4xl {
            max-width: 100%;
          }
          .bg-gray-100 {
            background: white;
          }
          button, a.btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {invoice && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Invoice"
          message={
            deleteError
              ? deleteError
              : `Are you sure you want to delete invoice "${invoice.invoice_no}"? This action cannot be undone.`
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteError(null);
          }}
          isLoading={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
}


