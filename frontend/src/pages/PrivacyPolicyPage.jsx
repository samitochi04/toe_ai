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
  Eye,
  Lock,
  Database,
  Users,
  Globe
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageSelector from '../components/navigation/LanguageSelector'

const PrivacyPolicyPage = () => {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const siteUrl = 'http://vwkcwwc4o4gwgs0c08scookk.168.231.82.151.sslip.io'

  // Set document title and meta description for SEO
  useEffect(() => {
    document.title = t('privacy.meta.title')
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('privacy.meta.description'))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = t('privacy.meta.description')
      document.head.appendChild(meta)
    }
  }, [t])

  const sections = [
    {
      id: 'overview',
      title: t('privacy.sections.overview.title'),
      content: t('privacy.sections.overview.content'),
      icon: Eye
    },
    {
      id: 'information-collected',
      title: t('privacy.sections.informationCollected.title'),
      content: t('privacy.sections.informationCollected.content'),
      icon: Database
    },
    {
      id: 'how-we-use',
      title: t('privacy.sections.howWeUse.title'),
      content: t('privacy.sections.howWeUse.content'),
      icon: Users
    },
    {
      id: 'information-sharing',
      title: t('privacy.sections.informationSharing.title'),
      content: t('privacy.sections.informationSharing.content'),
      icon: Globe
    },
    {
      id: 'data-security',
      title: t('privacy.sections.dataSecurity.title'),
      content: t('privacy.sections.dataSecurity.content'),
      icon: Lock
    },
    {
      id: 'data-retention',
      title: t('privacy.sections.dataRetention.title'),
      content: t('privacy.sections.dataRetention.content'),
      icon: Clock
    },
    {
      id: 'your-rights',
      title: t('privacy.sections.yourRights.title'),
      content: t('privacy.sections.yourRights.content'),
      icon: Shield
    },
    {
      id: 'cookies',
      title: t('privacy.sections.cookies.title'),
      content: t('privacy.sections.cookies.content'),
      icon: FileText
    },
    {
      id: 'third-party',
      title: t('privacy.sections.thirdParty.title'),
      content: t('privacy.sections.thirdParty.content'),
      icon: Globe
    },
    {
      id: 'international',
      title: t('privacy.sections.international.title'),
      content: t('privacy.sections.international.content'),
      icon: Globe
    },
    {
      id: 'children',
      title: t('privacy.sections.children.title'),
      content: t('privacy.sections.children.content'),
      icon: Users
    },
    {
      id: 'changes',
      title: t('privacy.sections.changes.title'),
      content: t('privacy.sections.changes.content'),
      icon: Calendar
    },
    {
      id: 'contact',
      title: t('privacy.sections.contact.title'),
      content: t('privacy.sections.contact.content'),
      icon: Shield
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
            <span className="text-white-primary">{t('common.privacyPolicy')}</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-2nd/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-2nd" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white-primary mb-6">
                {t('privacy.hero.title')}
              </h1>
              <p className="text-xl text-white-secondary mb-8">
                {t('privacy.hero.description')}
              </p>
              
              {/* Last Updated */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-white-secondary">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('privacy.effectiveDate')}: {t('privacy.effectiveDateValue')}</span>
                </div>
              </div>
            </div>

            {/* Key Points Summary */}
            <div className="bg-dark-secondary border border-gray-600 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                {t('privacy.keyPoints.title')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-2nd rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white-secondary text-sm">{t('privacy.keyPoints.point1')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-2nd rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white-secondary text-sm">{t('privacy.keyPoints.point2')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-2nd rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white-secondary text-sm">{t('privacy.keyPoints.point3')}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-2nd rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white-secondary text-sm">{t('privacy.keyPoints.point4')}</p>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-dark-secondary border border-gray-600 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t('privacy.tableOfContents')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-blue-2nd hover:text-blue transition-colors py-1 text-sm flex items-center"
                  >
                    <section.icon className="w-4 h-4 mr-2" />
                    {index + 1}. {section.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {sections.map((section, index) => {
                const Icon = section.icon
                return (
                  <div key={section.id} id={section.id} className="scroll-mt-24">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-2nd" />
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white-primary">
                        {index + 1}. {section.title}
                      </h2>
                    </div>
                    <div className="prose prose-invert max-w-none ml-16">
                      <div 
                        className="text-white-secondary leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Contact Information */}
            <div className="mt-16 p-8 bg-dark-secondary border border-gray-600 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-2nd" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white-primary mb-3">
                    {t('privacy.contact.title')}
                  </h3>
                  <p className="text-white-secondary mb-4">
                    {t('privacy.contact.description')}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-white-secondary">{t('privacy.contact.email')}: </span>
                      <a 
                        href="mailto:privacy@toeai.com"
                        className="text-blue-2nd hover:text-blue transition-colors font-medium"
                      >
                        privacy@toeai.com
                      </a>
                    </div>
                    <div>
                      <span className="text-white-secondary">{t('privacy.contact.dpo')}: </span>
                      <a 
                        href="mailto:dpo@toeai.com"
                        className="text-blue-2nd hover:text-blue transition-colors font-medium"
                      >
                        dpo@toeai.com
                      </a>
                    </div>
                  </div>
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
              {t('privacy.related.title')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
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
                  {t('privacy.related.terms')}
                </p>
              </Link>

              <Link 
                to="/cookies"
                className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3 group-hover:text-blue-2nd transition-colors">
                  {t('common.cookiePolicy')}
                </h3>
                <p className="text-white-secondary">
                  {t('privacy.related.cookies')}
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
                {t('privacy.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('privacy.footer.product')}</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.about')}</Link></li>
                <li><Link to={siteUrl} className="text-white-secondary hover:text-white-primary transition-colors">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('privacy.footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="/help-center" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.helpCenter')}</Link></li>
                <li><a href="mailto:support@toeai.com" className="text-white-secondary hover:text-white-primary transition-colors">{t('privacy.footer.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('privacy.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.termsOfService')}</Link></li>
                <li><Link to="/privacy" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.privacyPolicy')}</Link></li>
                <li><Link to="/cookies" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-white-secondary">
              © 2024 TOE AI. {t('privacy.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicyPage