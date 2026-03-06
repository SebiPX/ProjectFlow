# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgencyFlow is a React-based project management application for agencies, built with TypeScript, Vite, and Supabase. It handles projects, tasks, clients, assets, time tracking, and financial documents.

## Development Commands

### Setup

```bash
npm install                    # Install dependencies
```

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials from https://app.supabase.com/project/_/settings/api:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Development

```bash
npm run dev                    # Start dev server on http://localhost:3000
npm run build                  # Build for production
npm run preview                # Preview production build
```

## Architecture

### Tech Stack

- **Frontend**: React 19.2.3 with TypeScript 5.8
- **Build Tool**: Vite 6.2
- **State Management**: TanStack React Query 5.90 (server state) + React Context (auth)
- **Backend**: Custom Express.js API (`labs-api`) connected to shared PostgreSQL database (`labs_db`)
- **UI**: Tailwind CSS (dark theme), Recharts for analytics
- **Notifications**: React Toastify

### Project Structure

```
├── App.tsx                    # Main container, view routing logic
├── index.tsx                  # React entry point
├── components/                # UI components (~35 files)
│   ├── Dashboard.tsx          # Analytics overview
│   ├── ProjectList.tsx        # Project grid view with real financial data
│   ├── ProjectDetail.tsx      # Multi-tab project view (tasks, assets, finances)
│   ├── KanbanBoard.tsx        # Task management board
│   ├── TaskList.tsx           # All tasks view (Grid layout with filters, "Only Me")
│   ├── AssetList.tsx          # File/document management (Grid layout with filters, "Only Me")
│   ├── ClientList.tsx         # Client management with contacts & logos
│   ├── EmployeeList.tsx       # Admin/Employee team management (with online status)
│   ├── NotificationsDropdown.tsx # Real-time alerts
│   ├── Planning.tsx           # Advanced Planning container
│   ├── planning/              # Planning sub-components
│   │   ├── CalendarView.tsx   # Monthly task grid
│   │   └── GanttView.tsx      # Project timeline
│   ├── Reports.tsx            # Service Profitability Analytics
│   ├── ResourcePlanning.tsx   # Resource Planning & Capacity Module
│   ├── resources/             # Resource sub-components
│   │   ├── ResourceTimeline.tsx # Interactive Gantt/Heatmap
│   │   └── TaskAllocationModal.tsx # Reassignment Modal
│   ├── TimeApprovalList.tsx   # Time card approval workflow
│   ├── AssetUploadModal.tsx   # Upload files to projects
│   ├── AssetPreviewModal.tsx  # Preview assets (images, PDFs, videos, audio)
│   ├── AssetStatusModal.tsx   # Change asset approval status
│   ├── CostFormModal.tsx      # Add project costs with document upload
│   ├── CostEditModal.tsx      # Edit costs and documents
│   ├── EmployeeEditModal.tsx  # Edit employee rates and hours (admin-only)
│   ├── *FormModal.tsx         # Create modals (Project, Task, Client)
│   ├── *EditModal.tsx         # Edit modals
│   ├── TimeTrackingModal.tsx  # Time entry logging with timer persistence
│   ├── Login.tsx / Signup.tsx # Authentication
│   └── ui/                    # Reusable components (Card, Icon, FileIcon, Avatar, ClientLogo)
├── services/
│   ├── pdfGenerator.ts        # PDF creation service
│   ├── api/                   # Data access layer
│   │   ├── projects.ts        # Project CRUD + stats + financial overview
│   │   ├── tasks.ts           # Task management
│   │   ├── clients.ts         # Client operations with contacts & logo upload
│   │   ├── clientContacts.ts  # Contact person CRUD
│   │   ├── costs.ts           # Project costs tracking with document upload
│   │   ├── assets.ts          # File upload/download with Supabase Storage + signed URLs
│   │   ├── timeEntries.ts     # Time tracking + billable value
│   │   ├── profiles.ts        # User profiles (Admin full, Employee restricted RPC)
│   │   ├── reports.ts         # Profitability analytics
│   │   ├── resources.ts       # Capacity logic (Time distribution, native Date math)
│   │   └── notifications.ts   # Real-time user alerts
├── lib/
│   ├── supabase.ts            # Supabase client singleton
│   ├── csvExport.ts           # CSV export utility
│   ├── AuthContext.tsx        # Auth state management
│   ├── queryClient.ts         # React Query config
│   └── test-connection.ts     # DB connectivity test
├── types/
│   └── supabase.ts            # TypeScript interfaces + enums
├── constants/
│   └── index.ts               # Mock data for development
└── vite.config.ts             # Vite config (port 3000, @ alias)
```

### State Management Pattern

1. **Server State**: React Query with 5-minute stale time
   - Query keys: `['projects']`, `['projects', id]`, `['tasks', projectId]`
   - Automatic caching and background refetching
   - Used in all components fetching Supabase data

2. **Auth State**: React Context via `AuthContext`
   - Provides: `user`, `profile`, `session`, `signIn()`, `signUp()`, `signOut()`
   - Auto-refreshes tokens, persists to Supabase storage

3. **Local UI State**: Component-level useState
   - Modal visibility, active tabs, filters, selected project

4. **Global Search State**: Lifted to `App.tsx`
   - `searchQuery` managed in `App` and passed to `Header` (input) and list components (filtering)
   - Clears on view navigation

### Data Flow

```
Components → useQuery/useAuth hooks
    ↓
React Query cache / Auth Context
    ↓
Services API layer (services/api/*.ts)
    ↓
Fetch Wrapper (client.ts)
    ↓
Custom Express.js Backend API
    ↓
PostgreSQL Database (`labs_db`)
```

### Database Schema

Core entities in PostgreSQL (all tables are prefixed with `agency_` to prevent collisions in the shared DB):

- **agency_profiles**: Users/team members - includes billable_hourly_rate, internal_cost_per_hour, weekly_hours
- **agency_clients**: Customer companies with logo_url for company logos
- **agency_client_contacts**: Multiple contact persons per client (name, email, position, phone)
- **agency_projects**: Agency projects (belongs to client) - includes project_members for team assignments
- **agency_tasks**: Project tasks with Kanban workflow (belongs to project)
- **agency_assets**: Files/documents uploaded to the backend server
- **agency_costs**: Project expenses with optional document attachments (receipts/invoices)
- **agency_time_entries**: Billable hours tracking (belongs to task/project)
- **agency_project_members**: Team assignments (many-to-many)
- **agency_notifications**: User alerts
- **service_modules**: Service definitions (v2 - normalized structure)
- **seniority_levels**: Level definitions (Junior/Professional/Senior/Director)
- **service_pricing**: Service pricing matrix (module × level with rates, costs, margins)
- **financial_documents**: Invoices and quotes (Auto-syncs with project budget on approval)
- **financial_items**: Line items (linked to service_modules + seniority_levels for automated pricing)

### Real-Time Synchronization Pattern

1. **Mutation**: User adds/edits a Quote/Invoice/Cost.
2. **Invalidation**: `queryClient.invalidateQueries` triggers refresh for:
   - `['financial-documents']` (List)
   - `['project-margin']` (Dashboard Cards)
   - `['projects']` (Budget/Revenue totals)
3. **Budget Sync**: Server-side helper `syncProjectBudget` updates `projects.budget_total` accurately based on approved revenue.

Relationships: `clients ← client_contacts`, `clients ← projects ← tasks/assets/costs/time_entries`, `projects ← project_members → profiles`

### Type System (types/supabase.ts)

Important enums:

```typescript
UserRole: "admin" | "employee" | "freelancer" | "client";
ProjectStatus: "planned" | "active" | "on_hold" | "completed" | "cancelled";
TaskStatus: "todo" | "in_progress" | "review" | "done";
AssetStatus: "upload" |
  "internal_review" |
  "client_review" |
  "changes_requested" |
  "approved" |
  "archived";
AssetType: "briefing" | "design" | "contract" | "kva" | "invoice" | "other";
TimeStatus: "draft" | "submitted" | "approved" | "rejected" | "billed";
CostCategory: "software_licenses" |
  "external_services" |
  "marketing" |
  "hardware" |
  "travel" |
  "office_supplies" |
  "consulting" |
  "other";
```

All entities are defined as TypeScript interfaces. Use "enriched" types for data with relations (e.g., `Project.client` populated).

## Development Patterns

### Adding a New Entity

1. Add interface + enum to `types/supabase.ts`
2. Create service module in `services/api/newEntity.ts` with CRUD functions:
   ```typescript
   export async function getEntities() {
     /* ... */
   }
   export async function getEntityById(id: string) {
     /* ... */
   }
   export async function createEntity(data: Partial<Entity>) {
     /* ... */
   }
   export async function updateEntity(id: string, data: Partial<Entity>) {
     /* ... */
   }
   export async function deleteEntity(id: string) {
     /* ... */
   }
   ```
3. Add mock data to `constants/index.ts` (use MOCK\_\* prefix)
4. Create list component and form/edit modals
5. Use React Query: `useQuery({ queryKey: ['entities'], queryFn: getEntities })`
6. Add to Sidebar navigation and `App.tsx` View type union

### Creating Modals

Follow established pattern:

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: EntityType; // For edit mode
  onSuccess?: () => void;
}

function EntityFormModal({ isOpen, onClose, item, onSuccess }: Props) {
  const [formData, setFormData] = useState<Partial<EntityType>>(item || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (item) {
        await updateEntity(item.id, formData);
      } else {
        await createEntity(formData);
      }
      toast.success("Success!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render form with disabled={loading}
}
```

### Error Handling Strategy

- **API Layer**: Throw descriptive errors
  ```typescript
  throw new Error(`Failed to fetch projects: ${error.message}`);
  ```
- **Components**: Check `isError` from React Query, show error UI
- **User Feedback**: Use `toast.error()` for all user-facing errors

### Query Key Convention

```typescript
["projects"][("projects", projectId)][("tasks", projectId)][ // List all // Single item // Filtered by parent
  ("timeEntries", { taskId })
]; // Complex filters
```

### Navigation Pattern

App uses view-based routing (no React Router):

```typescript
type View =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "tasks"
  | "assets"
  | "clients"
  | "employees"
  | "finances"
  | "reports"
  | "settings";
```

Navigation via `handleNavigate(view)` callback passed through Sidebar.

- **employees** view is admin-only (hidden in sidebar for non-admin users)

### Path Alias

Use `@/` for absolute imports:

```typescript
import { supabase } from "@/lib/supabase";
import { Project } from "@/types/supabase";
```

## Important Implementation Notes

### Backend Integration

- API client configured in `services/api/client.ts` with env vars
- Session persistence enabled (JWT tokens stored in localStorage)
- Storage: Uploaded via multipart/form-data to Express.js endpoints
- Asset URLs: Generated securely by the backend

### Authentication Flow

1. User logs in via Custom Auth `/api/auth/login`
2. `AuthContext` stores session token + fetches profile
3. Protected routes check `user` from `useAuth()`
4. Valid JWT passed in Authorization header for all API calls

### Kanban Board

- Tasks filtered into 4 columns by `status` enum
- Column headers show task counts
- Structure ready for drag-and-drop (not yet implemented)

### Mock Data Usage

`constants/index.ts` provides realistic fixtures for development. Dashboard calculations use mock "spent amounts" as percentages of budgets.

### Loading States

Always show loading UI:

```typescript
const { data, isLoading, isError } = useQuery(...);
if (isLoading) return <div>Loading...</div>;
if (isError) return <div className="text-red-500">Error...</div>;
```

### Responsive Design

- Use Tailwind grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dark theme: `bg-gray-900`, `text-gray-100`
- Icons: Custom SVG component with Heroicons paths

## Common Tasks

### Running Tests (when added)

Currently no test framework configured. Consider adding Vitest for unit tests.

### Database Migrations

Supabase migrations managed at https://app.supabase.com/project/_/editor. No local migration files in repo.

### Debugging Supabase Connection

Run the test utility:

```typescript
import { testConnection } from "@/lib/test-connection";
await testConnection();
```

### Adding a New Service Function

Example for custom query:

```typescript
// services/api/projects.ts
export async function getProjectsByStatus(status: ProjectStatus) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client(*)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data;
}
```

## Known Limitations

- No URL-based routing (views not bookmarkable)
- Kanban drag-and-drop not fully implemented (visual only)
- No real-time subscriptions (manual refetch only)
- No form validation schemas (consider Zod)
- Reports and Settings views are placeholders

## Recent Features Added

### Client Logo Upload

- **ClientLogo.tsx**: Reusable component for displaying company logos
  - Uses signed URLs for secure image loading (1-hour expiry)
  - Fallback to icon when no logo exists
  - Displayed in ClientList as avatar
- **API Functions** in `clients.ts`:
  - `uploadClientLogo()`: Upload logo to `client-logos/` in AgencyStorage
  - `getClientLogoSignedUrl()`: Generate temporary signed URL
  - `deleteClientLogo()`: Remove logo from storage
- **ClientFormModal & ClientEditModal**: Logo upload integrated
  - File picker with 5MB max size validation
  - Image preview before upload
  - Remove/replace existing logo functionality

### Finance Tab - Cost Tracking

- **costs** table: Track project expenses with document attachments
- **CostFormModal.tsx**: Add costs with metadata
  - Fields: Title, Amount (€), Category, Estimated checkbox
  - Categories: Software/Licenses, External Services, Marketing, Hardware, Travel, Office Supplies, Consulting, Other
  - Optional document upload (receipts/invoices) - 10MB max
  - Documents stored in `cost-documents/{project-id}/` path
- **CostEditModal.tsx**: Edit existing costs
  - All fields editable
  - Replace document functionality (deletes old, uploads new)
  - Shows "✓ Document attached" indicator
- **ProjectDetail Finance Tab**: Complete redesign
  - 4-column dashboard: Total Budget, Direct Costs, Billable Hours Value, Remaining
  - Color-coded remaining amount (green/red based on positive/negative)
  - Real-time calculations: `totalSpent = costs + (billable hours × hourly rates)`
  - Category filter dropdown for costs
  - Cost cards with edit/delete buttons
  - Download button for cost documents (signed URLs)
- **API Functions** in `costs.ts`:
  - Full CRUD operations for costs
  - `uploadCostDocument()` and `getCostDocumentSignedUrl()`
  - `calculateProjectCosts()`: Sum all project costs
- **API Functions** in `timeEntries.ts`:
  - `calculateProjectBillableValue()`: Calculate value of billable hours
  - Returns: totalHours, billableHours, totalValue (hours × rates from profiles)

### Real Financial Data on Project Cards

- **getProjectsFinancialOverview()** in `projects.ts`:
  - Aggregates costs and billable hours value across all projects
  - Returns map: `{ projectId: { costs, billableValue, total } }`
- **ProjectList.tsx**: Shows real budget usage
  - Progress bar color-coding: blue (<80%), yellow (80-100%), red (>100%)
  - Displays: "€X spent / €Y budget"
  - Red text when over budget
  - Uses React Query: `['projects-financial-overview']` cache key

### Project Deadline Display

- **ProjectCard**: Deadline with urgency indicators
  - Calendar icon with date
  - Color-coded: Red (overdue), Yellow (≤7 days), Gray (normal)
  - Smart text: "Overdue", "Due today", "Due tomorrow", or formatted date
  - German date format: `toLocaleDateString('de-DE')`

### Employee Management (Admin-Only)

- **EmployeeList.tsx**: Grid view of internal team members
  - Only visible to admin users (role-based UI filtering in Sidebar)
  - Card layout: Avatar, name, role badge
  - Displays: Weekly hours, billable rate, internal cost per hour
  - Click card to edit employee details
- **EmployeeEditModal.tsx**: Edit team member details
  - Fields: Full Name, Email, Role (Employee/Freelancer/Admin)
  - Required numeric fields with validation:
    - Weekly Hours (1-168, step 0.5)
    - Billable Hourly Rate (€, min 0, step 0.01)
    - Internal Cost Per Hour (€, min 0, step 0.01)
  - Note: Email change may require verification
  - Uses `updateProfile()` from profiles.ts
- **API Functions** in `profiles.ts`:
  - `getInternalProfiles()`: Fetch only admin/employee/freelancer roles
  - Excludes client users from list
- **Sidebar.tsx**: Admin-only navigation
  - `adminOnly: true` flag on Employees nav item
  - Filtered based on `profile.role === 'admin'`

### "Only Me" Filter

Personal filter button on Tasks, Projects, and Assets pages:

- **TaskList.tsx**:
  - Blue toggle button: "Only Me"
  - Filters tasks where `assigned_to === user.id`
  - Shows "• Only Me" indicator in subtitle
  - Empty state message: "No tasks assigned to you"
- **AssetList.tsx**:
  - Filters assets where `uploaded_by === user.id`
  - Shows "• Only Me" indicator in subtitle
  - Empty state message: "No assets uploaded by you"
- **ProjectList.tsx**:
  - Filters projects where user is team member
  - Uses `project.project_members` array (loaded via getProjects with `.select('*, project_members(profile_id)')`)
  - Checks: `project_members.some(member => member.profile_id === user.id)`
  - Shows "• Only Me" indicator in subtitle
  - Empty state message: "You are not assigned to any projects yet"
- **Implementation**:
  - Uses `useAuth()` hook to get current user
  - Client-side filtering (instant response)
  - Button style: Active (blue bg) / Inactive (gray bg)
  - User icon from Heroicons

### Asset Status Management

- **AssetStatusModal.tsx**: Change asset approval workflow status
  - Status options: Upload, Internal Review, Client Review, Changes Requested, Approved, Archived
  - Color-coded badges matching AssetStatus enum
  - Integrated in AssetCard and AssetPreviewModal
  - Uses `updateAsset()` from assets.ts

### Modern Grid Layout with Filters & Sorting

- **TaskList.tsx**: Complete redesign from table to grid layout
  - Responsive grid: 1/2/3/4 columns (mobile/tablet/desktop/xl)
  - TaskCard component: Title, status badge, project link, assignee with avatar, due date with overdue warning
  - Filter by: Status, Project, Assignee (including Unassigned), + "Only Me"
  - Sort by: Date Created, Task Name, Due Date, Status (asc/desc toggle)
  - Active filter count with "Clear Filters" button
  - Skeleton loading cards, enhanced empty states

- **AssetList.tsx**: Complete redesign from table to grid layout
  - Responsive grid: 1/2/3 columns (mobile/tablet/desktop)
  - AssetCard component: FileIcon, asset name, file size, project link, category & status badges, uploader
  - Filter by: Status, Project, Category, Uploaded By, + "Only Me"
  - Sort by: Date Created, Asset Name, Status, Category (asc/desc toggle)
  - formatFileSize() helper (Bytes → KB → MB → GB)

### Asset Preview Modal

- **AssetPreviewModal.tsx**: Full-screen modal for asset previews
  - Image support: Direct display with max resolution
  - PDF support: Embedded iframe viewer
  - Video support: Native HTML5 player with controls
  - Audio support: Audio player with FileIcon display
  - Other files: FileIcon with download button
  - Features: ESC to close, click outside to close, download button in header
  - Integrated in both AssetList and ProjectDetail views

### Client Contact Management

- Multiple contacts per client (client_contacts table)
- ClientFormModal: Dynamic contact fields (add/remove)
- ClientEditModal: Edit existing contacts, delete, add new
- ClientList: Shows primary contact with email/phone
- API: `services/api/clientContacts.ts` with full CRUD

### Time Tracking Timer Persistence

- Timer continues running across navigation
- State restored from draft time_entries in database
- Calculates elapsed time from stored start_time
- Implementation in TimeTrackingModal.tsx useEffect hook

### Service-Katalog v2 (Normalized Multi-Table Structure)

- **3-Table Architecture**: Normalized structure for agency service catalog with seniority-based pricing
  - **service_modules**: Master service definitions (category, name, description, default unit)
  - **seniority_levels**: Level definitions (Junior, Professional, Senior, Director) with order and experience requirements
  - **service_pricing**: Junction table linking modules to levels with rate, internal_cost, and auto-calculated margin_percentage
- **ServiceModuleList.tsx**: Admin-only expandable card view
  - Responsive grid: 1/2 columns (mobile/tablet/desktop)
  - Expandable cards showing pricing tables when clicked
  - Filter by category (CONSULTING, CREATION, PRODUCTION, MANAGEMENT, LOGISTICS)
  - Filter: Active/Inactive toggle
  - Sort: Name or Category
  - Each card shows: category badge, service name, description, unit, pricing count
- **ServiceModuleCard.tsx**: Expandable card component
  - Collapsed state: Shows summary (category, name, description, pricing count)
  - Expanded state: Shows full pricing table with all seniority levels
  - Pricing table columns: Level, Rate, Cost, Margin (color-coded: green ≥35%, yellow ≥25%, red <25%)
  - Actions: Edit button, Activate/Deactivate toggle
- **ServiceModuleFormModal.tsx**: 1-step create/edit modal with inline pricing matrix
  - Service Info section: Module name, category, description, unit, active status
  - Pricing Matrix section: Checkbox-enabled table for each seniority level
    - Columns: Enabled checkbox, Level name, Rate (€), Internal Cost (€), Margin (% - auto-calculated)
    - Live margin calculation: `((rate - cost) / rate * 100)`
    - Validation: Min 1 level enabled, rates > 0, costs ≥ 0
  - Batch operations: Creates/updates/deletes pricing entries based on enabled levels
  - Delete confirmation for edit mode ("Gefahrenzone")
- **Admin-only access**: Sidebar menu item hidden for non-admin users
- **Integration**: Ready for financial_items expansion (add service_module_id and seniority_level_id columns for granular quote/invoice line items)
  - All authenticated users can view services (needed for creating financial documents)
  - Only admins can create, update, or delete services
- **API Functions** (3 modules):
  - `services/api/serviceModules.ts`: CRUD for service_modules, enriched fetch with pricing
  - `services/api/seniorityLevels.ts`: CRUD for seniority_levels
  - `services/api/servicePricing.ts`: CRUD + batch operations (createMultiplePricings, updateMultiplePricings)
- **Database Schema**:
  - **service_modules**: id, created_at, category (enum), service_module (text), description, default_unit, is_active
  - **seniority_levels**: id, created_at, level_name, level_order, description, experience_years_min, is_active
  - **service_pricing**: id, created_at, service_module_id (FK), seniority_level_id (FK), rate, internal_cost, margin_percentage (GENERATED), valid_from, valid_until, is_active
  - Unique constraints: (category, service_module) on modules, (service_module_id, seniority_level_id, valid_from) on pricing
  - CASCADE delete: Deleting module/level removes associated pricing entries
  - RLS policies: All authenticated users SELECT, admins only for INSERT/UPDATE/DELETE on all 3 tables
- **Type System**:
  - `ServiceCategory` enum: CONSULTING, CREATION, PRODUCTION, MANAGEMENT, LOGISTICS
  - `ServiceUnit` enum: hour, day, flat, piece
  - Interfaces: ServiceModule (with pricing?: ServicePricing[]), SeniorityLevel, ServicePricing (with enriched module/level)
- **Seed Data**: 4 seniority levels + 10 service modules + sample pricing in `scripts/service-catalog-v2-seed.sql`

### Project Margin Calculation & Display (Option A - Completed)

- **Integrated financial tracking** with automatic margin calculation for projects
- **Database Extension**:
  - Extended `financial_items` table with `service_module_id` and `seniority_level_id` columns
  - Ready for KVA (quote) creation with service selection (UI pending)
  - SQL script: `scripts/extend-financial-items-services.sql`
- **API Functions** in `services/api/projectFinancials.ts`:
  - `calculateProjectRevenue(projectId)`: Sum of approved quotes (financial_documents where type='quote' AND status='approved')
  - `calculateProjectCosts(projectId)`: Returns breakdown of direct costs + billable hours value
  - `calculateProjectMargin(projectId)`: Complete margin calculation with status (excellent/good/acceptable/poor/negative)
  - `calculateProjectsMargins(projectIds[])`: Batch calculation for project list display
- **ProjectMarginCard.tsx**: Finance tab component showing 4-column dashboard
  - **EINNAHMEN** (Revenue): Sum of approved quotes in €
  - **KOSTEN** (Costs): Direct costs + billable hours value breakdown
  - **GEWINN** (Profit): Revenue - Costs with green/red color-coding
  - **MARGE** (Margin): Percentage with status badge
    - Excellent: ≥30% (green)
    - Good: ≥20% (blue)
    - Acceptable: ≥10% (yellow)
    - Poor: <10% (orange)
    - Negative: <0% (red)
  - Explanation note documenting calculation formula
- **ProjectList Enhancement**: Margin badge on project cards
  - Shows margin percentage with +/- indicator
  - Color-coded by profitability status
  - Batch query optimization for performance
- **Integration**: Margin appears automatically when projects have approved quotes

### Task-Level Service Integration (Option B - Completed)

- **Plan vs Actual tracking** for individual tasks with service-based estimation
- **Database Extension**:
  - Extended `tasks` table with `service_module_id`, `seniority_level_id`, `estimated_hours`, `estimated_rate`
  - All columns nullable for backward compatibility
  - Indexes on service columns for performance
  - SQL script: `scripts/add-task-service-tracking.sql`
- **API Functions** in `services/api/taskVariance.ts`:
  - `calculateTaskVariance(taskId)`: Single task plan vs actual comparison
  - `calculateProjectTaskVariances(projectId)`: All tasks in a project
  - `getProjectServiceBreakdown(projectId)`: Aggregated service breakdown by module+level
  - `getServicePricingRate(moduleId, levelId)`: Helper for rate auto-fill
- **TaskFormModal & TaskEditModal Enhancement**:
  - Optional "Service-Based Estimation" section
  - Service Module dropdown (filtered: active only)
  - Seniority Level dropdown
  - Estimated Hours input
  - Estimated Rate input (auto-filled from service_pricing, can be overridden)
  - Planned Value preview: `hours × rate`
- **TaskPlanVsActual.tsx**: Plan vs Actual component for single tasks
  - 3-column dashboard: Planned | Actual | Variance
  - Status badge: Under Budget (green), On Budget (blue), Over Budget (red)
  - Shows hours and value comparisons
  - Only displays when task has service tracking (progressive enhancement)
- **ProjectServiceBreakdown.tsx**: Service breakdown table for projects
  - Grouped by service_module_id + seniority_level_id
  - Columns: Service, Tasks, Planned Hours, Actual Hours, Hours Δ, Planned Value, Actual Value, Value Δ
  - Color-coded variances (green/blue/red)
  - Total row with aggregated sums
  - Empty state when no service-tracked tasks
- **TaskList Enhancement**: Service badge on task cards
  - Blue badge showing service module name + estimated hours
  - Only shown for tasks with service tracking
- **ProjectDetail Enhancement**: New "Services" tab
  - Shows ProjectServiceBreakdown component
  - Real-time aggregation of all service-tracked tasks
- **Cache Invalidation**: Complete React Query strategy
  - TaskFormModal/TaskEditModal invalidate `project-service-breakdown`
  - TimeTrackingModal invalidates `task-variance` and `project-service-breakdown`
  - Ensures UI updates automatically on data changes
- **Progressive Enhancement**: All features optional, existing tasks work without changes

## Performance Considerations

- React Query cache reduces API calls (5-min stale time)
- Images/assets served from Supabase storage CDN
- Bundle size: Monitor with `npm run build` (Recharts is large)
- Consider lazy loading for modal components if bundle grows

### Resource Planning Module (v1.11.0)

- **ResourcePlanning.tsx**: Main container for capacity planning
- **ResourceTimeline.tsx**:
  - Custom Gantt-style implementation using native JS `Date` (no date-fns dependency)
  - Heatmap visual: Green (<80%), Yellow (80-100%), Red (>100%)
  - Interactive cells: Click to open `TaskAllocationModal`
- **TaskAllocationModal.tsx**:
  - Reassign tasks to different team members
  - Date changes: Redirects user to Task Detail (informational text)
  - Auto-updates parent timeline on success
- **services/api/resources.ts**:
  - `getResourceAvailability()`: Core logic for distributing task hours active across business days
  - Handles `profiles` (capacity) vs `tasks` (load)
  - Returns `ResourceData[]` with daily allocations
