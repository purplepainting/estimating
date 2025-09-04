-- Main Modifiers Setup
-- Run this in your Supabase SQL editor

-- 1. Create the main_modifiers table
CREATE TABLE main_modifiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pct DECIMAL(5,4) NOT NULL, -- e.g., 0.25 for +25%, -0.25 for -25%
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- 2. Add main_modifier_id to estimates table
ALTER TABLE estimates ADD COLUMN main_modifier_id INTEGER REFERENCES main_modifiers(id);

-- 3. Add indexes for performance
CREATE INDEX idx_main_modifiers_enabled ON main_modifiers(enabled, sort_order);
CREATE INDEX idx_estimates_main_modifier_id ON estimates(main_modifier_id);

-- 4. Disable RLS for main_modifiers (since we have no auth)
ALTER TABLE main_modifiers DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions to anon role
GRANT ALL PRIVILEGES ON main_modifiers TO anon;
GRANT ALL PRIVILEGES ON SEQUENCE main_modifiers_id_seq TO anon;

-- 6. Insert the main modifiers (Residential as default with 0%)
INSERT INTO main_modifiers (name, pct, sort_order) VALUES
('Residential', 0.00, 1),    -- Default, no markup
('Commercial', 0.15, 2),     -- +15% markup
('Production', -0.20, 3),    -- -20% discount
('High End', 0.30, 4);       -- +30% markup

-- Check the results
SELECT * FROM main_modifiers ORDER BY sort_order;
