-- Estimating App v2 Database Schema

-- Estimates (no auth, simple contact info)
CREATE TABLE estimates (
  id SERIAL PRIMARY KEY,
  status TEXT CHECK (status IN ('draft', 'sent', 'accepted', 'lost', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contact_first TEXT NOT NULL,
  contact_last TEXT,
  phone TEXT,
  email TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  postal TEXT,
  scheduled_date DATE
);

-- Interior Areas
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  length_ft DECIMAL(8,2),
  width_ft DECIMAL(8,2),
  height_ft DECIMAL(8,2)
);

-- Exterior Perimeter Measures
CREATE TABLE exterior_measures (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
  perimeter_ln_ft DECIMAL(8,2),
  wall_height_ft DECIMAL(8,2),
  eaves_ln_ft DECIMAL(8,2),
  eave_depth_ft DECIMAL(8,2) DEFAULT 2.0
);

-- Exterior Elevations
CREATE TABLE elevations (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  length_ft DECIMAL(8,2),
  height_ft DECIMAL(8,2),
  eaves_ln_ft DECIMAL(8,2),
  fascia_ln_ft DECIMAL(8,2)
);

-- Cabinet Groups
CREATE TABLE cabinet_groups (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Price Sheet Items
CREATE TABLE price_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('interior', 'exterior', 'cabinets')) NOT NULL,
  substrate TEXT CHECK (substrate IN ('drywall', 'wood', 'metal', 'stucco_masonry')) NOT NULL,
  uom TEXT CHECK (uom IN ('sf', 'lf', 'each')) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  prep_finish_text TEXT
);

-- Modifiers
CREATE TABLE modifiers (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES price_items(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('interior', 'exterior', 'cabinets')),
  label TEXT NOT NULL,
  pct DECIMAL(5,4) NOT NULL -- e.g., 0.50 for +50%, -0.25 for -25%
);

-- Estimate Lines (with snapshots)
CREATE TABLE estimate_lines (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
  area_id INTEGER REFERENCES areas(id) ON DELETE CASCADE,
  elevation_id INTEGER REFERENCES elevations(id) ON DELETE CASCADE,
  cabinet_group_id INTEGER REFERENCES cabinet_groups(id) ON DELETE CASCADE,
  price_item_id INTEGER REFERENCES price_items(id),
  -- Snapshots to preserve pricing when price sheet changes
  snapshot_name TEXT NOT NULL,
  snapshot_category TEXT NOT NULL,
  snapshot_substrate TEXT NOT NULL,
  snapshot_uom TEXT NOT NULL,
  snapshot_rate DECIMAL(10,2) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  selected_modifier_ids INTEGER[] DEFAULT '{}'
);

-- Line Modifiers (alternative to array, for easier queries)
CREATE TABLE line_modifiers (
  id SERIAL PRIMARY KEY,
  estimate_line_id INTEGER REFERENCES estimate_lines(id) ON DELETE CASCADE,
  modifier_id INTEGER REFERENCES modifiers(id),
  snapshot_pct DECIMAL(5,4) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_areas_estimate_id ON areas(estimate_id);
CREATE INDEX idx_elevations_estimate_id ON elevations(estimate_id);
CREATE INDEX idx_cabinet_groups_estimate_id ON cabinet_groups(estimate_id);
CREATE INDEX idx_estimate_lines_estimate_id ON estimate_lines(estimate_id);
CREATE INDEX idx_price_items_category_enabled ON price_items(category, enabled);
CREATE INDEX idx_modifiers_item_id ON modifiers(item_id);
CREATE INDEX idx_modifiers_category ON modifiers(category);

-- Disable RLS for all tables (no authentication required)
ALTER TABLE estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE exterior_measures DISABLE ROW LEVEL SECURITY;
ALTER TABLE elevations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_modifiers DISABLE ROW LEVEL SECURITY;
