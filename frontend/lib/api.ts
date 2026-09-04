// Typed API client — the frontend talks ONLY to the Express backend.
import type {
  Schedule, Room, Booking, CampusEvent, Announcement, Assignment,
  ChatMessage, ChatResponse, AvailabilityResult,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error || `Request failed (${res.status})`, res.status, json?.details);
  }
  return json as T;
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const api = {
  // Schedules
  schedules: {
    list: (f: { day?: string; course?: string; room?: string } = {}) =>
      req<Schedule[]>('GET', `/schedules${qs(f)}`),
    create: (data: Omit<Schedule, 'id'>) => req<Schedule>('POST', '/schedules', data),
    update: (id: string, data: Partial<Schedule>) => req<Schedule>('PUT', `/schedules/${id}`, data),
    remove: (id: string) => req<Schedule>('DELETE', `/schedules/${id}`),
  },
  // Rooms
  rooms: {
    list: (f: { type?: string; minCapacity?: number; equipment?: string; status?: string } = {}) =>
      req<Room[]>('GET', `/rooms${qs(f)}`),
    create: (data: Omit<Room, 'id' | 'bookings'>) => req<Room>('POST', '/rooms', data),
    update: (id: string, data: Partial<Room>) => req<Room>('PUT', `/rooms/${id}`, data),
    remove: (id: string) => req<Room>('DELETE', `/rooms/${id}`),
    availability: (room_number: string, date: string, start: string, end: string) =>
      req<AvailabilityResult>('GET', `/rooms/availability${qs({ room_number, date, start, end })}`),
    findAvailable: (f: { date: string; start: string; end: string; minCapacity?: number; equipment?: string }) =>
      req<Room[]>('GET', `/rooms/available${qs(f)}`),
    book: (roomNumber: string, data: { date: string; start_time: string; end_time: string; booked_by: string; purpose?: string }) =>
      req<Booking>('POST', `/rooms/${roomNumber}/book`, data),
    cancelBooking: (bookingId: string, requested_by: string) =>
      req<Booking>('DELETE', `/rooms/bookings/${bookingId}`, { requested_by }),
  },
  // Events
  events: {
    list: (f: { status?: string } = {}) => req<CampusEvent[]>('GET', `/events${qs(f)}`),
    create: (data: Omit<CampusEvent, 'id' | 'registrations'>) => req<CampusEvent>('POST', '/events', data),
    update: (id: string, data: Partial<CampusEvent>) => req<CampusEvent>('PUT', `/events/${id}`, data),
    remove: (id: string) => req<CampusEvent>('DELETE', `/events/${id}`),
    register: (id: string, data: { student_id: string; name: string }) =>
      req<CampusEvent>('POST', `/events/${id}/register`, data),
    cancelRegistration: (id: string, studentId: string) =>
      req<CampusEvent>('DELETE', `/events/${id}/register/${studentId}`),
  },
  // Announcements
  announcements: {
    list: (f: { priority?: string; activeOnly?: boolean } = {}) =>
      req<Announcement[]>('GET', `/announcements${qs(f)}`),
    create: (data: Omit<Announcement, 'id'>) => req<Announcement>('POST', '/announcements', data),
    update: (id: string, data: Partial<Announcement>) => req<Announcement>('PUT', `/announcements/${id}`, data),
    remove: (id: string) => req<Announcement>('DELETE', `/announcements/${id}`),
  },
  // Assignments
  assignments: {
    list: (f: { course?: string; status?: string; dueBefore?: string; dueAfter?: string } = {}) =>
      req<Assignment[]>('GET', `/assignments${qs(f)}`),
    create: (data: Omit<Assignment, 'id'>) => req<Assignment>('POST', '/assignments', data),
    update: (id: string, data: Partial<Assignment>) => req<Assignment>('PUT', `/assignments/${id}`, data),
    remove: (id: string) => req<Assignment>('DELETE', `/assignments/${id}`),
  },
  // AI chat — includes the active user identity so actions are on their behalf
  chat: (messages: ChatMessage[], user?: { name: string; student_id: string }) =>
    req<ChatResponse>('POST', '/chat', { messages, user }),
  // Auth
  auth: {
    register: (data: { name: string; student_id: string; email: string; password: string }) =>
      req<{ token: string; user: { id: string; email: string; name: string; student_id: string } }>('POST', '/auth/register', data),
    login: (data: { email: string; password: string }) =>
      req<{ token: string; user: { id: string; email: string; name: string; student_id: string } }>('POST', '/auth/login', data),
  },
};

export const fmt12h = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
