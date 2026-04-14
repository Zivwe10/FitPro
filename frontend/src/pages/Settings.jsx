import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import i18n from '../i18n/config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div className={`settings-toast settings-toast-${type}`}>
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className="toggle-switch" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  )
}

// ── Coming Soon Badge ─────────────────────────────────────────────────────────
function ComingSoonBadge({ label }) {
  return <span className="badge-coming-soon">{label}</span>
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SettingsCard({ title, description, children }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div>
          <h3 className="settings-card-title">{title}</h3>
          {description && <p className="settings-card-desc">{description}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useTranslation()
  const { userId, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [profile, setProfile] = useState({ name: '', age: '', height_cm: '', weight_kg: '', gender: '' })
  const [goals, setGoals] = useState({ calorie_goal: 2000, protein_goal: 120, weekly_workout_target: 3 })
  const [prefs, setPrefs] = useState({ language: 'en', units_weight: 'kg', units_distance: 'km' })
  const [notifs, setNotifs] = useState({
    workout_reminder: false,
    workout_reminder_time: '08:00',
    daily_nutrition: false,
    weekly_summary: false,
  })
  const [googleConnected, setGoogleConnected] = useState(false)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}/settings`)
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile({
              name: data.profile.name || '',
              age: data.profile.age ?? '',
              height_cm: data.profile.height_cm ?? '',
              weight_kg: data.profile.weight_kg ?? '',
              gender: data.profile.gender || '',
            })
          }
          if (data.goals) setGoals(data.goals)
          if (data.preferences) setPrefs(data.preferences)
          if (data.notifications) setNotifs(data.notifications)
          setGoogleConnected(!!data.google_calendar_enabled)
        } else {
          showToast('Failed to load settings', 'error')
        }
      } catch (err) {
        console.error('Settings load error:', err)
        showToast('Failed to load settings', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [userId])

  // ── Save handlers ────────────────────────────────────────────────────────────
  const id = userId

  const saveProfile = async () => {
    setSaving(s => ({ ...s, profile: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age !== '' ? Number(profile.age) : null,
          height_cm: profile.height_cm !== '' ? Number(profile.height_cm) : null,
          weight_kg: profile.weight_kg !== '' ? Number(profile.weight_kg) : null,
          gender: profile.gender || null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.user) setUser(data.user)
      showToast(t('settings.saveSuccess'))
    } catch {
      showToast(t('settings.saveError'), 'error')
    } finally {
      setSaving(s => ({ ...s, profile: false }))
    }
  }

  const saveGoals = async () => {
    setSaving(s => ({ ...s, goals: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${id}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      })
      if (!res.ok) throw new Error()
      showToast(t('settings.saveSuccess'))
    } catch {
      showToast(t('settings.saveError'), 'error')
    } finally {
      setSaving(s => ({ ...s, goals: false }))
    }
  }

  const savePreferences = async () => {
    setSaving(s => ({ ...s, prefs: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error()
      i18n.changeLanguage(prefs.language)
      document.documentElement.dir = prefs.language === 'he' ? 'rtl' : 'ltr'
      showToast(t('settings.saveSuccess'))
    } catch {
      showToast(t('settings.saveError'), 'error')
    } finally {
      setSaving(s => ({ ...s, prefs: false }))
    }
  }

  const saveNotifications = async () => {
    setSaving(s => ({ ...s, notifs: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_workout_reminder: notifs.workout_reminder,
          notification_workout_time: notifs.workout_reminder_time,
          notification_daily_nutrition: notifs.daily_nutrition,
          notification_weekly_summary: notifs.weekly_summary,
        }),
      })
      if (!res.ok) throw new Error()
      showToast(t('settings.saveSuccess'))
    } catch {
      showToast(t('settings.saveError'), 'error')
    } finally {
      setSaving(s => ({ ...s, notifs: false }))
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      logout()
      navigate('/onboarding')
    } catch {
      showToast(t('settings.saveError'), 'error')
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner" />
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="settings-layout">

        {/* ── Profile ── */}
        <SettingsCard title={t('settings.profile')} description={t('settings.profileDesc')}>
          <div className="settings-form-grid">
            <div className="form-group">
              <label className="form-label">{t('settings.name')}</label>
              <input
                className="input"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.age')}</label>
              <input
                className="input"
                type="number"
                min="1"
                max="120"
                value={profile.age}
                onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                placeholder="e.g. 28"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.heightCm')}</label>
              <input
                className="input"
                type="number"
                min="50"
                max="300"
                value={profile.height_cm}
                onChange={e => setProfile(p => ({ ...p, height_cm: e.target.value }))}
                placeholder="e.g. 175"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.weightKg')}</label>
              <input
                className="input"
                type="number"
                min="20"
                max="500"
                step="0.1"
                value={profile.weight_kg}
                onChange={e => setProfile(p => ({ ...p, weight_kg: e.target.value }))}
                placeholder="e.g. 70"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.gender')}</label>
              <select
                className="input"
                value={profile.gender}
                onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
              >
                <option value="">—</option>
                <option value="male">{t('settings.male')}</option>
                <option value="female">{t('settings.female')}</option>
                <option value="other">{t('settings.preferNotToSay')}</option>
              </select>
            </div>
          </div>
          <div className="settings-card-footer">
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving.profile}>
              {saving.profile ? '...' : t('settings.saveProfile')}
            </button>
          </div>
        </SettingsCard>

        {/* ── Goals ── */}
        <SettingsCard title={t('settings.goals')} description={t('settings.goalsDesc')}>
          <div className="settings-form-grid">
            <div className="form-group">
              <label className="form-label">{t('settings.calorieGoal')}</label>
              <input
                className="input"
                type="number"
                min="500"
                max="10000"
                value={goals.calorie_goal}
                onChange={e => setGoals(g => ({ ...g, calorie_goal: Number(e.target.value) }))}
              />
              <span className="settings-hint">kcal / day</span>
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.proteinGoal')}</label>
              <input
                className="input"
                type="number"
                min="10"
                max="500"
                value={goals.protein_goal}
                onChange={e => setGoals(g => ({ ...g, protein_goal: Number(e.target.value) }))}
              />
              <span className="settings-hint">grams / day</span>
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.weeklyWorkoutTarget')}</label>
              <input
                className="input"
                type="number"
                min="1"
                max="14"
                value={goals.weekly_workout_target}
                onChange={e => setGoals(g => ({ ...g, weekly_workout_target: Number(e.target.value) }))}
              />
              <span className="settings-hint">workouts / week</span>
            </div>
          </div>
          <div className="settings-card-footer">
            <button className="btn btn-primary" onClick={saveGoals} disabled={saving.goals}>
              {saving.goals ? '...' : t('settings.saveGoals')}
            </button>
          </div>
        </SettingsCard>

        {/* ── Preferences ── */}
        <SettingsCard title={t('settings.preferences')} description={t('settings.preferencesDesc')}>
          <div className="settings-pref-list">
            <div className="settings-pref-row">
              <span className="settings-pref-label">{t('settings.language')}</span>
              <div className="pref-toggle-group">
                <button
                  className={`pref-toggle-btn${prefs.language === 'en' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, language: 'en' }))}
                >
                  English
                </button>
                <button
                  className={`pref-toggle-btn${prefs.language === 'he' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, language: 'he' }))}
                >
                  עברית
                </button>
              </div>
            </div>

            <div className="settings-pref-row">
              <span className="settings-pref-label">{t('settings.unitsWeight')}</span>
              <div className="pref-toggle-group">
                <button
                  className={`pref-toggle-btn${prefs.units_weight === 'kg' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, units_weight: 'kg' }))}
                >
                  kg
                </button>
                <button
                  className={`pref-toggle-btn${prefs.units_weight === 'lbs' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, units_weight: 'lbs' }))}
                >
                  lbs
                </button>
              </div>
            </div>

            <div className="settings-pref-row">
              <span className="settings-pref-label">{t('settings.unitsDistance')}</span>
              <div className="pref-toggle-group">
                <button
                  className={`pref-toggle-btn${prefs.units_distance === 'km' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, units_distance: 'km' }))}
                >
                  km
                </button>
                <button
                  className={`pref-toggle-btn${prefs.units_distance === 'miles' ? ' active' : ''}`}
                  onClick={() => setPrefs(p => ({ ...p, units_distance: 'miles' }))}
                >
                  miles
                </button>
              </div>
            </div>

            <div className="settings-pref-row settings-pref-row-disabled">
              <span className="settings-pref-label">
                {t('settings.theme')}
                <ComingSoonBadge label={t('settings.comingSoon')} />
              </span>
              <div className="pref-toggle-group">
                <button className="pref-toggle-btn active" disabled>Light</button>
                <button className="pref-toggle-btn" disabled>Dark</button>
              </div>
            </div>
          </div>
          <div className="settings-card-footer">
            <button className="btn btn-primary" onClick={savePreferences} disabled={saving.prefs}>
              {saving.prefs ? '...' : t('settings.savePreferences')}
            </button>
          </div>
        </SettingsCard>

        {/* ── Notifications ── */}
        <SettingsCard title={t('settings.notifications')} description={t('settings.notificationsDesc')}>
          <div className="settings-notif-list">
            <div className="settings-notif-row">
              <div className="settings-notif-info">
                <span className="settings-notif-label">{t('settings.workoutReminder')}</span>
                <span className="settings-notif-sub">Get reminded before your scheduled workouts</span>
              </div>
              <ToggleSwitch
                id="workout-reminder"
                checked={notifs.workout_reminder}
                onChange={v => setNotifs(n => ({ ...n, workout_reminder: v }))}
              />
            </div>
            {notifs.workout_reminder && (
              <div className="settings-notif-sub-row">
                <label className="form-label">{t('settings.workoutReminderTime')}</label>
                <input
                  className="input settings-time-input"
                  type="time"
                  value={notifs.workout_reminder_time}
                  onChange={e => setNotifs(n => ({ ...n, workout_reminder_time: e.target.value }))}
                />
              </div>
            )}

            <div className="settings-notif-divider" />

            <div className="settings-notif-row">
              <div className="settings-notif-info">
                <span className="settings-notif-label">{t('settings.dailyNutrition')}</span>
                <span className="settings-notif-sub">Remind you to log your daily meals</span>
              </div>
              <ToggleSwitch
                id="daily-nutrition"
                checked={notifs.daily_nutrition}
                onChange={v => setNotifs(n => ({ ...n, daily_nutrition: v }))}
              />
            </div>

            <div className="settings-notif-divider" />

            <div className="settings-notif-row">
              <div className="settings-notif-info">
                <span className="settings-notif-label">{t('settings.weeklySummary')}</span>
                <span className="settings-notif-sub">Receive a weekly overview of your progress</span>
              </div>
              <ToggleSwitch
                id="weekly-summary"
                checked={notifs.weekly_summary}
                onChange={v => setNotifs(n => ({ ...n, weekly_summary: v }))}
              />
            </div>
          </div>
          <div className="settings-card-footer">
            <button className="btn btn-primary" onClick={saveNotifications} disabled={saving.notifs}>
              {saving.notifs ? '...' : t('settings.saveNotifications')}
            </button>
          </div>
        </SettingsCard>

        {/* ── Connected Devices ── */}
        <SettingsCard title={t('settings.connectedDevices')} description={t('settings.connectedDevicesDesc')}>
          <div className="settings-device-list">
            {[
              { name: 'Fitbit', icon: '💪', comingSoon: true },
              { name: 'Apple Health', icon: '❤️', comingSoon: true },
              { name: 'Garmin', icon: '⌚', comingSoon: true },
            ].map(device => (
              <div key={device.name} className="settings-device-row">
                <div className="settings-device-info">
                  <span className="settings-device-icon">{device.icon}</span>
                  <span className="settings-device-name">{device.name}</span>
                  {device.comingSoon && <ComingSoonBadge label={t('settings.comingSoon')} />}
                </div>
                <button className="btn btn-secondary btn-sm" disabled>
                  {t('settings.connect')}
                </button>
              </div>
            ))}

            <div className="settings-device-row">
              <div className="settings-device-info">
                <span className="settings-device-icon">📅</span>
                <span className="settings-device-name">Google Calendar</span>
                {googleConnected && (
                  <span className="badge-connected">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {t('settings.connected')}
                  </span>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" disabled>
                {googleConnected ? t('settings.disconnect') : t('settings.connect')}
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* ── Account ── */}
        <SettingsCard title={t('settings.account')} description={t('settings.accountDesc')}>
          <div className="settings-account-list">
            <div className="settings-account-row">
              <div className="settings-account-info">
                <span className="settings-account-label">{t('settings.changePassword')}</span>
              </div>
              <button className="btn btn-secondary btn-sm" disabled>
                {t('settings.comingSoon')}
              </button>
            </div>
            <div className="settings-account-divider" />
            <div className="settings-account-row">
              <div className="settings-account-info">
                <span className="settings-account-label">{t('settings.exportData')}</span>
              </div>
              <button className="btn btn-secondary btn-sm" disabled>
                {t('settings.comingSoon')}
              </button>
            </div>
            <div className="settings-account-divider" />
            <div className="settings-account-row">
              <div className="settings-account-info">
                <span className="settings-account-label settings-danger-label">{t('settings.deleteAccount')}</span>
                <span className="settings-account-sub">{t('settings.deleteAccountWarning')}</span>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </SettingsCard>

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('settings.deleteConfirmTitle')}</h3>
            </div>
            <div className="modal-body">
              <p>{t('settings.deleteConfirmText')}</p>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
                <input
                  className="input"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
              >
                {t('settings.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                {t('settings.deleteConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
