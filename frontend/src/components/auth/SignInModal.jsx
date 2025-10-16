import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import toast from 'react-hot-toast'

const SignInModal = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const { t } = useTranslation()
  const { signIn, signInWithGoogle, isLoading } = useAuthStore()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  const onSubmit = async (data) => {
    try {
      await signIn(data.email, data.password)
      toast.success(t('auth.messages.signInSuccess'))
      reset()
      onClose()
    } catch (error) {
      toast.error(error.message || t('auth.messages.signInError'))
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      toast.success(t('auth.messages.signInSuccess'))
      onClose()
    } catch (error) {
      toast.error(error.message || t('auth.messages.googleAuthError'))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white-primary" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/toe_ai_logo.png" 
            alt="TOE AI Logo" 
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white-primary text-center mb-8">
          {t('auth.signIn.title')}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <Input
              type="email"
              placeholder={t('auth.signIn.email')}
              {...register('email', {
                required: t('auth.validation.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('auth.validation.email'),
                },
              })}
              error={errors.email?.message}
            />
          </div>

          {/* Password Field */}
          <div>
            <Input
              type="password"
              placeholder={t('auth.signIn.password')}
              {...register('password', {
                required: t('auth.validation.required'),
                minLength: {
                  value: 8,
                  message: t('auth.validation.passwordLength'),
                },
              })}
              error={errors.password?.message}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            {t('auth.signIn.signIn')}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">{t('landing.hero.cta.or')}</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full bg-white-primary text-dark-primary font-medium py-3 px-6 rounded-xl hover:bg-white-secondary transition-colors duration-200 flex items-center justify-center space-x-3 border border-white-primary disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-dark-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{t('auth.signIn.googleSignIn')}</span>
        </button>
      </div>
    </Modal>
  )
}

export default SignInModal