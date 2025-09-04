-- Seed data for Estimating App v2 Price Sheet

-- Interior Items
INSERT INTO price_items (name, category, substrate, uom, rate, enabled, prep_finish_text) VALUES
('Walls', 'interior', 'drywall', 'sf', 2.00, true, 'Light sand, prime with quality primer, apply two coats premium paint'),
('Ceilings', 'interior', 'drywall', 'sf', 2.25, true, 'Light sand, prime with quality primer, apply two coats premium ceiling paint'),
('Baseboard', 'interior', 'wood', 'lf', 2.50, true, 'Sand, prime, and paint with semi-gloss finish'),
('Doors', 'interior', 'wood', 'each', 85.00, true, 'Sand, prime, and paint both sides with semi-gloss finish'),
('Windows', 'interior', 'wood', 'each', 45.00, true, 'Sand, prime, and paint sash and trim with semi-gloss finish'),
('Crown Molding', 'interior', 'wood', 'lf', 3.75, true, 'Sand, prime, and paint with semi-gloss finish');

-- Exterior Items  
INSERT INTO price_items (name, category, substrate, uom, rate, enabled, prep_finish_text) VALUES
('Stucco Walls', 'exterior', 'stucco_masonry', 'sf', 2.25, true, 'Pressure wash, prime with masonry primer, apply two coats exterior paint'),
('Wood Siding', 'exterior', 'wood', 'sf', 2.75, true, 'Pressure wash, scrape loose paint, prime bare wood, apply two coats exterior paint'),
('Metal Siding', 'exterior', 'metal', 'sf', 2.50, true, 'Pressure wash, sand rust spots, prime with metal primer, apply two coats exterior paint'),
('Fascia', 'exterior', 'wood', 'lf', 3.00, true, 'Sand, prime, and paint with exterior semi-gloss'),
('Eaves/Soffit', 'exterior', 'wood', 'sf', 2.00, true, 'Sand, prime, and paint with exterior paint'),
('Front Door', 'exterior', 'wood', 'each', 125.00, true, 'Sand, prime, and paint with exterior semi-gloss finish'),
('Shutters', 'exterior', 'wood', 'each', 35.00, true, 'Sand, prime, and paint both sides');

-- Cabinet Items
INSERT INTO price_items (name, category, substrate, uom, rate, enabled, prep_finish_text) VALUES
('Cabinet Doors - Small', 'cabinets', 'wood', 'each', 45.00, true, 'Clean, sand, prime, and paint both sides with semi-gloss finish'),
('Cabinet Doors - Large', 'cabinets', 'wood', 'each', 65.00, true, 'Clean, sand, prime, and paint both sides with semi-gloss finish'),
('Drawer Fronts', 'cabinets', 'wood', 'each', 25.00, true, 'Clean, sand, prime, and paint with semi-gloss finish'),
('Cabinet Boxes', 'cabinets', 'wood', 'sf', 3.50, true, 'Clean, sand, prime, and paint interior surfaces');

-- Sample Modifiers
INSERT INTO modifiers (item_id, category, label, pct) VALUES
-- Interior modifiers
(NULL, 'interior', 'High Ceilings (10+ ft)', 0.25),
(NULL, 'interior', 'Multiple Colors', 0.15),
(NULL, 'interior', 'Textured Walls', 0.20),
(NULL, 'interior', 'New Construction Clean', -0.10),

-- Exterior modifiers  
(NULL, 'exterior', 'Two Story', 0.30),
(NULL, 'exterior', 'Heavy Prep Work', 0.40),
(NULL, 'exterior', 'Difficult Access', 0.25),
(NULL, 'exterior', 'New Construction', -0.15),

-- Cabinet modifiers
(NULL, 'cabinets', 'Detailed/Raised Panel', 0.30),
(NULL, 'cabinets', 'Multiple Colors', 0.20),
(NULL, 'cabinets', 'Glass Doors', 0.15),
(NULL, 'cabinets', 'In-Place (No Removal)', -0.10);
