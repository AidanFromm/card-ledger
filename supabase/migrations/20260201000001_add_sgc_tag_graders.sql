-- Add SGC and TAG to grading_company enum
ALTER TYPE grading_company ADD VALUE IF NOT EXISTS 'sgc';
ALTER TYPE grading_company ADD VALUE IF NOT EXISTS 'tag';
