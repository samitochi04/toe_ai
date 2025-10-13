import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import SignInModal from '../components/auth/SignInModal'
import SignUpModal from '../components/auth/SignUpModal'
import LanguageSelector from '../components/navigation/LanguageSelector'

const LandingPage = () => {
  const { t } = useTranslation()
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)

  const handleGoogleAuth = () => {
    setShowSignUp(true)
  }

  return (
    <div className="min-h-screen bg-dark-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-2nd via-transparent to-blue" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="absolute top-0 left-0 w-full z-20">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img 
                src="/src/assets/images/toe_ai_logo.png" 
                alt="TOE AI Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>

            {/* Language Selector */}
            <LanguageSelector />
          </div>
        </header>

        {/* Hero Section - Desktop and Tablet */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left Side - Character */}
          <div className="lg:w-1/2 flex items-center justify-center p-8">
            <div className="relative">
              {/* Landing Page Image */}
              <img 
                src="/src/assets/images/landing_page_image.png" 
                alt="Professional Interview Character" 
                className="w-96 h-[32rem] object-contain animate-float"
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="lg:w-1/2 flex items-center justify-center p-6">
            <div className="max-w-sm w-full space-y-5 text-center">
              {/* Main Heading */}
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white-primary leading-tight">
                  {t('landing.hero.title')}
                  <br />
                  <span className="text-gradient">
                    {t('landing.hero.subtitle')}
                  </span>
                </h1>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* Google Sign Up */}
                <button
                  onClick={handleGoogleAuth}
                  className="w-full bg-white-primary text-dark-primary font-medium py-2.5 px-5 rounded-full hover:bg-white-secondary transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm">{t('landing.hero.cta.signUp')}</span>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">{t('landing.hero.cta.or')}</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                {/* Create Account */}
                <button
                  onClick={() => setShowSignUp(true)}
                  className="w-full bg-light-dark-secondary text-white-primary font-medium py-2.5 px-5 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  {t('landing.hero.cta.createAccount')}
                </button>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-400 px-2">
                <p className="leading-relaxed">
                  {t('landing.hero.termsText')}{' '}
                  <a href="#" className="text-blue-2nd hover:underline">
                    {t('landing.hero.termsLink')}
                  </a>{' '}
                  {t('landing.hero.and')}{' '}
                  <a href="#" className="text-blue-2nd hover:underline">
                    {t('landing.hero.privacyLink')}
                  </a>
                  , {t('landing.hero.including')}{' '}
                  <a href="#" className="text-blue-2nd hover:underline">
                    {t('landing.hero.cookieLink')}
                  </a>.
                </p>
              </div>

              {/* Sign In */}
              <div className="pt-4">
                <p className="text-white-secondary mb-3 text-sm">
                  {t('landing.hero.alreadyHaveAccount')}
                </p>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="w-full bg-transparent text-white-primary font-medium py-2.5 px-5 rounded-full border border-white-secondary hover:bg-white-primary hover:text-dark-primary transition-colors duration-200 text-sm"
                >
                  {t('landing.hero.cta.signIn')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section - Mobile */}
        <div className="lg:hidden flex flex-col items-center justify-center min-h-screen p-4 pb-8">
          <div className="max-w-xs w-full space-y-4 text-center">
            {/* Main Heading */}
            <h1 className="text-2xl font-bold text-white-primary leading-tight">
              {t('landing.hero.title')}
              <br />
              <span className="text-gradient">
                {t('landing.hero.subtitle')}
              </span>
            </h1>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {/* Google Sign Up */}
              <button
                onClick={handleGoogleAuth}
                className="w-full bg-white-primary text-dark-primary font-medium py-2.5 px-4 rounded-full hover:bg-white-secondary transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">{t('landing.hero.cta.signUp')}</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-gray-400 text-xs">{t('landing.hero.cta.or')}</span>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>

              {/* Create Account */}
              <button
                onClick={() => setShowSignUp(true)}
                className="w-full bg-light-dark-secondary text-white-primary font-medium py-2.5 px-4 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors duration-200 text-sm"
              >
                {t('landing.hero.cta.createAccount')}
              </button>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-400 px-1">
              <p className="leading-relaxed">
                {t('landing.hero.termsText')}{' '}
                <a href="#" className="text-blue-2nd hover:underline">
                  {t('landing.hero.termsLink')}
                </a>{' '}
                {t('landing.hero.and')}{' '}
                <a href="#" className="text-blue-2nd hover:underline">
                  {t('landing.hero.privacyLink')}
                </a>
                , {t('landing.hero.including')}{' '}
                <a href="#" className="text-blue-2nd hover:underline">
                  {t('landing.hero.cookieLink')}
                </a>.
              </p>
            </div>

            {/* Sign In */}
            <div className="pt-3">
              <p className="text-white-secondary mb-3 text-sm">
                {t('landing.hero.alreadyHaveAccount')}
              </p>
              <button
                onClick={() => setShowSignIn(true)}
                className="w-full bg-transparent text-white-primary font-medium py-2.5 px-4 rounded-full border border-white-secondary hover:bg-white-primary hover:text-dark-primary transition-colors duration-200 text-sm"
              >
                {t('landing.hero.cta.signIn')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-dark-primary mt-8 lg:mt-0">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white-primary transition-colors">
                {t('landing.footer.aboutUs')}
              </a>
              <a href="#" className="hover:text-white-primary transition-colors">
                {t('landing.footer.helpCenter')}
              </a>
              <a href="#" className="hover:text-white-primary transition-colors">
                {t('landing.footer.termOfService')}
              </a>
              <a href="#" className="hover:text-white-primary transition-colors">
                {t('landing.footer.privacyPolicy')}
              </a>
              <a href="#" className="hover:text-white-primary transition-colors">
                {t('landing.footer.cookieUse')}
              </a>
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{t('landing.footer.english')}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <SignInModal 
        isOpen={showSignIn} 
        onClose={() => setShowSignIn(false)}
        onSwitchToSignUp={() => {
          setShowSignIn(false)
          setShowSignUp(true)
        }}
      />
      <SignUpModal 
        isOpen={showSignUp} 
        onClose={() => setShowSignUp(false)}
        onSwitchToSignIn={() => {
          setShowSignUp(false)
          setShowSignIn(true)
        }}
      />
    </div>
  )
}

export default LandingPage