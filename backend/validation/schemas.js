// Zod schemas shared by REST controllers and AI tools.
const { z } = require('zod');

const time = z.string().regex(/^\d{2}:\d{2}$/, 'must be "HH:MM" 24h format');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be "YYYY-MM-DD"');
const day = z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);

const scheduleCreate = z.object({
  id: z.string().optional(),
  course: z.string().min(1),
  title: z.string().min(1),
  day,
  start_time: time,
  end_time: time,
  room: z.string().min(1),
  instructor: z.string().min(1).default('TBA'),
  section: z.string().min(1),
}).refine((s) => s.start_time < s.end_time, { message: 'end_time must be after start_time' });

const scheduleUpdate = z.object({
  course: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  day: day.optional(),
  start_time: time.optional(),
  end_time: time.optional(),
  room: z.string().min(1).optional(),
  instructor: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
});

const roomCreate = z.object({
  id: z.string().optional(),
  room_number: z.string().min(1),
  type: z.enum(['classroom', 'lab', 'seminar']),
  capacity: z.number().int().positive(),
  equipment: z.array(z.string()).default([]),
  floor: z.number().int(),
  status: z.enum(['available', 'unavailable']).default('available'),
});

const roomUpdate = z.object({
  room_number: z.string().min(1).optional(),
  type: z.enum(['classroom', 'lab', 'seminar']).optional(),
  capacity: z.number().int().positive().optional(),
  equipment: z.array(z.string()).optional(),
  floor: z.number().int().optional(),
  status: z.enum(['available', 'unavailable']).optional(),
});

const bookingCreate = z.object({
  date: isoDate,
  start_time: time,
  end_time: time,
  booked_by: z.string().min(1),
  purpose: z.string().default(''),
}).refine((b) => b.start_time < b.end_time, { message: 'end_time must be after start_time' });

const eventCreate = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(''),
  date: isoDate,
  start_time: time,
  end_time: time,
  end_date: isoDate.optional(),
  venue: z.string().min(1),
  organizer: z.string().min(1),
  capacity: z.number().int().positive(),
  registered: z.number().int().min(0).default(0),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled', 'full']).default('upcoming'),
});

const eventUpdate = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  date: isoDate.optional(),
  start_time: time.optional(),
  end_time: time.optional(),
  end_date: isoDate.optional(),
  venue: z.string().min(1).optional(),
  organizer: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  registered: z.number().int().min(0).optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled', 'full']).optional(),
});

const registrationCreate = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
});

const announcementCreate = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  date: isoDate.optional(),
  priority: z.enum(['high', 'medium', 'low']),
  posted_by: z.string().min(1),
  expires: isoDate,
});

const announcementUpdate = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  date: isoDate.optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  posted_by: z.string().min(1).optional(),
  expires: isoDate.optional(),
});

const assignmentCreate = z.object({
  id: z.string().optional(),
  course: z.string().min(1),
  course_title: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  assigned_date: isoDate.optional(),
  deadline: isoDate,
  submission_platform: z.string().min(1),
  status: z.enum(['pending', 'submitted', 'graded', 'late']).default('pending'),
  marks: z.number().int().min(0),
});

const assignmentUpdate = z.object({
  course: z.string().min(1).optional(),
  course_title: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigned_date: isoDate.optional(),
  deadline: isoDate.optional(),
  submission_platform: z.string().min(1).optional(),
  status: z.enum(['pending', 'submitted', 'graded', 'late']).optional(),
  marks: z.number().int().min(0).optional(),
});

const cancelBookingBody = z.object({ requested_by: z.string().min(1) });

module.exports = {
  scheduleCreate,
  scheduleUpdate,
  roomCreate,
  roomUpdate,
  bookingCreate,
  cancelBookingBody,
  eventCreate,
  eventUpdate,
  registrationCreate,
  announcementCreate,
  announcementUpdate,
  assignmentCreate,
  assignmentUpdate,
};
