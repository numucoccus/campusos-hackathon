const router = require('express').Router();
const service = require('../services/announcementService');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { announcementCreate, announcementUpdate } = require('../validation/schemas');

router.get('/', asyncHandler(async (req, res) => {
  const { priority, activeOnly } = req.query;
  res.json(await service.getAll({ priority, activeOnly: activeOnly === 'true' }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', validate(announcementCreate), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.body));
}));

router.put('/:id', validate(announcementUpdate), asyncHandler(async (req, res) => {
  res.json(await service.update(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await service.remove(req.params.id));
}));

module.exports = router;
