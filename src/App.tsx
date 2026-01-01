import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./ui/Layout";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import NewProductPage from "./pages/NewProductPage";
import EditProductPage from "./pages/EditProductPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import VendorsPage from "./pages/VendorsPage";
import NewVendorPage from "./pages/NewVendorPage";
import EditVendorPage from "./pages/EditVendorPage";
import VendorDetailsPage from "./pages/VendorDetailsPage";
import CustomersPage from "./pages/CustomersPage";
import NewCustomerPage from "./pages/NewCustomerPage";
import EditCustomerPage from "./pages/EditCustomerPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import PurchasesPage from "./pages/PurchasesPage";
import NewPurchasePage from "./pages/NewPurchasePage";
import EditPurchasePage from "./pages/EditPurchasePage";
import PurchaseDetailsPage from "./pages/PurchaseDetailsPage";
import InvoicesPage from "./pages/InvoicesPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import EditInvoicePage from "./pages/EditInvoicePage";
import InvoiceDetailsPage from "./pages/InvoiceDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/new" element={<NewVendorPage />} />
          <Route path="/vendors/:id/edit" element={<EditVendorPage />} />
          <Route path="/vendors/:id" element={<VendorDetailsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerPage />} />
          <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailsPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/new" element={<NewPurchasePage />} />
          <Route path="/purchases/:id/edit" element={<EditPurchasePage />} />
          <Route path="/purchases/:id" element={<PurchaseDetailsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<NewInvoicePage />} />
          <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;


