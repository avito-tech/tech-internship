const generateMockAds = (count) => {
  const categories = ['Электроника', 'Недвижимость', 'Транспорт', 'Работа', 'Услуги', 'Животные', 'Мода', 'Детское'];
  const statuses = ['pending', 'approved', 'rejected'];
  const priorities = ['normal', 'urgent'];
  const rejectionReasons = ['Запрещенный товар', 'Неверная категория', 'Некорректное описание', 'Проблемы с фото', 'Подозрение на мошенничество', 'Другое'];
  
  const ads = [];
  
  for (let i = 1; i <= count; i++) {
    const categoryId = Math.floor(Math.random() * categories.length);
    const statusId = Math.floor(Math.random() * statuses.length);
    const priorityId = Math.floor(Math.random() * priorities.length);
    
    // Создаем объявления за разные периоды для тестирования фильтрации
    const daysAgo = Math.floor(Math.random() * 60); // Объявления за последние 60 дней
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    const ad = {
      id: i,
      title: `Объявление ${i}: ${categories[categoryId]} для продажи`,
      description: `Подробное описание товара ${i}. Это отличный товар, который подходит для различных целей. Качество проверено временем и имеет гарантию.`,
      price: Math.floor(Math.random() * 100000) + 1000,
      category: categories[categoryId],
      categoryId: categoryId,
      status: statuses[statusId],
      priority: priorities[priorityId],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      images: [
        `https://placehold.co/300x200/cccccc/969696?text=Image+${i}-1`,
        `https://placehold.co/300x200/cccccc/969696?text=Image+${i}-2`,
        `https://placehold.co/300x200/cccccc/969696?text=Image+${i}-3`
      ],
      seller: {
        id: Math.floor(Math.random() * 1000) + 1,
        name: `Продавец ${Math.floor(Math.random() * 100) + 1}`,
        rating: (Math.random() * 5).toFixed(1),
        totalAds: Math.floor(Math.random() * 50) + 1,
        registeredAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString()
      },
      characteristics: {
        'Состояние': ['Новое', 'Б/у', 'Отличное', 'Хорошее', 'Удовлетворительное'][Math.floor(Math.random() * 5)],
        'Гарантия': ['Есть', 'Нет', 'Частичная'][Math.floor(Math.random() * 3)],
        'Производитель': `Бренд ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        'Модель': `Модель ${Math.floor(Math.random() * 1000)}`,
        'Цвет': ['Черный', 'Белый', 'Серый', 'Синий', 'Красный', 'Зеленый'][Math.floor(Math.random() * 6)]
      },
      moderationHistory: []
    };
    
    // Добавляем историю модерации с датами
    if (statuses[statusId] !== 'pending') {
      const moderatorId = Math.floor(Math.random() * 5) + 1;
      const moderatorName = `Модератор ${moderatorId}`;
      // Модерация происходит через 5-30 минут после создания
      const moderationTime = new Date(createdAt.getTime() + (5 + Math.floor(Math.random() * 25)) * 60 * 1000);
      
      ad.moderationHistory.push({
        id: 1,
        moderatorId: moderatorId,
        moderatorName: moderatorName,
        action: statuses[statusId],
        reason: statuses[statusId] === 'rejected' ? rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)] : null,
        comment: statuses[statusId] === 'rejected' ? 'Объявление не соответствует правилам платформы' : 'Объявление прошло модерацию успешно',
        timestamp: moderationTime.toISOString()
      });
      
      ad.updatedAt = moderationTime.toISOString();
    }
    
    ads.push(ad);
  }
  
  return ads;
};

const generateMockStats = () => {
  const stats = {
    summary: {
      totalReviewed: 1247,
      totalReviewedToday: 45,
      totalReviewedThisWeek: 234,
      totalReviewedThisMonth: 892,
      approvedPercentage: 78.5,
      rejectedPercentage: 15.2,
      requestChangesPercentage: 6.3,
      averageReviewTime: 156
    },
    activityChart: [],
    decisionsChart: {
      approved: 78.5,
      rejected: 15.2,
      requestChanges: 6.3
    },
    categoriesChart: {}
  };
  
  const categories = ['Электроника', 'Недвижимость', 'Транспорт', 'Работа', 'Услуги', 'Животные', 'Мода', 'Детское'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    stats.activityChart.push({
      date: date.toISOString().split('T')[0],
      approved: Math.floor(Math.random() * 20) + 10,
      rejected: Math.floor(Math.random() * 10) + 5,
      requestChanges: Math.floor(Math.random() * 5) + 1
    });
  }
  
  categories.forEach(category => {
    stats.categoriesChart[category] = Math.floor(Math.random() * 100) + 20;
  });
  
  return stats;
};

const mockModerator = {
  id: 1,
  name: 'Алексей Петров',
  email: 'alexey.petrov@moderator.avito',
  role: 'Senior Moderator',
  statistics: {
    totalReviewed: 1247,
    todayReviewed: 45,
    thisWeekReviewed: 234,
    thisMonthReviewed: 892,
    averageReviewTime: 156,
    approvalRate: 78.5
  },
  permissions: ['approve_ads', 'reject_ads', 'request_changes', 'view_stats']
};

const adsData = generateMockAds(150);
const statsData = generateMockStats();

const dataStore = {
  ads: adsData,
  stats: statsData,
  moderator: mockModerator
};

module.exports = dataStore;
