-- Clear existing roles and set up initial roles
-- This migration replaces default roles with the specific roles needed for the system

-- Delete all existing roles
DELETE FROM public.roles;

-- Insert the 4 initial roles
INSERT INTO public.roles (name, description) VALUES
    ('Estimator', 'Responsible for project cost estimation and proposal pricing'),
    ('IT', 'Information Technology support and system management'),
    ('Sale & Marketing', 'Sales and marketing operations and client engagement'),
    ('C level', 'Executive leadership with full system access')
ON CONFLICT (name) DO NOTHING;