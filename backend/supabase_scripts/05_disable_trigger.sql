-- ================================================
-- DISABLE PROBLEMATIC TRIGGER TEMPORARILY
-- ================================================

-- The handle_new_user() trigger is failing and preventing user registration
-- This script disables it so registration can work while we debug the issue

-- Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Check if subscription tiers exist (this might be the issue)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'Free') THEN
        RAISE NOTICE 'WARNING: Free subscription tier does not exist! This may be why the trigger fails.';
        RAISE NOTICE 'Run the 04_initial_data.sql script to create subscription tiers.';
    ELSE
        RAISE NOTICE 'Free subscription tier exists with ID: %', (SELECT id FROM public.subscription_tiers WHERE name = 'Free' LIMIT 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'Premium') THEN
        RAISE NOTICE 'WARNING: Premium subscription tier does not exist!';
    END IF;
END $$;

-- Optional: Keep the function but disable the trigger
-- DROP FUNCTION IF EXISTS handle_new_user();

RAISE NOTICE 'Trigger on_auth_user_created has been disabled.';
RAISE NOTICE 'User registration should now work without automatic profile creation.';
RAISE NOTICE 'Make sure your backend handles profile creation manually.';