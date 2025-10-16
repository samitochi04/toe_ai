# Simple Docker Deployment for TOE AI

## Quick Start

1. **Clone and setup**:
```bash
git clone https://github.com/samitochi04/toe_ai.git
cd toe_ai
```

2. **Configure environment**:
```bash
cp .env.production .env
# Edit .env with your actual values (Supabase, OpenAI, Stripe keys)
```

3. **Deploy**:
```bash
docker-compose up -d
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## Environment Variables

Edit the `.env` file with your real values:

```env
# Required
SECRET_KEY=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key

# Stripe (for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# CORS (add your domain)
ALLOWED_ORIGINS=["http://localhost:3000","https://yourdomain.com"]
```

## Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Ports Used

- Frontend: 3000 (mapped to container port 80)
- Backend: 8001 (mapped to container port 8000)

This avoids conflicts with any services running on port 8000.