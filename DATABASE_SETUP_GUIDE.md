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
- ✅ All ENUM types (8 types)
- ✅ All 12 tables with correct foreign keys
- ✅ All indexes (9 indexes)
- ✅ All RLS policies (26 policies)
- ✅ Helper functions (`is_internal()`, `get_my_client_id()`, `get_team_directory()`)
- ✅ Seed data (4 seniority levels)

### 2. Set Admin Role

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 3. Reload Application

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
9. `time_entries` - Time tracking (with task_id, profile_id, duration_minutes)
10. `financial_documents` - Quotes, invoices, credit notes
11. `financial_items` - Line items for financial documents
12. `notifications` - User notifications

### Key Features
- **Foreign Keys**: All relationships properly defined
- **RLS Policies**: Row-level security for all tables
- **Generated Columns**: Auto-calculated `margin_percentage` and `total_price`
- **Indexes**: Optimized for common queries
- **Helper Functions**: Reusable security and utility functions

## 🎯 Troubleshooting

### "Error loading clients" or similar errors
Run this to reload schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```
Then wait 30 seconds or restart PostgREST in Supabase Dashboard → Settings → API.

### "Could not find relationship"
The schema cache needs reloading. See above.

### "Permission denied"
Check your user has the correct role:
```sql
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
```

If role is NULL or 'client', set it to 'admin':
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
```

## ✅ Success Checklist

- [ ] Database setup script executed successfully
- [ ] Admin role set for your user
- [ ] Application reloaded (Cmd+R)
- [ ] All views working (Dashboard, Projects, Tasks, Clients, Service Catalog, Team)
- [ ] Time tracking works (can create time entries)
- [ ] No critical console errors

## 📝 Notes

- **WebSocket warnings**: Non-critical, can be ignored
- **Chart width/height errors**: Cosmetic, non-critical
- **Tailwind CDN warning**: Development only, non-critical

---

**That's it!** Your AgencyFlow database is now fully set up and ready to use. 🎉
