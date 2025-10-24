# 🚀 Stripe Live Mode Migration Guide

## Overview
This guide will help you transition your TOE AI application from Stripe test mode to live mode for production use.

## Step 1: Stripe Dashboard Setup (YOU NEED TO DO THIS)

### 1.1 Switch to Live Mode
1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Click the **"Test mode"** toggle in the top-left corner to switch to **"Live mode"**

### 1.2 Get Live API Keys
1. Go to **Developers** → **API keys**
2. Copy your **Live Publishable Key** (starts with `pk_live_`)
3. Copy your **Live Secret Key** (starts with `sk_live_`)

### 1.3 Create Live Products and Prices
1. Go to **Products** → **Add product**
2. Create your Premium subscription product:
   - **Name**: "TOE AI Premium"
   - **Description**: "Premium subscription for TOE AI"
3. Add pricing:
   - **Monthly**: Set your monthly price (e.g., $5.00)
   - **Yearly**: Set your yearly price (e.g., $50.00)
4. Copy the **Price IDs** (they start with `price_`)

### 1.4 Set up Live Webhook Endpoint
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://yourdomain.com/api/v1/payments/webhook`
3. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret** (starts with `whsec_`)

## Step 2: Environment Variables Configuration

### 2.1 Backend Environment Variables (.env)
Create/update your `.env` file in the backend directory:

```bash
# Stripe Live Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
STRIPE_PRICE_ID_PREMIUM=price_your_monthly_price_id_here
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_your_yearly_price_id_here

# CORS Configuration (Update with your production domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Google OAuth (Update with your production domain)
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback/google

# Backend URL (for file serving)
BACKEND_URL=https://yourdomain.com
```

### 2.2 Frontend Environment Variables (.env)
Create/update your `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://yourdomain.com/api/v1

# Stripe Publishable Key (for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
```

## Step 3: Production Deployment Checklist

### 3.1 Domain Configuration
- [ ] Update `ALLOWED_ORIGINS` with your production domain
- [ ] Update `GOOGLE_REDIRECT_URI` with your production domain
- [ ] Update `VITE_API_BASE_URL` with your production API URL
- [ ] Update webhook endpoint URL in Stripe Dashboard

### 3.2 SSL/HTTPS Requirements
- [ ] Ensure your production server has SSL certificate
- [ ] All URLs must use HTTPS in production
- [ ] Stripe requires HTTPS for live mode

### 3.3 Security Considerations
- [ ] Never commit live API keys to version control
- [ ] Use environment variables for all sensitive data
- [ ] Ensure webhook endpoint is secure and accessible
- [ ] Test webhook endpoint with Stripe CLI or dashboard

## Step 4: Testing in Live Mode

### 4.1 Test with Real Cards
1. Use real credit cards for testing
2. Process small amounts initially
3. Refund test transactions after verification

### 4.2 Webhook Testing
1. Use Stripe CLI: `stripe listen --forward-to localhost:8000/api/v1/payments/webhook`
2. Or test via Stripe Dashboard webhook logs

## Step 5: Redirect URLs Explanation

### 5.1 How Redirects Work
1. **User clicks "Subscribe"** → Frontend calls `/payments/create-checkout-session`
2. **Backend creates Stripe session** → Returns checkout URL
3. **User completes payment** → Stripe redirects to success/cancel URLs
4. **Frontend handles redirect** → Shows success/error messages

### 5.2 Current Redirect URLs
- **Success**: `{FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel**: `{FRONTEND_URL}/payment/cancel`

### 5.3 Production URLs
- **Success**: `https://yourdomain.com/payment/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel**: `https://yourdomain.com/payment/cancel`

## Step 6: Environment-Specific Configuration

### 6.1 Development (Local)
```bash
# Backend .env
ALLOWED_ORIGINS=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
BACKEND_URL=http://localhost:8000

# Frontend .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

### 6.2 Production (Server)
```bash
# Backend .env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback/google
BACKEND_URL=https://yourdomain.com

# Frontend .env
VITE_API_BASE_URL=https://yourdomain.com/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
```

## Step 7: Verification Steps

### 7.1 Backend Verification
1. Check logs for "Stripe environment: live"
2. Verify webhook endpoint is accessible
3. Test API endpoints with live keys

### 7.2 Frontend Verification
1. Check browser console for Stripe initialization
2. Test payment flow end-to-end
3. Verify redirect URLs work correctly

### 7.3 Stripe Dashboard Verification
1. Check webhook logs for successful deliveries
2. Verify test transactions appear in live mode
3. Confirm subscription status updates correctly

## Step 8: Rollback Plan

If issues occur, you can temporarily rollback by:
1. Switching back to test keys in environment variables
2. Updating webhook endpoint to test mode
3. Restarting your application

## Important Notes

⚠️ **CRITICAL**: 
- Never use test keys in production
- Never use live keys in development
- Always test with small amounts first
- Keep your live keys secure and never commit them to version control

✅ **BEST PRACTICES**:
- Use environment variables for all configuration
- Test thoroughly before going live
- Monitor webhook deliveries
- Keep backup of working configuration
- Document your production setup

## Support

If you encounter issues:
1. Check Stripe Dashboard logs
2. Check your application logs
3. Verify environment variables
4. Test webhook endpoint accessibility
5. Contact Stripe support if needed

---

**Remember**: This is a one-way transition. Once you go live, make sure everything is working correctly before processing real payments!
