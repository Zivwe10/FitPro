import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const Header = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [language, setLanguage] = React.useState(i18n.language)
  const [showDropdown, setShowDropdown] = React.useState(false)

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr'
  }

  const handleLogout = () => {
    logout()
    navigate('/onboarding')
  }

  React.useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
  }, [language])

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="header-logo logo">
            <span className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </span>
            <span className="logo-text">FitPro</span>
          </div>
        </div>
        <div className="header-right">
          <div className="language-selector">
            <button
              className="language-btn"
              onClick={() => handleLanguageChange(language === 'en' ? 'he' : 'en')}
            >
              {language === 'en' ? 'EN' : 'עב'}
            </button>
          </div>
          <div className="user-menu">
            <button className="avatar-btn" onClick={toggleDropdown}>
              <div className="avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item user-info">
                  <div className="avatar-small">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="user-name">{user?.name || 'User'}</div>
                    <div className="user-email">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleLogout}>
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
