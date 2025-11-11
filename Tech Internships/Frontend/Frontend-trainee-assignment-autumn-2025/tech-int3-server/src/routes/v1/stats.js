const express = require('express');
const router = express.Router();
const { 
  getSummaryStats,
  getActivityChart,
  getDecisionsChart,
  getCategoriesChart
} = require('../../controllers/v1/statsController');

router.get('/summary', getSummaryStats);

router.get('/chart/activity', getActivityChart);

router.get('/chart/decisions', getDecisionsChart);

router.get('/chart/categories', getCategoriesChart);

module.exports = router;
