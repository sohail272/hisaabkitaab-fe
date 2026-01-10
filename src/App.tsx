import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./ui/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
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
import StoresPage from "./pages/StoresPage";
import NewStorePage from "./pages/NewStorePage";
import UsersPage from "./pages/UsersPage";
import NewUserPage from "./pages/NewUserPage";
import EditUserPage from "./pages/EditUserPage";
import { useAuth } from "./contexts/AuthContext";

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if onboarding is needed
    const checkOnboarding = async () => {
      try {
        const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'https://hisaabkitaab-be.onrender.com/api/v1';
        const response = await fetch(`${BASE}/auth/check_onboarding`);
        if (response.ok) {
          const data = await response.json();
          setNeedsOnboarding(data.needs_onboarding);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setNeedsOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show onboarding if needed and not authenticated
  if (needsOnboarding && !isAuthenticated) {
    return <OnboardingPage />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show app routes if authenticated
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <NewProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <EditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <VendorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/new"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <NewVendorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/:id/edit"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <EditVendorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/:id"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <VendorDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <NewCustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <EditCustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <CustomerDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <PurchasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/new"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <NewPurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/:id/edit"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <EditPurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/:id"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <PurchaseDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <ProtectedRoute>
              <NewInvoicePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id/edit"
          element={
            <ProtectedRoute requiredRole="store_manager">
              <EditInvoicePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <StoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores/new"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <NewStorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores/:id/edit"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <NewStorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <NewUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute requiredRole="org_admin">
              <EditUserPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;


