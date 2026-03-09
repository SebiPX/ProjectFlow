# AgencyFlow - Modern Project Management for Agencies

![AgencyFlow Dashboard](https://i.imgur.com/gKj7XyC.png)

## 🎯 Vision & Purpose

**AgencyFlow** is a modern, professional web application specifically designed for creative, digital, and advertising agencies. The goal is to manage the entire lifecycle of a project – from initial inquiry through quote creation, task management, and resource planning to final billing – in one central, intuitive platform.

This app aims to increase efficiency, improve transparency for internal teams and clients, and make collaboration seamless.

---

## ✨ Current Features (Production Ready)

### Core Functionality (100% Complete)

**✅ Authentication & User Management**

- Login and signup with Supabase Auth
- Automatic profile creation on signup
- Role-based access control (Admin, Employee, Freelancer, Client)
- Session management with persistent login
- Full name capture during registration

**✅ Client Management**

- Create, view, update, and delete clients
- **Company logo upload** with secure signed URL display
- Company information (name, address, VAT ID, payment terms, website)
- Multiple contact persons per client (name, position, email, phone)
- Primary contact designation
- Beautiful card-based layout with contact display and logos
- Full CRUD with React Query state management

**✅ Project Management**

- Create, view, edit, and delete projects
- Link projects to clients
- Project categories and status tracking
- **Real-time budget tracking** with financial calculations
  - Shows actual spent (costs + billable hours value) vs budget
  - Color-coded progress bars (blue/yellow/red based on usage)
  - Over-budget warnings with red indicators
- **Deadline display on project cards** with urgency indicators
  - Color-coded: Red (overdue), Yellow (≤7 days), Gray (normal)
  - Smart text: "Due today", "Due tomorrow", or formatted date
- **Finance tab** with complete cost tracking (see Finance Management below)
- **Services tab** with Plan vs Actual service breakdown
  - Aggregated view of all service-tracked tasks
  - Grouped by service module + seniority level
  - Shows planned vs actual hours and values with variance indicators
  - Total row with project-wide aggregation
- Custom color coding for visual organization
- Start dates and deadlines
- Full CRUD operations with auto-refresh

**✅ Task Management (Modern Grid View with Service Integration)**

- Create, view, edit, and delete tasks
- **Service-based estimation**: Link tasks to service catalog with auto-filled rates
- **Plan vs Actual tracking**: Compare estimated vs actual hours and costs per task
- **Service badge display**: Visual indicator on task cards showing service + hours
- **Modern card-based grid layout** (responsive: 1/2/3/4 columns)
- **Advanced filtering**: Status, Project, Assignee (including Unassigned)
- **"Only Me" filter button**: Show only tasks assigned to current user
- **Flexible sorting**: Date Created, Task Name, Due Date, Status (asc/desc)
- Beautiful TaskCard component with avatars and project colors
- Kanban board visualization (To Do, In Progress, Review, Done)
- Assign tasks to team members
- Due dates with overdue warnings (red highlight)
- Task descriptions and planning (estimated time)
- Client visibility toggle
- Time tracking integration
- Active filter count with clear filters button
- Skeleton loading states
- Enhanced empty states
- Full CRUD with instant updates

**✅ Dashboard**

- Active projects count
- Total budget overview
- Time tracking summary
- Visual charts and KPIs
- Real-time data from Supabase

**✅ Finance Management**

- **Project cost tracking** with comprehensive expense management
- **Cost categories**: Software/Licenses, External Services, Marketing, Hardware, Travel, Office Supplies, Consulting, Other
- **Document upload** for receipts and invoices (10MB max, stored in AgencyStorage)
- **Real-time financial dashboard** in ProjectDetail Finance tab:
  - Total Budget vs Spent comparison
  - Direct Costs aggregation
  - Billable Hours Value calculation (hours × employee rates)
  - Remaining budget with color indicators (green/red)
  - Category filtering for expenses
- **Estimated costs** toggle for budgeting
- Download cost documents with secure signed URLs
- Full CRUD operations with React Query
- Integration with time tracking for accurate billing

**✅ Employee Management (Admin-Only)**

- **Team member management** restricted to admin users
- Beautiful card-based grid layout
- **Employee profiles** with:
  - Avatar and full name display
  - Role badges (Admin, Employee, Freelancer)
  - Weekly contracted hours (40h default, customizable)
  - Billable hourly rate (used for project billing calculations)
  - Internal cost per hour (for profit margin analysis)
- **Edit modal** for updating:
  - Contact information (name, email)
  - Role assignment
  - Financial rates and availability
  - Input validation for numeric fields
- **Admin-only sidebar visibility**: Employees link hidden for non-admin users
- Excludes client users from list
- Full integration with profiles table
- Used for billable hours calculations in finance tracking

**✅ Real-time Collaboration & Notifications**

- **Live Data Sync**: Tasks, Costs, and Financials update instantly across all connected clients.
- **Global Notification System**:
  - **Instant Toast Alerts**: Receive popup notifications for assignments even when browsing other pages.
  - **Badge Count**: Red notification badge updates in real-time.
  - **Assignment Tracking**: Automatic notifications when tasks are assigned to you.
- **Presence Awareness**: See who is currently online (green dot indicator on avatars).
- **Efficient Sync**: Uses Supabase Realtime (Postgres Changes) to push updates only when necessary.

**✅ Service-Katalog v2 (Admin-Only) - Normalized Multi-Table Structure**

- **3-table architecture** for granular service pricing
  - service_modules: Master service definitions
  - seniority_levels: Junior, Professional, Senior, Director with experience requirements
  - service_pricing: Rate matrix with internal costs and auto-calculated margins
- **Expandable card layout** (responsive: 1/2 columns)
- **Service entries** with:
  - Category badges (CONSULTING, CREATION, PRODUCTION, MANAGEMENT, LOGISTICS)
  - Service module name and description
  - Default unit (hour, day, flat, piece)
  - Active/Inactive status with toggle
  - Pricing count indicator
- **Expandable pricing tables** on card click
  - Shows all configured seniority levels
  - Columns: Level, Rate, Internal Cost, Margin (%)
  - Color-coded margins: Green (≥35%), Yellow (≥25%), Red (<25%)
- **1-step create/edit modal** with inline pricing matrix
  - Checkbox-enabled seniority level selection
  - Live margin calculation: `((rate - cost) / rate * 100)`
  - Batch operations for creating/updating/deleting pricing entries
  - Delete confirmation ("Gefahrenzone")
- **Advanced filtering**: Category filter, Active/Inactive toggle
- **Flexible sorting**: Name or Category
- Integration ready for financial_items (service_module_id + seniority_level_id)
- **Seed data**: 4 seniority levels + 10 service modules + sample pricing

**✅ Project Margin Calculation (Integrated Financial Tracking)**

- **Automatic margin calculation** for project profitability analysis
- **Database integration**: Extended financial_items table with service references (service_module_id, seniority_level_id)
- **ProjectMarginCard** component in Finance tab:
  - 4-column dashboard: Einnahmen (Revenue), Kosten (Costs), Gewinn (Profit), Marge (%)
  - Status indicators: Excellent (≥30%), Good (≥20%), Acceptable (≥10%), Poor (<10%), Negative (<0%)
  - Color-coded: Green → Blue → Yellow → Orange → Red
  - Real-time calculation: Revenue (approved quotes) - Costs (direct + billable hours)
- **Margin badge on project cards** in project list
  - Shows profitability at a glance
  - +X.X% format with status color-coding
- **API functions**: calculateProjectRevenue, calculateProjectCosts, calculateProjectMargin, batch calculations
- **Integration ready**: Works automatically when projects have approved quotes
- **Future expansion**: Task-level service tracking (Option B) documented in ROADMAP-SERVICE-INTEGRATION.md

**✅ Resource Planning (Interactive Capacity Timeline)**

- **Timeline View**: Visual Gantt-style overview of team workload
- **Heatmap Visualization**: Color-coded capacity indicators
  - Green (<80%): Available
  - Yellow (80-100%): Fully booked
  - Red (>100%): Overbooked
- **Interactive Management**: Click on any cell to open Allocation Modal
- **Task Reassignment**: Instantly move tasks between team members
- **Real-time updates**: Changes reflect immediately for all users
- **Date Navigation**: Jump between weeks to plan ahead
- **Smart Tooltips**: Hover for detailed task breakdown per day

**✅ Asset Management (Modern Grid View with Preview)**

- Complete file upload/download/delete workflow
- **Modern card-based grid layout** (responsive: 1/2/3 columns)
- **Advanced filtering**: Status, Project, Category, Uploader
- **"Only Me" filter button**: Show only assets uploaded by current user
- **Flexible sorting**: Date Created, Asset Name, Status, Category (asc/desc)
- **Asset status workflow**: Upload → Internal Review → Client Review → Changes Requested/Approved → Archived
- **Full-screen preview modal** for all asset types:
  - Images: Direct display with full resolution
  - PDFs: Embedded iframe viewer
  - Videos: Native HTML5 player with controls
  - Audio: Audio player with FileIcon
  - Other files: FileIcon with download button
- **Signed URL support** for secure private storage access (1-hour expiry)
- Integration with Supabase Storage (AgencyStorage bucket)
- Visual file type indicators with color-coded icons
- Image thumbnails with async loading
- Status tracking and approval workflow
- Client visibility control
- File metadata (type, size, category, description)
- Auto-formatted file sizes (Bytes → KB → MB → GB)
- Active filter count with clear filters button
- Skeleton loading states
- Enhanced empty states
- Supports all common file types (images, PDFs, Office docs, videos, audio, archives, code)

---

## 🏗️ Technical Architecture

### Frontend Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (responsive design)
- **State Management**: @tanstack/react-query (v5)
- **Routing**: React Router (if needed)
- **Forms**: Controlled components with validation
- **Charts**: Recharts for dashboard visualizations
- **Notifications**: react-toastify for user feedback
- **Build Tool**: Vite

### Backend Stack (Custom Node.js)

- **Database**: PostgreSQL (shared `labs_db` instance)
- **Backend API**: Express.js REST API (`labs-api` project)
- **Authentication**: Custom JWT-based Auth
- **Storage**: Local file upload handling on backend
- **API**: Custom REST API routes under `/api/agency`

### Database Schema

- **14 Tables**: clients (with logo_url), client_contacts, profiles (with rates & hours), projects (with project_members), tasks, assets, costs (with document_path), financial_documents, financial_items, time_entries, service_modules, seniority_levels, service_pricing, project_members
- **10 Enum Types**: user_role, project_category, project_status, task_status, asset_type, asset_status, doc_type, doc_status, time_status, cost_category
- **19+ Foreign Keys**: Fully relational with CASCADE/RESTRICT rules
- **RLS Policies**: Complete security model (internal vs client access) with costs table policies
- **Helper Functions**: `is_internal()`, `get_my_client_id()`, `handle_new_user()`
- **Triggers**: Auto-create profile on user signup
- **Storage Buckets**: AgencyStorage for assets, client logos, and cost documents

---

## 📊 Implementation Status

### Core Features (100%)

| Feature                  | Status  | CRUD | Notes                                                                    |
| ------------------------ | ------- | ---- | ------------------------------------------------------------------------ |
| Authentication           | ✅ 100% | -    | Login, Signup, Session, Roles                                            |
| Clients                  | ✅ 100% | ✅   | Create, Read, Update, Delete with contacts & logos                       |
| Client Contacts          | ✅ 100% | ✅   | Multiple contacts per client                                             |
| Projects                 | ✅ 100% | ✅   | Create, Read, Update, Delete with real financial data                    |
| Project Finances         | ✅ 100% | ✅   | Cost tracking, billable hours, budget calculations                       |
| Tasks                    | ✅ 100% | ✅   | Create, Read, Update, Delete with "Only Me" filter + service integration |
| Task Service Integration | ✅ 100% | ✅   | Plan vs Actual tracking with variance analysis                           |
| Kanban Board             | ✅ 100% | -    | Visual task management by status                                         |
| Dashboard                | ✅ 100% | -    | KPIs, Charts, Real-time data                                             |
| Assets                   | ✅ 100% | ✅   | Upload, Download, Delete, Preview, Status workflow, "Only Me" filter     |
| Time Tracking            | ✅ 90%  | ✅   | Timer with persistence across navigation                                 |
| Employee Management      | ✅ 100% | ✅   | Admin-only team member management with rates                             |
| Service Catalog v2       | ✅ 100% | ✅   | Normalized 3-table structure with seniority-based pricing                |
| Project Margin Tracking  | ✅ 100% | -    | Automatic profitability calculation with status indicators               |

### Planned Features (0-50%)

| Feature             | Status  | Priority | Notes                                                           |
| ------------------- | ------- | -------- | --------------------------------------------------------------- |
| Financial Documents | ✅ 100% | ✅       | Quotes & Invoices with Service Selection, Real-time Budget Sync |
| Reports             | ✅ 100% | Medium   | Analytics dashboard with service profitability analysis         |
| Resource Planning   | ✅ 100% | Medium   | Employee hours tracked, interactive capacity timeline           |
| Real-time Updates   | ✅ 100% | High     | Supabase Realtime (WebSockets)                                  |

### New in v1.8.0

| Feature           | Status  | Notes                                                               |
| ----------------- | ------- | ------------------------------------------------------------------- |
| Client Portal     | ✅ 100% | Dedicated dashboard, restricted asset/project views, secure RLS     |
| Asset Drag-n-Drop | ✅ 100% | Kanban board for assets, optimistic updates, role-based interaction |
| Deployment        | ✅ 100% | Docker, NGINX, VPS setup guide (`DEPLOYMENT.md`)                    |

### New in v1.9.0

| Feature             | Status  | Notes                                                    |
| ------------------- | ------- | -------------------------------------------------------- |
| Reports & Analytics | ✅ 100% | Service Profitability, Revenue vs Cost charts            |
| Real-time Presence  | ✅ 100% | Online user tracking, "Online Only" team filter          |
| Notifications       | ✅ 100% | Real-time alerts, bell icon, feedback loops              |
| Time Approvals      | ✅ 100% | Approval workflow, rejection with reason                 |
| Secure Team View    | ✅ 100% | Employee visibility without financial data (RPC secured) |
| Real-time Updates   | ✅ 100% | Live Task/Cost sync, Toast Notifications                 |

### New in v1.11.0

| Feature           | Status  | Notes                                                           |
| ----------------- | ------- | --------------------------------------------------------------- |
| Resource Planning | ✅ 100% | Interactive Timeline, Capacity Heatmap, Task Reassignment Modal |
| PDF/CSV Export    | ✅ 100% | Professional Quotes/Invoices, Payroll Data Export               |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd agencyflow-project-management
npm install
```

### 2. Set Up Backend (Visionary PX Studio API)

1. Ensure the `labs_db` PostgreSQL database is running.
2. the `labs-api` Node.js server needs to be running.
3. The API includes all `agency_*` tables required for ProjectFlow.

### 3. Configure Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

_(Point this to your running `labs-api` instance)_

### 4. Run Development Server

```bash
npm run dev
```

### 5. Create First User

1. Open the app (usually http://localhost:5173)
2. Click "Sign Up"
3. Enter your details (email, password, full name)
4. After signup, set your role to admin:

```sql
-- Run in Supabase SQL Editor
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. (Optional) Add Seed Data

Run `scripts/seed-data-fixed.sql` in Supabase SQL Editor for sample clients and projects.

---

## 📁 Project Structure

```
agencyflow-project-management/
├── components/              # React components (~35 files)
│   ├── Dashboard.tsx       # Dashboard with KPIs
│   ├── ProjectList.tsx     # Projects grid with financial data
│   ├── ProjectDetail.tsx   # Single project view (multi-tab: tasks, assets, finances)
│   ├── ProjectFormModal.tsx # Create project
│   ├── ProjectEditModal.tsx # Edit project
│   ├── TaskList.tsx        # All tasks grid with "Only Me" filter
│   ├── TaskFormModal.tsx   # Create task
│   ├── TaskEditModal.tsx   # Edit task
│   ├── KanbanBoard.tsx     # Task board
│   ├── ClientList.tsx      # Clients grid with logos
│   ├── ClientFormModal.tsx # Create client with logo upload
│   ├── ClientEditModal.tsx # Edit client with contacts
│   ├── AssetList.tsx       # Assets grid with "Only Me" filter
│   ├── AssetUploadModal.tsx # Upload assets
│   ├── AssetPreviewModal.tsx # Preview images/PDFs/videos/audio
│   ├── AssetStatusModal.tsx # Change asset status
│   ├── CostFormModal.tsx   # Add project costs
│   ├── CostEditModal.tsx   # Edit costs
│   ├── EmployeeList.tsx    # Admin-only team management
│   ├── EmployeeEditModal.tsx # Edit employee rates
│   ├── TimeTrackingModal.tsx # Time entry with timer
│   ├── Login.tsx           # Login form
│   ├── Signup.tsx          # Registration form
│   ├── Header.tsx          # Top navigation
│   ├── Sidebar.tsx         # Left navigation (role-based)
│   └── ui/                 # Reusable components
│       ├── Card.tsx        # Card component
│       ├── Icon.tsx        # SVG icon component
│       ├── FileIcon.tsx    # File type icons
│       ├── Avatar.tsx      # User avatars
│       └── ClientLogo.tsx  # Client logo component
├── services/api/           # API layer (9 modules)
│   ├── projects.ts         # Project CRUD + financial overview
│   ├── tasks.ts            # Task CRUD
│   ├── clients.ts          # Client CRUD + logo upload
│   ├── clientContacts.ts   # Contact person CRUD
│   ├── costs.ts            # Cost tracking with documents
│   ├── assets.ts           # Asset CRUD with signed URLs
│   ├── timeEntries.ts      # Time tracking + billable value
│   └── profiles.ts         # User profiles + internal team
├── lib/                    # Core utilities
│   ├── AuthContext.tsx     # Auth state management
│   └── queryClient.ts      # React Query config
├── types/                  # TypeScript types
│   └── supabase.ts         # Database types
├── scripts/                # SQL scripts
│   ├── FINAL-SCHEMA.sql    # Complete database setup
│   ├── seed-data-fixed.sql # Sample data
│   └── *.sql               # Utility scripts
├── FINAL-SCHEMA.sql        # 🔥 Main database file
├── DEPLOYMENT-GUIDE.md     # Setup instructions
├── DATABASE-SCHEMA-REFERENCE.md # Schema docs
├── AUTHENTICATION-SETUP-GUIDE.md # Auth guide
├── CONTRIBUTING.md         # Developer guide
└── DOCS-INDEX.md           # Documentation index
```

---

## 🔐 Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies for:

- **Internal Users** (admin, employee, freelancer): Full CRUD access
- **Client Users**: Read-only access to their own projects/tasks/assets
- **Helper Functions**: `is_internal()` for role checks

### Authentication

- JWT Auth via `labs-api` backend
- Passwords hashed by backend (bcrypt)
- Tokens stored securely
- Auto-logout on session expiry

### Best Practices

- All database access occurs securely on the backend via Express.js
- Input validation on frontend & backend forms
- SQL injection protection via backend parameterized queries

---

## 📚 Documentation

| Document                                                       | Purpose                                       |
| -------------------------------------------------------------- | --------------------------------------------- |
| [DEPLOYMENT.md](DEPLOYMENT.md)                                 | **NEW:** Complete Docker/VPS Deployment Guide |
| [DATABASE-SCHEMA-REFERENCE.md](DATABASE-SCHEMA-REFERENCE.md)   | Complete database documentation               |
| [AUTHENTICATION-SETUP-GUIDE.md](AUTHENTICATION-SETUP-GUIDE.md) | Auth system explained                         |
| [CONTRIBUTING.md](CONTRIBUTING.md)                             | Development guidelines                        |
| [DOCS-INDEX.md](DOCS-INDEX.md)                                 | Documentation navigation                      |

---

## 🛠️ Development

### Adding New Features

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for patterns
2. Check [DATABASE-SCHEMA-REFERENCE.md](DATABASE-SCHEMA-REFERENCE.md) for schema
3. Follow existing component structure
4. Use React Query for data fetching
5. Add RLS policies if needed
6. Test with different user roles

### Common Tasks

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
# Run SQL scripts in Supabase SQL Editor
# See scripts/ folder for utilities
```

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- React Query for server state
- Toast notifications for feedback

---

## 🐛 Troubleshooting

### Common Issues

**"Profile not found" error**

- Run `scripts/verify-and-fix-tasks-select.sql`
- Ensure RLS policies are applied

**"403 Forbidden" errors**

- Check user role: `SELECT role FROM profiles WHERE id = auth.uid();`
- Ensure role is 'admin', 'employee', or 'freelancer'
- Verify RLS policies exist

**Tasks not showing in project**

- Clear browser cache
- Check browser console for errors
- Verify project has tasks in database

**Can't create items**

- Ensure RLS policies include INSERT/UPDATE/DELETE
- Run `scripts/add-all-rls-policies.sql`

**Labs-API Backend Errors (Gemini 404, Database 500, Apify Sync)**

- See the **Backend Connection Troubleshooting** section in `DEPLOYMENT.md` for fixes related to AI model names, API keys, and Postgres JSON array insertions.

See [AUTHENTICATION-SETUP-GUIDE.md](AUTHENTICATION-SETUP-GUIDE.md) for detailed troubleshooting.

---

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 👥 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and best practices.

---

## 🎉 Acknowledgments

Built with:

- React + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS
- React Query
- Recharts

---

**AgencyFlow** - Making project management efficient, transparent, and enjoyable! 🚀
