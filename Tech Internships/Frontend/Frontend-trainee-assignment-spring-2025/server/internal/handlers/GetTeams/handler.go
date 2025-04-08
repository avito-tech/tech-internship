package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetTeamsHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetTeams(c *gin.Context)
	}
)

func NewGetTeamsHandler(db *gorm.DB) Handler {
	return &GetTeamsHandler{db: db}
}

// @Summary Получить информацию о всех командах
// @Description Получает информацию о всех командах, включая количество пользователей и досок
// @Tags Команды
// @Accept json
// @Produce json
// @Success 200 {array} models.GetTeamsResponse
// @Failure 500 {object} errs.ErrorResponse "Ошибка при получении команд"
// @Router /teams [get]
func (h *GetTeamsHandler) GetTeams(c *gin.Context) {
	var teams []models.Team
	if err := h.db.Preload("Users").Preload("Boards").Find(&teams).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при получении команд")
		return
	}

	response := make([]models.GetTeamsResponse, len(teams))
	for i, team := range teams {
		response[i] = models.GetTeamsResponse{
			ID:          team.ID,
			Name:        team.Name,
			Description: team.Description,
			UsersCount:  len(team.Users),
			BoardsCount: len(team.Boards),
		}
	}

	errs.Success(c, response)
}
