-- ================================================
-- FIX RLS POLICIES FOR CHAT CREATION AND ACCESS
-- ================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create normal chats" ON public.normal_chat;
DROP POLICY IF EXISTS "Users can view own normal chats" ON public.normal_chat;
DROP POLICY IF EXISTS "Users can update own normal chats" ON public.normal_chat;
DROP POLICY IF EXISTS "Users can delete own normal chats" ON public.normal_chat;

-- Recreate normal chat policies with correct logic
CREATE POLICY "Users can view own normal chats" ON public.normal_chat
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create normal chats" ON public.normal_chat
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own normal chats" ON public.normal_chat
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own normal chats" ON public.normal_chat
    FOR DELETE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Fix interview chat policies
DROP POLICY IF EXISTS "Users can create interview chats" ON public.interview_chat;
DROP POLICY IF EXISTS "Users can view own interview chats" ON public.interview_chat;
DROP POLICY IF EXISTS "Users can update own interview chats" ON public.interview_chat;
DROP POLICY IF EXISTS "Users can delete own interview chats" ON public.interview_chat;

CREATE POLICY "Users can view own interview chats" ON public.interview_chat
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create interview chats" ON public.interview_chat
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own interview chats" ON public.interview_chat
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own interview chats" ON public.interview_chat
    FOR DELETE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Fix usage tracking policies
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;

CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own usage" ON public.usage_tracking
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Fix API usage logs policies
DROP POLICY IF EXISTS "Users can insert own api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Service role can insert api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can view own api usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Service role can manage api usage logs" ON public.api_usage_logs;

CREATE POLICY "Users can view own api usage" ON public.api_usage_logs
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own api usage logs" ON public.api_usage_logs
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage api usage logs" ON public.api_usage_logs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add service role policies for system operations
DROP POLICY IF EXISTS "Service role can manage normal chats" ON public.normal_chat;
DROP POLICY IF EXISTS "Service role can manage interview chats" ON public.interview_chat;
DROP POLICY IF EXISTS "Service role can manage usage tracking" ON public.usage_tracking;

CREATE POLICY "Service role can manage normal chats" ON public.normal_chat
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage interview chats" ON public.interview_chat
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage usage tracking" ON public.usage_tracking
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create comment to confirm completion
COMMENT ON TABLE public.normal_chat IS 'RLS policies updated for chat creation and access';
