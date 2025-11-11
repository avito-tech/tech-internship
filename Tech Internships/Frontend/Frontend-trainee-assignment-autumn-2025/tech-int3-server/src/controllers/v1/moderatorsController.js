const dataStore = require('../../models/v1/data');

const getCurrentModerator = (req, res) => {
  try {
    res.json(dataStore.moderator);
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка при получении информации о модераторе',
      message: error.message
    });
  }
};

module.exports = {
  getCurrentModerator
};
