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
  Scale
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageSelector from '../components/navigation/LanguageSelector'

const TermsOfServicePage = () => {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const siteUrl = 'http://vwkcwwc4o4gwgs0c08scookk.168.231.82.151.sslip.io'

  // Set document title and meta description for SEO
  useEffect(() => {
    document.title = t('terms.meta.title')
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('terms.meta.description'))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = t('terms.meta.description')
      document.head.appendChild(meta)
    }
  }, [t])

  const sections = [
    {
      id: 'acceptance',
      title: t('terms.sections.acceptance.title'),
      content: t('terms.sections.acceptance.content')
    },
    {
      id: 'description',
      title: t('terms.sections.description.title'),
      content: t('terms.sections.description.content')
    },
    {
      id: 'accounts',
      title: t('terms.sections.accounts.title'),
      content: t('terms.sections.accounts.content')
    },
    {
      id: 'usage',
      title: t('terms.sections.usage.title'),
      content: t('terms.sections.usage.content')
    },
    {
      id: 'content',
      title: t('terms.sections.content.title'),
      content: t('terms.sections.content.content')
    },
    {
      id: 'privacy',
      title: t('terms.sections.privacy.title'),
      content: t('terms.sections.privacy.content')
    },
    {
      id: 'payment',
      title: t('terms.sections.payment.title'),
      content: t('terms.sections.payment.content')
    },
    {
      id: 'intellectual',
      title: t('terms.sections.intellectual.title'),
      content: t('terms.sections.intellectual.content')
    },
    {
      id: 'prohibited',
      title: t('terms.sections.prohibited.title'),
      content: t('terms.sections.prohibited.content')
    },
    {
      id: 'termination',
      title: t('terms.sections.termination.title'),
      content: t('terms.sections.termination.content')
    },
    {
      id: 'disclaimers',
      title: t('terms.sections.disclaimers.title'),
      content: t('terms.sections.disclaimers.content')
    },
    {
      id: 'limitation',
      title: t('terms.sections.limitation.title'),
      content: t('terms.sections.limitation.content')
    },
    {
      id: 'indemnification',
      title: t('terms.sections.indemnification.title'),
      content: t('terms.sections.indemnification.content')
    },
    {
      id: 'governing',
      title: t('terms.sections.governing.title'),
      content: t('terms.sections.governing.content')
    },
    {
      id: 'changes',
      title: t('terms.sections.changes.title'),
      content: t('terms.sections.changes.content')
    },
    {
      id: 'contact',
      title: t('terms.sections.contact.title'),
      content: t('terms.sections.contact.content')
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
            <span className="text-white-primary">{t('common.termsOfService')}</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-2nd/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scale className="w-8 h-8 text-blue-2nd" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white-primary mb-6">
                {t('terms.hero.title')}
              </h1>
              <p className="text-xl text-white-secondary mb-8">
                {t('terms.hero.description')}
              </p>
              
              {/* Last Updated */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-white-secondary">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('terms.effectiveDate')}: {t('terms.effectiveDateValue')}</span>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-dark-secondary border border-gray-600 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t('terms.tableOfContents')}
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
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
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
                    {t('terms.contact.title')}
                  </h3>
                  <p className="text-white-secondary mb-4">
                    {t('terms.contact.description')}
                  </p>
                  <a 
                    href="mailto:legal@toeai.com"
                    className="text-blue-2nd hover:text-blue transition-colors font-medium"
                  >
                    legal@toeai.com
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
              {t('terms.related.title')}
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
                  {t('terms.related.privacy')}
                </p>
              </Link>

              <Link 
                to="/cookies"
                className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3 group-hover:text-blue-2nd transition-colors">
                  {t('common.cookiePolicy')}
                </h3>
                <p className="text-white-secondary">
                  {t('terms.related.cookies')}
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
                {t('terms.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('terms.footer.product')}</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.about')}</Link></li>
                <li><Link to={siteUrl} className="text-white-secondary hover:text-white-primary transition-colors">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('terms.footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="/help-center" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.helpCenter')}</Link></li>
                <li><a href="mailto:support@toeai.com" className="text-white-secondary hover:text-white-primary transition-colors">{t('terms.footer.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('terms.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.termsOfService')}</Link></li>
                <li><Link to="/privacy" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.privacyPolicy')}</Link></li>
                <li><Link to="/cookies" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-white-secondary">
              © 2024 TOE AI. {t('terms.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsOfServicePage