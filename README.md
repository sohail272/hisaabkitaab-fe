# HisaabKitaab - Frontend

A modern, responsive web application for managing inventory, invoices, purchases, customers, vendors, and products. Built with React, TypeScript, and Tailwind CSS.

## Overview

HisaabKitaab (हिसाब किताब) is a comprehensive accounting and inventory management system designed for small to medium businesses. The frontend provides an intuitive interface for managing all aspects of your business operations.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## Features

### 📊 Dashboard
- Real-time sales statistics (today and monthly)
- Recent invoices overview (latest 3)
- Low stock alerts
- Recent purchases and outstanding payments
- Quick access to all modules

### 🧾 Invoice Management
- Create, edit, and delete invoices
- PDF-like invoice view with print functionality
- Mobile share functionality
- Automatic stock reduction on invoice creation
- Support for discounts (percentage or fixed amount)
- Roundoff adjustment
- Multiple payment methods
- Customer auto-detection by phone number

### 📦 Product Management
- Full CRUD operations for products
- Searchable product list
- Stock tracking
- SKU and barcode support
- Vendor association
- Active/Inactive status

### 🏪 Vendor Management
- Vendor information management
- Searchable vendor list
- Contact details (phone, email, address)
- Active/Inactive status

### 👥 Customer Management
- Customer information management
- Phone-based customer lookup
- Auto-creation from invoices
- Searchable customer list
- Purchase history tracking

### 🛒 Purchase Management
- Create and manage purchase orders
- Vendor selection with search
- Multiple line items
- Payment tracking
- Outstanding balance management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see [hisaabkitaab-be README](../hisaabkitaab-be/README.md))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hisaabkitaab-fe
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL:
```env
VITE_API_BASE_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
hisaabkitaab-fe/
├── src/
│   ├── api.ts              # API client and type definitions
│   ├── App.tsx             # Main app component with routes
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles and utility classes
│   ├── pages/              # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── NewInvoicePage.tsx
│   │   ├── EditInvoicePage.tsx
│   │   ├── InvoiceDetailsPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── NewProductPage.tsx
│   │   ├── EditProductPage.tsx
│   │   ├── ProductDetailsPage.tsx
│   │   ├── VendorsPage.tsx
│   │   ├── NewVendorPage.tsx
│   │   ├── EditVendorPage.tsx
│   │   ├── VendorDetailsPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── NewCustomerPage.tsx
│   │   ├── EditCustomerPage.tsx
│   │   ├── CustomerDetailsPage.tsx
│   │   ├── PurchasesPage.tsx
│   │   ├── NewPurchasePage.tsx
│   │   ├── EditPurchasePage.tsx
│   │   └── PurchaseDetailsPage.tsx
│   └── ui/
│       └── Layout.tsx      # Main layout with sidebar navigation
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Key Features Implementation

### Searchable Dropdowns
All dropdowns (products, vendors, customers) support real-time search for better UX.

### Responsive Design
- Mobile-first approach
- Responsive tables and forms
- Touch-friendly interface
- Print-optimized invoice view

### Invoice Features
- **PDF-like Layout**: Professional invoice design matching traditional Indian billing format
- **Share Functionality**: Native Web Share API with clipboard fallback
- **Print Support**: Print-optimized CSS for clean invoice printing
- **Roundoff Support**: Adjust final amount with roundoff
- **Discount Types**: Percentage or fixed amount discounts

### Status Badges
Consistent status indicators across all pages:
- Active/Inactive (green/gray)
- Paid/Finalized (green/blue)
- Clean, modern design

## API Integration

The frontend communicates with a Rails API backend. All API calls are centralized in `src/api.ts`:

- RESTful endpoints for all resources
- Type-safe request/response handling
- Error handling and user feedback

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Tailwind CSS

Custom utility classes are defined in `src/index.css`:
- `.btn` - Base button styles
- `.btn-primary` - Primary action buttons
- `.btn-danger` - Delete/destructive actions
- `.btn-success` - Success actions
- `.input` - Form input styles
- `.card` - Card container styles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes

### Code Style
- ESLint for code quality
- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions

### State Management
- React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
- Local component state
- API-driven data fetching

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory, ready to be deployed to any static hosting service.

## Deployment

The frontend can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Make sure to set the `VITE_API_BASE_URL` environment variable in your hosting platform.

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all linting passes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue in the repository.

