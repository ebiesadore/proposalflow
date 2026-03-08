-- Create roles table for dynamic role management
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read roles
DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON public.roles;
CREATE POLICY "authenticated_users_can_read_roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only admins can insert/update/delete roles
DROP POLICY IF EXISTS "admins_can_manage_roles" ON public.roles;
CREATE POLICY "admins_can_manage_roles"
ON public.roles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insert default roles
DO $$
BEGIN
    INSERT INTO public.roles (name, description) VALUES
        ('Administrator', 'Full system access with all permissions'),
        ('Manager', 'Manage teams and projects'),
        ('Specialist', 'Specialized role with specific permissions'),
        ('Analyst', 'Data analysis and reporting'),
        ('Coordinator', 'Coordinate tasks and activities')
    ON CONFLICT (name) DO NOTHING;
END $$;