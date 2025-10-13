import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-blue-2nd text-white-primary hover:bg-opacity-90 focus:ring-blue-2nd',
    secondary: 'bg-light-dark-secondary text-white-primary border border-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    outline: 'bg-transparent text-white-primary border border-white-secondary hover:bg-white-primary hover:text-dark-primary focus:ring-white-secondary',
    ghost: 'bg-transparent text-white-secondary hover:bg-light-dark-secondary hover:text-white-primary focus:ring-gray-500',
    danger: 'bg-error text-white-primary hover:bg-red-600 focus:ring-error',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-sm rounded-xl',
    lg: 'px-6 py-4 text-base rounded-xl',
  }

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  )

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button