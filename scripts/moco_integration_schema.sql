-- profiles: add moco_user_id for Impersonation mapping
ALTER TABLE profiles ADD COLUMN moco_user_id INTEGER;

-- agency_clients: add moco_company_id
ALTER TABLE agency_clients ADD COLUMN moco_company_id INTEGER;

-- agency_projects: add moco_project_id and moco_contract_id
ALTER TABLE agency_projects ADD COLUMN moco_project_id INTEGER;
ALTER TABLE agency_projects ADD COLUMN moco_contract_id INTEGER;

-- agency_tasks: add moco_task_id
ALTER TABLE agency_tasks ADD COLUMN moco_task_id INTEGER;

-- Create Cache Table for Absences
CREATE TABLE IF NOT EXISTS agency_moco_absences (
    id SERIAL PRIMARY KEY,
    moco_absence_id INTEGER UNIQUE NOT NULL,
    moco_user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    am BOOLEAN DEFAULT TRUE,
    pm BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Cache Table for Schedules
CREATE TABLE IF NOT EXISTS agency_moco_schedules (
    id SERIAL PRIMARY KEY,
    moco_user_id INTEGER NOT NULL UNIQUE,
    monday REAL DEFAULT 0,
    tuesday REAL DEFAULT 0,
    wednesday REAL DEFAULT 0,
    thursday REAL DEFAULT 0,
    friday REAL DEFAULT 0,
    saturday REAL DEFAULT 0,
    sunday REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
