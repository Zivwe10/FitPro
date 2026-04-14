import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const todayISO = new Date().toISOString().slice(0, 10)

const formatDay = (dateString) => new Date(dateString).toLocaleDateString(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const buildWeek = (baseDate = new Date(), offset = 0) => {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + offset * 7)

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(date)
    current.setDate(date.getDate() + index)
    const iso = current.toISOString().slice(0, 10)
    return {
      iso,
      abbr: current.toLocaleDateString(undefined, { weekday: 'short' }),
      dateText: current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullLabel: current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      date: current,
    }
  })
}

const WORKOUT_FIELD_CONFIG = {
  EMS: [
    { name: 'intensity', label: 'Intensity (%)', type: 'number', step: '1' },
    { name: 'frequency', label: 'Frequency (Hz)', type: 'number', step: '1' },
    { name: 'duration', label: 'Duration (min)', type: 'number', step: '1' },
    { name: 'muscle_groups', label: 'Muscle groups', type: 'text' },
  ],
  RUNNING: [
    { name: 'distance', label: 'Distance (km)', type: 'number', step: '0.1' },
    { name: 'speed', label: 'Speed (km/h)', type: 'number', step: '0.1' },
    { name: 'duration', label: 'Duration (min)', type: 'number', step: '1' },
    { name: 'calories', label: 'Calories', type: 'number', step: '1' },
    { name: 'heart_rate', label: 'Heart rate', type: 'number', step: '1' },
  ],
  WEIGHTS: [
    { name: 'sets', label: 'Sets', type: 'number', step: '1' },
    { name: 'reps', label: 'Reps', type: 'number', step: '1' },
    { name: 'weight', label: 'Weight (kg)', type: 'number', step: '0.5' },
    { name: 'duration', label: 'Duration (min)', type: 'number', step: '1' },
  ],
  CYCLING: [
    { name: 'distance', label: 'Distance (km)', type: 'number', step: '0.1' },
    { name: 'pace', label: 'Pace', type: 'text' },
    { name: 'duration', label: 'Duration (min)', type: 'number', step: '1' },
    { name: 'calories', label: 'Calories', type: 'number', step: '1' },
  ],
  YOGA: [
    { name: 'duration', label: 'Duration (min)', type: 'number', step: '1' },
    { name: 'style', label: 'Style', type: 'text' },
  ],
}

const getWorkoutType = (exercise) => {
  const normalized = exercise?.toLowerCase() || ''
  if (/ems|electro|e-stim/.test(normalized)) return 'EMS'
  if (/treadmill|running|run|jog|sprint/.test(normalized)) return 'RUNNING'
  if (/cycle|cycling|bike|biking/.test(normalized)) return 'CYCLING'
  if (/yoga|stretch|pilates/.test(normalized)) return 'YOGA'
  return 'WEIGHTS'
}

const EXTRACTED_LABELS = {
  exercise: 'Exercise',
  workout_type: 'Workout Type',
  duration: 'Duration',
  intensity: 'Intensity',
  frequency: 'Frequency',
  muscle_groups: 'Muscle Groups',
  distance: 'Distance',
  speed: 'Speed',
  calories: 'Calories',
  heart_rate: 'Heart Rate',
  pace: 'Pace',
  style: 'Style',
  notes: 'Notes',
}

function Workouts() {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [formData, setFormData] = useState({
    exercise: '',
    sets: 3,
    reps: 8,
    weight: 10,
    duration: 30,
    intensity: '',
    frequency: '',
    muscle_groups: '',
    distance: '',
    speed: '',
    calories: '',
    heart_rate: '',
    pace: '',
    style: '',
    date: todayISO,
    notes: '',
  })
  const [plannerDate, setPlannerDate] = useState(null)
  const [plannerForm, setPlannerForm] = useState({
    exercise: '',
    sets: 3,
    reps: 8,
    weight: 10,
    notes: '',
  })
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = useMemo(() => buildWeek(new Date(), weekOffset), [weekOffset])

  useEffect(() => {
    if (!userId) return
    loadWorkouts()
  }, [userId])

  const loadWorkouts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts/${userId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load workouts')
      setWorkouts(data.workouts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'exercise' ? { duration: 30, intensity: '', frequency: '', muscle_groups: '', distance: '', speed: '', calories: '', heart_rate: '', pace: '', style: '' } : {}),
    }))
    if (name === 'exercise') {
      setExtractedData(null)
      setSelectedImageName('')
      setScanError('')
    }
  }

  const handlePlannerChange = (event) => {
    const { name, value } = event.target
    setPlannerForm((prev) => ({ ...prev, [name]: value }))
  }

  const getWorkoutTypeLabel = (type) => {
    switch (type) {
      case 'EMS':
        return 'EMS'
      case 'RUNNING':
        return 'Treadmill / Running'
      case 'CYCLING':
        return 'Cycling'
      case 'YOGA':
        return 'Yoga / Stretching'
      default:
        return 'Weights / Strength'
    }
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setScanError('')
    setScanLoading(true)
    setSelectedImageName(file.name)
    setExtractedData(null)

    try {
      const payload = new FormData()
      payload.append('image', file)

      const response = await axios.post(`${API_BASE_URL}/api/extract-workout-image`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.error) {
        setScanError(response.data.error)
      } else {
        setExtractedData(response.data.extracted_data || {})
      }
    } catch (err) {
      setScanError(err.response?.data?.error || err.message || 'Image scan failed')
    } finally {
      setScanLoading(false)
    }
  }

  const applyExtractedData = () => {
    if (!extractedData) return
    setFormData((prev) => ({
      ...prev,
      exercise: extractedData.exercise || prev.exercise,
      duration: extractedData.duration ?? prev.duration,
      intensity: extractedData.intensity ?? prev.intensity,
      frequency: extractedData.frequency ?? prev.frequency,
      muscle_groups: extractedData.muscle_groups ?? prev.muscle_groups,
      distance: extractedData.distance ?? prev.distance,
      speed: extractedData.speed ?? prev.speed,
      calories: extractedData.calories ?? prev.calories,
      heart_rate: extractedData.heart_rate ?? prev.heart_rate,
      pace: extractedData.pace ?? prev.pace,
      style: extractedData.style ?? prev.style,
      notes: extractedData.notes ?? prev.notes,
    }))
    setExtractedData(null)
  }

  const saveWorkout = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to save workout')
    return data.workout
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const workout = await saveWorkout({
        user_id: userId,
        exercise: formData.exercise,
        sets: Number(formData.sets),
        reps: Number(formData.reps),
        weight: Number(formData.weight),
        duration: Number(formData.duration),
        intensity: formData.intensity,
        frequency: formData.frequency,
        muscle_groups: formData.muscle_groups,
        distance: formData.distance,
        speed: formData.speed,
        calories: formData.calories,
        heart_rate: formData.heart_rate,
        pace: formData.pace,
        style: formData.style,
        date: formData.date,
        notes: formData.notes,
        status: 'completed',
      })
      setWorkouts((prev) => [workout, ...prev])
      setFormData({ ...formData, exercise: '', notes: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (workoutId) => {
    try {
      await fetch(`${API_BASE_URL}/api/workouts/${workoutId}`, { method: 'DELETE' })
      setWorkouts((prev) => prev.filter((item) => item.id !== workoutId))
    } catch (err) {
      setError('Unable to delete workout')
    }
  }

  const handleStatusUpdate = async (workoutId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update status')
      setWorkouts((prev) => prev.map((item) => (item.id === workoutId ? data.workout : item)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSyncToCalendar = async (workoutId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts/${workoutId}/sync-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to sync to calendar')
      
      // Update the workout in the list
      setWorkouts((prev) => prev.map((item) => 
        item.id === workoutId 
          ? { ...item, calendar_synced: true, google_event_id: data.event_id }
          : item
      ))
      
      alert('Workout synced to calendar!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePlanForDay = (date) => {
    setPlannerDate(date)
    setPlannerForm({ exercise: '', sets: 3, reps: 8, weight: 10, notes: '' })
  }

  const handlePlannerSubmit = async (event) => {
    event.preventDefault()
    if (!plannerDate) return
    setError('')
    try {
      const workout = await saveWorkout({
        user_id: userId,
        exercise: plannerForm.exercise,
        sets: Number(plannerForm.sets),
        reps: Number(plannerForm.reps),
        weight: Number(plannerForm.weight),
        date: plannerDate,
        notes: plannerForm.notes,
        status: 'planned',
      })
      setWorkouts((prev) => [workout, ...prev])
      setPlannerDate(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleSync = () => {
    alert(t('workouts.syncGoogleCalendarSoon'))
  }

  const workoutsByDate = useMemo(() => {
    return workouts.reduce((groups, workout) => {
      const dateKey = workout.date
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(workout)
      return groups
    }, {})
  }, [workouts])

  const summaryByDay = useMemo(() => {
    const today = new Date(todayISO)
    return weekDays.map((day) => {
      const dayWorkouts = workouts.filter((workout) => workout.date === day.iso)
      const completed = dayWorkouts.filter((item) => item.status === 'completed').length
      const planned = dayWorkouts.filter((item) => item.status === 'planned').length
      const missed = dayWorkouts.filter((item) => item.status === 'planned' && new Date(item.date) < today).length
      return { ...day, completed, planned, missed }
    })
  }, [weekDays, workouts])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('workouts.title')}</h1>
        <p className="page-subtitle">{t('workouts.subtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="workouts-grid">
        <section className="card workout-form-card">
          <div className="card-content">
            <div className="section-heading">
              <div>
                <h3>{t('workouts.logWorkout')}</h3>
                <p className="section-subtitle">{t('workouts.logWorkoutDesc')}</p>
              </div>
            </div>

            <div className="scan-banner">
              <h4>📸 {t('workouts.scanBanner')}</h4>
              <div className="device-icons">
                <span className="device-icon">⚡</span>
                <span className="device-icon">🏃‍♂️</span>
                <span className="device-icon">🚴‍♂️</span>
                <span className="device-icon">⌚</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="workout-form">
              <label className="form-label">
                {t('workouts.exercise')}
                <input
                  name="exercise"
                  value={formData.exercise}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('workouts.exercisePlaceholder')}
                  required
                />
              </label>

              <div className="form-inline-row">
                <button
                  type="button"
                  className="btn-scan-large"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  <span className="camera-icon">📷</span>
                  {t('workouts.scanDeviceScreen')}
                </button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {selectedImageName && <span className="upload-meta">{selectedImageName}</span>}
                {scanLoading && <span className="loading-text">{t('workouts.analyzingImage')}</span>}
              </div>
              {scanError && <div className="error-message">{scanError}</div>}

              {formData.exercise && (
                <div className={`workout-type-badge ${getWorkoutType(formData.exercise).toLowerCase()}`}>
                  {getWorkoutTypeLabel(getWorkoutType(formData.exercise))} workout detected - showing {getWorkoutTypeLabel(getWorkoutType(formData.exercise))} fields
                </div>
              )}

              <div className="form-meta-row">
                <strong>Detected workout type: {getWorkoutTypeLabel(getWorkoutType(formData.exercise))}</strong>
              </div>

              {getWorkoutType(formData.exercise) === 'WEIGHTS' ? (
                <div className="field-group">
                  <div className="workout-number-row">
                    <label className="form-label">
                      {t('workouts.sets')}
                      <input
                        type="number"
                        name="sets"
                        min="1"
                        value={formData.sets}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </label>
                    <label className="form-label">
                      {t('workouts.reps')}
                      <input
                        type="number"
                        name="reps"
                        min="1"
                        value={formData.reps}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </label>
                    <label className="form-label">
                      {t('workouts.weight')}
                      <input
                        type="number"
                        name="weight"
                        min="0"
                        step="0.5"
                        value={formData.weight}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </label>
                    <label className="form-label">
                      Duration (min)
                      <input
                        type="number"
                        name="duration"
                        min="1"
                        step="1"
                        value={formData.duration}
                        onChange={handleChange}
                        className="input"
                      />
                    </label>
                  </div>
                  <div className="field-explanation">
                    {t('workouts.fieldExplanations.weights')}
                  </div>
                </div>
              ) : (
                <div className="field-group">
                  <div className="workout-number-row">
                    {WORKOUT_FIELD_CONFIG[getWorkoutType(formData.exercise)].map((field) => (
                      <label className="form-label" key={field.name}>
                        {field.label}
                        <input
                          type={field.type}
                          name={field.name}
                          min={field.step === '1' ? '0' : undefined}
                          step={field.step}
                          value={formData[field.name] ?? ''}
                          onChange={handleChange}
                          className="input"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="field-explanation">
                    {(() => {
                      const type = getWorkoutType(formData.exercise)
                      switch (type) {
                        case 'WEIGHTS': return t('workouts.fieldExplanations.weights')
                        case 'EMS': return t('workouts.fieldExplanations.ems')
                        case 'RUNNING': return t('workouts.fieldExplanations.running')
                        case 'CYCLING': return t('workouts.fieldExplanations.cycling')
                        case 'YOGA': return t('workouts.fieldExplanations.yoga')
                        default: return ''
                      }
                    })()}
                  </div>
                </div>
              )}
              <label className="form-label">
                {t('workouts.date')}
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </label>

              <label className="form-label">
                {t('workouts.notes')} ({t('workouts.optional')})
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input textarea-input"
                  rows="4"
                />
              </label>

              {extractedData && (
                <div className="extracted-preview-card">
                  <h4>Extracted workout data</h4>
                  {Object.keys(extractedData).length ? (
                    Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="extracted-row">
                        <strong>{EXTRACTED_LABELS[key] || key}:</strong> {value?.toString() || '—'}
                      </div>
                    ))
                  ) : (
                    <div>No extracted values found.</div>
                  )}
                  <div className="extracted-actions">
                    <button type="button" className="btn btn-secondary" onClick={applyExtractedData}>
                      Apply extracted data to form
                    </button>
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-full" type="submit">
                {t('workouts.addWorkout')}
              </button>
            </form>
          </div>
        </section>

        <section className="card workout-history-card">
          <div className="card-content">
            <div className="section-heading">
              <div>
                <h3>{t('workouts.history')}</h3>
                <p className="section-subtitle">{t('workouts.historyDesc')}</p>
              </div>
            </div>

            {loading ? (
              <div className="loader">{t('common.loading')}</div>
            ) : (
              Object.keys(workoutsByDate).length ? (
                Object.entries(workoutsByDate).map(([date, entries]) => (
                  <div key={date} className="history-group">
                    <div className="group-header">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    {entries.map((entry) => (
                      <div key={entry.id} className="history-card">
                        <div>
                          <div className="history-title">{entry.exercise}</div>
                          <div className="history-meta">
                            {entry.sets} x {entry.reps} · {entry.weight} kg
                          </div>
                        </div>
                        <div className="history-actions">
                          <span className={`status-pill status-${entry.status}`}>
                            {t(`workouts.status.${entry.status}`)}
                          </span>
                          {entry.status === 'planned' && (
                            <>
                              <button className="text-button" onClick={() => handleSyncToCalendar(entry.id)}>
                                {entry.calendar_synced ? '🔄 Re-sync' : '📅 Sync'}
                              </button>
                              <button className="text-button" onClick={() => handleStatusUpdate(entry.id, 'completed')}>
                                {t('workouts.markCompleted')}
                              </button>
                            </>
                          )}
                          <button className="text-button" onClick={() => handleDelete(entry.id)}>
                            {t('workouts.delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="empty-state">{t('workouts.noHistory')}</div>
              )
            )}
          </div>
        </section>
      </div>

      <section className="card planner-card">
        <div className="card-content">
          <div className="planner-header-row">
            <div>
              <h3>{t('workouts.weeklyPlanner')}</h3>
              <p className="section-subtitle">{t('workouts.weeklyPlannerDesc')}</p>
            </div>
            <div className="planner-header-actions">
              <button className="btn btn-secondary btn-calendar" onClick={handleGoogleSync}>
                {t('workouts.syncGoogleCalendar')}
              </button>
              <div className="week-nav-controls">
                <button
                  className="icon-button"
                  onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
                  disabled={weekOffset === 0}
                >
                  ‹
                </button>
                <div className="week-label">
                  {t('workouts.weekOf')} {weekDays[0].fullLabel} – {weekDays[6].fullLabel}
                </div>
                <button className="icon-button" onClick={() => setWeekOffset((prev) => prev + 1)}>
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="planner-quote">{t('workouts.quote')}</div>

          <div className="week-journal-list">
            {weekDays.map((day) => {
              const dayWorkouts = workouts.filter((workout) => workout.date === day.iso)
              const isToday = day.iso === todayISO
              return (
                <div key={day.iso} className={`week-row ${isToday ? 'week-row-today' : ''}`}>
                  <div className="week-row-left">
                    <div className="week-day-abbr">{day.abbr}</div>
                    <div className="week-day-small-date">{day.dateText}</div>
                  </div>
                  <div className="week-row-tags">
                    {dayWorkouts.length > 0 ? (
                      dayWorkouts.map((item) => {
                        const status = item.status === 'planned' && new Date(item.date) < new Date(todayISO)
                          ? 'missed'
                          : item.status
                        const pillClass = status === 'completed'
                          ? 'pill pill-completed'
                          : status === 'missed'
                            ? 'pill pill-missed'
                            : 'pill pill-planned'
                        return (
                          <span key={item.id} className={pillClass}>
                            {item.exercise}
                          </span>
                        )
                      })
                    ) : (
                      <span className="pill pill-planned-empty">{t('workouts.noWorkouts')}</span>
                    )}
                  </div>
                  <button className="btn btn-add-row" onClick={() => handlePlanForDay(day.iso)}>
                    + {t('workouts.add')}
                  </button>
                </div>
              )
            })}
          </div>

          {plannerDate && (
            <div className="planner-form-card">
              <h4>{t('workouts.planFor')} {new Date(plannerDate).toLocaleDateString()}</h4>
              <form onSubmit={handlePlannerSubmit} className="planner-form">
                <div className="planner-row">
                  <label className="form-label">
                    {t('workouts.exercise')}
                    <input
                      name="exercise"
                      value={plannerForm.exercise}
                      onChange={handlePlannerChange}
                      className="input"
                      required
                    />
                  </label>
                  <label className="form-label">
                    {t('workouts.sets')}
                    <input
                      type="number"
                      name="sets"
                      min="1"
                      value={plannerForm.sets}
                      onChange={handlePlannerChange}
                      className="input"
                      required
                    />
                  </label>
                </div>
                <div className="planner-row">
                  <label className="form-label">
                    {t('workouts.reps')}
                    <input
                      type="number"
                      name="reps"
                      min="1"
                      value={plannerForm.reps}
                      onChange={handlePlannerChange}
                      className="input"
                      required
                    />
                  </label>
                  <label className="form-label">
                    {t('workouts.weight')}
                    <input
                      type="number"
                      name="weight"
                      min="0"
                      step="0.5"
                      value={plannerForm.weight}
                      onChange={handlePlannerChange}
                      className="input"
                      required
                    />
                  </label>
                </div>
                <label className="form-label">
                  {t('workouts.notes')} ({t('workouts.optional')})
                  <textarea
                    name="notes"
                    value={plannerForm.notes}
                    onChange={handlePlannerChange}
                    className="input textarea-input"
                    rows="3"
                  />
                </label>
                <div className="planner-actions">
                  <button className="btn btn-primary" type="submit">{t('workouts.addPlan')}</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setPlannerDate(null)}>
                    {t('workouts.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Workouts