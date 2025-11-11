    const express = require('express');
const router = express.Router();

const adsRoutes = require('./ads');
const statsRoutes = require('./stats');
const moderatorsRoutes = require('./moderators');

router.use('/ads', adsRoutes);
router.use('/stats', statsRoutes);
router.use('/moderators', moderatorsRoutes);

module.exports = router;
