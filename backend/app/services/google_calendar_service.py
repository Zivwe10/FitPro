from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os
from app import db
from flask import current_app

class GoogleCalendarService:
    
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 
                                          'credentials/google_credentials.json')
    
    def get_auth_flow(self, redirect_uri):
        """Create OAuth flow for user authorization."""
        flow = Flow.from_client_secrets_file(
            self.credentials_file,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )
        return flow
    
    def get_auth_url(self, redirect_uri):
        """Generate authorization URL."""
        flow = self.get_auth_flow(redirect_uri)
        auth_url, state = flow.authorization_url(access_type='offline', prompt='consent')
        return auth_url, state
    
    def exchange_code_for_tokens(self, code, redirect_uri):
        """Exchange authorization code for tokens."""
        try:
            flow = self.get_auth_flow(redirect_uri)
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expiry': credentials.expiry,
                'token_type': credentials.token_type
            }
        except Exception as e:
            current_app.logger.error(f"Token exchange error: {str(e)}")
            raise
    
    def get_credentials(self, user):
        """Reconstruct credentials from stored tokens."""
        if not user.google_access_token:
            return None
        
        credentials = Credentials(
            token=user.google_access_token,
            refresh_token=user.google_refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scopes=self.SCOPES
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                # Update stored tokens
                user.google_access_token = credentials.token
                user.google_token_expiry = credentials.expiry
                db.session.commit()
            except Exception as e:
                current_app.logger.error(f"Token refresh error: {str(e)}")
                return None
        
        return credentials
    
    def create_calendar_event(self, user, workout):
        """Create calendar event from workout."""
        credentials = self.get_credentials(user)
        if not credentials:
            raise ValueError("No valid Google Calendar credentials")
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            # Build event details
            start_time = datetime.combine(workout.date, datetime.min.time())
            # Estimate 1 hour for workout
            end_time = start_time + timedelta(hours=1)
            
            event = {
                'summary': f"Workout: {workout.exercise}",
                'description': self._build_event_description(workout),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': os.getenv('TIMEZONE', 'UTC')
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': os.getenv('TIMEZONE', 'UTC')
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'notification', 'minutes': 30},
                        {'method': 'email', 'minutes': 1440}
                    ]
                },
                'transparency': 'opaque'
            }
            
            created_event = service.events().insert(
                calendarId=user.calendar_id or 'primary',
                body=event
            ).execute()
            
            return created_event
            
        except Exception as e:
            current_app.logger.error(f"Event creation error: {str(e)}")
            raise
    
    def update_calendar_event(self, user, workout):
        """Update existing calendar event."""
        if not workout.google_event_id:
            raise ValueError("Workout not synced to calendar")
        
        credentials = self.get_credentials(user)
        if not credentials:
            raise ValueError("No valid Google Calendar credentials")
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            start_time = datetime.combine(workout.date, datetime.min.time())
            end_time = start_time + timedelta(hours=1)
            
            event = {
                'summary': f"Workout: {workout.exercise}",
                'description': self._build_event_description(workout),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': os.getenv('TIMEZONE', 'UTC')
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': os.getenv('TIMEZONE', 'UTC')
                }
            }
            
            updated_event = service.events().update(
                calendarId=user.calendar_id or 'primary',
                eventId=workout.google_event_id,
                body=event
            ).execute()
            
            return updated_event
            
        except Exception as e:
            current_app.logger.error(f"Event update error: {str(e)}")
            raise
    
    def delete_calendar_event(self, user, workout):
        """Delete calendar event."""
        if not workout.google_event_id:
            return True
        
        credentials = self.get_credentials(user)
        if not credentials:
            raise ValueError("No valid Google Calendar credentials")
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            service.events().delete(
                calendarId=user.calendar_id or 'primary',
                eventId=workout.google_event_id
            ).execute()
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Event deletion error: {str(e)}")
            raise
    
    def _build_event_description(self, workout):
        """Build event description from workout details."""
        description = f"Exercise: {workout.exercise}\n"
        description += f"Sets: {workout.sets} × Reps: {workout.reps}\n"
        if workout.weight:
            description += f"Weight: {workout.weight} kg\n"
        if workout.notes:
            description += f"Notes: {workout.notes}\n"
        description += f"Status: {workout.status}"
        return description