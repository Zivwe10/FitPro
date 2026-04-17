import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { CalendarToday, Sync, LinkOff } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const GoogleCalendarSync = ({ userId, onSyncComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkCalendarStatus();
  }, [userId]);

  const checkCalendarStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/google/status?user_id=${userId}`);
      setIsConnected(response.data.connected);
    } catch (err) {
      console.error('Failed to check calendar status:', err);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/google/authorize`, {
        user_id: userId
      });
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError('Failed to initiate Google Calendar connection');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/google/disconnect`, {
        user_id: userId
      });
      setIsConnected(false);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to disconnect Google Calendar');
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/workouts/sync-all`, {
        user_id: userId
      });

      if (onSyncComplete) {
        onSyncComplete();
      }

      alert(`Synced ${response.data.synced} workouts to calendar`);
    } catch (err) {
      setError('Failed to sync workouts to calendar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
        Google Calendar Sync
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isConnected ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Connect your Google Calendar to automatically sync planned workouts as calendar events.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnect}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CalendarToday />}
          >
            {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        </Box>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Google Calendar connected
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSyncAll}
              disabled={syncing}
              startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
            >
              {syncing ? 'Syncing...' : 'Sync All Workouts'}
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={handleDisconnect}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <LinkOff />}
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Planned workouts will be automatically synced as calendar events.
            You can also sync individual workouts from the workout details.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GoogleCalendarSync;