const BASE = import.meta.env.VITE_API_BASE_URL as string;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  purchase_price: string;
  selling_price: string;
  current_stock: number;
  active: boolean;
  vendor_id?: number | null;
  vendor?: Vendor | null;
};

export type Vendor = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
};

export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
};

export type PurchaseItemInput = {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: string;     // cost price
  tax_percent?: string;
};

export type Purchase = {
  id: number;
  vendor_id: number;
  purchase_no: string;
  subtotal: string;
  tax_total: string;
  discount_total: string;
  grand_total: string;
  status: number; // 0 draft, 1 finalized, 2 cancelled
  purchased_at?: string | null;
  note?: string | null;

  // Optional: if backend includes these
  vendor?: Vendor;
  purchase_items?: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    tax_percent: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
  }>;

  // Optional: if backend includes rollups
  paid_total?: string;
  balance_due?: string;
  purchase_payments?: Array<{
    id: number;
    amount: string;
    payment_method?: string | null;
    paid_at?: string | null;
    note?: string | null;
  }>;
};

export type InvoiceItemInput = {
  product_id: number;
  quantity: number;
  unit_price: string; // selling price
  tax_percent?: string;
};

export type Invoice = {
  id: number;
  invoice_no: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer?: Customer | null;

  subtotal: string;
  tax_total: string;
  discount_total: string;
  roundoff?: string;
  grand_total: string;

  payment_method?: string | null;
  status: number; // 0 draft, 1 finalized
  billed_at?: string | null;

  invoice_items?: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    tax_percent: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
  }>;
};

export const api = {
  // Products
  listProducts: (query?: string) =>
    request<Product[]>(`/products${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (body: Partial<Product>) =>
    request<Product>(`/products`, { method: "POST", body: JSON.stringify({ product: body }) }),
  updateProduct: (id: number, body: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify({ product: body }) }),
  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  // Vendors
  listVendors: () => request<Vendor[]>(`/vendors`),
  getVendor: (id: number) => request<Vendor>(`/vendors/${id}`),
  createVendor: (body: Partial<Vendor>) =>
    request<Vendor>(`/vendors`, { method: "POST", body: JSON.stringify({ vendor: body }) }),
  updateVendor: (id: number, body: Partial<Vendor>) =>
    request<Vendor>(`/vendors/${id}`, { method: "PUT", body: JSON.stringify({ vendor: body }) }),
  deleteVendor: (id: number) =>
    request<void>(`/vendors/${id}`, { method: "DELETE" }),

  // Customers
  listCustomers: (query?: string) =>
    request<Customer[]>(`/customers${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  findCustomerByPhone: (phone: string) =>
    request<Customer | null>(`/customers?phone=${encodeURIComponent(phone)}`),
  getCustomer: (id: number) => request<Customer>(`/customers/${id}`),
  createCustomer: (body: Partial<Customer>) =>
    request<Customer>(`/customers`, { method: "POST", body: JSON.stringify({ customer: body }) }),
  updateCustomer: (id: number, body: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify({ customer: body }) }),
  deleteCustomer: (id: number) =>
    request<void>(`/customers/${id}`, { method: "DELETE" }),

  // Purchases
  listPurchases: () => request<Purchase[]>(`/purchases`),
  getPurchase: (id: number) => request<Purchase>(`/purchases/${id}`),
  createPurchase: (body: { 
    vendor_id: number; 
    note?: string; 
    purchase_items_attributes: PurchaseItemInput[];
    payment?: { amount: string; payment_method?: string; note?: string };
  }) =>
    request<Purchase>(`/purchases`, { method: "POST", body: JSON.stringify({ purchase: body }) }),
  updatePurchase: (id: number, body: { 
    vendor_id?: number; 
    note?: string; 
    purchase_items_attributes?: PurchaseItemInput[];
    payment?: { amount: string; payment_method?: string; note?: string };
  }) =>
    request<Purchase>(`/purchases/${id}`, { method: "PUT", body: JSON.stringify({ purchase: body }) }),
  deletePurchase: (id: number) =>
    request<void>(`/purchases/${id}`, { method: "DELETE" }),
  addPurchasePayment: (id: number, body: { amount: string; payment_method?: string; note?: string }) =>
    request<Purchase>(`/purchases/${id}/add_payment`, { method: "POST", body: JSON.stringify({ purchase_payment: body }) }),

  // Invoices
  listInvoices: () => request<Invoice[]>(`/invoices`),
  getInvoice: (id: number) => request<Invoice>(`/invoices/${id}`),
  createInvoice: (body: { customer_id?: number; customer_name?: string; customer_phone?: string; discount_total?: string; roundoff?: string; payment_method?: string; billed_at?: string; invoice_items_attributes: InvoiceItemInput[] }) =>
    request<Invoice>(`/invoices`, { method: "POST", body: JSON.stringify({ invoice: body }) }),
  updateInvoice: (id: number, body: { customer_id?: number; customer_name?: string; customer_phone?: string; discount_total?: string; roundoff?: string; payment_method?: string; billed_at?: string; invoice_items_attributes?: InvoiceItemInput[] }) =>
    request<Invoice>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify({ invoice: body }) }),
  deleteInvoice: (id: number) =>
    request<void>(`/invoices/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => request<{
    today_sales: { count: number; total: number };
    month_sales: { total: number };
    latest_invoice: {
      id: number;
      invoice_no: string;
      customer_name?: string | null;
      customer_phone?: string | null;
      grand_total: number;
      billed_at?: string | null;
    } | null;
    recent_customers: Array<{
      name: string;
      phone?: string | null;
      last_purchase: string;
    }>;
    recent_invoices: Array<{
      id: number;
      invoice_no: string;
      customer_name?: string | null;
      customer_phone?: string | null;
      grand_total: number;
      billed_at?: string | null;
      created_at: string;
    }>;
    low_stock_products: Array<{
      id: number;
      name: string;
      current_stock: number;
      sku?: string | null;
    }>;
    recent_purchases: Array<{
      id: number;
      purchase_no: string;
      vendor_name?: string | null;
      grand_total: number;
      purchased_at?: string | null;
    }>;
    outstanding_purchases: Array<{
      id: number;
      purchase_no: string;
      grand_total: number;
      paid_total: number;
      balance_due: number;
    }>;
    totals: {
      products: number;
      vendors: number;
      invoices: number;
      purchases: number;
    };
  }>(`/dashboard`),
};
