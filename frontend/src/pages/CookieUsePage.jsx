import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Menu,
  X,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Shield,
  Cookie,
  Settings,
  BarChart3,
  Globe,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageSelector from '../components/navigation/LanguageSelector'

const CookieUsePage = () => {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always enabled
    analytics: false,
    marketing: false,
    preferences: false
  })

  const siteUrl = 'http://vwkcwwc4o4gwgs0c08scookk.168.231.82.151.sslip.io'

  // Set document title and meta description for SEO
  useEffect(() => {
    document.title = t('cookies.meta.title')
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('cookies.meta.description'))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = t('cookies.meta.description')
      document.head.appendChild(meta)
    }
  }, [t])

  // Load cookie preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('toe_ai_cookie_preferences')
    if (savedPreferences) {
      setCookiePreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const handlePreferenceChange = (category) => {
    if (category === 'necessary') return // Cannot disable necessary cookies
    
    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const savePreferences = () => {
    localStorage.setItem('toe_ai_cookie_preferences', JSON.stringify(cookiePreferences))
    // You could also send this to your backend here
    alert(t('cookies.preferences.saved'))
  }

  const acceptAllCookies = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    setCookiePreferences(allAccepted)
    localStorage.setItem('toe_ai_cookie_preferences', JSON.stringify(allAccepted))
    alert(t('cookies.preferences.allAccepted'))
  }

  const rejectOptionalCookies = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
    setCookiePreferences(onlyNecessary)
    localStorage.setItem('toe_ai_cookie_preferences', JSON.stringify(onlyNecessary))
    alert(t('cookies.preferences.rejected'))
  }

  const cookieTypes = [
    {
      id: 'necessary',
      title: t('cookies.types.necessary.title'),
      description: t('cookies.types.necessary.description'),
      examples: t('cookies.types.necessary.examples'),
      icon: Shield,
      required: true,
      enabled: cookiePreferences.necessary
    },
    {
      id: 'analytics',
      title: t('cookies.types.analytics.title'),
      description: t('cookies.types.analytics.description'),
      examples: t('cookies.types.analytics.examples'),
      icon: BarChart3,
      required: false,
      enabled: cookiePreferences.analytics
    },
    {
      id: 'marketing',
      title: t('cookies.types.marketing.title'),
      description: t('cookies.types.marketing.description'),
      examples: t('cookies.types.marketing.examples'),
      icon: Globe,
      required: false,
      enabled: cookiePreferences.marketing
    },
    {
      id: 'preferences',
      title: t('cookies.types.preferences.title'),
      description: t('cookies.types.preferences.description'),
      examples: t('cookies.types.preferences.examples'),
      icon: Settings,
      required: false,
      enabled: cookiePreferences.preferences
    }
  ]

  const sections = [
    {
      id: 'what-are-cookies',
      title: t('cookies.sections.whatAreCookies.title'),
      content: t('cookies.sections.whatAreCookies.content')
    },
    {
      id: 'how-we-use',
      title: t('cookies.sections.howWeUse.title'),
      content: t('cookies.sections.howWeUse.content')
    },
    {
      id: 'third-party',
      title: t('cookies.sections.thirdParty.title'),
      content: t('cookies.sections.thirdParty.content')
    },
    {
      id: 'managing-cookies',
      title: t('cookies.sections.managingCookies.title'),
      content: t('cookies.sections.managingCookies.content')
    },
    {
      id: 'cookie-retention',
      title: t('cookies.sections.cookieRetention.title'),
      content: t('cookies.sections.cookieRetention.content')
    },
    {
      id: 'updates',
      title: t('cookies.sections.updates.title'),
      content: t('cookies.sections.updates.content')
    }
  ]

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/toe_ai_logo.png" 
                alt="TOE AI Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-white-primary">TOE AI</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/about" className="text-white-secondary hover:text-white-primary transition-colors">
                {t('common.about')}
              </Link>
              <Link to="/help-center" className="text-white-secondary hover:text-white-primary transition-colors">
                {t('common.helpCenter')}
              </Link>
              <LanguageSelector />
              <Link
                to={siteUrl}
                className="bg-blue-2nd text-white-primary px-6 py-2 rounded-full hover:bg-blue transition-colors duration-200"
              >
                {t('common.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white-primary hover:text-blue-2nd transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4">
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/about" 
                  className="text-white-secondary hover:text-white-primary transition-colors text-center py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.about')}
                </Link>
                <Link 
                  to="/help-center" 
                  className="text-white-secondary hover:text-white-primary transition-colors text-center py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.helpCenter')}
                </Link>
                <div className="flex justify-center">
                  <LanguageSelector />
                </div>
                <Link
                  to={siteUrl}
                  className="bg-blue-2nd text-white-primary px-6 py-3 rounded-full hover:bg-blue transition-colors duration-200 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.getStarted')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb */}
      <section className="py-6 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-white-secondary hover:text-white-primary transition-colors">
              {t('common.home')}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white-primary">{t('common.cookiePolicy')}</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-2nd/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cookie className="w-8 h-8 text-blue-2nd" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white-primary mb-6">
                {t('cookies.hero.title')}
              </h1>
              <p className="text-xl text-white-secondary mb-8">
                {t('cookies.hero.description')}
              </p>
              
              {/* Last Updated */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-white-secondary">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('cookies.lastUpdated')}: {t('cookies.lastUpdatedDate')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('cookies.effectiveDate')}: {t('cookies.effectiveDateValue')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Preferences Section */}
      <section className="py-16 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white-primary text-center mb-12">
              {t('cookies.preferences.title')}
            </h2>
            
            <div className="space-y-6 mb-8">
              {cookieTypes.map((cookieType) => {
                const Icon = cookieType.icon
                return (
                  <div key={cookieType.id} className="bg-dark-primary border border-gray-600 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-blue-2nd" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-white-primary">
                              {cookieType.title}
                            </h3>
                            {cookieType.required && (
                              <span className="bg-blue-2nd text-white text-xs px-2 py-1 rounded">
                                {t('cookies.required')}
                              </span>
                            )}
                          </div>
                          <p className="text-white-secondary mb-4">
                            {cookieType.description}
                          </p>
                          <div className="text-sm text-gray-400">
                            <strong>{t('cookies.examples')}: </strong>
                            {cookieType.examples}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handlePreferenceChange(cookieType.id)}
                          disabled={cookieType.required}
                          className={`flex items-center justify-center w-12 h-6 rounded-full transition-colors ${
                            cookieType.enabled
                              ? 'bg-blue-2nd'
                              : 'bg-gray-600'
                          } ${cookieType.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            cookieType.enabled ? 'translate-x-3' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Preference Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={acceptAllCookies}
                className="bg-blue-2nd text-white-primary px-8 py-3 rounded-full hover:bg-blue transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t('cookies.preferences.acceptAll')}</span>
              </button>
              <button
                onClick={savePreferences}
                className="border border-blue-2nd text-blue-2nd px-8 py-3 rounded-full hover:bg-blue-2nd hover:text-white transition-colors duration-200"
              >
                {t('cookies.preferences.saveSelected')}
              </button>
              <button
                onClick={rejectOptionalCookies}
                className="border border-gray-600 text-white-secondary px-8 py-3 rounded-full hover:border-gray-400 hover:text-white-primary transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>{t('cookies.preferences.rejectOptional')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Table of Contents */}
            <div className="bg-dark-secondary border border-gray-600 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t('cookies.tableOfContents')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-blue-2nd hover:text-blue transition-colors py-1 text-sm"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white-primary mb-6">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-white-secondary leading-relaxed text-lg"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="mt-16 p-8 bg-dark-secondary border border-gray-600 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-2nd" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white-primary mb-3">
                    {t('cookies.contact.title')}
                  </h3>
                  <p className="text-white-secondary mb-4">
                    {t('cookies.contact.description')}
                  </p>
                  <a 
                    href="mailto:privacy@toeai.com"
                    className="text-blue-2nd hover:text-blue transition-colors font-medium"
                  >
                    privacy@toeai.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-white-primary text-center mb-12">
              {t('cookies.related.title')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Link 
                to="/privacy"
                className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3 group-hover:text-blue-2nd transition-colors">
                  {t('common.privacyPolicy')}
                </h3>
                <p className="text-white-secondary">
                  {t('cookies.related.privacy')}
                </p>
              </Link>

              <Link 
                to="/terms"
                className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3 group-hover:text-blue-2nd transition-colors">
                  {t('common.termsOfService')}
                </h3>
                <p className="text-white-secondary">
                  {t('cookies.related.terms')}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <img 
                  src="/toe_ai_logo.png" 
                  alt="TOE AI Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-lg font-bold text-white-primary">TOE AI</span>
              </div>
              <p className="text-white-secondary">
                {t('cookies.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('cookies.footer.product')}</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.about')}</Link></li>
                <li><Link to={siteUrl} className="text-white-secondary hover:text-white-primary transition-colors">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('cookies.footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="/help-center" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.helpCenter')}</Link></li>
                <li><a href="mailto:support@toeai.com" className="text-white-secondary hover:text-white-primary transition-colors">{t('cookies.footer.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('cookies.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.termsOfService')}</Link></li>
                <li><Link to="/privacy" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.privacyPolicy')}</Link></li>
                <li><Link to="/cookies" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-white-secondary">
              © 2024 TOE AI. {t('cookies.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CookieUsePage