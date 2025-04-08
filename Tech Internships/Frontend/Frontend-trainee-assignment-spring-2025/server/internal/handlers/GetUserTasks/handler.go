package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetUserTasksHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetUserTasks(c *gin.Context)
	}
)

func NewGetUserTasksHandler(db *gorm.DB) Handler {
	return &GetUserTasksHandler{db: db}
}

// @Summary Получить задачи пользователя
// @Description Получает список задач для указанного пользователя по его ID
// @Tags Пользователи
// @Accept json
// @Produce json
// @Param id path int true "ID пользователя"
// @Success 200 {array} models.GetUserTasksResponse
// @Failure 400 {object} errs.ErrorResponse "Некорректный userID"
// @Failure 500 {object} errs.ErrorResponse "Ошибка при получении задач пользователя"
// @Router /users/{id}/tasks [get]
func (h *GetUserTasksHandler) GetUserTasks(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		errs.BadRequest(c, err, "Некорректный userID")
		return
	}

	var tasks []models.Task
	if err := h.db.Where("assignee_id = ?", userID).Preload("Board").Find(&tasks).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при получении задач пользователя")
		return
	}

	response := make([]models.GetUserTasksResponse, len(tasks))
	for i, task := range tasks {
		response[i] = models.GetUserTasksResponse{
			ID:          task.ID,
			Title:       task.Title,
			Description: task.Description,
			Status:      task.Status,
			BoardName:   task.Board.Name,
			Priority:    task.Priority,
		}
	}
	errs.Success(c, response)
}
