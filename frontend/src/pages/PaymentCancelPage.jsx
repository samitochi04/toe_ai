import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle, ArrowLeft, Crown } from 'lucide-react'
import Button from '../components/common/Button'

const PaymentCancelPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-light-dark-secondary rounded-xl p-8 text-center border border-gray-600">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white-primary mb-2">
              {t('paymentCancel.title')}
            </h1>
            <p className="text-gray-400">
              {t('paymentCancel.description')}
            </p>
          </div>

          <div className="bg-dark-primary rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-white-primary font-medium">{t('paymentCancel.premiumPlan')}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('paymentCancel.upgradeAnytime')}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/billing')}
              className="w-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              {t('paymentCancel.tryAgain')}
            </Button>
            
            <Button 
              onClick={() => navigate('/workspace/dashboard')}
              variant="secondary"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('paymentCancel.backToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelPage
