-- ================================================
-- TEMPORARILY DISABLE RLS FOR DEVELOPMENT
-- ================================================

-- Disable RLS on chat tables for development
ALTER TABLE public.normal_chat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_chat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking DISABLE ROW LEVEL SECURITY;

-- Optional: Keep RLS on sensitive tables
-- ALTER TABLE public.user_profile DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;

-- This allows all operations on chat tables without RLS restrictions
-- WARNING: Only use this in development! Re-enable RLS for production

-- To re-enable later, run:
-- ALTER TABLE public.normal_chat ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.interview_chat ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for development. Remember to re-enable for production!' as notice;
