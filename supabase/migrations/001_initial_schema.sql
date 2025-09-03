-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'ESTIMATOR', 'VIEWER');
CREATE TYPE project_category AS ENUM ('residential', 'commercial', 'HOA', 'healthcare', 'industrial');
CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'accepted', 'lost');
CREATE TYPE job_walk_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE area_type AS ENUM ('interior', 'exterior', 'cabinets');
CREATE TYPE uom_type AS ENUM ('sqft', 'lnft', 'ea');
CREATE TYPE section_type AS ENUM ('interior', 'exterior', 'cabinets', 'general');
CREATE TYPE scope_type AS ENUM ('item', 'area', 'estimate');
CREATE TYPE formula_key_type AS ENUM (
  'walls_sqft', 'ceil_sqft', 'base_lnft', 'exterior_walls', 
  'eaves_sqft', 'fascia_lnft', 'elevation_walls', 'manual'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'VIEWER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT,
  state TEXT,
  postal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  category project_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job walks table
CREATE TABLE job_walks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  estimator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  status job_walk_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estimates table
CREATE TABLE estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_walk_id UUID REFERENCES job_walks(id) ON DELETE SET NULL,
  status estimate_status NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  overhead_percent DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  profit_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 8.50,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price items table
CREATE TABLE price_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section section_type NOT NULL,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  uom uom_type NOT NULL,
  base_unit_cost DECIMAL(10,2) NOT NULL,
  base_unit_price DECIMAL(10,2) NOT NULL,
  formula_key formula_key_type NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modifiers table
CREATE TABLE modifiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section section_type NOT NULL,
  scope scope_type NOT NULL,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  cost_adjustment DECIMAL(5,2) NOT NULL,
  price_adjustment DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estimate areas table
CREATE TABLE estimate_areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type area_type NOT NULL,
  length DECIMAL(8,2) NOT NULL,
  width DECIMAL(8,2) NOT NULL,
  height DECIMAL(8,2),
  perimeter DECIMAL(8,2),
  eaves_length DECIMAL(8,2),
  elevation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estimate items table
CREATE TABLE estimate_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  area_id UUID REFERENCES estimate_areas(id) ON DELETE CASCADE,
  price_item_id UUID NOT NULL REFERENCES price_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  extended_cost DECIMAL(12,2) NOT NULL,
  extended_price DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estimate modifiers table
CREATE TABLE estimate_modifiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  area_id UUID REFERENCES estimate_areas(id) ON DELETE CASCADE,
  item_id UUID REFERENCES estimate_items(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  scope scope_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_job_walks_project_id ON job_walks(project_id);
CREATE INDEX idx_job_walks_scheduled_date ON job_walks(scheduled_date);
CREATE INDEX idx_job_walks_estimator_id ON job_walks(estimator_id);
CREATE INDEX idx_estimates_project_id ON estimates(project_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_created_by ON estimates(created_by);
CREATE INDEX idx_price_items_section ON price_items(section);
CREATE INDEX idx_price_items_code ON price_items(code);
CREATE INDEX idx_modifiers_section ON modifiers(section);
CREATE INDEX idx_modifiers_scope ON modifiers(scope);
CREATE INDEX idx_estimate_areas_estimate_id ON estimate_areas(estimate_id);
CREATE INDEX idx_estimate_areas_type ON estimate_areas(type);
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_area_id ON estimate_items(area_id);
CREATE INDEX idx_estimate_modifiers_estimate_id ON estimate_modifiers(estimate_id);
CREATE INDEX idx_estimate_modifiers_area_id ON estimate_modifiers(area_id);
CREATE INDEX idx_estimate_modifiers_item_id ON estimate_modifiers(item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_walks_updated_at BEFORE UPDATE ON job_walks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_items_updated_at BEFORE UPDATE ON price_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modifiers_updated_at BEFORE UPDATE ON modifiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_areas_updated_at BEFORE UPDATE ON estimate_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_items_updated_at BEFORE UPDATE ON estimate_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_modifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own user record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Clients: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Clients viewable by all authenticated users" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Clients editable by estimators and admins" ON clients
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Projects: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Projects viewable by all authenticated users" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Projects editable by estimators and admins" ON projects
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Job walks: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Job walks viewable by all authenticated users" ON job_walks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Job walks editable by estimators and admins" ON job_walks
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Estimates: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Estimates viewable by all authenticated users" ON estimates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estimates editable by estimators and admins" ON estimates
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Price items: Only Admins can edit, all can view
CREATE POLICY "Price items viewable by all authenticated users" ON price_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Price items editable by admins only" ON price_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Modifiers: Only Admins can edit, all can view
CREATE POLICY "Modifiers viewable by all authenticated users" ON modifiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Modifiers editable by admins only" ON modifiers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Estimate areas: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Estimate areas viewable by all authenticated users" ON estimate_areas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estimate areas editable by estimators and admins" ON estimate_areas
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Estimate items: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Estimate items viewable by all authenticated users" ON estimate_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estimate items editable by estimators and admins" ON estimate_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Estimate modifiers: Estimators and Admins can CRUD, Viewers can only read
CREATE POLICY "Estimate modifiers viewable by all authenticated users" ON estimate_modifiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estimate modifiers editable by estimators and admins" ON estimate_modifiers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'ESTIMATOR')
    )
  );

-- Insert default price items
INSERT INTO price_items (section, code, label, uom, base_unit_cost, base_unit_price, formula_key) VALUES
-- Interior items
('interior', 'DRYWALL', 'Drywall', 'sqft', 0.85, 1.25, 'walls_sqft'),
('interior', 'PLASTER', 'Plaster', 'sqft', 1.20, 1.80, 'walls_sqft'),
('interior', 'NEW_DRYWALL', 'New Drywall', 'sqft', 1.10, 1.65, 'walls_sqft'),
('interior', 'PANELING', 'Paneling', 'sqft', 0.95, 1.45, 'walls_sqft'),
('interior', 'CEILING_PAINT', 'Ceiling Paint', 'sqft', 0.45, 0.75, 'ceil_sqft'),
('interior', 'BASEBOARD_NEW', 'New Baseboard', 'lnft', 2.50, 3.75, 'base_lnft'),
('interior', 'BASEBOARD_EXISTING', 'Existing Baseboard', 'lnft', 1.80, 2.70, 'base_lnft'),
('interior', 'DOOR_PAINT', 'Door Paint', 'ea', 25.00, 37.50, 'manual'),
('interior', 'WINDOW_TRIM', 'Window Trim', 'lnft', 3.20, 4.80, 'manual'),

-- Exterior items
('exterior', 'STUCCO', 'Stucco', 'sqft', 2.85, 4.25, 'exterior_walls'),
('exterior', 'WOOD_SIDING', 'Wood Siding', 'sqft', 3.50, 5.25, 'exterior_walls'),
('exterior', 'EAVES', 'Eaves', 'sqft', 1.95, 2.95, 'eaves_sqft'),
('exterior', 'FASCIA', 'Fascia', 'lnft', 4.25, 6.40, 'fascia_lnft'),
('exterior', 'EXTERIOR_DOOR', 'Exterior Door', 'ea', 45.00, 67.50, 'manual'),
('exterior', 'EXTERIOR_WINDOW', 'Exterior Window', 'ea', 35.00, 52.50, 'manual'),

-- Cabinet items
('cabinets', 'CABINET_SMALL', 'Small Cabinet Front', 'ea', 15.00, 22.50, 'manual'),
('cabinets', 'CABINET_MEDIUM', 'Medium Cabinet Front', 'ea', 22.00, 33.00, 'manual'),
('cabinets', 'CABINET_LARGE', 'Large Cabinet Front', 'ea', 28.00, 42.00, 'manual'),
('cabinets', 'CABINET_BOX', 'Cabinet Box', 'sqft', 12.00, 18.00, 'manual'),
('cabinets', 'CABINET_PANEL', 'Cabinet Panel', 'sqft', 8.50, 12.75, 'manual'),
('cabinets', 'CABINET_CROWN', 'Cabinet Crown', 'lnft', 6.50, 9.75, 'manual'),
('cabinets', 'CABINET_TOE_KICK', 'Cabinet Toe Kick', 'lnft', 4.25, 6.40, 'manual');

-- Insert default modifiers
INSERT INTO modifiers (section, scope, code, label, cost_adjustment, price_adjustment) VALUES
-- Interior modifiers
('interior', 'item', 'HIGH_QUALITY', 'High Quality (+15%)', 15.00, 15.00),
('interior', 'item', 'PRODUCTION', 'Production (-10%)', -10.00, -10.00),
('interior', 'item', 'PRIME_2_COATS', 'Prime + 2 Coats (+25%)', 25.00, 25.00),
('interior', 'area', 'HARD_ACCESS', 'Hard Access (+12%)', 12.00, 12.00),
('interior', 'estimate', 'PREVAILING_WAGE', 'Prevailing Wage (+18%)', 18.00, 18.00),

-- Exterior modifiers
('exterior', 'item', 'HIGH_QUALITY', 'High Quality (+15%)', 15.00, 15.00),
('exterior', 'item', 'PRODUCTION', 'Production (-10%)', -10.00, -10.00),
('exterior', 'area', 'HARD_ACCESS', 'Hard Access (+12%)', 12.00, 12.00),
('exterior', 'estimate', 'PREVAILING_WAGE', 'Prevailing Wage (+18%)', 18.00, 18.00),

-- Cabinet modifiers
('cabinets', 'item', 'HEAVY_PREP', 'Heavy Prep (+20%)', 20.00, 20.00),
('cabinets', 'item', 'GRAIN_FILL', 'Grain Fill (+15%)', 15.00, 15.00),
('cabinets', 'item', 'PREMIUM_FINISH', 'Premium Finish (+25%)', 25.00, 25.00),
('cabinets', 'item', 'SPRAY_BOOTH', 'Spray Booth (+18%)', 18.00, 18.00),
('cabinets', 'item', 'HARDWARE_RR', 'Hardware R&R (+12%)', 12.00, 12.00);
