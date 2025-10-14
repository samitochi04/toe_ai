-- ================================================
-- CREATE USAGE INCREMENT RPC FUNCTION
-- ================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_usage_count(UUID, TEXT);

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
    user_id UUID,
    chat_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_usage_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage_count(UUID, TEXT) TO service_role;
