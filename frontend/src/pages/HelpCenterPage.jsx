import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageCircle,
  Settings,
  CreditCard,
  Mic,
  Globe,
  Menu,
  X,
  ArrowRight,
  Mail,
  Phone,
  Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageSelector from '../components/navigation/LanguageSelector'

const HelpCenterPage = () => {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const siteUrl = 'http://vwkcwwc4o4gwgs0c08scookk.168.231.82.151.sslip.io'

  // Set document title and meta description for SEO
  useEffect(() => {
    document.title = t('helpCenter.meta.title')
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('helpCenter.meta.description'))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = t('helpCenter.meta.description')
      document.head.appendChild(meta)
    }
  }, [t])

  const categories = [
    { id: 'all', name: t('helpCenter.categories.all'), icon: BookOpen },
    { id: 'getting-started', name: t('helpCenter.categories.gettingStarted'), icon: ArrowRight },
    { id: 'interviews', name: t('helpCenter.categories.interviews'), icon: Mic },
    { id: 'chat', name: t('helpCenter.categories.chat'), icon: MessageCircle },
    { id: 'account', name: t('helpCenter.categories.account'), icon: Settings },
    { id: 'billing', name: t('helpCenter.categories.billing'), icon: CreditCard },
    { id: 'technical', name: t('helpCenter.categories.technical'), icon: Globe }
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: t('helpCenter.faqs.gettingStarted.q1.question'),
      answer: t('helpCenter.faqs.gettingStarted.q1.answer')
    },
    {
      id: 2,
      category: 'getting-started',
      question: t('helpCenter.faqs.gettingStarted.q2.question'),
      answer: t('helpCenter.faqs.gettingStarted.q2.answer')
    },
    {
      id: 3,
      category: 'interviews',
      question: t('helpCenter.faqs.interviews.q1.question'),
      answer: t('helpCenter.faqs.interviews.q1.answer')
    },
    {
      id: 4,
      category: 'interviews',
      question: t('helpCenter.faqs.interviews.q2.question'),
      answer: t('helpCenter.faqs.interviews.q2.answer')
    },
    {
      id: 5,
      category: 'interviews',
      question: t('helpCenter.faqs.interviews.q3.question'),
      answer: t('helpCenter.faqs.interviews.q3.answer')
    },
    {
      id: 6,
      category: 'chat',
      question: t('helpCenter.faqs.chat.q1.question'),
      answer: t('helpCenter.faqs.chat.q1.answer')
    },
    {
      id: 7,
      category: 'chat',
      question: t('helpCenter.faqs.chat.q2.question'),
      answer: t('helpCenter.faqs.chat.q2.answer')
    },
    {
      id: 8,
      category: 'account',
      question: t('helpCenter.faqs.account.q1.question'),
      answer: t('helpCenter.faqs.account.q1.answer')
    },
    {
      id: 9,
      category: 'account',
      question: t('helpCenter.faqs.account.q2.question'),
      answer: t('helpCenter.faqs.account.q2.answer')
    },
    {
      id: 10,
      category: 'billing',
      question: t('helpCenter.faqs.billing.q1.question'),
      answer: t('helpCenter.faqs.billing.q1.answer')
    },
    {
      id: 11,
      category: 'billing',
      question: t('helpCenter.faqs.billing.q2.question'),
      answer: t('helpCenter.faqs.billing.q2.answer')
    },
    {
      id: 12,
      category: 'technical',
      question: t('helpCenter.faqs.technical.q1.question'),
      answer: t('helpCenter.faqs.technical.q1.answer')
    },
    {
      id: 13,
      category: 'technical',
      question: t('helpCenter.faqs.technical.q2.question'),
      answer: t('helpCenter.faqs.technical.q2.answer')
    }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

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

      {/* Hero Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white-primary mb-6">
            {t('helpCenter.hero.title')}
          </h1>
          <p className="text-xl text-white-secondary mb-8 max-w-2xl mx-auto">
            {t('helpCenter.hero.description')}
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('helpCenter.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-dark-secondary border border-gray-600 rounded-full text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-2nd focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Quick Help Cards */}
      <section className="py-12 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-white-primary text-center mb-12">
            {t('helpCenter.quickHelp.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors">
              <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-blue-2nd" />
              </div>
              <h3 className="text-xl font-semibold text-white-primary mb-3">
                {t('helpCenter.quickHelp.interview.title')}
              </h3>
              <p className="text-white-secondary mb-4">
                {t('helpCenter.quickHelp.interview.description')}
              </p>
              <button 
                onClick={() => setSelectedCategory('interviews')}
                className="text-blue-2nd hover:text-blue transition-colors flex items-center space-x-2"
              >
                <span>{t('helpCenter.quickHelp.interview.action')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors">
              <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-blue-2nd" />
              </div>
              <h3 className="text-xl font-semibold text-white-primary mb-3">
                {t('helpCenter.quickHelp.account.title')}
              </h3>
              <p className="text-white-secondary mb-4">
                {t('helpCenter.quickHelp.account.description')}
              </p>
              <button 
                onClick={() => setSelectedCategory('account')}
                className="text-blue-2nd hover:text-blue transition-colors flex items-center space-x-2"
              >
                <span>{t('helpCenter.quickHelp.account.action')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-dark-primary border border-gray-600 rounded-xl p-6 hover:border-blue-2nd transition-colors">
              <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-2nd" />
              </div>
              <h3 className="text-xl font-semibold text-white-primary mb-3">
                {t('helpCenter.quickHelp.billing.title')}
              </h3>
              <p className="text-white-secondary mb-4">
                {t('helpCenter.quickHelp.billing.description')}
              </p>
              <button 
                onClick={() => setSelectedCategory('billing')}
                className="text-blue-2nd hover:text-blue transition-colors flex items-center space-x-2"
              >
                <span>{t('helpCenter.quickHelp.billing.action')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white-primary text-center mb-12">
              {t('helpCenter.faq.title')}
            </h2>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-2nd text-white-primary border-blue-2nd'
                        : 'text-white-secondary border-gray-600 hover:border-blue-2nd hover:text-white-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                )
              })}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div key={faq.id} className="bg-dark-secondary border border-gray-600 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="text-white-primary font-medium pr-4">{faq.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-blue-2nd flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-600 pt-4">
                        <p className="text-white-secondary leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white-secondary text-lg">
                  {t('helpCenter.search.noResults')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white-primary mb-6">
              {t('helpCenter.contact.title')}
            </h2>
            <p className="text-xl text-white-secondary mb-12">
              {t('helpCenter.contact.description')}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-dark-primary border border-gray-600 rounded-xl p-8">
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3">
                  {t('helpCenter.contact.email.title')}
                </h3>
                <p className="text-white-secondary mb-4">
                  {t('helpCenter.contact.email.description')}
                </p>
                <a 
                  href="mailto:support@toeai.com"
                  className="inline-flex items-center space-x-2 text-blue-2nd hover:text-blue transition-colors"
                >
                  <span>support@toeai.com</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-dark-primary border border-gray-600 rounded-xl p-8">
                <div className="w-12 h-12 bg-blue-2nd/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-blue-2nd" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-3">
                  {t('helpCenter.contact.hours.title')}
                </h3>
                <p className="text-white-secondary mb-4">
                  {t('helpCenter.contact.hours.description')}
                </p>
                <p className="text-blue-2nd font-medium">
                  {t('helpCenter.contact.hours.time')}
                </p>
              </div>
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
                {t('helpCenter.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('helpCenter.footer.product')}</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.about')}</Link></li>
                <li><Link to={siteUrl} className="text-white-secondary hover:text-white-primary transition-colors">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('helpCenter.footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="/help-center" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.helpCenter')}</Link></li>
                <li><a href="mailto:support@toeai.com" className="text-white-secondary hover:text-white-primary transition-colors">{t('helpCenter.footer.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white-primary font-semibold mb-4">{t('helpCenter.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.termsOfService')}</Link></li>
                <li><Link to="/privacy" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.privacyPolicy')}</Link></li>
                <li><Link to="/cookies" className="text-white-secondary hover:text-white-primary transition-colors">{t('common.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-white-secondary">
              © 2024 TOE AI. {t('helpCenter.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HelpCenterPage