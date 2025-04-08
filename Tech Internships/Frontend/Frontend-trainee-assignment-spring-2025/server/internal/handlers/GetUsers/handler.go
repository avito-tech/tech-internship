package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetUsersHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetUsers(c *gin.Context)
	}
)

func NewGetUsersHandler(db *gorm.DB) Handler {
	return &GetUsersHandler{db: db}
}

// @Summary Получить информацию о всех пользователях
// @Description Получает информацию о всех пользователях, включая их команды и количество задач
// @Tags Пользователи
// @Accept json
// @Produce json
// @Success 200 {array} models.GetUsersResponse
// @Failure 500 {object} errs.ErrorResponse "Ошибка при получении пользователей"
// @Router /users [get]
func (h *GetUsersHandler) GetUsers(c *gin.Context) {
	var users []models.User
	if err := h.db.Preload("AssignedTasks").Preload("Team").Find(&users).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при получении пользователей")
		return
	}

	response := make([]models.GetUsersResponse, len(users))
	for i, user := range users {
		response[i] = models.GetUsersResponse{
			ID:          user.ID,
			FullName:    user.FullName,
			Email:       user.Email,
			Description: user.Description,
			TeamID:      user.TeamID,
			AvatarURL:   user.AvatarURL,
			TeamName:    user.Team.Name,
			TasksCount:  len(user.AssignedTasks),
		}
	}

	errs.Success(c, response)
}
