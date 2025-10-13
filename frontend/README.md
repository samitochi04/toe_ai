# TOE AI Frontend - React Application

## Overview
Modern React frontend for TOE AI (TopOneEmployee AI Interview Application) built with Vite, Tailwind CSS, and modern web technologies.

## Tech Stack
- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v3** - Utility-first CSS framework
- **Zustand** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React i18next** - Internationalization
- **Framer Motion** - Animations
- **React Hook Form** - Form handling

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Features
- 🎤 **AI Interview Simulation** - Voice-to-voice interview practice
- 💬 **Smart Chat** - AI-powered conversation practice
- 🔊 **Speech Recognition** - Real-time speech-to-text
- 🎯 **Personalized Feedback** - AI-driven interview analysis
- 📱 **Responsive Design** - Mobile-first approach
- 🌍 **Multi-language** - English and French support
- 💳 **Subscription Management** - Stripe integration
- 📤 **Content Sharing** - Share interviews and chats
- 📊 **Analytics Dashboard** - Usage statistics and insights

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── store/         # Zustand stores
├── services/      # API services
├── utils/         # Utility functions
├── styles/        # Global styles
├── locales/       # Translation files
└── assets/        # Static assets
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License
MIT License - see LICENSE file for details