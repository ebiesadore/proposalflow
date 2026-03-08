-- Add admin user to auth.users for login access
-- User: admin@nexsyscore.com
-- Password: Admin@2026

DO $$
DECLARE
    admin_user_uuid UUID := gen_random_uuid();
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@nexsyscore.com') THEN
        -- Insert admin user into auth.users with all required fields
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data,
            is_sso_user,
            is_anonymous,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            reauthentication_token,
            reauthentication_sent_at,
            phone,
            phone_change,
            phone_change_token,
            phone_change_sent_at
        ) VALUES (
            admin_user_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@nexsyscore.com',
            crypt('Admin@2026', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object(
                'full_name', 'System Administrator',
                'role', 'admin'
            ),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']::TEXT[],
                'role', 'admin'
            ),
            false,
            false,
            '',
            null,
            '',
            null,
            '',
            '',
            null,
            '',
            0,
            '',
            null,
            null,
            '',
            '',
            null
        );

        -- Note: user_profiles row will be created automatically by the handle_new_user() trigger
        -- The trigger reads raw_user_meta_data and creates the profile with admin role

        RAISE NOTICE 'Admin user created successfully: admin@nexsyscore.com';
    ELSE
        RAISE NOTICE 'Admin user already exists: admin@nexsyscore.com';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create admin user: %', SQLERRM;
END $$;

-- Verify the user was created
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'admin@nexsyscore.com';
    RAISE NOTICE 'Admin user verification: % user(s) found with email admin@nexsyscore.com', user_count;
END $$;