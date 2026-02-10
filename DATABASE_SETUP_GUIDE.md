# 🚀 AgencyFlow Database Setup Guide

## Quick Start

This is the **single source of truth** for setting up the AgencyFlow database from scratch.

## 📋 Prerequisites

- Fresh Supabase project
- `auth.users` table exists (automatic with Supabase)
- `public.profiles` table exists and linked to `auth.users`

## 🔧 Setup Steps

### 1. Run Database Setup Script

Execute **[database_setup.sql](file:///Users/px-admin/Desktop/ANTIGRAVITY/ProjectFlow/database_setup.sql)** in Supabase SQL Editor.

This creates:
- ✅ All ENUM types
- ✅ All 12 tables with correct foreign keys
- ✅ All indexes
- ✅ All RLS policies
- ✅ Helper functions (`is_internal()`, `get_my_client_id()`, `get_team_directory()`)
- ✅ Seed data (4 seniority levels)

### 2. Import CSV Data

Go to **Supabase → Table Editor** and import:

| Table | CSV File | Expected Rows |
|-------|----------|---------------|
| `service_modules` | [service_modules_rows.csv](file:///Users/px-admin/Desktop/ANTIGRAVITY/ProjectFlow/refs/service_modules_rows.csv) | ~19 |
| `service_pricing` | [service_pricing_import_ready.csv](file:///Users/px-admin/Desktop/ANTIGRAVITY/ProjectFlow/refs/service_pricing_import_ready.csv) | ~11 |
| `clients` | [clients_import_ready.csv](file:///Users/px-admin/Desktop/ANTIGRAVITY/ProjectFlow/refs/clients_import_ready.csv) | ~167 |
| `client_contacts` | [client_contacts_rows.csv](file:///Users/px-admin/Desktop/ANTIGRAVITY/ProjectFlow/refs/client_contacts_rows.csv) | ~137 |

### 3. Set Admin Role

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 4. Reload Application

- Press `Cmd + R` / `Ctrl + R`
- All features should now work! ✅

## 📊 Database Structure

### Tables Created
1. `clients` - Client companies
2. `client_contacts` - Contact persons for clients
3. `seniority_levels` - Job seniority levels (Junior, Intermediate, Senior, Expert)
4. `service_modules` - Service catalog modules
5. `service_pricing` - Pricing matrix (service × seniority)
6. `projects` - Client projects
7. `tasks` - Project tasks
8. `assets` - Project files/assets
9. `time_entries` - Time tracking
10. `financial_documents` - Quotes, invoices, credit notes
11. `financial_items` - Line items for financial documents
12. `notifications` - User notifications

### Key Features
- **Foreign Keys**: All relationships properly defined
- **RLS Policies**: Row-level security for all tables
- **Generated Columns**: Auto-calculated `margin_percentage` and `total_price`
- **Indexes**: Optimized for common queries
- **Helper Functions**: Reusable security and utility functions

## 🧹 Cleanup

You can now **delete** all these temporary SQL files:
- `URGENT_restore_profiles_table.sql`
- `diagnose_database.sql`
- `fix_tasks_and_service_tables.sql`
- `FIX_foreign_keys.sql`
- `FIX_foreign_keys_after_reset.sql`
- `COMPLETE_DATABASE_RESET.sql`
- `SAFE_AGENCYFLOW_RESET.sql`
- `ULTRA_SAFE_RESET.sql`
- `FINAL_SAFE_RESET.sql`
- `EXPORT_SCHEMA_FROM_WORKING_DB.sql`
- `HOW_TO_EXPORT_SCHEMA.sql`
- `fix_clients_table_columns.sql`
- `create_client_contacts_table.sql`
- `fix_client_contacts_columns.sql`
- `fix_clients_rls_policies.sql`
- `fix_clients_read_access.sql`
- `FINAL_FIX_schema_cache.sql`
- `debug_*.sql`
- `diagnose_*.sql`
- `ultimate_debug_*.sql`
- `set_admin_role.sql`

**Keep only:**
- ✅ `database_setup.sql` - The single source of truth
- ✅ CSV files in `/refs` folder

## 🎯 Troubleshooting

### "Error loading clients"
Run this to reload schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```
Then wait 30 seconds or restart PostgREST in Supabase Dashboard.

### "Could not find relationship"
The schema cache needs reloading. See above.

### "Permission denied"
Check your user has the correct role:
```sql
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
```

## ✅ Success Checklist

- [ ] Database setup script executed successfully
- [ ] All 4 CSV files imported
- [ ] Admin role set for your user
- [ ] Application reloaded
- [ ] All views working (Dashboard, Projects, Tasks, Clients, Service Catalog, Team)
- [ ] No console errors (except WebSocket warnings, which are non-critical)

---

**That's it!** Your AgencyFlow database is now fully set up and ready to use. 🎉
