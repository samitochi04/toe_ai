# TOE AI Frontend Architecture

## Overview
Modern React frontend for TOE AI (TopOneEmployee AI Interview Application) built with React 18, Vite, and Tailwind CSS.

## Tech Stack
- **Framework**: React 18 (JSX, no TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM v6
- **Internationalization**: React i18next
- **Authentication**: JWT + Supabase Auth
- **UI Components**: Headless UI + Custom Components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **Date/Time**: Date-fns
- **Audio/Media**: React Player, React Audio Player
- **Dev Tools**: ESLint, Prettier

## Color Palette
```css
/* Primary Colors */
--dark-primary: #0b090a
--light-dark-secondary: #161a1d
--white-primary: #ffffff
--white-secondary: #f5f3f4
--blue: #29343e
--blue-2nd: #0466c8

/* Semantic Colors */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

## File Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo192.png
│   ├── logo512.png
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Layout.jsx
│   │   ├── auth/
│   │   │   ├── SignInModal.jsx
│   │   │   ├── SignUpModal.jsx
│   │   │   ├── GoogleAuthButton.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── navigation/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── LanguageSelector.jsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatHistory.jsx
│   │   │   └── VoiceRecorder.jsx
│   │   ├── interview/
│   │   │   ├── InterviewInterface.jsx
│   │   │   ├── VideoRecorder.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── InterviewSettings.jsx
│   │   │   └── InterviewHistory.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── UsageChart.jsx
│   │   │   ├── RecentChats.jsx
│   │   │   └── QuickActions.jsx
│   │   ├── profile/
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── SubscriptionCard.jsx
│   │   │   ├── BillingHistory.jsx
│   │   │   └── AccountSettings.jsx
│   │   └── landing/
│   │       ├── Hero.jsx
│   │       ├── Features.jsx
│   │       ├── Pricing.jsx
│   │       └── Testimonials.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── InterviewPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── BillingPage.jsx
│   │   ├── SharedChatPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useChat.js
│   │   ├── useInterview.js
│   │   ├── useAudio.js
│   │   ├── useSubscription.js
│   │   ├── useLocalStorage.js
│   │   └── useTranslation.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── chatStore.js
│   │   ├── interviewStore.js
│   │   ├── userStore.js
│   │   └── settingsStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── interview.js
│   │   ├── user.js
│   │   ├── payments.js
│   │   └── upload.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── validation.js
│   │   ├── formatters.js
│   │   └── storage.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── animations.css
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── fr/
│   │       └── translation.json
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── sounds/
│   ├── App.jsx
│   ├── main.jsx
│   └── i18n.js
├── .env.example
├── .env.local
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Core Features

### 1. Authentication System
- **Email/Password Registration & Login**
- **Google OAuth Integration**
- **JWT Token Management**
- **Password Reset Functionality**
- **Account Verification**
- **Persistent Login State**

### 2. User Dashboard
- **Usage Statistics & Analytics**
- **Chat & Interview History**
- **Subscription Status**
- **Quick Action Buttons**
- **Recent Activity Feed**
- **Account Overview**

### 3. Normal Chat Interface
- **Real-time Chat with AI (GPT-3.5-turbo)**
- **Message History**
- **Chat Session Management**
- **Export Chat to PDF**
- **Share Chat via Alias**
- **Search Chat History**

### 4. Interview Chat Interface
- **AI-Powered Interview Simulation**
- **Voice-to-Voice Communication**
- **Speech-to-Text (Whisper API)**
- **Text-to-Speech (OpenAI TTS)**
- **Video Recording Capability**
- **Customizable Interview Settings**
- **Interview Performance Analytics**
- **Export Interview Reports**

### 5. User Profile Management
- **Profile Information Editing**
- **Profile Picture Upload**
- **Account Settings**
- **Privacy Controls**
- **Notification Preferences**
- **Account Deletion**

### 6. Subscription & Billing
- **Free & Premium Tier Management**
- **Stripe Payment Integration**
- **Subscription Upgrade/Downgrade**
- **Billing History**
- **Usage Limits Tracking**
- **Payment Method Management**

### 7. Content Sharing
- **Share Chats via Unique Aliases**
- **Public/Private Share Settings**
- **Expiration Date Control**
- **View Shared Content**
- **Share Analytics**

### 8. Audio & Media Features
- **Voice Recording**
- **Audio Playback Controls**
- **Multiple Audio Format Support**
- **Voice Speed Controls**
- **Audio Quality Settings**

### 9. Internationalization
- **English & French Language Support**
- **Auto Language Detection**
- **RTL Support Ready**
- **Dynamic Language Switching**
- **Localized Date/Time Formats**

### 10. Responsive Design
- **Mobile-First Approach**
- **Tablet Optimization**
- **Desktop Experience**
- **Touch-Friendly Interface**
- **Accessibility Compliance**

## API Integration

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `PUT /api/v1/auth/password` - Update password

### Chat Endpoints
- `GET /api/v1/chats/normal` - Get normal chats
- `POST /api/v1/chats/normal` - Create normal chat
- `GET /api/v1/chats/normal/{id}` - Get specific chat
- `PUT /api/v1/chats/normal/{id}` - Update chat
- `DELETE /api/v1/chats/normal/{id}` - Delete chat

### Interview Endpoints
- `GET /api/v1/chats/interview` - Get interview chats
- `POST /api/v1/chats/interview` - Create interview chat
- `GET /api/v1/chats/interview/{id}` - Get specific interview
- `PUT /api/v1/chats/interview/{id}` - Update interview

### AI Services Endpoints
- `POST /api/v1/ai/chat/completion` - AI chat completion
- `POST /api/v1/ai/interview/chat` - AI interview chat
- `POST /api/v1/ai/speech-to-text` - STT conversion
- `POST /api/v1/ai/text-to-speech` - TTS conversion

### User Endpoints
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/stats` - Get user statistics
- `POST /api/v1/users/profile/picture` - Upload profile picture

### Payment Endpoints
- `POST /api/v1/payments/create-checkout-session` - Create Stripe session
- `GET /api/v1/payments/subscription-status` - Get subscription status
- `POST /api/v1/payments/cancel-subscription` - Cancel subscription

## Deployment Strategy
- **Build Tool**: Vite for fast development and optimized production builds
- **Environment**: Supports development, staging, and production environments
- **Assets**: Optimized images and lazy loading
- **PWA Ready**: Service worker support for offline functionality
- **SEO Optimized**: Meta tags and structured data
- **Performance**: Code splitting and bundle optimization

## Security Features
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: Token-based request validation
- **Secure Storage**: Encrypted local storage for sensitive data
- **API Security**: JWT token validation and refresh
- **Content Security**: Image upload validation and restrictions