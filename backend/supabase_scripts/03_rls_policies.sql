-- ================================================
-- TOE AI Row Level Security (RLS) Policies
-- ================================================

-- ================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normal_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USER PROFILE POLICIES
-- ================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profile
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profile
    FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Users can view profiles by alias (for sharing functionality)
CREATE POLICY "Users can view profiles by alias" ON public.user_profile
    FOR SELECT
    USING (is_active = true);

-- ================================================
-- ADMIN POLICIES
-- ================================================

-- Only admins can view admin table
CREATE POLICY "Admins can view admin table" ON public.admin
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            WHERE up.auth_user_id = auth.uid()
            AND up.id IN (SELECT user_profile_id FROM public.admin WHERE is_active = true)
        )
    );

-- ================================================
-- SUBSCRIPTION TIERS POLICIES
-- ================================================

-- Everyone can view subscription tiers (for pricing page)
CREATE POLICY "Everyone can view subscription tiers" ON public.subscription_tiers
    FOR SELECT
    USING (is_active = true);

-- ================================================
-- USER SUBSCRIPTIONS POLICIES
-- ================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own subscriptions (for Stripe webhooks)
CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ================================================
-- USAGE TRACKING POLICIES
-- ================================================

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own usage (through functions)
CREATE POLICY "Users can update own usage" ON public.usage_tracking
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- ================================================
-- NORMAL CHAT POLICIES
-- ================================================

-- Users can view their own chats
CREATE POLICY "Users can view own normal chats" ON public.normal_chat
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can insert their own chats
CREATE POLICY "Users can create normal chats" ON public.normal_chat
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own chats
CREATE POLICY "Users can update own normal chats" ON public.normal_chat
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can delete their own chats
CREATE POLICY "Users can delete own normal chats" ON public.normal_chat
    FOR DELETE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can view shared chats
CREATE POLICY "Users can view shared normal chats" ON public.normal_chat
    FOR SELECT
    USING (
        is_shared = true
        OR user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- ================================================
-- INTERVIEW CHAT POLICIES
-- ================================================

-- Users can view their own interview chats
CREATE POLICY "Users can view own interview chats" ON public.interview_chat
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can insert their own interview chats
CREATE POLICY "Users can create interview chats" ON public.interview_chat
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own interview chats
CREATE POLICY "Users can update own interview chats" ON public.interview_chat
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can delete their own interview chats
CREATE POLICY "Users can delete own interview chats" ON public.interview_chat
    FOR DELETE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can view shared interview chats
CREATE POLICY "Users can view shared interview chats" ON public.interview_chat
    FOR SELECT
    USING (
        is_shared = true
        OR user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- ================================================
-- SHARED CHAT POLICIES
-- ================================================

-- Users can view shared chats they own
CREATE POLICY "Users can view own shared chats" ON public.shared_chat
    FOR SELECT
    USING (
        owner_user_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can create shared chats for their own chats
CREATE POLICY "Users can create shared chats" ON public.shared_chat
    FOR INSERT
    WITH CHECK (
        owner_user_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own shared chats
CREATE POLICY "Users can update own shared chats" ON public.shared_chat
    FOR UPDATE
    USING (
        owner_user_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can delete their own shared chats
CREATE POLICY "Users can delete own shared chats" ON public.shared_chat
    FOR DELETE
    USING (
        owner_user_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Everyone can view public shared chats (for anonymous access)
CREATE POLICY "Everyone can view public shared chats" ON public.shared_chat
    FOR SELECT
    USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ================================================
-- STRIPE PAYMENTS POLICIES
-- ================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.stripe_payments
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can manage all payments (for Stripe webhooks)
CREATE POLICY "Service role can manage payments" ON public.stripe_payments
    FOR ALL
    USING (auth.role() = 'service_role');

-- ================================================
-- AUDIO FILES POLICIES
-- ================================================

-- Users can view audio files for their own chats
CREATE POLICY "Users can view own audio files" ON public.audio_files
    FOR SELECT
    USING (
        chat_id IN (
            SELECT id FROM public.interview_chat 
            WHERE user_profile_id IN (
                SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can insert audio files for their own chats
CREATE POLICY "Users can create audio files" ON public.audio_files
    FOR INSERT
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.interview_chat 
            WHERE user_profile_id IN (
                SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
            )
        )
    );

-- ================================================
-- API USAGE LOGS POLICIES
-- ================================================

-- Users can view their own API usage logs
CREATE POLICY "Users can view own api usage" ON public.api_usage_logs
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can view all API usage (for billing)
CREATE POLICY "Service role can view all api usage" ON public.api_usage_logs
    FOR SELECT
    USING (auth.role() = 'service_role');

-- ================================================
-- SYSTEM SETTINGS POLICIES
-- ================================================

-- Everyone can view public system settings
CREATE POLICY "Everyone can view public settings" ON public.system_settings
    FOR SELECT
    USING (is_public = true);

-- Admins can view all system settings
CREATE POLICY "Admins can view all settings" ON public.system_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.admin a ON up.id = a.user_profile_id
            WHERE up.auth_user_id = auth.uid()
            AND a.is_active = true
        )
    );

-- Admins can manage system settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.admin a ON up.id = a.user_profile_id
            WHERE up.auth_user_id = auth.uid()
            AND a.is_active = true
        )
    );