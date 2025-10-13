import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, ChevronDown } from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const LanguageSelector = () => {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'en', name: t('common.english'), flag: '🇺🇸' },
    { code: 'fr', name: t('common.french'), flag: '🇫🇷' },
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white-primary bg-light-dark-secondary border border-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary focus:ring-blue-2nd transition-colors">
          <Globe className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Menu.Button>
      </div>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 w-40 mt-2 origin-top-right bg-light-dark-secondary border border-gray-600 rounded-lg shadow-strong focus:outline-none">
          <div className="py-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={`${
                      active ? 'bg-gray-700' : ''
                    } ${
                      i18n.language === language.code ? 'text-blue-2nd' : 'text-white-primary'
                    } group flex w-full items-center px-4 py-2 text-sm transition-colors`}
                  >
                    <span className="mr-3">{language.flag}</span>
                    {language.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export default LanguageSelector