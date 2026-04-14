import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
  Fab,
  Alert,
  Snackbar
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  FitnessCenter as FitnessIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as LightbulbIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Progress = () => {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const [stats, setStats] = useState(null)
  const [bodyMetrics, setBodyMetrics] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [activeChallenges, setActiveChallenges] = useState([])
  const [challengeProgress, setChallengeProgress] = useState([])
  const [insights, setInsights] = useState([])
  const [socialProof, setSocialProof] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [openLogModal, setOpenLogModal] = useState(false)
  const [logData, setLogData] = useState({
    weight_kg: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    energy_level: '',
    notes: ''
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  const loadData = async () => {
    try {
      const [
        statsRes,
        metricsRes,
        workoutsRes,
        activeChallengesRes,
        challengeProgressRes,
        insightsRes,
        socialRes,
        countdownRes
      ] = await Promise.all([
        axios.get(`/api/progress/stats?user_id=${userId}`),
        axios.get(`/api/progress/body-metrics?user_id=${userId}`),
        axios.get(`/api/workouts/${userId}`),
        axios.get('/api/progress/challenges'),
        axios.get(`/api/progress/user-challenges?user_id=${userId}`),
        axios.get(`/api/progress/insights?user_id=${userId}`),
        axios.get('/api/progress/social-proof'),
        axios.get(`/api/progress/countdown?user_id=${userId}`)
      ])

      setStats(statsRes.data)
      
      // Handle body metrics - could be array or wrapped in object
      const metricsData = metricsRes.data
      if (Array.isArray(metricsData)) {
        setBodyMetrics(metricsData)
      } else if (metricsData?.data && Array.isArray(metricsData.data)) {
        setBodyMetrics(metricsData.data)
      } else {
        setBodyMetrics([])
      }
      
      setWorkouts(workoutsRes.data?.workouts || [])
      
      // Handle challenges - could be array or wrapped in object
      const challengesData = activeChallengesRes.data
      if (Array.isArray(challengesData)) {
        setActiveChallenges(challengesData)
      } else if (challengesData?.data && Array.isArray(challengesData.data)) {
        setActiveChallenges(challengesData.data)
      } else {
        setActiveChallenges([])
      }
      
      // Handle challenge progress
      const progressData = challengeProgressRes.data
      if (Array.isArray(progressData)) {
        setChallengeProgress(progressData)
      } else if (progressData?.data && Array.isArray(progressData.data)) {
        setChallengeProgress(progressData.data)
      } else {
        setChallengeProgress([])
      }
      
      setInsights(insightsRes.data?.insights || [])
      setSocialProof(socialRes.data || {})
      setCountdown(countdownRes.data || {})
    } catch (error) {
      console.error('Error loading progress data:', error)
      // Set defaults on error
      setBodyMetrics([])
      setWorkouts([])
      setActiveChallenges([])
      setChallengeProgress([])
      setInsights([])
    }
  }

  const handleLogSubmit = async () => {
    try {
      await axios.post('/api/progress/body-metrics', {
        user_id: userId,
        ...logData
      })

      setSnackbar({
        open: true,
        message: 'Progress logged successfully!',
        severity: 'success'
      })
      setOpenLogModal(false)
      setLogData({
        weight_kg: '',
        chest_cm: '',
        waist_cm: '',
        hips_cm: '',
        energy_level: '',
        notes: ''
      })
      loadData() // Refresh data
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error logging progress',
        severity: 'error'
      })
    }
  }

  const getWorkoutIntensityData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    const data = last30Days.map(date => {
      const dayWorkouts = workouts.filter(w => w.date === date && w.status === 'completed')
      const avgIntensity = dayWorkouts.length > 0
        ? dayWorkouts.reduce((sum, w) => sum + (w.intensity || 0), 0) / dayWorkouts.length
        : 0

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        intensity: Math.round(avgIntensity),
        workouts: dayWorkouts.length
      }
    })

    if (workouts.length === 0) {
      return [
        { date: 'Apr 1', intensity: 45 },
        { date: 'Apr 8', intensity: 52 },
        { date: 'Apr 15', intensity: 58 },
        { date: 'Apr 22', intensity: 63 },
        { date: 'Apr 29', intensity: 68 }
      ]
    }

    return data
  }

  const getWeeklyWorkoutData = () => {
    if (workouts.length === 0) {
      return [
        { week: 'Week 1', workouts: 2 },
        { week: 'Week 2', workouts: 3 },
        { week: 'Week 3', workouts: 4 },
        { week: 'Week 4', workouts: 3 }
      ]
    }

    const weeks = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date)
        return workoutDate >= weekStart && workoutDate <= weekEnd && w.status === 'completed'
      })

      weeks.push({
        week: `Week ${12 - i}`,
        workouts: weekWorkouts.length
      })
    }
    return weeks
  }

  const getBeforeAfterData = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentMonthCount = workouts.filter((w) => {
      const date = new Date(w.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentDate.getFullYear() && w.status === 'completed'
    }).length
    const previousMonthCount = workouts.filter((w) => {
      const date = new Date(w.date)
      const year = currentMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()
      return date.getMonth() === previousMonth && date.getFullYear() === year && w.status === 'completed'
    }).length

    return [
      { period: 'Last Month', value: previousMonthCount },
      { period: 'This Month', value: currentMonthCount }
    ]
  }

  const getBodyMetricsData = () => {
    // Ensure bodyMetrics is an array
    const metricsArray = Array.isArray(bodyMetrics) ? bodyMetrics : []
    
    if (metricsArray.length === 0) {
      return [
        { date: 'Apr 1', weight: 78, waist: 88, energy: 6 },
        { date: 'Apr 8', weight: 77.2, waist: 87, energy: 7 },
        { date: 'Apr 15', weight: 76.4, waist: 86, energy: 7 },
        { date: 'Apr 22', weight: 75.8, waist: 85.5, energy: 8 },
        { date: 'Apr 29', weight: 75.0, waist: 85, energy: 8 }
      ]
    }

    return metricsArray.map(metric => ({
      date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: metric.weight_kg || 0,
      chest: metric.chest_cm || 0,
      waist: metric.waist_cm || 0,
      hips: metric.hips_cm || 0,
      energy: metric.energy_level || 0
    }))
  }

  const getLevelInfo = () => {
    if (!stats?.level) return null

    const levels = [
      { name: 'Beginner', color: '#9E9E9E', icon: '🌱' },
      { name: 'Intermediate', color: '#2196F3', icon: '⚡' },
      { name: 'Advanced', color: '#FF9800', icon: '🔥' },
      { name: 'Elite', color: '#E91E63', icon: '👑' }
    ]

    const currentLevelIndex = levels.findIndex(l => l.name === stats.level.current?.name)
    return {
      ...stats.level,
      color: levels[currentLevelIndex]?.color || '#9E9E9E',
      icon: levels[currentLevelIndex]?.icon || '🌱'
    }
  }

  const levelInfo = getLevelInfo()

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {t('progress.title', 'Progress Dashboard')}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FitnessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="text.secondary">
                  {t('progress.thisWeek', 'This Week')}
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.workouts_this_week || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.workouts', 'workouts')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="text.secondary">
                  {t('progress.thisMonth', 'This Month')}
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.workouts_this_month || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.workouts', 'workouts')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrophyIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="text.secondary">
                  {t('progress.currentStreak', 'Current Streak')}
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.current_streak || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.days', 'days')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StarIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" color="text.secondary">
                  {t('progress.level', 'Level')}
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {levelInfo?.icon} {levelInfo?.current?.name || 'Beginner'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={levelInfo?.progress || 0}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('progress.personalRecord', 'Personal Record')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.personal_records?.max_intensity ? `${stats.personal_records.max_intensity}%` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.bestEms', 'Best EMS intensity')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('progress.personalRecord', 'Personal Record')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.personal_records?.max_distance ? `${stats.personal_records.max_distance} km` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.longestRun', 'Longest run')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('progress.personalRecord', 'Personal Record')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.personal_records?.max_weight ? `${stats.personal_records.max_weight} kg` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('progress.heaviestLift', 'Heaviest lift')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.workoutIntensity', 'Workout Intensity Over Time')}
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getWorkoutIntensityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="intensity"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="EMS Intensity %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.weeklyWorkouts', 'Workouts Per Week')}
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeeklyWorkoutData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="workouts" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.beforeAfter', 'Last Month vs This Month')}
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBeforeAfterData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Body Metrics Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('progress.bodyMetrics', 'Body Metrics Over Time')}
            {stats?.weight_change && (
              <Chip
                label={`${stats.weight_change > 0 ? '+' : ''}${stats.weight_change.toFixed(1)}kg since you started`}
                color={stats.weight_change > 0 ? 'warning' : 'success'}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getBodyMetricsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                <Line type="monotone" dataKey="waist" stroke="#82ca9d" name="Waist (cm)" />
                <Line type="monotone" dataKey="energy" stroke="#ffc658" name="Energy Level" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Challenges */}
      {activeChallenges.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('progress.challenges', 'Active Challenges')}
            </Typography>
            <Grid container spacing={2}>
              {activeChallenges.map((challenge) => {
                const progress = challengeProgress.find((item) => item.challenge.id === challenge.id)
                const currentValue = progress?.current_value || 0
                const percent = Math.min((currentValue / challenge.target_value) * 100, 100)
                return (
                  <Grid item xs={12} md={6} key={challenge.id}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {challenge.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {challenge.description}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2">
                        {currentValue} / {challenge.target_value} {challenge.unit}
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Insights and Social Proof */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  {t('progress.smartInsights', 'Smart Insights')}
                </Typography>
              </Box>
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {insight}
                  </Alert>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('progress.noInsights', 'Complete more workouts to see insights!')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">
                  {t('progress.socialProof', 'Community')}
                </Typography>
              </Box>
              {socialProof && (
                <Alert severity="success">
                  {socialProof.message}
                </Alert>
              )}

              {countdown && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">
                      {t('progress.nextWorkout', 'Next Workout')}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {countdown.message}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="log progress"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => setOpenLogModal(true)}
      >
        <AddIcon />
      </Fab>

      {/* Log Progress Modal */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('progress.logToday', 'Log Today\'s Progress')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('progress.weightKg', 'Weight (kg)')}
                type="number"
                value={logData.weight_kg}
                onChange={(e) => setLogData({ ...logData, weight_kg: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('progress.energyLevel', 'Energy Level (1-10)')}
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={logData.energy_level}
                onChange={(e) => setLogData({ ...logData, energy_level: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('progress.chestCm', 'Chest (cm)')}
                type="number"
                value={logData.chest_cm}
                onChange={(e) => setLogData({ ...logData, chest_cm: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('progress.waistCm', 'Waist (cm)')}
                type="number"
                value={logData.waist_cm}
                onChange={(e) => setLogData({ ...logData, waist_cm: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('progress.hipsCm', 'Hips (cm)')}
                type="number"
                value={logData.hips_cm}
                onChange={(e) => setLogData({ ...logData, hips_cm: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('progress.notes', 'Notes')}
                multiline
                rows={3}
                value={logData.notes}
                onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogModal(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleLogSubmit} variant="contained" color="primary">
            {t('progress.save', 'Save Progress')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Progress