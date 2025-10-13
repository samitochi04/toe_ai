// Application constants
export const APP_NAME = 'TOE AI'
export const APP_DESCRIPTION = "Don't Bet Your Interview, Train With Us"

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Feature Flags
export const FEATURES = {
  GOOGLE_AUTH: import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true',
  STRIPE_PAYMENTS: import.meta.env.VITE_ENABLE_STRIPE_PAYMENTS === 'true',
  VOICE_FEATURES: import.meta.env.VITE_ENABLE_VOICE_FEATURES === 'true',
  VIDEO_RECORDING: import.meta.env.VITE_ENABLE_VIDEO_RECORDING === 'true',
}

// Chat Configuration
export const CHAT_LIMITS = {
  FREE_NORMAL_CHATS: 10,
  FREE_INTERVIEW_CHATS: 5,
  PREMIUM_NORMAL_CHATS: 999999,
  PREMIUM_INTERVIEW_CHATS: 999999,
}

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  ALLOWED_AUDIO_FORMATS: ['mp3', 'wav', 'm4a', 'webm', 'ogg'],
  ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
}

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  INTERVIEW: '/interview',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  BILLING: '/billing',
  SHARED_CHAT: '/shared',
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
  PREFERENCES: 'preferences',
}

// Color Palette (for JavaScript usage)
export const COLORS = {
  DARK_PRIMARY: '#0b090a',
  LIGHT_DARK_SECONDARY: '#161a1d',
  WHITE_PRIMARY: '#ffffff',
  WHITE_SECONDARY: '#f5f3f4',
  BLUE: '#29343e',
  BLUE_2ND: '#0466c8',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
}

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
}

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  XS: 475,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
  '3XL': 1680,
}

// Interview Settings
export const INTERVIEW_SETTINGS = {
  VOICES: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  DIFFICULTIES: ['easy', 'medium', 'hard'],
  LANGUAGES: ['en', 'fr'],
  MAX_DURATION: 120, // minutes
  MIN_DURATION: 5,   // minutes
}

// Audio Settings
export const AUDIO_SETTINGS = {
  SAMPLE_RATE: 44100,
  BIT_DEPTH: 16,
  CHANNELS: 1, // mono
  FORMAT: 'wav',
}

export default {
  APP_NAME,
  APP_DESCRIPTION,
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GOOGLE_CLIENT_ID,
  STRIPE_PUBLISHABLE_KEY,
  FEATURES,
  CHAT_LIMITS,
  UPLOAD_LIMITS,
  ROUTES,
  STORAGE_KEYS,
  COLORS,
  ANIMATIONS,
  BREAKPOINTS,
  INTERVIEW_SETTINGS,
  AUDIO_SETTINGS,
}