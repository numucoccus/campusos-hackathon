const router = require('express').Router();
const service = require('../services/roomService');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { roomCreate, roomUpdate, bookingCreate, cancelBookingBody } = require('../validation/schemas');

// GET /api/rooms/availability?room_number=7A02&date=2026-09-05&start=15:00&end=17:00
router.get('/availability', asyncHandler(async (req, res) => {
  const { room_number, date, start, end } = req.query;
  res.json(await service.checkAvailability(room_number, date, start, end));
}));

// GET /api/rooms/available?date=...&start=...&end=...&minCapacity=5&equipment=projector
router.get('/available', asyncHandler(async (req, res) => {
  const { date, start, end, minCapacity, equipment } = req.query;
  res.json(await service.findAvailableRooms({
    date,
    start_time: start,
    end_time: end,
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
    equipment,
  }));
}));

router.get('/', asyncHandler(async (req, res) => {
  const { type, minCapacity, equipment, status } = req.query;
  res.json(await service.getAll({
    type,
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
    equipment,
    status,
  }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', validate(roomCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body));
}));

router.put('/:id', validate(roomUpdate), asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await service.remove(req.params.id));
}));

// POST /api/rooms/7A02/book  { date, start_time, end_time, booked_by, purpose }
router.post('/:roomNumber/book', validate(bookingCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.bookRoom({ room_number: req.params.roomNumber, ...req.body }));
}));

// DELETE /api/rooms/bookings/bk-001  { requested_by }
router.delete('/bookings/:bookingId', validate(cancelBookingBody), asyncHandler(async (req, res) => {
  res.json(await service.cancelBooking(req.params.bookingId, req.body.requested_by));
}));

module.exports = router;
