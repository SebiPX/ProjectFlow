
import type { Client, Profile, Project, Task, Asset, TimeEntry } from '../types/supabase';
import { UserRole, ProjectCategory, ProjectStatus, TaskStatus, AssetType, AssetStatus, TimeStatus } from '../types/supabase';

export const MOCK_CLIENTS: Client[] = [
  { id: '1', company_name: 'Innovate Corp', city: 'Berlin', website: 'innovate.de' },
  { id: '2', company_name: 'Quantum Solutions', city: 'München', website: 'quantum.com' },
  { id: '3', company_name: 'Digital Horizons', city: 'Hamburg', website: 'digitalhorizons.io' },
];

export const MOCK_PROFILES: Profile[] = [
  { id: '101', full_name: 'Alex Meier', email: 'alex@agency.com', role: UserRole.Admin, avatar_url: 'https://picsum.photos/seed/alex/100/100' },
  { id: '102', full_name: 'Julia Weber', email: 'julia@agency.com', role: UserRole.Creative, avatar_url: 'https://picsum.photos/seed/julia/100/100' },
  { id: '103', full_name: 'Tom Schmidt', email: 'tom@agency.com', role: UserRole.PJM, avatar_url: 'https://picsum.photos/seed/tom/100/100' },
  { id: '104', full_name: 'Sandra Klein', email: 'sandra@agency.com', role: UserRole.Guest, avatar_url: 'https://picsum.photos/seed/sandra/100/100' },
  { id: '201', full_name: 'Dr. Eva Lang', email: 'eva.lang@innovate.de', role: UserRole.Client, client_id: '1', avatar_url: 'https://picsum.photos/seed/eva/100/100' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    project_number: 101,
    title: 'Project Phoenix - Website Relaunch',
    description: 'Complete redesign and development of the corporate website for Innovate Corp.',
    category: ProjectCategory.WebDesign,
    status: ProjectStatus.Active,
    color_code: '#3b82f6',
    client_id: '1',
    start_date: '2023-10-01',
    deadline: '2024-03-31',
    budget_total: 75000,
    client: MOCK_CLIENTS[0],
  },
  {
    id: 'p2',
    project_number: 102,
    title: 'QuantumLeap Social Media Campaign',
    description: 'Q4 social media campaign to promote new product line.',
    category: ProjectCategory.SocialCampaign,
    status: ProjectStatus.Completed,
    color_code: '#10b981',
    client_id: '2',
    start_date: '2023-09-15',
    deadline: '2023-12-20',
    budget_total: 45000,
    client: MOCK_CLIENTS[1],
  },
  {
    id: 'p3',
    project_number: 103,
    title: 'Horizons App Development',
    description: 'Cross-platform mobile application for customer engagement.',
    category: ProjectCategory.AppDev,
    status: ProjectStatus.Planned,
    color_code: '#f97316',
    client_id: '3',
    start_date: '2024-02-01',
    deadline: '2024-09-30',
    budget_total: 120000,
    client: MOCK_CLIENTS[2],
  },
   {
    id: 'p4',
    project_number: 104,
    title: 'Innovate Corp TV Commercial',
    description: 'Production of a 30s TV spot for the new product launch.',
    category: ProjectCategory.TvCommercial,
    status: ProjectStatus.OnHold,
    color_code: '#f59e0b',
    client_id: '1',
    start_date: '2024-01-10',
    deadline: '2024-05-15',
    budget_total: 250000,
    client: MOCK_CLIENTS[0],
  },
];

export const MOCK_TASKS: Task[] = [
  // Project Phoenix Tasks
  { id: 't1', project_id: 'p1', title: 'Initial Kick-off Meeting', status: TaskStatus.Done, assigned_to: '101', due_date: '2023-10-05T00:00:00Z', assignee: MOCK_PROFILES[0] },
  { id: 't2', project_id: 'p1', title: 'Wireframing & UX Concepts', status: TaskStatus.Done, assigned_to: '102', due_date: '2023-10-20T00:00:00Z', assignee: MOCK_PROFILES[1] },
  { id: 't3', project_id: 'p1', title: 'UI Design Mockups (Homepage)', status: TaskStatus.Review, assigned_to: '103', due_date: '2023-11-10T00:00:00Z', assignee: MOCK_PROFILES[2] },
  { id: 't4', project_id: 'p1', title: 'Frontend Development Setup', status: TaskStatus.InProgress, assigned_to: '104', due_date: '2023-11-15T00:00:00Z', assignee: MOCK_PROFILES[3] },
  { id: 't5', project_id: 'p1', title: 'Develop Content Management System', status: TaskStatus.InProgress, assigned_to: '104', due_date: '2023-12-15T00:00:00Z', assignee: MOCK_PROFILES[3] },
  { id: 't6', project_id: 'p1', title: 'Client Feedback Session #1', status: TaskStatus.Todo, assigned_to: '101', due_date: '2023-11-12T00:00:00Z', assignee: MOCK_PROFILES[0] },
  { id: 't7', project_id: 'p1', title: 'User Acceptance Testing', status: TaskStatus.Todo, assigned_to: '102', due_date: '2024-03-10T00:00:00Z', assignee: MOCK_PROFILES[1] },
  // Other projects tasks...
  { id: 't8', project_id: 'p2', title: 'Campaign Concept Presentation', status: TaskStatus.Done, assigned_to: '101', due_date: '2023-09-20T00:00:00Z', assignee: MOCK_PROFILES[0] },
  { id: 't9', project_id: 'p3', title: 'Requirement Engineering Workshop', status: TaskStatus.Todo, assigned_to: '102', due_date: '2024-02-10T00:00:00Z', assignee: MOCK_PROFILES[1] },
];

export const MOCK_ASSETS: Asset[] = [
    { id: 'a1', project_id: 'p1', name: 'Initial Briefing.pdf', category: AssetType.Briefing, status: AssetStatus.Approved, uploader: MOCK_PROFILES[4], file_size: 1200, file_type: 'application/pdf', created_at: '2023-10-02T00:00:00Z' },
    { id: 'a2', project_id: 'p1', name: 'Homepage_Design_v3.fig', category: AssetType.Design, status: AssetStatus.ClientReview, uploader: MOCK_PROFILES[2], file_size: 25000, file_type: 'image/figma', created_at: '2023-11-08T00:00:00Z' },
    { id: 'a3', project_id: 'p1', name: 'Service Contract.docx', category: AssetType.Contract, status: AssetStatus.Approved, uploader: MOCK_PROFILES[0], file_size: 350, file_type: 'application/msword', created_at: '2023-10-01T00:00:00Z' },
];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
    { id: 'te1', project_id: 'p1', task_id: 't2', profile_id: '102', start_time: '2023-10-18T09:00:00Z', duration_minutes: 240, status: TimeStatus.Approved, profile: MOCK_PROFILES[1]},
    { id: 'te2', project_id: 'p1', task_id: 't3', profile_id: '103', start_time: '2023-11-05T10:00:00Z', duration_minutes: 360, status: TimeStatus.Approved, profile: MOCK_PROFILES[2]},
    { id: 'te3', project_id: 'p1', task_id: 't4', profile_id: '104', start_time: '2023-11-14T09:30:00Z', duration_minutes: 180, status: TimeStatus.Submitted, profile: MOCK_PROFILES[3]},
];
