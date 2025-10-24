import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const NotFoundPage = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-8xl">🤖</div>
        <h1 className="text-4xl font-bold text-white-primary">
          {t('notFound.title')}
        </h1>
        <p className="text-white-secondary max-w-md">
          {t('notFound.description')}
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-2nd text-white-primary px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors"
        >
          {t('notFound.button')}
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage