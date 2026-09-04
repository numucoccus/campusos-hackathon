// AI tools — thin wrappers over the SAME services the REST API uses.
// Every call reads/writes live Supabase data; nothing is cached.
const scheduleService = require('../services/scheduleService');
const roomService = require('../services/roomService');
const eventService = require('../services/eventService');
const announcementService = require('../services/announcementService');
const assignmentService = require('../services/assignmentService');
const { announcementCreate } = require('../validation/schemas');

// OpenAI-format tool definitions.
const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_schedules',
      description: 'Get class schedules (the current user\'s full weekly timetable). Optionally filter by day of week, course code, or room number. Omit filters you do not need — never pass empty strings.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'string', description: 'Day of week: Sunday, Monday, Tuesday, Wednesday, or Thursday' },
          course: { type: 'string', description: 'Course code, e.g. "CSE 4113" (partial match ok)' },
          room: { type: 'string', description: 'Room number, e.g. "7A03"' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_rooms',
      description: 'List rooms with capacity, equipment, status and their bookings. Filter by type, minimum capacity, or equipment. Omit filters you do not need.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Room type: classroom, lab, or seminar' },
          minCapacity: { type: 'number', description: 'Minimum room capacity' },
          equipment: { type: 'string', description: 'Required equipment, e.g. "projector"' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_available_rooms',
      description: 'Find all rooms free for a given date and time range, optionally filtered by capacity and equipment.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          start_time: { type: 'string', description: '24h HH:MM' },
          end_time: { type: 'string', description: '24h HH:MM' },
          minCapacity: { type: 'number' },
          equipment: { type: 'string' },
        },
        required: ['date', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_room_availability',
      description: 'Check whether a specific room is free for a date and time range. Returns conflicts if any.',
      parameters: {
        type: 'object',
        properties: {
          room_number: { type: 'string', description: 'e.g. "7A02"' },
          date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          start_time: { type: 'string', description: '24h HH:MM' },
          end_time: { type: 'string', description: '24h HH:MM' },
        },
        required: ['room_number', 'date', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_room',
      description: 'Book a room for the current user. Availability is validated automatically; a conflict error is returned if taken.',
      parameters: {
        type: 'object',
        properties: {
          room_number: { type: 'string' },
          date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          start_time: { type: 'string', description: '24h HH:MM' },
          end_time: { type: 'string', description: '24h HH:MM' },
          purpose: { type: 'string', description: 'Reason for the booking' },
        },
        required: ['room_number', 'date', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: "Cancel a room booking. Only works for the current user's own bookings.",
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string', description: 'e.g. "bk-001"' },
        },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_events',
      description: 'List campus events with dates, venues, capacity and registration counts. Optionally search by name. Omit filters you do not need.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Search events by (partial) name' },
          status: { type: 'string', description: 'Event status: upcoming, ongoing, completed, cancelled, or full' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'register_for_event',
      description: 'Register the current user for an event by event id. Fails if full, already registered, or cancelled.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'e.g. "evt-002"' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_event_registration',
      description: "Cancel the current user's own registration for an event.",
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_announcements',
      description: 'Get campus announcements/notices. Filter by priority or active (non-expired) only. Omit filters you do not need.',
      parameters: {
        type: 'object',
        properties: {
          priority: { type: 'string', description: 'Priority: high, medium, or low' },
          activeOnly: { type: 'boolean', description: 'Exclude expired announcements' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_assignments',
      description: 'Get course assignments with deadlines and status. Filter by course, status, or deadline window. Omit filters you do not need.',
      parameters: {
        type: 'object',
        properties: {
          course: { type: 'string' },
          status: { type: 'string', description: 'Status: pending, submitted, graded, or late' },
          dueBefore: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          dueAfter: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_announcement',
      description: 'Post a new campus announcement.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          expires: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        },
        required: ['title', 'body', 'priority', 'expires'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_assignment_status',
      description: 'Update the status of an assignment (e.g. mark as submitted).',
      parameters: {
        type: 'object',
        properties: {
          assignment_id: { type: 'string', description: 'e.g. "asgn-001"' },
          status: { type: 'string', enum: ['pending', 'submitted', 'graded', 'late'] },
        },
        required: ['assignment_id', 'status'],
      },
    },
  },
];

// Tool handlers. `user` is the authenticated demo user ({ name, student_id }).
// Ownership rules are enforced here AND in the services — never left to the LLM.
const toolHandlers = {
  get_schedules: (args) => scheduleService.getAll(args),
  get_rooms: (args) => roomService.getAll(args),
  find_available_rooms: (args) => roomService.findAvailableRooms(args),
  check_room_availability: (args) =>
    roomService.checkAvailability(args.room_number, args.date, args.start_time, args.end_time),
  book_room: (args, user) =>
    roomService.bookRoom({ ...args, booked_by: user.name, purpose: args.purpose || 'Booked via CampusOS assistant' }),
  cancel_booking: (args, user) => roomService.cancelBooking(args.booking_id, user.name),
  get_events: async (args) => {
    if (args && args.name) return eventService.findByName(args.name);
    return eventService.getAll(args || {});
  },
  register_for_event: (args, user) =>
    eventService.register(args.event_id, { student_id: user.student_id, name: user.name }),
  cancel_event_registration: (args, user) =>
    eventService.cancelRegistration(args.event_id, user.student_id, user.student_id),
  get_announcements: (args) => announcementService.getAll(args || {}),
  get_assignments: (args) => assignmentService.getAll(args || {}),
  create_announcement: (args, user) =>
    announcementService.create(announcementCreate.parse({ ...args, posted_by: user.name })),
  update_assignment_status: (args) =>
    assignmentService.update(args.assignment_id, { status: args.status }),
};

async function executeTool(name, args, user) {
  const handler = toolHandlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  // Strip empty/null args the model sometimes emits for optional params.
  const clean = {};
  for (const [k, v] of Object.entries(args || {})) {
    if (v !== '' && v !== null && v !== undefined) clean[k] = v;
  }
  return handler(clean, user);
}

module.exports = { toolDefinitions, executeTool };
