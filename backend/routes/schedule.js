const router = require('express').Router();
const service = require('../services/scheduleService');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { scheduleCreate, scheduleUpdate } = require('../validation/schemas');

router.get('/', asyncHandler(async (req, res) => {
  const { day, course, room } = req.query;
  res.json(await service.getAll({ day, course, room }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', validate(scheduleCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body));
}));

router.put('/:id', validate(scheduleUpdate), asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await service.remove(req.params.id));
}));

module.exports = router;
