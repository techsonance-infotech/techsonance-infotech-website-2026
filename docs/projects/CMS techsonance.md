# 🏢 CMS TechSonance — Enterprise Operations, HRMS & Client Management System

> **Unified Multi-Tenant Operations, Workforce Governance & Client CRM Platform**  
> *Engineered by TechSonance InfoTech LLP · Built with Next.js 15, React 19, Supabase (PostgreSQL), and Docker*

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

🔗 **Live Portal:** [cms.techsonance.co.in/login](https://cms.techsonance.co.in/login)

---

## 📋 Table of Contents

- [Executive Summary](#-executive-summary)
- [Core Architecture & Multi-Tenancy](#-core-architecture--multi-tenancy)
- [HRMS (Human Resource Management System)](#-hrms-human-resource-management-system)
- [Project Management & Sprints](#-project-management--sprints)
- [Client Relationship Management (CRM)](#-client-relationship-management-crm)
- [Finance & Invoicing Engine](#-finance--invoicing-engine)
- [Help Desk & Support Ticketing](#-help-desk--support-ticketing)
- [Content Management & Media Library](#-content-management--media-library)
- [23-Role Granular Permission Matrix (RBAC)](#-23-role-granular-permission-matrix-rbac)
- [API Architecture (53+ REST Endpoints)](#-api-architecture-53-rest-endpoints)
- [Security, Telemetry & DevOps](#-security-telemetry--devops)

---

## 📌 Executive Summary

**CMS TechSonance** is an enterprise-grade multi-tenant operations platform designed to consolidate day-to-day organizational workflows into a single pane of glass. It serves as both an internal operations nerve center (HRMS, dual-source attendance, automated payroll, daily task tracking, expense claims) and a client-facing delivery platform (project sprints, milestone deliverables, client communication logs, helpdesk ticketing, and invoicing).

The application is secured behind a fine-grained **23-Role Permission Matrix** enforced through **Supabase Row-Level Security (RLS)** at the PostgreSQL database layer and **custom API handler middleware** in the Next.js App Router.

---

## 🏗 Core Architecture & Multi-Tenancy

- **Database-Level Isolation**: Every query is strictly isolated by `tenant_id`. Supabase Row-Level Security (RLS) policies prevent cross-tenant data leakage even in direct queries.
- **Dual Dashboard Paradigm**:
  - **Executive & Admin Dashboard**: Real-time business KPIs, active clients, active projects, revenue run-rate charts, workforce hub, pending approval queues, and global activity feeds.
  - **Employee Workspace Dashboard**: Monthly/yearly worked hours, active project assignments, due-today task widgets, attendance history charts, report compliance, and organizational announcements.
- **Standardized API Envelope**: All 53+ endpoints use a unified response wrapper (`{ success, data, message, errors, meta }`) with built-in audit logging and correlation ID tracing.
- **Telemetry & Observability**: MongoDB handles authentication telemetry, login/logout session tracing, and audit mutations, complemented by structured logging.

---

## 👥 HRMS (Human Resource Management System)

### 1. Team & Employee Directory
- Complete employee lifecycle management with full CRUD operations.
- Departmental organization (Engineering, Operations, Design, QA, Sales, Management).
- Employment status tracking: `active`, `on_leave`, `resigned`.
- Dynamic employee profile management with secure avatar uploads via Supabase Storage.
- Comprehensive individual employee pages detailing assigned projects, work history, and device enrollments.

### 2. Dual-Source Attendance & Tracking
- **Hybrid Tracking**:
  - **NFC Hardware Readers**: Reader device agents read physical employee NFC card UIDs with instant tap validation and offline buffering.
  - **Manual Web Check-In / Check-Out**: Fallback for remote and authorized personnel with device telemetry.
- **GPS Geofencing**: Validates mobile check-ins against configured tenant office coordinates and radius limits.
- **IP Whitelisting**: Restricts or flags check-ins occurring outside approved office IP ranges.
- **Automatic Overtime Calculation**: Evaluates working hours against tenant standard work day policies.
- **Weekend Attendance Approval Workflow**: Shifts logged on non-working days are automatically routed to an approval queue requiring employee justification notes.
- **Violation Flagging**: Automatically flags geofence breaches or IP mismatches, notifying HR and administrators immediately.

### 3. Daily Work Reports & Updates
- End-of-day progress submission by team members tagged to specific projects and milestones.
- Status classification: `present`, `half_day`, `early_leave`, `on_leave`.
- Missing report alerts prominently displayed on executive dashboards to track reporting compliance.
- Manager review and feedback loops on daily project updates.

### 4. Leave & Holiday Management
- Multi-tier leave submission and approval workflows (`pending` → `approved` / `rejected`).
- Support for multiple leave types: `sick`, `casual`, `vacation`, `unpaid`.
- Per-organization leave policy configuration with quota and carry-forward rules.
- Centralized company holiday calendar with real-time employee leave balance counters.

### 5. Automated Payroll Engine
- Server-side payroll computation engine calculating net pay, deductions, and tax withholdings.
- Configurable pay periods with a structured lifecycle: `draft` → `approved` → `paid`.
- Bulk payroll processing with paginated batch actions.
- Secure automated payslip PDF generation and storage in Supabase Storage.

### 6. Reimbursements & Expense Claims
- Digital claim submission with attached receipt images (camera/file uploads).
- Pre-configured and customizable categories: *Travel, Meal, Lodging, Office Supplies, Internet/Phone, Equipment*.
- Multi-step approval lifecycle: `draft` → `submitted` → `approved` → `rejected`.
- Direct integration into executive dashboard approval queues.

---

## 🗂 Project Management & Sprints

- **Full Project Lifecycle**: Tracks initiatives across `planned`, `in_progress`, `completed`, `on_hold`, and `cancelled` states.
- **Role-Based Member Allocation**: Assigns engineers, designers, and managers with specific project roles and permission boundaries.
- **Agile Sprints & Milestones**: Granular milestone deadlines, sprint goals, and deliverable percentage tracking.
- **Interactive Kanban Task Board**:
  - Drag-and-drop status lanes: `todo` → `in_progress` → `in_review` → `done`.
  - Priority scoring: `low`, `medium`, `high`, `urgent`.
  - Tasks-due-today counters and sprint linkage.
- **Project Document Vault**: Versioned document storage for PRDs, specifications, diagrams, and client sign-offs via Supabase Storage.

---

## 🤝 Client Relationship Management (CRM)

- **Client Directory**: Centralized account profiles with active contract statuses, key stakeholders, and billing terms.
- **Communication History & Logs**: Chronological timeline of meetings, calls, email threads, and milestone reviews.
- **Inquiry Management & Feeds**: Lead capture portal with source attribution, qualification metrics, and lead status tracking.
- **Client-to-Project Association**: Seamlessly links client accounts to their active development sprints and billing profiles.
- **Business Development Pipeline**: Tracks new client proposals, contract values, closing probabilities, and NDA/contract agreements.

---

## 💰 Finance & Invoicing Engine

- **End-to-End Invoice Lifecycle**: `draft` → `sent` → `paid` → `overdue` → `cancelled`.
- **Dynamic Line Items**: Automated calculation of quantities, hourly rates, milestone fees, and GST/international tax percentages.
- **Payment Processing**: Integrated Stripe payment workflows with webhook transaction reconciliation.
- **Expense Categorization**: Categorized operational expenditures for real-time EBITDA and margin tracking.
- **Financial Run-Rate Analytics**: Recharts-powered revenue trends, billing histories, and cashflow charts on the executive dashboard.

---

## 🎫 Help Desk & Support Ticketing

- **Ticket Classification**: Priority levels (`low`, `medium`, `high`, `urgent`) with SLA escalation rules.
- **Status Lifecycle**: `open` → `in_progress` → `resolved` → `closed`.
- **Collaborative Threading**: Internal notes, client responses, and file attachments.
- **Real-Time Push Notifications**: Instant alerts for status changes and ticket replies via Firebase Cloud Messaging (FCM).

---

## 📰 Content Management & Media Library

- **Blog & Article Management**: Rich text content authoring, tagging, categories, and SEO metadata.
- **Media Asset Library**: Centralized asset management for images, PDFs, and brand assets.
- **Case Study & Portfolio Showcase**: Dynamic builder for publishing case studies and client projects.

---

## 🔐 23-Role Granular Permission Matrix (RBAC)

The system enforces granular permissions (`canView`, `canCreate`, `canEdit`, `canDelete`, `canApprove`) across **13 functional modules**:

| Tier | Included Roles | Capabilities |
|---|---|---|
| **Executive** | Super Admin, Admin, CEO, CTO, Director | Full access across all 13 modules, approvals, billing & system settings |
| **Management** | HR Manager, CMS Administrator, Operations Lead | Full access to HR, team directory, projects, reports, content, and attendance |
| **Finance** | Chief Accountant, Billing Specialist | Full finance, invoices, payroll & expense approvals; read-only operations |
| **Operations** | Project Manager, Scrum Master | Full project, sprint, task, milestone, and daily report management |
| **Sales / BD** | Business Development, Account Executive | Full CRM, inquiry pipeline, client directory, and proposal management |
| **Engineering** | Fullstack, Frontend, Backend, Mobile Dev, QA, DevOps | Task boards, daily report submissions, attendance, project viewing |
| **Creative** | UI/UX Designer, Digital Marketer | Content management, media library, task execution, daily updates |
| **Entry** | Intern | Task tracking, daily report submission, view-only project access |
| **External** | Client Portal User | View-only project milestones, financial invoices, and help desk ticketing |

---

## 🛠 Complete Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 15.3 (App Router) & React 19 | High-performance SSR, server components, and routing |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling & UI** | Tailwind CSS 4, Radix UI & shadcn/ui | Modern design system, accessible UI primitives |
| **Animations** | Framer Motion 12 | Fluid transitions, dashboard animations, and interactive cards |
| **Data Visualization** | Recharts 3 | Real-time financial run-rate and attendance charts |
| **Primary Database** | Supabase (PostgreSQL 16) | Relational database with Row-Level Security (RLS) |
| **Telemetry Database** | MongoDB 7 | Audit logs, authentication telemetry, and activity tracking |
| **Storage Engine** | Supabase Storage | Encrypted storage for avatars, invoices, receipts, and PRDs |
| **Authentication** | Supabase Auth + better-auth | JWT bearer tokens, HTTP-only refresh cookies, RBAC middleware |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Real-time mobile and web push alerts |
| **Payments** | Stripe API | Invoicing, automated payment processing, and webhooks |
| **DevOps & Containers** | Docker & Docker Compose | Multi-stage production containerization |
| **API Documentation** | OpenAPI 3.0 / Swagger | AST-parsed auto-generated API specifications (53+ endpoints) |

---

## 📊 Business Impact & Measurable Results

- **6-in-1 Consolidation**: Replaced 6 fragmented SaaS tools (biometric hardware portal, leave tracker, spreadsheet billing, Trello, client email chains, and accounting spreadsheets) into a unified ecosystem.
- **100% Data Isolation**: Row-Level Security (RLS) ensures absolute data privacy across multi-tenant organizations.
- **Zero Attendance Fraud**: Hardware NFC readers paired with GPS geofencing and IP validation eliminated buddy-punching completely.
- **25+ Admin Hours Saved**: Automated payroll calculation and expense approval workflows save over 25 manual administrative hours each week.
