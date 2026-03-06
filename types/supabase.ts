
export enum UserRole {
  Admin = 'admin',
  PJM = 'pjm',
  Creative = 'creative',
  Client = 'client',
  Guest = 'guest',
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string | null;
  link?: string | null;
  is_read: boolean;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
}

export enum ProjectCategory {
  OnAirPromotion = 'on_air_promotion',
  TvCommercial = 'tv_commercial',
  SocialCampaign = 'social_campaign',
  AppDev = 'app_dev',
  Event = 'event',
  UserExperience = 'user_experience',
  WebDesign = 'web_design',
  Consulting = 'consulting',
  Other = 'other',
}

export enum ProjectStatus {
  Planned = 'planned',
  Active = 'active',
  OnHold = 'on_hold',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Review = 'review',
  Done = 'done',
}

export enum AssetStatus {
  Upload = 'upload',
  InternalReview = 'internal_review',
  ClientReview = 'client_review',
  ChangesRequested = 'changes_requested',
  Approved = 'approved',
  Archived = 'archived',
}

export enum AssetType {
  Briefing = 'briefing',
  Design = 'design',
  Contract = 'contract',
  Kva = 'kva',
  Invoice = 'invoice',
  Other = 'other',
}

export enum DocStatus {
  Draft = 'draft',
  Sent = 'sent',
  Approved = 'approved',
  Paid = 'paid',
  Cancelled = 'cancelled',
}

export enum DocType {
  Quote = 'quote',
  Invoice = 'invoice',
}

export enum TimeStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Billed = 'billed',
}

export enum ServiceCategory {
  CONSULTING = 'CONSULTING',
  CREATION = 'CREATION',
  PRODUCTION = 'PRODUCTION',
  MANAGEMENT = 'MANAGEMENT',
  LOGISTICS = 'LOGISTICS',
}

export enum ServiceUnit {
  Hour = 'hour',
  Day = 'day',
  Flat = 'flat',
  Piece = 'piece',
}

export interface Client {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  company_name: string;
  address_line1?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string;
  vat_id?: string | null;
  payment_terms_days?: number;
  website?: string | null;
  logo_url?: string | null; // Storage path for company logo
  contacts?: ClientContact[]; // Enriched data
}

export interface ClientContact {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  client_id: string; // UUID
  full_name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  notes?: string | null;
}

export interface ServiceModule {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  category: ServiceCategory;
  service_module: string;
  description?: string | null;
  default_unit: ServiceUnit;
  is_active?: boolean;
  pricing?: ServicePricing[]; // Enriched data
}

export interface SeniorityLevel {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  level_name: string;
  level_order: number;
  description?: string | null;
  experience_years_min?: number | null;
  is_active?: boolean;
}

export interface ServicePricing {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  service_module_id: string; // UUID
  seniority_level_id: string; // UUID
  rate: number; // NUMERIC
  internal_cost?: number; // NUMERIC
  margin_percentage?: number; // NUMERIC (computed)
  valid_from?: string; // DATE
  valid_until?: string | null; // DATE
  is_active?: boolean;
  service_module?: ServiceModule; // Enriched data
  seniority_level?: SeniorityLevel; // Enriched data
}

export interface Profile {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  client_id?: string | null; // UUID
  internal_cost_per_hour?: number; // NUMERIC
  billable_hourly_rate?: number; // NUMERIC
  weekly_hours?: number; // NUMERIC - Standard weekly working hours (default: 40)
}

export interface Project {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_number: number; // SERIAL
  title: string;
  description?: string | null;
  category?: ProjectCategory;
  status?: ProjectStatus;
  color_code?: string;
  client_id: string; // UUID
  main_contact_id?: string | null; // UUID
  start_date?: string | null; // DATE
  deadline?: string | null; // DATE
  budget_total?: number; // NUMERIC
  client?: Client; // Enriched data
  project_members?: ProjectMember[]; // Enriched data - team members assigned to project
}

export interface ProjectMember {
  project_id: string; // UUID
  profile_id: string; // UUID
  role?: string | null;
  profile?: Profile; // Enriched data
}

export interface Task {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_id: string; // UUID
  title: string;
  description?: string | null;
  status?: TaskStatus;
  position?: number; // NUMERIC
  assigned_to?: string | null; // UUID
  start_date?: string; // TIMESTAMPTZ
  due_date?: string | null; // TIMESTAMPTZ
  planned_minutes?: number;
  is_visible_to_client?: boolean;

  // Service tracking (Option B - Task-Level Integration)
  service_module_id?: string | null; // UUID - Link to service catalog
  seniority_level_id?: string | null; // UUID - Seniority level for rate calculation
  estimated_hours?: number | null; // Planned effort in hours (for billing)
  estimated_rate?: number | null; // Estimated hourly rate in € (from service_pricing or custom)

  // Enriched data
  assignee?: Profile;
  service_module?: ServiceModule;
  seniority_level?: SeniorityLevel;
}

export interface Asset {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_id: string; // UUID
  name: string;
  description?: string | null;
  category?: AssetType;
  status?: AssetStatus;
  feedback_note?: string | null;
  storage_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  is_physical?: boolean;
  location?: string | null;
  uploaded_by?: string | null; // UUID
  is_visible_to_client?: boolean;
  uploader?: Profile; // Enriched data
}

export interface FinancialDocument {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_id?: string | null; // UUID
  type: DocType;
  status?: DocStatus;
  document_number?: string | null;
  date_issued?: string; // DATE
  due_date?: string | null; // DATE
  total_net?: number; // NUMERIC
  vat_percent?: number; // NUMERIC
  total_gross?: number; // NUMERIC
}

export interface FinancialItem {
  id: string; // UUID
  document_id: string; // UUID
  service_id?: string | null; // UUID (deprecated - use service_module_id instead)
  service_module_id?: string | null; // UUID - Link to service_modules (v2)
  seniority_level_id?: string | null; // UUID - Link to seniority_levels (v2)
  position_title: string;
  description?: string | null;
  quantity: number; // NUMERIC
  unit_price: number; // NUMERIC
  total_price: number; // NUMERIC
  service_module?: ServiceModule; // Enriched data
  seniority_level?: SeniorityLevel; // Enriched data
}

export interface Cost {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_id: string; // UUID
  title: string;
  amount: number; // NUMERIC
  invoice_document_path?: string | null;
  category?: string | null;
  is_estimated?: boolean;
}

export interface TimeEntry {
  id: string; // UUID
  created_at?: string; // TIMESTAMPTZ
  project_id: string; // UUID
  task_id?: string | null; // UUID
  profile_id: string; // UUID
  start_time: string; // TIMESTAMPTZ
  end_time?: string | null; // TIMESTAMPTZ
  duration_minutes?: number | null;
  status?: TimeStatus;
  rejection_reason?: string | null;
  billable?: boolean;
  billed_in_invoice_id?: string | null; // UUID
  profile?: Profile; // Enriched data
  project?: Project; // Enriched data
  task?: Task; // Enriched data
}

// =====================================================
// Task Service Integration - Variance Analysis Types
// =====================================================

/**
 * Task variance data (Plan vs Actual)
 * Compares estimated hours/costs with actual tracked time
 */
export interface TaskVariance {
  task_id: string;
  task_title: string;

  // Planned (from task)
  estimated_hours: number;
  estimated_rate: number;
  planned_value: number; // estimated_hours × estimated_rate

  // Actual (from time_entries)
  actual_hours: number;
  actual_rates: number[]; // Different team members may have different rates
  actual_value: number; // Sum of (hours × individual rates)

  // Variance
  hours_variance: number; // actual - estimated
  hours_variance_percent: number; // (variance / estimated) × 100
  value_variance: number; // actual_value - planned_value
  value_variance_percent: number; // (variance / planned_value) × 100

  // Status (within 10% tolerance = on_budget)
  status: 'under_budget' | 'on_budget' | 'over_budget';
}

/**
 * Project-level service breakdown
 * Aggregates tasks by service module for project analysis
 */
export interface ProjectServiceBreakdown {
  service_module_id: string;
  service_module_name: string;
  seniority_level_id?: string | null;
  seniority_level_name?: string | null;

  // Aggregated from tasks
  total_estimated_hours: number;
  total_planned_value: number;

  // Aggregated from time_entries
  total_actual_hours: number;
  total_actual_value: number;

  // Variance
  hours_variance: number; // total_actual - total_estimated
  value_variance: number; // total_actual_value - total_planned_value
  variance_status: 'under' | 'on_track' | 'over';

  task_count: number; // Number of tasks using this service
}
