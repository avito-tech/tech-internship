package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetTasksOnBoardHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetTasksOnBoard(c *gin.Context)
	}
)

func NewGetTasksOnBoardHandler(db *gorm.DB) Handler {
	return &GetTasksOnBoardHandler{db: db}
}

// GetTasksOnBoard возвращает список задач для конкретной доски
// @Summary Получить задачи доски
// @Description Возвращает все задачи, принадлежащие указанной доске
// @Tags Доски
// @Accept json
// @Produce json
// @Param boardId path int true "ID доски"
// @Success 200 {array} models.GetTasksOnBoardResponse
// @Failure 400 {object} errs.ErrorResponse "Неверный формат ID доски"
// @Failure 404 {object} errs.ErrorResponse "Доска не найдена"
// @Failure 500 {object} errs.ErrorResponse "Ошибка сервера"
// @Router /boards/{boardId} [get]
func (h *GetTasksOnBoardHandler) GetTasksOnBoard(c *gin.Context) {
	boardID, err := strconv.Atoi(c.Param("boardId"))
	if err != nil {
		errs.BadRequest(c, err, "Некорректный boardID")
		return
	}

	var tasks []models.Task
	if err := h.db.Preload("Assignee").Where("board_id = ?", boardID).Find(&tasks).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при получении задач на доске")
		return
	}

	response := make([]models.GetTasksOnBoardResponse, len(tasks))
	for i, task := range tasks {
		response[i] = models.GetTasksOnBoardResponse{
			ID:          task.ID,
			Title:       task.Title,
			Description: task.Description,
			Priority:    task.Priority,
			Status:      task.Status,
			Assignee: models.AssigneeUserForTask{
				ID:        task.Assignee.ID,
				FullName:  task.Assignee.FullName,
				Email:     task.Assignee.Email,
				AvatarURL: task.Assignee.AvatarURL,
			},
		}
	}
	errs.Success(c, response)
}
