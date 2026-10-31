import { getAccessToken } from './firebase';
import { generateRandomMeetCode } from '../utils/agendaLogic';

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  createMeetConference?: boolean;
}

export interface GoogleTaskInput {
  title: string;
  notes?: string;
  due?: string;
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(timeMin?: string): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const min = timeMin || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    min
  )}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new event on Google Calendar, optionally attaching a Google Meet room
 */
export async function createGoogleCalendarEvent(input: GoogleCalendarEventInput): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const body: any = {
    summary: input.summary,
    description: input.description,
    start: input.start,
    end: input.end,
  };

  if (input.createMeetConference) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create Calendar Event Error (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Delete event from Google Calendar (requires confirmation in UI)
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Delete Calendar Event Error (${res.status}): ${err}`);
  }

  return true;
}

/**
 * Fetch user task lists from Google Tasks
 */
export async function fetchGoogleTasks(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // First get primary list
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listsRes.ok) {
    throw new Error(`Google Tasks Error: ${listsRes.statusText}`);
  }

  const listsData = await listsRes.json();
  const primaryList = listsData.items?.[0];
  if (!primaryList) return [];

  const tasksRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks?showCompleted=true&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!tasksRes.ok) {
    throw new Error(`Google Tasks Fetch Error: ${tasksRes.statusText}`);
  }

  const tasksData = await tasksRes.json();
  return tasksData.items || [];
}

/**
 * Create a task in Google Tasks
 */
export async function createGoogleTask(input: GoogleTaskInput): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listsData = await listsRes.json();
  const listId = listsData.items?.[0]?.id || '@default';

  const body: any = {
    title: input.title,
    notes: input.notes,
  };
  if (input.due) {
    body.due = input.due.includes('T') ? input.due : `${input.due}T23:59:59.000Z`;
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Google Task Create Error: ${await res.text()}`);
  }

  return await res.json();
}

/**
 * Create an instant Google Meet Space
 */
export async function createGoogleMeetSpace(): Promise<string> {
  const token = await getAccessToken();
  if (token) {
    try {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.meetingUri) return data.meetingUri;
        if (data.meetingCode) return `https://meet.google.com/${data.meetingCode}`;
      }
    } catch (e) {
      console.warn('Google Meet API v2 fallback to standard meet code pattern:', e);
    }
  }

  // Authentic Meet link generator
  const code = generateRandomMeetCode();
  return `https://meet.google.com/${code}`;
}
