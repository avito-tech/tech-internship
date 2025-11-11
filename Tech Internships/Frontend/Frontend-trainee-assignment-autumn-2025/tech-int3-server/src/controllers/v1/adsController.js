const dataStore = require('../../models/v1/data');

const getAds = (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredAds = [...dataStore.ads];

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filteredAds = filteredAds.filter(ad => statuses.includes(ad.status));
    }

    if (categoryId) {
      filteredAds = filteredAds.filter(ad => ad.categoryId === parseInt(categoryId));
    }

    if (minPrice) {
      filteredAds = filteredAds.filter(ad => ad.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filteredAds = filteredAds.filter(ad => ad.price <= parseFloat(maxPrice));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredAds = filteredAds.filter(ad => 
        ad.title.toLowerCase().includes(searchLower) ||
        ad.description.toLowerCase().includes(searchLower)
      );
    }

    filteredAds.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'priority':
          aValue = a.priority === 'urgent' ? 1 : 0;
          bValue = b.priority === 'urgent' ? 1 : 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const total = filteredAds.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAds = filteredAds.slice(startIndex, endIndex);

    res.json({
      ads: paginatedAds,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении объявлений',
      message: error.message
    });
  }
};

const getAdById = (req, res) => {
  try {
    const { id } = req.params;
    const adId = parseInt(id);
    
    const ad = dataStore.ads.find(ad => ad.id === adId);
    
    if (!ad) {
      return res.status(404).json({
        error: 'Объявление не найдено',
        id: adId
      });
    }
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении объявления',
      message: error.message
    });
  }
};

const approveAd = (req, res) => {
  try {
    const { id } = req.params;
    const adId = parseInt(id);
    
    const ad = dataStore.ads.find(ad => ad.id === adId);
    
    if (!ad) {
      return res.status(404).json({
        error: 'Объявление не найдено',
        id: adId
      });
    }
    
    const historyEntry = {
      id: ad.moderationHistory.length + 1,
      moderatorId: dataStore.moderator.id,
      moderatorName: dataStore.moderator.name,
      action: 'approved',
      reason: null,
      comment: 'Объявление одобрено модератором',
      timestamp: new Date().toISOString()
    };
    
    ad.moderationHistory.push(historyEntry);
    ad.status = 'approved';
    ad.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Объявление успешно одобрено',
      ad: ad
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при одобрении объявления',
      message: error.message
    });
  }
};

const rejectAd = (req, res) => {
  try {
    const { id } = req.params;
    const { reason, comment } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Необходимо указать причину отклонения'
      });
    }
    
    const adId = parseInt(id);
    const ad = dataStore.ads.find(ad => ad.id === adId);
    
    if (!ad) {
      return res.status(404).json({
        error: 'Объявление не найдено',
        id: adId
      });
    }
    
    const historyEntry = {
      id: ad.moderationHistory.length + 1,
      moderatorId: dataStore.moderator.id,
      moderatorName: dataStore.moderator.name,
      action: 'rejected',
      reason: reason,
      comment: comment || 'Объявление отклонено модератором',
      timestamp: new Date().toISOString()
    };
    
    ad.moderationHistory.push(historyEntry);
    ad.status = 'rejected';
    ad.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Объявление успешно отклонено',
      ad: ad
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при отклонении объявления',
      message: error.message
    });
  }
};

const requestChanges = (req, res) => {
  try {
    const { id } = req.params;
    const { reason, comment } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Необходимо указать причину запроса изменений'
      });
    }
    
    const adId = parseInt(id);
    const ad = dataStore.ads.find(ad => ad.id === adId);
    
    if (!ad) {
      return res.status(404).json({
        error: 'Объявление не найдено',
        id: adId
      });
    }
    
    const historyEntry = {
      id: ad.moderationHistory.length + 1,
      moderatorId: dataStore.moderator.id,
      moderatorName: dataStore.moderator.name,
      action: 'requestChanges',
      reason: reason,
      comment: comment || 'Требуются изменения в объявлении',
      timestamp: new Date().toISOString()
    };
    
    ad.moderationHistory.push(historyEntry);
    ad.status = 'draft';
    ad.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Запрос изменений успешно отправлен',
      ad: ad
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при запросе изменений',
      message: error.message
    });
  }
};

module.exports = {
  getAds,
  getAdById,
  approveAd,
  rejectAd,
  requestChanges
};
