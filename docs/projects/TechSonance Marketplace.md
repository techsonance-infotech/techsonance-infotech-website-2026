# TechSonance Marketplace - Sound Sphere

A comprehensive **multi-tenant techsonance marketplace** platform where customers can browse and purchase music products, vendors can manage their stores, and admins can oversee the entire platform - all from a single, beautifully crafted React application.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?logo=redux&logoColor=white)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Routing Overview](#routing-overview)
- [State Management](#state-management)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
The platform operates on a **multi-tenant architecture** where each vendor operates an isolated storefront under the Sound Sphere umbrella, managed centrally by platform administrators.

---

## Key Features

### 🛒 Customer Storefront
- **Product Browsing** - Browse by category, filter, and search across all vendor products
- **Shopping Cart** - Persistent cart with add/remove/update quantity, synced to localStorage
- **Wishlist** - Save favourite products for later, persisted across sessions
- **Checkout Flow** - Address selection, payment, and order confirmation
- **Order Tracking** - View order history and delivery status
- **User Profiles** - Manage personal info, multiple addresses (CRUD), and change password
- **Responsive Design** - Mobile-first with dedicated bottom tab navigation

### 🏪 Vendor Dashboard
- **Product Management** - Full CRUD for product listings (name, price, SKU, images, variants)
- **Order Processing** - View and manage incoming customer orders
- **Inventory Tracking** - Monitor stock levels
- **Financial Analytics** - Revenue insights and financial data via Recharts
- **Marketing Tools** - Promotional capabilities
- **Customer Care** - Handle customer inquiries and support
- **Store Settings** - Store profile, locations/warehouses, business profile, billing & banking, security

### 🛡️ Admin Panel
- **Vendor Management** - View all vendors, approve/reject registrations
- **Support Tickets** - Handle platform-wide support cases
- **Audit Logs** - System-wide activity tracking
- **Dashboard Analytics** - High-level platform metrics with data visualisations
- **Dark / Light Theme** - Toggle between themes in the admin panel

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)** - Protected routes per user role
- **JWT Token Auth** - Token-based authentication stored securely
- **Separate Login Portals** - Dedicated login/register flows for Admin, Vendor, and Customer
- **Session Persistence** - Auth state restored from localStorage on reload

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | React 19 · TypeScript 5.9 · Vite 7.2 |
| **State Management** | Redux Toolkit · React Redux |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS 4 · shadcn/ui · Radix UI · Motion (animations) |
| **Forms & Validation** | React Hook Form · Zod |
| **Data Visualisation** | Recharts |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Utilities** | date-fns · clsx · tailwind-merge · class-variance-authority |
| **UI Extras** | Embla Carousel · React Day Picker · react-responsive |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/techsonance-infotech/techsonance-marketplace.git
cd techsonance-marketplace

# Install dependencies
npm install

# Create your environment file
cp .env.local.example .env.local
# → Then fill in the API base URLs (see Environment Variables below)

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** (with `--host` enabled for network access).

---

## Project Structure

```
techsonance-marketplace/
├── public/                         # Static assets
├── src/
│   ├── app/
│   │   ├── main.tsx                # App entry point & route configuration
│   │   ├── store.ts                # Redux store with localStorage middleware
│   │   ├── index.css               # Global styles (Tailwind)
│   │   ├── not-found.tsx           # 404 page
│   │   └── pages/
│   │       ├── admin/              # Admin pages (7 files)
│   │       │   ├── AdminLayout.tsx
│   │       │   ├── DashBoard.tsx
│   │       │   ├── VendorManagement.tsx
│   │       │   ├── VendorForm.tsx
│   │       │   ├── ApproveVendor.tsx
│   │       │   ├── SupportTickets.tsx
│   │       │   └── AuditLog.tsx
│   │       ├── vendor/             # Vendor pages
│   │       │   ├── VendorLayout.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   ├── Orders.tsx
│   │       │   ├── Inventory.tsx
│   │       │   ├── Finances.tsx
│   │       │   ├── Marketing.tsx
│   │       │   ├── CustomerCare.tsx
│   │       │   ├── products/       # Product CRUD pages
│   │       │   └── settings/       # Vendor settings pages (6 files)
│   │       ├── shop/               # Customer-facing pages
│   │       │   ├── ShopLayout.tsx
│   │       │   ├── index.tsx       # Home (hero, categories, featured)
│   │       │   ├── Shopping.tsx    # Product listing with filters
│   │       │   ├── Product.tsx     # Product detail
│   │       │   ├── Contact.tsx
│   │       │   ├── AboutAs.tsx
│   │       │   └── customerProfile/
│   │       │       ├── UserLayout.tsx
│   │       │       ├── Addresses.tsx, Wishlist.tsx, CartList.tsx ...
│   │       │       └── Payment/    # Checkout & OrderStatus
│   │       └── auth/               # Login & Register pages per role
│   │
│   ├── components/
│   │   ├── common/                 # Shared (ProtectedRoute, Sidebar, Pagination ...)
│   │   ├── admin/                  # Admin Navbar, DashboardChart
│   │   ├── vendor/                 # Vendor Navbar
│   │   ├── customer/               # 14 storefront components
│   │   └── ui/                     # shadcn/ui primitives (Button, Card, Carousel ...)
│   │
│   ├── features/                   # Redux slices (7 total)
│   │   ├── auth/authSlice.ts       # Auth + user profile + address CRUD
│   │   ├── theme/adminThemeSlice.ts
│   │   ├── Cart.ts
│   │   ├── CartSidebar.ts
│   │   ├── Wishlist.ts
│   │   ├── sidebar.ts
│   │   └── menuBar.ts
│   │
│   ├── utils/
│   │   ├── constants.ts            # Nav links, API base URLs
│   │   ├── Types.ts                # TypeScript interfaces & types
│   │   ├── validation.ts           # Zod schemas
│   │   └── customer/constants.ts   # Customer-specific content & categories
│   │
│   ├── assets/                     # Brand logos, icons, poster images
│   └── lib/utils.ts                # Utility helpers (cn, etc.)
│
├── components.json                 # shadcn/ui config
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript base config
├── tsconfig.app.json               # App TS config
├── tsconfig.node.json              # Node TS config
├── eslint.config.js                # ESLint config
└── PROJECT_ARCHITECTURE_UPDATED.md # Detailed architecture documentation
```

---

## User Roles & Permissions

| Role | `user_role_id` | Permissions | Dashboard |
|---|:---:|---|---|
| **Admin** | `1` | Read · Create · Delete · Update | `/admin` |
| **Vendor** | `2` | Read · Create · Update | `/vendor` |
| **Customer** | `3` | Read | `/` (Storefront) |

Each role has a dedicated login portal, layout, sidebar, and set of protected routes. The `ProtectedRoute` component validates the user's role before rendering any guarded page.

---

## Routing Overview

| Path | Layout | Description |
|---|---|---|
| `/` | `ShopLayout` | Customer storefront (Home, Shopping, Product Detail, Contact, About) |
| `/auth/*` | - | Login & registration pages for all roles |
| `/customerProfile/:userId/*` | `UserLayout` | Profile, addresses, wishlist, cart, orders, checkout |
| `/admin/*` | `AdminLayout` | Admin dashboard, vendor management, support tickets, audit logs |
| `/vendor/*` | `VendorLayout` | Vendor dashboard, products, orders, inventory, finances, marketing, settings |
| `/vendor/settings/*` | `VendorSettingLayout` | Nested vendor settings (store profile, locations, security, billing) |

> For the full route tree, see `src/app/main.tsx` or [PROJECT_ARCHITECTURE_UPDATED.md](./PROJECT_ARCHITECTURE_UPDATED.md).

---

## State Management

The app uses **Redux Toolkit** with **7 slices** and a custom localStorage middleware for state persistence:

| Slice | Persisted | Purpose |
|---|:---:|---|
| `auth` | ✅ | User session, profile, addresses |
| `cart` | ✅ | Shopping cart items |
| `wishlist` | ✅ | Saved/favourite products |
| `cartSidebar` | ✅ | Cart panel open/close state |
| `adminTheme` | ❌ | Dark/light mode toggle |
| `sidebar` | ❌ | Admin/vendor sidebar collapse |
| `menu` | ❌ | Mobile menu open/close |

State is hydrated from `localStorage` on app init and automatically synced back via custom Redux middleware whenever relevant actions are dispatched.

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
VITE_VENDOR_BASE_URL=http://api.example.com/vendor
VITE_CUSTOMER_BASE_URL=http://api.example.com/customer
VITE_ADMIN_BASE_URL=http://api.example.com/admin
```

These are used across the app via `import.meta.env.VITE_*` to configure Axios base URLs for each role's API.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (with `--host` for LAN access) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Contributing

1. **Fork** the repository
2. **Create a feature branch** - `git checkout -b feature/my-feature`
3. **Commit your changes** - `git commit -m "feat: add my feature"`
4. **Push to the branch** - `git push origin feature/my-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing **feature-based folder structure** (pages by role, components by domain)
- Add new Redux slices in `src/features/` and register them in `src/app/store.ts`
- Define all TypeScript interfaces in `src/utils/Types.ts`
- Use **Zod** schemas (in `src/utils/validation.ts`) for form validation
- Keep navigation constants centralised in `src/utils/constants.ts`
- Use **shadcn/ui** components from `src/components/ui/` for consistent UI

---

## License

This project is private and proprietary to **TechSonance Infotech**.

---

<p align="center">
  Built with ❤️ by <strong>TechSonance Infotech</strong>
</p>
