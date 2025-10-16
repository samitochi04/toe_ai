# TOE AI - TopOneEmployee AI Interview Application

TOE AI is a comprehensive web application designed to help job seekers prepare for interviews using artificial intelligence. The application provides both normal chat functionality and specialized interview simulation with voice interaction capabilities.

## 🚀 Features

### Core Features
- **User Authentication**: Sign up, log in, log out with email/password and Google OAuth
- **Profile Management**: Complete CRUD operations for user profiles with auto-generated aliases
- **Normal Chat**: AI-powered chat conversations for general interview preparation
- **Interview Chat**: Specialized interview simulations with job position and company context
- **Voice Integration**: Speech-to-text (Whisper) and text-to-speech (OpenAI TTS) capabilities
- **Chat Sharing**: Share conversations with other users using aliases or public links
- **PDF Export**: Export interview conversations to PDF format
- **Premium Subscription**: Stripe-integrated payment system with usage limits

### AI Services
- **OpenAI GPT Integration**: Intelligent responses for both normal and interview chats
- **Whisper STT**: Convert speech to text for voice interactions
- **OpenAI TTS**: Convert text to speech with multiple voice options
- **Coqui TTS**: Alternative text-to-speech option (implemented but optional)

### Business Features
- **Usage Tracking**: Monitor user consumption with monthly limits
- **Subscription Tiers**: Free (5 interview + 10 normal chats) and Premium (unlimited)
- **Payment Processing**: Complete Stripe integration with webhooks
- **Admin Dashboard**: System statistics and user management
- **API Usage Logging**: Track costs and usage for billing purposes

## 🏗️ Architecture

### Tech Stack
- **Backend**: Python 3.11+ with FastAPI
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Payment Processing**: Stripe
- **AI Services**: OpenAI API (GPT, Whisper, TTS)
- **File Storage**: Local file system (static files)
- **PDF Generation**: ReportLab

### Project Structure
```
backend/
├── main.py                     # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment configuration template
├── .gitignore                 # Git ignore rules
├── DATABASE_SCHEMA.md         # Database documentation
├── app/
│   ├── core/
│   │   ├── config.py          # Application configuration
│   │   ├── database.py        # Database connection and utilities
│   │   └── auth.py            # Authentication utilities
│   ├── models/
│   │   ├── user.py            # User-related Pydantic models
│   │   └── chat.py            # Chat-related Pydantic models
│   ├── api/
│   │   ├── main.py            # API router configuration
│   │   └── routes/
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── users.py       # User profile endpoints
│   │       ├── chats.py       # Chat management endpoints
│   │       ├── ai.py          # AI service endpoints
│   │       ├── sharing.py     # Chat sharing endpoints
│   │       ├── payments.py    # Stripe payment endpoints
│   │       └── admin.py       # Admin dashboard endpoints
│   └── utils/
│       └── pdf_export.py      # PDF generation utilities
├── supabase_scripts/
│   ├── 01_create_tables.sql   # Database table creation
│   ├── 02_functions_triggers.sql # Database functions and triggers
│   ├── 03_rls_policies.sql    # Row Level Security policies
│   └── 04_initial_data.sql    # Initial data and settings
└── static/
    └── uploads/               # User uploaded files (created automatically)
        ├── audio/             # Audio files (TTS/STT)
        ├── images/            # Profile pictures
        ├── pdfs/              # Generated PDF exports
        └── temp/              # Temporary files
```

## 🗄️ Database Schema

### Core Tables
- **user_profile**: User account information and profiles
- **admin**: Admin user management
- **subscription_tiers**: Available subscription plans
- **user_subscriptions**: User subscription tracking
- **usage_tracking**: Monthly usage limits tracking
- **normal_chat**: Regular AI chat conversations
- **interview_chat**: Interview-specific chat sessions
- **shared_chat**: Chat sharing management
- **stripe_payments**: Payment transaction records
- **audio_files**: Audio file metadata for interviews
- **api_usage_logs**: API usage tracking for billing
- **system_settings**: Application configuration

### Key Features
- **Automatic user profile creation** via database triggers
- **Usage limit enforcement** with database functions
- **Row Level Security (RLS)** for data protection
- **Comprehensive indexing** for performance
- **Auto-generated aliases** in format `username@year`

## 🚀 Getting Started

### Prerequisites
- Python 3.11 or higher
- Supabase account and project
- OpenAI API key
- Stripe account (for payments)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd toe_ai/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your actual configuration values
```

5. **Database setup**
- Run the SQL scripts in `supabase_scripts/` in order:
  1. `01_create_tables.sql`
  2. `02_functions_triggers.sql`
  3. `03_rls_policies.sql`
  4. `04_initial_data.sql`

6. **Start the application**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## 🔧 Configuration

### Environment Variables

#### Required Configuration
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID_PREMIUM=price_your-premium-price-id

# Security
SECRET_KEY=your-super-secret-key-for-jwt-signing
```

#### Optional Configuration
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis
REDIS_URL=redis://localhost:6379/0

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Stripe Webhook Setup
1. Create webhook endpoint in Stripe Dashboard
2. Point to `https://yourdomain.com/api/v1/payments/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/logout` - User logout
- `PUT /api/v1/auth/password` - Update password
- `GET /api/v1/auth/me` - Get current user info

### User Profile Endpoints
- `GET /api/v1/users/profile` - Get user profile with usage info
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/profile/picture` - Upload profile picture
- `GET /api/v1/users/stats` - Get user statistics
- `GET /api/v1/users/search` - Search users for sharing

### Chat Endpoints
- `GET /api/v1/chats/normal` - List normal chats
- `POST /api/v1/chats/normal` - Create normal chat
- `GET /api/v1/chats/normal/{id}` - Get specific normal chat
- `PUT /api/v1/chats/normal/{id}` - Update normal chat
- `DELETE /api/v1/chats/normal/{id}` - Delete normal chat
- `GET /api/v1/chats/interview` - List interview chats
- `POST /api/v1/chats/interview` - Create interview chat
- `POST /api/v1/chats/export-pdf` - Export chat to PDF

### AI Service Endpoints
- `POST /api/v1/ai/chat/completion` - Get AI response for normal chat
- `POST /api/v1/ai/interview/chat` - Get AI response for interview
- `POST /api/v1/ai/speech-to-text` - Convert audio to text
- `POST /api/v1/ai/text-to-speech` - Convert text to audio
- `POST /api/v1/ai/audio-chat` - Complete audio workflow (STT + Chat + TTS)

### Sharing Endpoints
- `POST /api/v1/sharing/create` - Create shared chat link
- `GET /api/v1/sharing/my-shares` - Get user's shared chats
- `GET /api/v1/sharing/token/{token}` - Access shared chat by token
- `GET /api/v1/sharing/shared-with-me` - Get chats shared with user

### Payment Endpoints
- `POST /api/v1/payments/create-checkout-session` - Create Stripe checkout
- `GET /api/v1/payments/subscription-status` - Get subscription status
- `POST /api/v1/payments/cancel-subscription` - Cancel subscription
- `GET /api/v1/payments/payment-history` - Get payment history
- `POST /api/v1/payments/webhook` - Stripe webhook handler

### Admin Endpoints
- `GET /api/v1/admin/stats` - Get system statistics
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/system-settings` - Get system settings
- `PUT /api/v1/admin/system-settings/{key}` - Update system setting
- `GET /api/v1/admin/api-usage` - Get API usage statistics

## 💳 Subscription Model

### Free Tier
- 5 interview chats per month
- 10 normal chats per month
- Basic features only
- No PDF export
- Limited sharing

### Premium Tier (€5/month)
- Unlimited interview chats
- Unlimited normal chats
- PDF export functionality
- Unlimited sharing
- Priority support
- Advanced analytics
- Custom interview settings

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Google OAuth integration
- Row Level Security (RLS) in database
- User role-based access control
- Secure password hashing with bcrypt

### Data Protection
- All user data isolated by RLS policies
- Encrypted API keys and secrets
- Secure file upload with validation
- CORS protection
- Rate limiting (configurable)

### API Security
- Input validation with Pydantic models
- SQL injection prevention
- File type and size validation
- Webhook signature verification (Stripe)

## 📊 Monitoring & Analytics

### Usage Tracking
- API call logging with costs
- User activity monitoring
- Subscription usage tracking
- Performance metrics

### Admin Dashboard
- User statistics
- Revenue tracking
- System health monitoring
- API usage analytics

## 🚀 Deployment

### Production Checklist
1. Set `ENVIRONMENT=production` in .env
2. Use strong `SECRET_KEY`
3. Configure HTTPS
4. Set up proper CORS origins
5. Configure Stripe webhook with production URL
6. Set up monitoring and logging
7. Configure backup strategy
8. Set up SSL certificates

### Environment Variables for Production
```env
ENVIRONMENT=production
DEBUG=False
ALLOWED_ORIGINS=["https://yourdomain.com"]
SUPABASE_URL=https://your-prod-project.supabase.co
# ... other production values
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
1. **Database connection issues**: Verify Supabase credentials
2. **OpenAI API errors**: Check API key and usage limits
3. **Stripe webhook issues**: Verify webhook secret and endpoint URL
4. **File upload issues**: Check upload directory permissions

### Getting Help
- Check the API documentation at `/docs`
- Review database schema in `DATABASE_SCHEMA.md`
- Check logs for detailed error messages
- Verify environment configuration

## 🔄 API Response Formats

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "detail": "Error description",
  "status": "error"
}
```

### Pagination Response
```json
{
  "items": [ /* paginated items */ ],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "has_next": true,
  "has_prev": false
}
```

## 🚢 Deployment

### Quick Deployment with Docker

TOE AI is fully containerized and ready for deployment with Docker Compose.

#### Production Deployment
```bash
# Clone the repository
git clone https://github.com/yourusername/toe_ai.git
cd toe_ai

# Configure environment variables
cp .env.production .env
# Edit .env with your production values

# Deploy with Docker Compose
chmod +x deploy.sh
./deploy.sh deploy
```

#### Coolify Deployment (Recommended)
1. Install Coolify on your VPS
2. Create a new project from this repository
3. Configure environment variables in Coolify dashboard
4. Deploy with one click

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Environment Configuration
Key environment variables for production:
- `SECRET_KEY`: Secure random key for JWT tokens
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Database connection
- `OPENAI_API_KEY`: AI services
- `STRIPE_SECRET_KEY`: Payment processing
- `ALLOWED_ORIGINS`: Frontend domain for CORS

### Infrastructure Requirements
- **Server**: Linux VPS with 2GB+ RAM
- **Docker**: 20.10+ with Docker Compose
- **Ports**: 80 (frontend), 8000 (backend), 443 (SSL)
- **Storage**: 20GB+ for application and uploads

---

**TOE AI** - Empowering job seekers with AI-powered interview preparation. Built with ❤️ using FastAPI, React, Supabase, and OpenAI.

Ready to deploy? Check out our [comprehensive deployment guide](DEPLOYMENT.md)!
