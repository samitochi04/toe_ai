import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
  type = 'text',
  error,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full rounded-xl border bg-light-dark-secondary px-4 py-3 text-white-primary placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary'

  const classes = clsx(
    baseClasses,
    error 
      ? 'border-error focus:border-error focus:ring-error' 
      : 'border-gray-600 focus:border-blue-2nd focus:ring-blue-2nd',
    className
  )

  return (
    <div className="w-full">
      <input
        ref={ref}
        type={type}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input