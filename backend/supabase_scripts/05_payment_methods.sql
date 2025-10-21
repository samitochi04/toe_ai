-- ================================================
-- PAYMENT METHODS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    card_brand VARCHAR(50) NOT NULL, -- visa, mastercard, amex, etc.
    card_last4 VARCHAR(4) NOT NULL,
    card_exp_month INTEGER NOT NULL,
    card_exp_year INTEGER NOT NULL,
    cardholder_name VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON public.payment_methods(stripe_payment_method_id);

-- RLS Policies
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment methods
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
    FOR SELECT
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods
    FOR INSERT
    WITH CHECK (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods" ON public.payment_methods
    FOR UPDATE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
    FOR DELETE
    USING (
        user_profile_id IN (
            SELECT id FROM public.user_profile WHERE auth_user_id = auth.uid()
        )
    );

-- Service role can do everything
CREATE POLICY "Service role can manage payment methods" ON public.payment_methods
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION set_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Unset other default payment methods for this user
        UPDATE public.payment_methods
        SET is_default = FALSE
        WHERE user_profile_id = NEW.user_profile_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single default payment method
DROP TRIGGER IF EXISTS ensure_single_default_payment_method ON public.payment_methods;
CREATE TRIGGER ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION set_default_payment_method();

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
