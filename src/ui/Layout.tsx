import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

function NavItem({ to, label, icon, onNavigate }: { to: string; label: string; icon?: string; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg no-underline text-sm transition-all duration-200 ${
        active
          ? "text-blue-600 bg-blue-50 font-semibold"
          : "text-gray-700 hover:bg-gray-100 font-medium"
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">HisaabKitaab</h1>
            <p className="text-xs text-gray-600 mt-1">Inventory & Billing</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem to="/dashboard" label="Dashboard" icon="📊" onNavigate={() => setSidebarOpen(false)} />
            <NavItem to="/products" label="Products" icon="📦" onNavigate={() => setSidebarOpen(false)} />
            <NavItem to="/vendors" label="Vendors" icon="🏢" onNavigate={() => setSidebarOpen(false)} />
            <NavItem to="/customers" label="Customers" icon="👥" onNavigate={() => setSidebarOpen(false)} />
            <NavItem to="/purchases" label="Purchases" icon="📥" onNavigate={() => setSidebarOpen(false)} />
            <NavItem to="/invoices" label="Invoices" icon="📄" onNavigate={() => setSidebarOpen(false)} />
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">HisaabKitaab</h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
