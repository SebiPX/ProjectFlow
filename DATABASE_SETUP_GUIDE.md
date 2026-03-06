# 🚀 AgencyFlow Database Setup Guide

## Quick Start

AgencyFlow uses a **self-hosted PostgreSQL** database, shared with the Visionary PX Studio ecosystem (`labs_db`). All former Supabase dependencies have been completely removed.

## 📋 Prerequisites

- Access to the `labs_db` PostgreSQL instance.
- Node.js backend (`labs-api`) connected to this database.

## 🔧 Setup Steps

### 1. Run Database Migration Script

Execute the provided SQL schema file (e.g. `agency_schema.sql` from the `labs-api` repository) in your PostgreSQL client (pgAdmin, psql, DBeaver).

This creates:

- ✅ All ENUM types (e.g., `user_role`, `project_status`)
- ✅ All 15+ prefixed tables (`agency_clients`, `agency_projects`, etc.) with correct foreign keys
- ✅ All indexes
- ✅ Seed data

### 2. Set Admin Role

To grant admin privileges to a user, update the `profiles` table:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 3. Backend API Connection

Make sure your `labs-api` backend is running and connected to the `labs_db`. The frontend connects to the backend via the `VITE_API_URL` environment variable.

## 📊 Database Structure

### Core Tables Created (Prefixed with `agency_`)

1. `agency_clients` - Client companies
2. `agency_client_contacts` - Contact persons for clients
3. `agency_seniority_levels` - Job seniority levels
4. `agency_service_modules` - Service catalog modules
5. `agency_service_pricing` - Pricing matrix
6. `agency_projects` - Client projects
7. `agency_tasks` - Project tasks
8. `agency_assets` - Project files/assets
9. `agency_time_entries` - Time tracking
10. `agency_financial_documents` - Quotes, invoices, credit notes
11. `agency_financial_items` - Line items
12. `agency_costs` - Project costs
13. `agency_notifications` - User notifications
    ... plus the shared `profiles` table.

## 📝 Notes

- **Supabase Removed**: All Supabase dependencies have been removed. The app now relies purely on our custom Express.js backend.
- Row-Level Security (RLS) is now enforced at the API route level via middleware, instead of database policies.

---

**That's it!** Your AgencyFlow database is now fully set up and ready to use. 🎉
