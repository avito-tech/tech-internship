const dataStore = require('../../models/v1/data');

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  
  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate)
    };
  }
  
  switch (period) {
    case 'today':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekAgo,
        end: now
      };
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start: monthAgo,
        end: now
      };
    default:
      // По умолчанию - последняя неделя
      const defaultWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: defaultWeekAgo,
        end: now
      };
  }
};

// Фильтрация объявлений по периоду модерации
const filterAdsByModerationDate = (ads, dateRange) => {
  return ads.filter(ad => {
    // Ищем последнюю модерацию в заданном периоде
    if (ad.moderationHistory.length > 0) {
      const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
      const moderationDate = new Date(lastModeration.timestamp);
      return moderationDate >= dateRange.start && moderationDate <= dateRange.end;
    }
    return false;
  });
};

// Расчет общей статистики
const calculateSummaryStats = (ads, dateRange) => {
  const filteredAds = filterAdsByModerationDate(ads, dateRange);
  
  if (filteredAds.length === 0) {
    return {
      totalReviewed: 0,
      totalReviewedToday: 0,
      totalReviewedThisWeek: 0,
      totalReviewedThisMonth: 0,
      approvedPercentage: 0,
      rejectedPercentage: 0,
      requestChangesPercentage: 0,
      averageReviewTime: 0
    };
  }
  
  let approvedCount = 0;
  let rejectedCount = 0;
  let requestChangesCount = 0;
  let totalReviewTime = 0;
  
  filteredAds.forEach(ad => {
    if (ad.moderationHistory.length > 0) {
      const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
      const reviewTime = new Date(lastModeration.timestamp) - new Date(ad.createdAt);
      
      totalReviewTime += reviewTime;
      
      switch (lastModeration.action) {
        case 'approved':
          approvedCount++;
          break;
        case 'rejected':
          rejectedCount++;
          break;
        case 'requestChanges':
          requestChangesCount++;
          break;
      }
    }
  });
  
  const total = filteredAds.length;
  
  return {
    totalReviewed: total,
    totalReviewedToday: filteredAds.filter(ad => {
      if (ad.moderationHistory.length > 0) {
        const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
        const moderationDate = new Date(lastModeration.timestamp);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return moderationDate >= todayStart;
      }
      return false;
    }).length,
    totalReviewedThisWeek: 0, // Будет рассчитано отдельно
    totalReviewedThisMonth: 0, // Будет рассчитано отдельно
    approvedPercentage: total > 0 ? (approvedCount / total * 100) : 0,
    rejectedPercentage: total > 0 ? (rejectedCount / total * 100) : 0,
    requestChangesPercentage: total > 0 ? (requestChangesCount / total * 100) : 0,
    averageReviewTime: total > 0 ? Math.round(totalReviewTime / total / 1000) : 0 // в секундах
  };
};

// Расчет данных для графика активности
const calculateActivityChart = (ads, dateRange) => {
  const result = [];
  const daysInPeriod = Math.ceil((dateRange.end - dateRange.start) / (24 * 60 * 60 * 1000));
  
  for (let i = 0; i <= daysInPeriod; i++) {
    const currentDate = new Date(dateRange.start);
    currentDate.setDate(dateRange.start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayAds = ads.filter(ad => {
      if (ad.moderationHistory.length > 0) {
        const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
        const moderationDate = new Date(lastModeration.timestamp);
        return moderationDate.toISOString().split('T')[0] === dateStr;
      }
      return false;
    });
    
    let approved = 0;
    let rejected = 0;
    let requestChanges = 0;
    
    dayAds.forEach(ad => {
      if (ad.moderationHistory.length > 0) {
        const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
        switch (lastModeration.action) {
          case 'approved':
            approved++;
            break;
          case 'rejected':
            rejected++;
            break;
          case 'requestChanges':
            requestChanges++;
            break;
        }
      }
    });
    
    result.push({
      date: dateStr,
      approved,
      rejected,
      requestChanges
    });
  }
  
  return result;
};

// Расчет данных для графика решений
const calculateDecisionsChart = (ads, dateRange) => {
  const filteredAds = filterAdsByModerationDate(ads, dateRange);
  
  if (filteredAds.length === 0) {
    return {
      approved: 0,
      rejected: 0,
      requestChanges: 0
    };
  }
  
  let approved = 0;
  let rejected = 0;
  let requestChanges = 0;
  
  filteredAds.forEach(ad => {
    if (ad.moderationHistory.length > 0) {
      const lastModeration = ad.moderationHistory[ad.moderationHistory.length - 1];
      switch (lastModeration.action) {
        case 'approved':
          approved++;
          break;
        case 'rejected':
          rejected++;
          break;
        case 'requestChanges':
          requestChanges++;
          break;
      }
    }
  });
  
  const total = filteredAds.length;
  
  return {
    approved: total > 0 ? (approved / total * 100) : 0,
    rejected: total > 0 ? (rejected / total * 100) : 0,
    requestChanges: total > 0 ? (requestChanges / total * 100) : 0
  };
};

// Расчет данных для графика категорий
const calculateCategoriesChart = (ads, dateRange) => {
  const filteredAds = filterAdsByModerationDate(ads, dateRange);
  const categories = {};
  
  filteredAds.forEach(ad => {
    if (!categories[ad.category]) {
      categories[ad.category] = 0;
    }
    categories[ad.category]++;
  });
  
  return categories;
};

const getSummaryStats = (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateRange = getDateRange(period, startDate, endDate);
    
    const stats = calculateSummaryStats(dataStore.ads, dateRange);
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении общей статистики',
      message: error.message
    });
  }
};

const getActivityChart = (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateRange = getDateRange(period, startDate, endDate);
    
    const chartData = calculateActivityChart(dataStore.ads, dateRange);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении данных графика активности',
      message: error.message
    });
  }
};

const getDecisionsChart = (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateRange = getDateRange(period, startDate, endDate);
    
    const chartData = calculateDecisionsChart(dataStore.ads, dateRange);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении данных графика решений',
      message: error.message
    });
  }
};

const getCategoriesChart = (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateRange = getDateRange(period, startDate, endDate);
    
    const chartData = calculateCategoriesChart(dataStore.ads, dateRange);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении данных графика категорий',
      message: error.message
    });
  }
};

module.exports = {
  getSummaryStats,
  getActivityChart,
  getDecisionsChart,
  getCategoriesChart
};
