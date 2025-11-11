const express = require('express');
const router = express.Router();
const { getCurrentModerator } = require('../../controllers/v1/moderatorsController');

router.get('/me', getCurrentModerator);

module.exports = router;
