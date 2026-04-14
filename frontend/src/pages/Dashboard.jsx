import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import GoogleCalendarSync from '../components/GoogleCalendarSync'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function Dashboard() {
  const { t } = useTranslation()
  const { userId, user } = useAuth()
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return

      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data.profile)
        } else {
          setError('Failed to load profile')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Error loading profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  const fitnessLevelMap = {
    beginner: t('onboarding.beginner'),
    intermediate: t('onboarding.intermediate'),
    advanced: t('onboarding.advanced'),
  }

  const goalsMap = {
    weight_loss: t('onboarding.weightLoss'),
    muscle_gain: t('onboarding.muscleGain'),
    endurance: t('onboarding.endurance'),
    flexibility: t('onboarding.flexibility'),
    strength: t('onboarding.strength'),
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          {t('dashboard.welcome', { name: user?.name || 'User' })}
        </h1>
        <p className="page-subtitle">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="card profile-card">
          <div className="card-content">
            <h3 className="card-title">{t('dashboard.profile')}</h3>

            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">{t('onboarding.name')}</span>
                <span className="info-value">{user?.name}</span>
              </div>

              <div className="info-item">
                <span className="info-label">{t('dashboard.fitnessLevel')}</span>
                <span className="info-value">
                  {profile ? fitnessLevelMap[profile.fitness_level] : '-'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">{t('dashboard.goals')}</span>
                <div className="goals-tags">
                  {profile?.goals?.map((goal) => (
                    <span key={goal} className="goal-tag">
                      {goalsMap[goal] || goal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar Sync */}
        <div className="card calendar-sync-card">
          <GoogleCalendarSync userId={userId} />
        </div>

        {/* Stats Cards */}
        <div className="card stats-card">
          <div className="card-content">
            <h3 className="card-title">{t('dashboard.stats')}</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">{t('dashboard.workoutsCompleted')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">{t('dashboard.daysActive')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">{t('dashboard.goalsAchieved')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="card feature-card">
          <div className="card-content">
            <div className="feature-icon">📝</div>
            <h4 className="feature-title">{t('dashboard.workoutJournal')}</h4>
            <p className="feature-description">
              {t('dashboard.workoutJournalDesc')}
            </p>
          </div>
        </div>

        <div className="card feature-card">
          <div className="card-content">
            <div className="feature-icon">🤖</div>
            <h4 className="feature-title">{t('dashboard.aiCoach')}</h4>
            <p className="feature-description">
              {t('dashboard.aiCoachDesc')}
            </p>
          </div>
        </div>

        <div className="card feature-card">
          <div className="card-content">
            <div className="feature-icon">📊</div>
            <h4 className="feature-title">{t('dashboard.progress')}</h4>
            <p className="feature-description">
              {t('dashboard.progressDesc')}
            </p>
          </div>
        </div>

        <div className="card feature-card">
          <div className="card-content">
            <div className="feature-icon">🥗</div>
            <h4 className="feature-title">{t('dashboard.nutrition')}</h4>
            <p className="feature-description">
              {t('dashboard.nutritionDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
