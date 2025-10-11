-- ================================================
-- TOE AI Initial Data Setup
-- ================================================

-- ================================================
-- INSERT DEFAULT SUBSCRIPTION TIERS
-- ================================================
-- Insert Free tier if it doesn't exist
INSERT INTO public.subscription_tiers (name, price_monthly, interview_chat_limit, normal_chat_limit, features, is_active)
SELECT 'Free', 0.00, 5, 10, 
    '{
        "pdf_export": false,
        "unlimited_sharing": false,
        "priority_support": false,
        "advanced_analytics": false,
        "custom_interview_settings": false
    }'::jsonb, 
    true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'Free');

-- Insert Premium tier if it doesn't exist
INSERT INTO public.subscription_tiers (name, price_monthly, interview_chat_limit, normal_chat_limit, features, is_active)
SELECT 'Premium', 5.00, 999999, 999999,
    '{
        "pdf_export": true,
        "unlimited_sharing": true,
        "priority_support": true,
        "advanced_analytics": true,
        "custom_interview_settings": true,
        "ai_feedback": true,
        "interview_history": true
    }'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'Premium');

-- ================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ================================================
-- Insert system settings individually to avoid conflicts

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'app_version', '"1.0.0"'::jsonb, 'Current application version', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'app_version');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'maintenance_mode', 'false'::jsonb, 'Whether the app is in maintenance mode', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'maintenance_mode');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'openai_model', '"gpt-3.5-turbo"'::jsonb, 'Default OpenAI model for chat', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'openai_model');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'whisper_model', '"whisper-1"'::jsonb, 'Whisper model for speech-to-text', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'whisper_model');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'max_chat_duration_minutes', '60'::jsonb, 'Maximum duration for interview chats in minutes', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'max_chat_duration_minutes');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'max_file_size_mb', '25'::jsonb, 'Maximum file size for audio uploads in MB', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'max_file_size_mb');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'supported_audio_formats', '["mp3", "wav", "m4a", "webm"]'::jsonb, 'Supported audio file formats', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'supported_audio_formats');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'default_interview_settings', '{
    "voice_speed": 1.0,
    "voice_type": "alloy", 
    "language": "en",
    "difficulty": "medium",
    "interview_type": "general"
}'::jsonb, 'Default settings for interview chats', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'default_interview_settings');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'rate_limits', '{
    "requests_per_minute": 60,
    "tokens_per_day": 10000,
    "audio_minutes_per_day": 120
}'::jsonb, 'API rate limits per user', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'rate_limits');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'stripe_webhook_secret', '""'::jsonb, 'Stripe webhook endpoint secret', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'stripe_webhook_secret');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'email_notifications', '{
    "welcome_email": true,
    "usage_warnings": true,
    "payment_confirmations": true,
    "feature_updates": false
}'::jsonb, 'Email notification settings', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'email_notifications');

INSERT INTO public.system_settings (setting_key, setting_value, description, is_public)
SELECT 'feature_flags', '{
    "pdf_export_enabled": true,
    "voice_chat_enabled": true,
    "video_recording_enabled": false,
    "analytics_enabled": true,
    "sharing_enabled": true
}'::jsonb, 'Feature flags for the application', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'feature_flags');

-- ================================================
-- CREATE DEFAULT ADMIN USER (OPTIONAL)
-- ================================================
-- Note: This will need to be updated with actual admin user ID after first admin signs up
-- You can run this separately after creating your first user account

-- INSERT INTO public.admin (user_profile_id, role, permissions, is_active) VALUES
-- (
--     (SELECT id FROM public.user_profile WHERE email = 'admin@toeai.com' LIMIT 1),
--     'super_admin',
--     '{
--         "manage_users": true,
--         "manage_subscriptions": true,
--         "view_analytics": true,
--         "manage_settings": true,
--         "access_logs": true
--     }'::jsonb,
--     true
-- );