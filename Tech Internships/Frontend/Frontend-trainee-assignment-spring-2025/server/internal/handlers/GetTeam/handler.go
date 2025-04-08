package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetTeamHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetTeam(c *gin.Context)
	}
)

func NewGetTeamHandler(db *gorm.DB) Handler {
	return &GetTeamHandler{db: db}
}

// @Summary Получить информацию о команде
// @Description Получает информацию о команде по ID, включая пользователей и доски
// @Tags 	
// @Accept json
// @Produce json
// @Param teamId path int true "ID команды"
// @Success 200 {object} models.GetTeamResponse
// @Failure 400 {object} errs.ErrorResponse "Некорректный teamID"
// @Failure 404 {object} errs.ErrorResponse "Команда не найдена"
// @Router /teams/{teamId} [get]
func (h *GetTeamHandler) GetTeam(c *gin.Context) {
	teamID, err := strconv.Atoi(c.Param("teamId"))
	if err != nil {
		errs.BadRequest(c, err, "Некорректный teamID")
		return
	}

	var team models.Team
	if err := h.db.Preload("Users").Preload("Boards").First(&team, teamID).Error; err != nil {
		errs.NotFound(c, err, "Команда не найдена")
		return
	}

	var users []models.GetTeamUsers
	for _, user := range team.Users {
		users = append(users, models.GetTeamUsers{
			ID:          user.ID,
			FullName:    user.FullName,
			Email:       user.Email,
			Description: user.Description,
			AvatarURL:   user.AvatarURL,
		})
	}

	var boards []models.GetTeamBoards
	for _, board := range team.Boards {
		boards = append(boards, models.GetTeamBoards{
			ID:          board.ID,
			Name:        board.Name,
			Description: board.Description,
		})
	}
	response := models.GetTeamResponse{
		ID:          team.ID,
		Name:        team.Name,
		Description: team.Description,
		Users:       users,
		Boards:      boards,
	}
	errs.Success(c, response)
}
