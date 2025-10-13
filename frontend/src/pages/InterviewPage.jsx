import { useTranslation } from 'react-i18next'

const InterviewPage = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white-primary mb-8">
          {t('interview.title')}
        </h1>
        <div className="text-white-secondary">
          Interview interface coming soon...
        </div>
      </div>
    </div>
  )
}

export default InterviewPage