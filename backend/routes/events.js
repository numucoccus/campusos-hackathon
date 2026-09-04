const router = require('express').Router();
const service = require('../services/eventService');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { eventCreate, eventUpdate, registrationCreate } = require('../validation/schemas');

router.get('/', asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo } = req.query;
  res.json(await service.getAll({ status, dateFrom, dateTo }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', validate(eventCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body));
}));

router.put('/:id', validate(eventUpdate), asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await service.remove(req.params.id));
}));

// POST /api/events/evt-002/register  { student_id, name }
// When signed in, the JWT identity overrides the registrant (can't be spoofed).
router.post('/:id/register', validate(registrationCreate), asyncHandler(async (req, res) => {
  const registrant = req.user
    ? { student_id: req.user.student_id, name: req.user.name }
    : req.body;
  res.status(201).json(await service.register(req.params.id, registrant));
}));

// DELETE /api/events/evt-002/register/20-40532
// When signed in, you may only cancel your own registration.
router.delete('/:id/register/:studentId', asyncHandler(async (req, res) => {
  const requestedBy = req.user ? req.user.student_id : undefined;
  res.json(await service.cancelRegistration(req.params.id, req.params.studentId, requestedBy));
}));

module.exports = router;
