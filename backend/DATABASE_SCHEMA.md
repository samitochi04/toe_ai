# Database Schema Documentation
# TOE AI - TopOneEmployee AI Interview Application

## Tables and Attributes

### 1. user_profile
- **id** (UUID, Primary Key) - Unique identifier for user profile
- **auth_user_id** (UUID, Foreign Key to auth.users) - Reference to Supabase auth user
- **email** (VARCHAR(255), Unique, NOT NULL) - User's email address
- **full_name** (VARCHAR(255), NOT NULL) - User's full name
- **alias** (VARCHAR(255), Unique, NOT NULL) - Auto-generated alias (username@year-of-account-created)
- **profile_picture_url** (TEXT) - URL to user's profile picture
- **bio** (TEXT) - User's biography/description
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Account creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **is_active** (BOOLEAN, DEFAULT TRUE) - Whether the account is active

### 2. admin
- **id** (UUID, Primary Key) - Unique identifier for admin record
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to admin user profile
- **role** (VARCHAR(50), DEFAULT 'admin') - Admin role type
- **permissions** (JSONB, DEFAULT '{}') - Admin permissions as JSON object
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Admin creation timestamp
- **created_by** (UUID, Foreign Key to user_profile) - Who created this admin
- **is_active** (BOOLEAN, DEFAULT TRUE) - Whether admin status is active

### 3. subscription_tiers
- **id** (UUID, Primary Key) - Unique identifier for subscription tier
- **name** (VARCHAR(100), NOT NULL) - Tier name (Free, Premium)
- **price_monthly** (DECIMAL(10,2), DEFAULT 0) - Monthly price in EUR
- **interview_chat_limit** (INTEGER, DEFAULT 5) - Max interview chats per month
- **normal_chat_limit** (INTEGER, DEFAULT 10) - Max normal chats per month
- **features** (JSONB, DEFAULT '{}') - Available features as JSON object
- **is_active** (BOOLEAN, DEFAULT TRUE) - Whether tier is available
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp

### 4. user_subscriptions
- **id** (UUID, Primary Key) - Unique identifier for user subscription
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to user
- **tier_id** (UUID, Foreign Key to subscription_tiers) - Reference to subscription tier
- **stripe_customer_id** (VARCHAR(255)) - Stripe customer identifier
- **stripe_subscription_id** (VARCHAR(255)) - Stripe subscription identifier
- **status** (VARCHAR(50), DEFAULT 'free') - Subscription status (free, active, cancelled, past_due)
- **current_period_start** (TIMESTAMPTZ) - Current billing period start
- **current_period_end** (TIMESTAMPTZ) - Current billing period end
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Subscription creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### 5. usage_tracking
- **id** (UUID, Primary Key) - Unique identifier for usage record
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to user
- **interview_chats_used** (INTEGER, DEFAULT 0) - Number of interview chats used this period
- **normal_chats_used** (INTEGER, DEFAULT 0) - Number of normal chats used this period
- **reset_date** (TIMESTAMPTZ, DEFAULT NOW()) - When usage counter was last reset
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Record creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### 6. normal_chat
- **id** (UUID, Primary Key) - Unique identifier for normal chat
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to chat owner
- **title** (VARCHAR(255), NOT NULL) - Chat title/name
- **conversation** (JSONB, DEFAULT '[]') - Array of chat messages as JSON
- **is_shared** (BOOLEAN, DEFAULT FALSE) - Whether chat is shared with others
- **shared_at** (TIMESTAMPTZ) - When chat was first shared
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Chat creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### 7. interview_chat
- **id** (UUID, Primary Key) - Unique identifier for interview chat
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to chat owner
- **title** (VARCHAR(255), NOT NULL) - Interview chat title/name
- **job_position** (VARCHAR(255)) - Target job position for interview
- **company_name** (VARCHAR(255)) - Target company name
- **conversation** (JSONB, DEFAULT '[]') - Array of chat messages with audio URLs
- **interview_settings** (JSONB, DEFAULT '{}') - Interview configuration settings
- **duration_minutes** (INTEGER, DEFAULT 0) - Total interview duration
- **is_shared** (BOOLEAN, DEFAULT FALSE) - Whether interview is shared
- **shared_at** (TIMESTAMPTZ) - When interview was first shared
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Interview creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### 8. shared_chat
- **id** (UUID, Primary Key) - Unique identifier for shared chat record
- **chat_id** (UUID, NOT NULL) - Reference to normal_chat.id or interview_chat.id
- **chat_type** (VARCHAR(20), NOT NULL) - Type of chat ('normal' or 'interview')
- **owner_user_id** (UUID, Foreign Key to user_profile) - Reference to chat owner
- **shared_with_alias** (VARCHAR(255)) - Specific user alias to share with (optional)
- **share_token** (UUID, DEFAULT uuid_generate_v4()) - Unique token for secure sharing
- **is_public** (BOOLEAN, DEFAULT FALSE) - Whether chat is publicly accessible
- **view_count** (INTEGER, DEFAULT 0) - Number of times chat has been viewed
- **expires_at** (TIMESTAMPTZ) - When share link expires (optional)
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Share creation timestamp

### 9. stripe_payments
- **id** (UUID, Primary Key) - Unique identifier for payment record
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to paying user
- **stripe_payment_intent_id** (VARCHAR(255), Unique) - Stripe payment intent ID
- **stripe_customer_id** (VARCHAR(255)) - Stripe customer identifier
- **amount** (DECIMAL(10,2), NOT NULL) - Payment amount in EUR
- **currency** (VARCHAR(3), DEFAULT 'EUR') - Payment currency
- **status** (VARCHAR(50)) - Payment status from Stripe
- **payment_method_types** (JSONB, DEFAULT '[]') - Accepted payment methods
- **description** (TEXT) - Payment description
- **metadata** (JSONB, DEFAULT '{}') - Additional payment metadata
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Payment record creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### 10. audio_files
- **id** (UUID, Primary Key) - Unique identifier for audio file record
- **chat_id** (UUID, NOT NULL) - Reference to interview_chat.id
- **message_index** (INTEGER, NOT NULL) - Position in conversation array
- **file_type** (VARCHAR(10)) - Type of audio file ('tts' or 'stt')
- **file_url** (TEXT, NOT NULL) - URL/path to audio file
- **file_size_bytes** (INTEGER) - File size in bytes
- **duration_seconds** (DECIMAL(5,2)) - Audio duration in seconds
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - File record creation timestamp

### 11. api_usage_logs
- **id** (UUID, Primary Key) - Unique identifier for API usage log
- **user_profile_id** (UUID, Foreign Key to user_profile) - Reference to user
- **api_provider** (VARCHAR(50), NOT NULL) - API provider name (openai, whisper, coqui)
- **endpoint** (VARCHAR(100)) - Specific API endpoint used
- **tokens_used** (INTEGER) - Number of tokens consumed
- **cost_usd** (DECIMAL(10,6)) - Cost in USD
- **request_data** (JSONB) - Request payload (for debugging)
- **response_data** (JSONB) - Response data (for debugging)
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Log creation timestamp

### 12. system_settings
- **id** (UUID, Primary Key) - Unique identifier for system setting
- **setting_key** (VARCHAR(100), Unique, NOT NULL) - Setting key/name
- **setting_value** (JSONB, NOT NULL) - Setting value as JSON
- **description** (TEXT) - Setting description
- **is_public** (BOOLEAN, DEFAULT FALSE) - Whether setting is publicly accessible
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Setting creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

## Relationships

### Primary Relationships
- **user_profile** ↔ **auth.users** (One-to-One via auth_user_id)
- **user_profile** → **admin** (One-to-Many)
- **user_profile** → **user_subscriptions** (One-to-Many)
- **user_profile** → **usage_tracking** (One-to-Many)
- **user_profile** → **normal_chat** (One-to-Many)
- **user_profile** → **interview_chat** (One-to-Many)
- **user_profile** → **shared_chat** (One-to-Many as owner)
- **user_profile** → **stripe_payments** (One-to-Many)
- **user_profile** → **api_usage_logs** (One-to-Many)

### Subscription Relationships
- **subscription_tiers** → **user_subscriptions** (One-to-Many)

### Chat Relationships
- **normal_chat** → **shared_chat** (One-to-Many via chat_id)
- **interview_chat** → **shared_chat** (One-to-Many via chat_id)
- **interview_chat** → **audio_files** (One-to-Many)

## Indexes

### Performance Indexes
- **user_profile**: auth_user_id, email, alias
- **normal_chat**: user_profile_id, created_at (DESC)
- **interview_chat**: user_profile_id, created_at (DESC)
- **shared_chat**: share_token, owner_user_id
- **user_subscriptions**: user_profile_id, stripe_customer_id
- **usage_tracking**: user_profile_id
- **audio_files**: chat_id
- **api_usage_logs**: user_profile_id, created_at (DESC)

## Triggers and Functions

### Automatic Functions
- **generate_user_alias()** - Generates unique alias for new users
- **handle_new_user()** - Creates user profile when auth user is created
- **update_updated_at_column()** - Updates timestamp on record changes
- **check_usage_limit()** - Validates if user can create new chats
- **increment_usage_count()** - Increments user usage counters
- **reset_monthly_usage()** - Resets usage counters monthly
- **get_user_by_alias()** - Retrieves user by alias
- **log_api_usage()** - Logs API usage for billing/monitoring

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies to ensure:
- Users can only access their own data
- Shared content is accessible based on sharing settings
- Admin users have elevated access
- Service role has full access for system operations