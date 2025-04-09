package get_tasks_handler

import (
	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetTasksHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetTasks(c *gin.Context)
	}
)

func NewGetTasksHandler(db *gorm.DB) Handler {
	return &GetTasksHandler{db: db}
}

// GetTasks возвращает список всех задач
// @Summary Получить список всех задач
// @Description Возвращает массив задач с полной информацией, включая данные исполнителей и досок
// @Tags Задачи
// @Accept json
// @Produce json
// @Success 200 {array} models.GetTasksResponse
// @Failure 500 {object} errs.ErrorResponse "Внутренняя ошибка сервера"
// @Router /tasks [get]
func (h *GetTasksHandler) GetTasks(c *gin.Context) {
	tasks, err := h.fetchTasksFromDB()
	if err != nil {
		errs.InternalError(c, err, "Ошибка при получении задач")
		return
	}

	response := prepareTasksResponse(tasks)
	errs.Success(c, response)
}

func (h *GetTasksHandler) fetchTasksFromDB() ([]models.Task, error) {
	var tasks []models.Task
	if err := h.db.
		Preload("Assignee").
		Preload("Board").
		Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func prepareTasksResponse(tasks []models.Task) []models.GetTasksResponse {
	response := make([]models.GetTasksResponse, len(tasks))
	for i, task := range tasks {
		response[i] = models.GetTasksResponse{
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
			BoardID:   task.Board.ID,
			BoardName: task.Board.Name,
		}
	}
	return response
}
