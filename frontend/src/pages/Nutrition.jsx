import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Divider,
  LinearProgress,
  Chip,
  Snackbar,
  Alert,
  Fab
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Lock as LockIcon
} from '@mui/icons-material'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const DEFAULT_CALORIES_GOAL = 2000
const DEFAULT_PROTEIN_GOAL = 120

const Nutrition = () => {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [weekly, setWeekly] = useState([])
  const [tip, setTip] = useState('')
  const [openFormFor, setOpenFormFor] = useState(null)
  const [formValues, setFormValues] = useState({ food_name: '', calories: '', protein: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Body Metrics Calculator State
  const [bodyMetrics, setBodyMetrics] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    gender: '',
    activity_level: ''
  })
  const [calorieGoal, setCalorieGoal] = useState(DEFAULT_CALORIES_GOAL)

  const formattedDate = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate])

  useEffect(() => {
    if (userId) {
      loadNutritionData()
      loadBodyMetrics()
    }
  }, [userId, formattedDate])

  // Body Metrics Calculator Functions
  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null
    const heightM = height / 100
    return (weight / (heightM * heightM)).toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (!bmi) return { label: '', color: 'grey' }
    const bmiNum = parseFloat(bmi)
    if (bmiNum < 18.5) return { label: 'Underweight', color: 'blue' }
    if (bmiNum < 25) return { label: 'Normal', color: 'green' }
    if (bmiNum < 30) return { label: 'Overweight', color: 'orange' }
    return { label: 'Obese', color: 'red' }
  }

  const calculateBMR = (height, weight, age, gender) => {
    if (!height || !weight || !age || !gender) return null
    // Mifflin-St Jeor Equation
    const base = 10 * weight + 6.25 * height - 5 * age
    return gender === 'male' ? base + 5 : base - 161
  }

  const calculateTDEE = (bmr, activityLevel) => {
    if (!bmr || !activityLevel) return null
    const multipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725
    }
    return Math.round(bmr * (multipliers[activityLevel] || 1.2))
  }

  const loadBodyMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/nutrition/body-metrics?user_id=${userId}`)
      if (response.data && Object.keys(response.data).length > 0) {
        setBodyMetrics({
          height_cm: response.data.height_cm || '',
          weight_kg: response.data.weight_kg || '',
          age: response.data.age || '',
          gender: response.data.gender || '',
          activity_level: response.data.activity_level || ''
        })
      }
    } catch (error) {
      console.error('Error loading body metrics:', error)
    }
  }

  const saveBodyMetrics = async (metrics) => {
    try {
      const payload = { user_id: userId, ...metrics }
      await axios.post(`${API_BASE_URL}/api/nutrition/body-metrics`, payload)
      setSnackbar({ open: true, message: 'Body metrics saved', severity: 'success' })
    } catch (error) {
      console.error('Error saving body metrics:', error)
      setSnackbar({ open: true, message: 'Could not save body metrics', severity: 'error' })
    }
  }

  const handleBodyMetricsChange = (field, value) => {
    const updated = { ...bodyMetrics, [field]: value }
    setBodyMetrics(updated)
    saveBodyMetrics(updated)
  }

  // Calculate metrics for display
  const bmi = calculateBMI(bodyMetrics.height_cm, bodyMetrics.weight_kg)
  const bmiCategory = getBMICategory(bmi)
  const bmr = calculateBMR(bodyMetrics.height_cm, bodyMetrics.weight_kg, bodyMetrics.age, bodyMetrics.gender)
  const tdee = calculateTDEE(bmr, bodyMetrics.activity_level)

  // Update calorie goal when TDEE changes
  useEffect(() => {
    if (tdee) {
      setCalorieGoal(tdee)
    } else {
      setCalorieGoal(DEFAULT_CALORIES_GOAL)
    }
  }, [tdee])

  const formatDisplayDate = (date) =>
    date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  const loadNutritionData = async () => {
    try {
      const [entriesRes, weeklyRes, tipRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/nutrition/entries?user_id=${userId}&date=${formattedDate}`),
        axios.get(`${API_BASE_URL}/api/nutrition/weekly?user_id=${userId}`),
        axios.get(`${API_BASE_URL}/api/nutrition/tip?user_id=${userId}&date=${formattedDate}`)
      ])

      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : [])
      setWeekly(weeklyRes.data?.weekly || [])
      setTip(tipRes.data?.tip || '')
    } catch (error) {
      console.error('Error loading nutrition data:', error)
      setEntries([])
      setWeekly([])
      setTip('')
    }
  }

  const groupedEntries = useMemo(() => {
    return MEAL_SLOTS.reduce((result, meal) => {
      result[meal] = entries.filter((entry) => entry.meal_slot === meal)
      return result
    }, {})
  }, [entries])

  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0)
  const totalProtein = entries.reduce((sum, entry) => sum + (entry.protein || 0), 0)
  const caloriesRatio = Math.min(totalCalories / calorieGoal, 1.2)
  const proteinRatio = Math.min(totalProtein / DEFAULT_PROTEIN_GOAL, 1.2)

  const getBarColor = (ratio) => {
    if (ratio < 0.8) return '#4caf50'
    if (ratio <= 1) return '#ff9800'
    return '#f44336'
  }

  const remainingCalories = Math.max(calorieGoal - totalCalories, 0)
  const remainingProtein = Math.max(DEFAULT_PROTEIN_GOAL - totalProtein, 0)

  const weeklyChartData = weekly.map((item) => ({
    ...item,
    day: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
    today: item.date === formattedDate
  }))

  const handleDateChange = (direction) => {
    setSelectedDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + (direction === 'next' ? 1 : -1))
      return next
    })
  }

  const openAddForm = (meal) => {
    setOpenFormFor(meal)
    setFormValues({ food_name: '', calories: '', protein: '' })
  }

  const closeForm = () => {
    setOpenFormFor(null)
    setFormValues({ food_name: '', calories: '', protein: '' })
  }

  const handleInputChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleAddEntry = async (meal) => {
    if (!formValues.food_name.trim()) {
      setSnackbar({ open: true, message: 'Food name is required', severity: 'error' })
      return
    }

    try {
      const payload = {
        user_id: userId,
        date: formattedDate,
        meal_slot: meal,
        food_name: formValues.food_name.trim(),
        calories: Number(formValues.calories) || 0,
        protein: Number(formValues.protein) || 0
      }
      const response = await axios.post(`${API_BASE_URL}/api/nutrition/entries`, payload)
      setEntries((current) => [...current, response.data])
      setSnackbar({ open: true, message: 'Entry added', severity: 'success' })
      closeForm()
      loadNutritionData()
    } catch (error) {
      console.error(error)
      setSnackbar({ open: true, message: 'Could not save entry', severity: 'error' })
    }
  }

  const handleDeleteEntry = async (entryId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/nutrition/entries/${entryId}?user_id=${userId}`)
      setEntries((current) => current.filter((entry) => entry.id !== entryId))
      setSnackbar({ open: true, message: 'Entry deleted', severity: 'success' })
      loadNutritionData()
    } catch (error) {
      console.error(error)
      setSnackbar({ open: true, message: 'Could not delete entry', severity: 'error' })
    }
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('nutritionPage.title', 'Nutrition Dashboard')}
          </Typography>
          <Typography color="text.secondary">{formatDisplayDate(selectedDate)}</Typography>
        </Box>
        <Box>
          <IconButton onClick={() => handleDateChange('prev')} aria-label="Previous day">
            <ArrowBackIcon />
          </IconButton>
          <IconButton onClick={() => handleDateChange('next')} aria-label="Next day">
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('nutritionPage.dailySummary', 'Daily Summary')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalCalories}</Typography>
                <Typography color="text.secondary">/ {calorieGoal} kcal</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((totalCalories / calorieGoal) * 100, 100)}
                sx={{ height: 10, borderRadius: 5, backgroundColor: '#f0f0f0', '& .MuiLinearProgress-bar': { backgroundColor: getBarColor(totalCalories / calorieGoal) } }}
              />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {remainingCalories} {t('nutritionPage.remaining', 'Remaining')} kcal
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('nutritionPage.totalProtein', 'Total Protein')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalProtein}g</Typography>
                <Typography color="text.secondary">/ {DEFAULT_PROTEIN_GOAL}g</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((totalProtein / DEFAULT_PROTEIN_GOAL) * 100, 100)}
                sx={{ height: 10, borderRadius: 5, backgroundColor: '#f0f0f0', '& .MuiLinearProgress-bar': { backgroundColor: getBarColor(totalProtein / DEFAULT_PROTEIN_GOAL) } }}
              />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {remainingProtein} {t('nutritionPage.remaining', 'Remaining')} g
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('nutritionPage.workoutTip', 'Smart Workout Tip')}
              </Typography>
              <Typography variant="body1" sx={{ minHeight: 48 }}>{tip || t('nutritionPage.generalTip', 'General Eating Tip')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('nutritionPage.foodLog', 'Food Log')}
                  </Typography>
                  <Typography color="text.secondary">{t('nutritionPage.addFood', 'Add food to start tracking')}</Typography>
                </Box>
              </Box>

              {MEAL_SLOTS.map((meal) => (
                <Box key={meal} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{meal}</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => openAddForm(meal)}>
                      {t('nutritionPage.addEntry', 'Add Entry')}
                    </Button>
                  </Box>

                  {(groupedEntries[meal] || []).length === 0 ? (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {t('nutritionPage.noEntries', 'No foods logged yet.')}
                    </Typography>
                  ) : (
                    (groupedEntries[meal] || []).map((entry) => (
                      <Card key={entry.id} variant="outlined" sx={{ mb: 1, p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{entry.food_name}</Typography>
                            <Typography color="text.secondary" variant="body2">
                              {entry.calories} kcal · {entry.protein}g protein
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={() => handleDeleteEntry(entry.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    ))
                  )}

                  {openFormFor === meal && (
                    <Card variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label={t('nutritionPage.foodName', 'Food Name')}
                            value={formValues.food_name}
                            onChange={(event) => handleInputChange('food_name', event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={t('nutritionPage.calories', 'Calories')}
                            value={formValues.calories}
                            onChange={(event) => handleInputChange('calories', event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={t('nutritionPage.protein', 'Protein (g)')}
                            value={formValues.protein}
                            onChange={(event) => handleInputChange('protein', event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button variant="contained" size="small" fullWidth onClick={() => handleAddEntry(meal)}>
                            {t('nutritionPage.addEntry', 'Add Entry')}
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('nutritionPage.weeklyOverview', 'Weekly Calories')}</Typography>
                <Chip label={t('nutritionPage.aiCoach', 'AI Nutrition Coach - Coming Soon')} icon={<LockIcon />} variant="outlined" />
              </Box>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [`${value} kcal`, 'Calories']} />
                    <Bar dataKey="calories" radius={[8, 8, 0, 0]} fill="#7c4dff" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('nutritionPage.bodyMetricsCalculator', 'Body Metrics Calculator')}
                </Typography>
                <Button size="small" color="primary" onClick={() => window.location.href = '/progress'}>
                  {t('nutritionPage.updateWeight', 'Update weight in Progress →')}
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t('nutritionPage.height', 'Height (cm)')}
                    value={bodyMetrics.height_cm}
                    onChange={(e) => handleBodyMetricsChange('height_cm', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t('nutritionPage.weight', 'Weight (kg)')}
                    value={bodyMetrics.weight_kg}
                    onChange={(e) => handleBodyMetricsChange('weight_kg', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t('nutritionPage.age', 'Age')}
                    value={bodyMetrics.age}
                    onChange={(e) => handleBodyMetricsChange('age', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t('nutritionPage.gender', 'Gender')}
                    value={bodyMetrics.gender}
                    onChange={(e) => handleBodyMetricsChange('gender', e.target.value)}
                  >
                    <MenuItem value=""></MenuItem>
                    <MenuItem value="male">{t('nutritionPage.male', 'Male')}</MenuItem>
                    <MenuItem value="female">{t('nutritionPage.female', 'Female')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t('nutritionPage.activityLevel', 'Activity Level')}
                    value={bodyMetrics.activity_level}
                    onChange={(e) => handleBodyMetricsChange('activity_level', e.target.value)}
                  >
                    <MenuItem value=""></MenuItem>
                    <MenuItem value="sedentary">{t('nutritionPage.sedentary', 'Sedentary')}</MenuItem>
                    <MenuItem value="lightly_active">{t('nutritionPage.lightlyActive', 'Lightly active')}</MenuItem>
                    <MenuItem value="moderately_active">{t('nutritionPage.moderatelyActive', 'Moderately active')}</MenuItem>
                    <MenuItem value="very_active">{t('nutritionPage.veryActive', 'Very active')}</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {bmi && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">{t('nutritionPage.bmi', 'BMI')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>{bmi}</Typography>
                      <Chip
                        size="small"
                        label={t(`nutritionPage.${bmiCategory.label.toLowerCase()}`, bmiCategory.label)}
                        sx={{
                          backgroundColor: bmiCategory.color,
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {bmr && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">{t('nutritionPage.bmr', 'BMR')}</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{Math.round(bmr)} kcal/day</Typography>
                  </Box>
                )}

                {tdee && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">{t('nutritionPage.tdee', 'TDEE')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>{tdee} kcal/day</Typography>
                      <Chip
                        size="small"
                        label={t('nutritionPage.dailyGoal', 'Daily Goal')}
                        color="primary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t('nutritionPage.totalCalories', 'Total Calories')}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">{t('nutritionPage.calories', 'Calories')}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{totalCalories} kcal</Typography>
                </Box>
                <LinearProgress variant="determinate" value={Math.min((totalCalories / calorieGoal) * 100, 100)} sx={{ height: 10, borderRadius: 5, backgroundColor: '#f0f0f0', '& .MuiLinearProgress-bar': { backgroundColor: getBarColor(totalCalories / calorieGoal) } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">{t('nutritionPage.remaining', 'Remaining')}</Typography>
                  <Typography>{remainingCalories} kcal</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t('nutritionPage.totalProtein', 'Total Protein')}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">{t('nutritionPage.protein', 'Protein (g)')}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{totalProtein} g</Typography>
                </Box>
                <LinearProgress variant="determinate" value={Math.min((totalProtein / DEFAULT_PROTEIN_GOAL) * 100, 100)} sx={{ height: 10, borderRadius: 5, backgroundColor: '#f0f0f0', '& .MuiLinearProgress-bar': { backgroundColor: getBarColor(totalProtein / DEFAULT_PROTEIN_GOAL) } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">{t('nutritionPage.remaining', 'Remaining')}</Typography>
                  <Typography>{remainingProtein} g</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{t('nutritionPage.generalTip', 'General Eating Tip')}</Typography>
              <Typography color="text.secondary">{tip || t('nutritionPage.generalTip', 'General Eating Tip')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Nutrition
