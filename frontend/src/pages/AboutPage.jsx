import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp, 
  MessageCircle,
  ChevronDown,
  ArrowRight,
  Mail,
  Send,
  Globe,
  Zap,
  Shield,
  HeadphonesIcon,
  Menu,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageSelector from '../components/navigation/LanguageSelector'

const AboutPage = () => {
  const { t, i18n } = useTranslation()
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [newsletterForm, setNewsletterForm] = useState({ name: '', email: '' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [contactStatus, setContactStatus] = useState('')
  const [loading, setLoading] = useState({ newsletter: false, contact: false })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const siteUrl = 'https://toe.diversis.site'

  // Set document title and meta description for SEO
  useEffect(() => {
    document.title = t('about.meta.title')
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('about.meta.description'))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = t('about.meta.description')
      document.head.appendChild(meta)
    }
  }, [t])

  // Newsletter submission
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, newsletter: true }))
    
    try {
      const response = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newsletterForm,
          language: i18n.language
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.status === 'already_subscribed') {
          setNewsletterStatus('already_subscribed')
        } else {
          setNewsletterStatus('success')
          setNewsletterForm({ name: '', email: '' })
        }
      } else {
        setNewsletterStatus('error')
      }
    } catch (error) {
      setNewsletterStatus('error')
    }
    
    setLoading(prev => ({ ...prev, newsletter: false }))
  }

  // Contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, contact: true }))
    
    try {
      const response = await fetch('/api/v1/newsletter/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          language: i18n.language
        })
      })

      if (response.ok) {
        setContactStatus('success')
        setContactForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setContactStatus('error')
      }
    } catch (error) {
      setContactStatus('error')
    }
    
    setLoading(prev => ({ ...prev, contact: false }))
  }

  const partners = [
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
    { name: 'Supabase', logo: 'https://avatars.githubusercontent.com/u/54469796?s=200&v=4' },
    { name: 'Hostinger', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Hostinger_logo.svg' },
    { name: 'OpenAI Whisper', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' }
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
                <LanguageSelector />
                <Link
                  to={siteUrl}
                  className="bg-blue-2nd text-white-primary px-6 py-2 rounded-full hover:bg-blue transition-colors duration-200"
                >
                  {t('about.cta.button')}
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
                  <div className="flex justify-center">
                    <LanguageSelector />
                  </div>
                  <Link
                    to={siteUrl}
                    className="bg-blue-2nd text-white-primary px-6 py-3 rounded-full hover:bg-blue transition-colors duration-200 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('about.cta.button')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white-primary leading-tight">
                    {t('about.hero.title')}<br />
                    <span className="text-gradient">{t('about.hero.subtitle')}</span>
                  </h1>
                  <p className="text-xl text-white-secondary mt-6 leading-relaxed">
                    {t('about.hero.description')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={siteUrl}
                    className="bg-blue-2nd text-white-primary px-8 py-4 rounded-full hover:bg-blue transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>{t('about.cta.button')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                    className="border border-white-secondary text-white-primary px-8 py-4 rounded-full hover:bg-white-primary hover:text-dark-primary transition-colors duration-200"
                  >
                    {t('about.pricing.title')}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-2nd">{t('about.cta.stats.users')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-2nd">{t('about.cta.stats.success')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-2nd">{t('about.cta.stats.interviews')}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <img 
                  src="/landing_page_image.png" 
                  alt="Professional Interview Character" 
                  className="w-96 h-[32rem] object-contain animate-float"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-light-dark-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
                {t('about.features.title')}<br />
                <span className="text-gradient">{t('about.features.subtitle')}</span>
              </h2>
              <p className="text-xl text-white-secondary max-w-3xl mx-auto">
                {t('about.features.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {t('about.features.list', { returnObjects: true }).map((feature, index) => (
                <div key={index} className="bg-dark-primary p-6 rounded-xl border border-gray-800 hover:border-blue-2nd transition-colors duration-200">
                  <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                    {index === 0 && <Zap className="w-6 h-6 text-blue-2nd" />}
                    {index === 1 && <HeadphonesIcon className="w-6 h-6 text-blue-2nd" />}
                    {index === 2 && <MessageCircle className="w-6 h-6 text-blue-2nd" />}
                    {index === 3 && <TrendingUp className="w-6 h-6 text-blue-2nd" />}
                    {index === 4 && <Star className="w-6 h-6 text-blue-2nd" />}
                    {index === 5 && <Globe className="w-6 h-6 text-blue-2nd" />}
                  </div>
                  <h3 className="text-xl font-semibold text-white-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white-secondary">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-white-primary mb-2">
                {t('about.partners.title')}
              </h2>
              <p className="text-white-secondary">
                {t('about.partners.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-60">
              {partners.map((partner, index) => (
                <div key={index} className="h-12 w-32 flex items-center justify-center">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 bg-light-dark-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
                {t('about.pricing.title')}
              </h2>
              <p className="text-xl text-white-secondary">
                {t('about.pricing.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-dark-primary p-8 rounded-xl border border-gray-800">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white-primary mb-2">
                    {t('about.pricing.free.title')}
                  </h3>
                  <div className="text-4xl font-bold text-white-primary mb-2">
                    {t('about.pricing.free.price')}
                    <span className="text-lg text-white-secondary">/{t('about.pricing.free.period')}</span>
                  </div>
                  <p className="text-white-secondary">
                    {t('about.pricing.free.description')}
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {t('about.pricing.free.features', { returnObjects: true }).map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a
                  href={siteUrl}
                  className="w-full bg-white-primary text-dark-primary py-3 rounded-full font-medium hover:bg-white-secondary transition-colors duration-200 block text-center"
                >
                  {t('about.pricing.free.cta')}
                </a>
              </div>

              {/* Premium Plan */}
              <div className="bg-dark-primary p-8 rounded-xl border-2 border-blue-2nd relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-2nd text-white px-4 py-1 rounded-full text-sm font-medium">
                    {t('about.pricing.premium.popular')}
                  </span>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white-primary mb-2">
                    {t('about.pricing.premium.title')}
                  </h3>
                  <div className="text-4xl font-bold text-white-primary mb-2">
                    {t('about.pricing.premium.price')}
                    <span className="text-lg text-white-secondary">/{t('about.pricing.premium.period')}</span>
                  </div>
                  <p className="text-white-secondary">
                    {t('about.pricing.premium.description')}
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {t('about.pricing.premium.features', { returnObjects: true }).map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a
                  href={siteUrl}
                  className="w-full bg-blue-2nd text-white-primary py-3 rounded-full font-medium hover:bg-blue transition-colors duration-200 block text-center"
                >
                  {t('about.pricing.premium.cta')}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
                {t('about.faq.title')}
              </h2>
              <p className="text-xl text-white-secondary">
                {t('about.faq.subtitle')}
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {t('about.faq.items', { returnObjects: true }).map((item, index) => (
                <div key={index} className="bg-light-dark-secondary rounded-xl border border-gray-800">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <span className="text-lg font-semibold text-white-primary pr-4">
                      {item.question}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-white-secondary transform transition-transform duration-200 ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-6">
                      <p className="text-white-secondary leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-light-dark-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
                {t('about.newsletter.title')}
              </h2>
              <p className="text-xl text-white-secondary mb-4">
                {t('about.newsletter.subtitle')}
              </p>
              <p className="text-white-secondary mb-8">
                {t('about.newsletter.description')}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('about.newsletter.placeholder.name')}
                    value={newsletterForm.name}
                    onChange={(e) => setNewsletterForm({...newsletterForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-primary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder={t('about.newsletter.placeholder.email')}
                    value={newsletterForm.email}
                    onChange={(e) => setNewsletterForm({...newsletterForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-primary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading.newsletter}
                  className="w-full bg-blue-2nd text-white-primary py-3 rounded-lg font-medium hover:bg-blue transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>{loading.newsletter ? 'Loading...' : t('about.newsletter.cta')}</span>
                </button>
              </form>

              {newsletterStatus && (
                <div className={`mt-4 p-4 rounded-lg ${
                  newsletterStatus === 'success' ? 'bg-green-500/20 text-green-400' :
                  newsletterStatus === 'already_subscribed' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {newsletterStatus === 'success' && t('about.newsletter.success')}
                  {newsletterStatus === 'already_subscribed' && t('about.newsletter.alreadySubscribed')}
                  {newsletterStatus === 'error' && t('about.newsletter.error')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
                  {t('about.contact.title')}
                </h2>
                <p className="text-xl text-white-secondary mb-4">
                  {t('about.contact.subtitle')}
                </p>
                <p className="text-white-secondary">
                  {t('about.contact.description')}
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('about.contact.form.name')}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder={t('about.contact.form.email')}
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('about.contact.form.subject')}
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none"
                />
                <textarea
                  placeholder={t('about.contact.form.message')}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-lg text-white-primary placeholder:text-gray-400 focus:border-blue-2nd focus:outline-none resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading.contact}
                  className="w-full bg-blue-2nd text-white-primary py-3 rounded-lg font-medium hover:bg-blue transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{loading.contact ? 'Loading...' : t('about.contact.form.send')}</span>
                </button>
              </form>

              {contactStatus && (
                <div className={`mt-6 p-4 rounded-lg ${
                  contactStatus === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {contactStatus === 'success' ? t('about.contact.success') : t('about.contact.error')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-2nd/20 to-blue/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-4">
              {t('about.cta.title')}
            </h2>
            <p className="text-xl text-white-secondary mb-8 max-w-2xl mx-auto">
              {t('about.cta.subtitle')}
            </p>
            <a
              href={siteUrl}
              className="bg-blue-2nd text-white-primary px-8 py-4 rounded-full hover:bg-blue transition-colors duration-200 inline-flex items-center space-x-2 text-lg font-medium"
            >
              <span>{t('about.cta.button')}</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-dark-primary py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-sm text-gray-400">
              <Link to="/about" className="hover:text-white-primary transition-colors">
                {t('landing.footer.aboutUs')}
              </Link>
              <Link to="/help-center" className="hover:text-white-primary transition-colors">
                {t('landing.footer.helpCenter')}
              </Link>
              <Link to="/terms" className="hover:text-white-primary transition-colors">
                {t('landing.footer.termOfService')}
              </Link>
              <Link to="/privacy" className="hover:text-white-primary transition-colors">
                {t('landing.footer.privacyPolicy')}
              </Link>
              <Link to="/cookies" className="hover:text-white-primary transition-colors">
                {t('landing.footer.cookieUse')}
              </Link>
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{t('landing.footer.english')}</span>
              </div>
            </div>
            <div className="text-center mt-6 text-gray-400 text-sm">
              © 2024 TOE AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    )
  }

  export default AboutPage