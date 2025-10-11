-- ================================================
-- TOE AI Database Functions and Triggers
-- ================================================

-- ================================================
-- 1. FUNCTION TO GENERATE USER ALIAS
-- ================================================
CREATE OR REPLACE FUNCTION generate_user_alias(email_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    username_part TEXT;
    year_part TEXT;
    base_alias TEXT;
    final_alias TEXT;
    counter INTEGER := 0;
BEGIN
    -- Extract username from email (part before @)
    username_part := LOWER(SPLIT_PART(email_input, '@', 1));
    
    -- Clean username: remove special characters, keep only alphanumeric and underscore
    username_part := REGEXP_REPLACE(username_part, '[^a-zA-Z0-9_]', '', 'g');
    
    -- Limit username length to 20 characters
    IF LENGTH(username_part) > 20 THEN
        username_part := LEFT(username_part, 20);
    END IF;
    
    -- Get current year
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Generate base alias
    base_alias := username_part || '@' || year_part;
    final_alias := base_alias;
    
    -- Check if alias exists and add counter if needed
    WHILE EXISTS (SELECT 1 FROM public.user_profile WHERE alias = final_alias) LOOP
        counter := counter + 1;
        final_alias := base_alias || '_' || counter::TEXT;
    END LOOP;
    
    RETURN final_alias;
END;
$$;

-- ================================================
-- 2. FUNCTION TO CREATE USER PROFILE FROM AUTH USER
-- ================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_alias TEXT;
BEGIN
    -- Generate alias for the new user
    user_alias := generate_user_alias(NEW.email);
    
    -- Insert new user profile
    INSERT INTO public.user_profile (
        auth_user_id,
        email,
        full_name,
        alias,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        user_alias,
        NOW(),
        NOW()
    );
    
    -- Initialize usage tracking for the new user
    INSERT INTO public.usage_tracking (
        user_profile_id,
        interview_chats_used,
        normal_chats_used,
        reset_date,
        created_at,
        updated_at
    ) VALUES (
        (SELECT id FROM public.user_profile WHERE auth_user_id = NEW.id),
        0,
        0,
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Create free subscription for the new user
    INSERT INTO public.user_subscriptions (
        user_profile_id,
        tier_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        (SELECT id FROM public.user_profile WHERE auth_user_id = NEW.id),
        (SELECT id FROM public.subscription_tiers WHERE name = 'Free' LIMIT 1),
        'free',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- ================================================
-- 3. TRIGGER FOR NEW USER CREATION
-- ================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- 4. FUNCTION TO UPDATE UPDATED_AT TIMESTAMPS
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ================================================
-- 5. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ================================================
DROP TRIGGER IF EXISTS update_user_profile_updated_at ON public.user_profile;
CREATE TRIGGER update_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_normal_chat_updated_at ON public.normal_chat;
CREATE TRIGGER update_normal_chat_updated_at
    BEFORE UPDATE ON public.normal_chat
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_chat_updated_at ON public.interview_chat;
CREATE TRIGGER update_interview_chat_updated_at
    BEFORE UPDATE ON public.interview_chat
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. FUNCTION TO CHECK USAGE LIMITS
-- ================================================
CREATE OR REPLACE FUNCTION check_usage_limit(
    user_id UUID,
    chat_type TEXT -- 'normal' or 'interview'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_usage_normal INTEGER;
    current_usage_interview INTEGER;
    limit_normal INTEGER;
    limit_interview INTEGER;
    subscription_status TEXT;
BEGIN
    -- Get current usage
    SELECT 
        normal_chats_used,
        interview_chats_used
    INTO current_usage_normal, current_usage_interview
    FROM public.usage_tracking
    WHERE user_profile_id = user_id;
    
    -- Get user's subscription limits
    SELECT 
        st.normal_chat_limit,
        st.interview_chat_limit,
        us.status
    INTO limit_normal, limit_interview, subscription_status
    FROM public.user_subscriptions us
    JOIN public.subscription_tiers st ON us.tier_id = st.id
    WHERE us.user_profile_id = user_id
    AND us.status IN ('free', 'active')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Check limits based on chat type
    IF chat_type = 'normal' THEN
        RETURN current_usage_normal < limit_normal;
    ELSIF chat_type = 'interview' THEN
        RETURN current_usage_interview < limit_interview;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- ================================================
-- 7. FUNCTION TO INCREMENT USAGE COUNT
-- ================================================
CREATE OR REPLACE FUNCTION increment_usage_count(
    user_id UUID,
    chat_type TEXT -- 'normal' or 'interview'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF chat_type = 'normal' THEN
        UPDATE public.usage_tracking
        SET normal_chats_used = normal_chats_used + 1,
            updated_at = NOW()
        WHERE user_profile_id = user_id;
    ELSIF chat_type = 'interview' THEN
        UPDATE public.usage_tracking
        SET interview_chats_used = interview_chats_used + 1,
            updated_at = NOW()
        WHERE user_profile_id = user_id;
    END IF;
END;
$$;

-- ================================================
-- 8. FUNCTION TO RESET MONTHLY USAGE
-- ================================================
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.usage_tracking
    SET 
        normal_chats_used = 0,
        interview_chats_used = 0,
        reset_date = NOW(),
        updated_at = NOW()
    WHERE reset_date < NOW() - INTERVAL '1 month';
END;
$$;

-- ================================================
-- 9. FUNCTION TO GET USER BY ALIAS
-- ================================================
CREATE OR REPLACE FUNCTION get_user_by_alias(user_alias TEXT)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    alias VARCHAR,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.full_name,
        up.alias,
        up.profile_picture_url,
        up.created_at
    FROM public.user_profile up
    WHERE up.alias = user_alias
    AND up.is_active = TRUE;
END;
$$;

-- ================================================
-- 10. FUNCTION TO LOG API USAGE
-- ================================================
CREATE OR REPLACE FUNCTION log_api_usage(
    user_id UUID,
    provider TEXT,
    endpoint_name TEXT,
    tokens INTEGER DEFAULT NULL,
    cost DECIMAL DEFAULT NULL,
    request_data JSONB DEFAULT NULL,
    response_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.api_usage_logs (
        user_profile_id,
        api_provider,
        endpoint,
        tokens_used,
        cost_usd,
        request_data,
        response_data,
        created_at
    ) VALUES (
        user_id,
        provider,
        endpoint_name,
        tokens,
        cost,
        request_data,
        response_data,
        NOW()
    );
END;
$$;