-- ================================================
-- FIX API USAGE LOGS RLS POLICY
-- ================================================

-- Add missing INSERT policy for api_usage_logs table
-- Users need to be able to insert their own API usage logs

CREATE POLICY "Users can insert own api usage logs" ON public.api_usage_logs
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can insert API usage logs for any user (for system operations)
CREATE POLICY "Service role can insert api usage logs" ON public.api_usage_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Verify the policies are created
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'api_usage_logs' 
ORDER BY policyname;