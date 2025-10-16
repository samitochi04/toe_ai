-- ================================================
-- ADD PHONE FIELD TO USER PROFILE TABLE
-- ================================================

-- Add phone field to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profile.phone IS 'User phone number (optional)';