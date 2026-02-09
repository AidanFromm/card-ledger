-- Add language column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN language TEXT DEFAULT 'English' CHECK (language IN ('English', 'Japanese', 'Chinese'));