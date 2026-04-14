import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function Onboarding() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    fitnessLevel: 'beginner',
    goals: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value })
  }

  const handleFitnessLevelChange = (e) => {
    setFormData({ ...formData, fitnessLevel: e.target.value })
  }

  const handleGoalsChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      goals: checked ? [...prev.goals, name] : prev.goals.filter((g) => g !== name),
    }))
  }

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError(t('onboarding.nameRequired'))
      return
    }
    if (!formData.fitnessLevel) {
      setError(t('onboarding.levelRequired'))
      return
    }
    if (formData.goals.length === 0) {
      setError(t('onboarding.goalsRequired'))
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/onboard`, {
        name: formData.name,
        fitness_level: formData.fitnessLevel,
        goals: formData.goals,
      })

      if (response.status === 201) {
        const { user_id, user, profile } = response.data
        login(user_id, { ...user, profile })
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err.response?.data?.error || t('onboarding.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="logo">
            <span className="logo-icon">🏋️</span>
            <span className="logo-text">FitPro</span>
          </div>
          <p className="onboarding-subtitle">{t('onboarding.subtitle')}</p>
        </div>

        {/* Language Selector */}
        <div className="language-selector">
          <button
            className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            {t('common.english')}
          </button>
          <button
            className={`lang-btn ${i18n.language === 'he' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('he')}
          >
            {t('common.hebrew')}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">{t('onboarding.name')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('onboarding.namePlaceholder')}
              value={formData.name}
              onChange={handleNameChange}
            />
          </div>

          {/* Fitness Level */}
          <div className="form-group">
            <label className="form-label">{t('onboarding.fitnessLevel')}</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="fitnessLevel"
                  value="beginner"
                  checked={formData.fitnessLevel === 'beginner'}
                  onChange={handleFitnessLevelChange}
                />
                <span className="radio-label">{t('onboarding.beginner')}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="fitnessLevel"
                  value="intermediate"
                  checked={formData.fitnessLevel === 'intermediate'}
                  onChange={handleFitnessLevelChange}
                />
                <span className="radio-label">{t('onboarding.intermediate')}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="fitnessLevel"
                  value="advanced"
                  checked={formData.fitnessLevel === 'advanced'}
                  onChange={handleFitnessLevelChange}
                />
                <span className="radio-label">{t('onboarding.advanced')}</span>
              </label>
            </div>
          </div>

          {/* Goals */}
          <div className="form-group">
            <label className="form-label">{t('onboarding.goals')}</label>
            <div className="checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="weight_loss"
                  checked={formData.goals.includes('weight_loss')}
                  onChange={handleGoalsChange}
                />
                <span className="checkbox-label">{t('onboarding.weightLoss')}</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="muscle_gain"
                  checked={formData.goals.includes('muscle_gain')}
                  onChange={handleGoalsChange}
                />
                <span className="checkbox-label">{t('onboarding.muscleGain')}</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="endurance"
                  checked={formData.goals.includes('endurance')}
                  onChange={handleGoalsChange}
                />
                <span className="checkbox-label">{t('onboarding.endurance')}</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="flexibility"
                  checked={formData.goals.includes('flexibility')}
                  onChange={handleGoalsChange}
                />
                <span className="checkbox-label">{t('onboarding.flexibility')}</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="strength"
                  checked={formData.goals.includes('strength')}
                  onChange={handleGoalsChange}
                />
                <span className="checkbox-label">{t('onboarding.strength')}</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Onboarding
