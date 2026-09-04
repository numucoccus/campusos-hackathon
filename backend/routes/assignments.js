const router = require('express').Router();
const service = require('../services/assignmentService');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { assignmentCreate, assignmentUpdate } = require('../validation/schemas');

router.get('/', asyncHandler(async (req, res) => {
  const { course, status, dueBefore, dueAfter } = req.query;
  res.json(await service.getAll({ course, status, dueBefore, dueAfter }));
}));

router.get('/due-this-week', asyncHandler(async (req, res) => {
  res.json(await service.getDueThisWeek(req.query.from));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', validate(assignmentCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body));
}));

router.put('/:id', validate(assignmentUpdate), asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await service.remove(req.params.id));
}));

module.exports = router;
