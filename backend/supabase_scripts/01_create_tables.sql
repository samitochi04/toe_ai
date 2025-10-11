-- ================================================
-- TOE AI Database Schema
-- Database Setup for TopOneEmployee AI Interview App
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. USER PROFILE TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    alias VARCHAR(255) UNIQUE NOT NULL, -- format: username@year-of-account-created
    profile_picture_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ================================================
-- 2. ADMIN TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profile(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- ================================================
-- 3. SUBSCRIPTION TIERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    interview_chat_limit INTEGER DEFAULT 5,
    normal_chat_limit INTEGER DEFAULT 10,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. USER SUBSCRIPTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES public.subscription_tiers(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'free', -- free, active, cancelled, past_due
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. USAGE TRACKING TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    interview_chats_used INTEGER DEFAULT 0,
    normal_chats_used INTEGER DEFAULT 0,
    reset_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 6. NORMAL CHAT TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.normal_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    conversation JSONB DEFAULT '[]', -- Array of messages with role, content, timestamp
    is_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 7. INTERVIEW CHAT TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.interview_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    job_position VARCHAR(255),
    company_name VARCHAR(255),
    conversation JSONB DEFAULT '[]', -- Array of messages with role, content, timestamp, audio_url
    interview_settings JSONB DEFAULT '{}', -- voice settings, language, etc.
    duration_minutes INTEGER DEFAULT 0,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 8. SHARED CHAT TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.shared_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL, -- references either normal_chat.id or interview_chat.id
    chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('normal', 'interview')),
    owner_user_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    shared_with_alias VARCHAR(255), -- can be null for public sharing
    share_token UUID DEFAULT uuid_generate_v4(), -- for secure sharing
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 9. STRIPE PAYMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.stripe_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50), -- succeeded, requires_payment_method, requires_confirmation, etc.
    payment_method_types JSONB DEFAULT '[]',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 10. AUDIO FILES TABLE (for TTS/STT)
-- ================================================
CREATE TABLE IF NOT EXISTS public.audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL, -- references interview_chat.id
    message_index INTEGER NOT NULL, -- position in conversation array
    file_type VARCHAR(10) CHECK (file_type IN ('tts', 'stt')), -- text-to-speech or speech-to-text
    file_url TEXT NOT NULL,
    file_size_bytes INTEGER,
    duration_seconds DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 11. API USAGE LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    api_provider VARCHAR(50) NOT NULL, -- openai, whisper, coqui
    endpoint VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 12. SYSTEM SETTINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_auth_user_id ON public.user_profile(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON public.user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_alias ON public.user_profile(alias);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_normal_chat_user_id ON public.normal_chat(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_normal_chat_created_at ON public.normal_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_chat_user_id ON public.interview_chat(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_interview_chat_created_at ON public.interview_chat(created_at DESC);

-- Shared chat indexes
CREATE INDEX IF NOT EXISTS idx_shared_chat_token ON public.shared_chat(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_chat_owner ON public.shared_chat(owner_user_id);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_profile_id);

-- Audio files indexes
CREATE INDEX IF NOT EXISTS idx_audio_files_chat_id ON public.audio_files(chat_id);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage_logs(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage_logs(created_at DESC);