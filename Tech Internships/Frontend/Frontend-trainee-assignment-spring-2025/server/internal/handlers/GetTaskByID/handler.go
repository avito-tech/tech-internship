package get_task_by_id_handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetTaskByIDHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetTaskByID(c *gin.Context)
	}
)

func NewGetTaskByIDHandler(db *gorm.DB) Handler {
	return &GetTaskByIDHandler{db: db}
}

// GetTaskByID возвращает задачу по ID
// @Summary Получить задачу по ID
// @Description Возвращает полную информацию о задаче, включая данные исполнителя и доски
// @Tags Задачи
// @Accept json
// @Produce json
// @Param taskId path int true "ID задачи"
// @Success 200 {object} models.GetTaskByIDResponse
// @Failure 400 {object} errs.ErrorResponse "Некорректный ID задачи"
// @Failure 404 {object} errs.ErrorResponse "Задача не найдена"
// @Router /tasks/{taskId} [get]
func (h *GetTaskByIDHandler) GetTaskByID(c *gin.Context) {
	taskID, err := parseTaskID(c)
	if err != nil {
		errs.BadRequest(c, err, "Некорректный taskID")
		return
	}

	task, err := h.fetchTaskFromDB(taskID)
	if err != nil {
		handleTaskError(c, err)
		return
	}

	response := prepareTaskResponse(task)
	errs.Success(c, response)
}

func parseTaskID(c *gin.Context) (uint, error) {
	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(taskID), nil
}

func (h *GetTaskByIDHandler) fetchTaskFromDB(taskID uint) (*models.Task, error) {
	var task models.Task
	if err := h.db.
		Preload("Assignee").
		Preload("Board").
		First(&task, taskID).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func prepareTaskResponse(task *models.Task) models.GetTaskByIDResponse {
	return models.GetTaskByIDResponse{
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
		BoardName: task.Board.Name,
	}
}

func handleTaskError(c *gin.Context, err error) {
	switch err {
	case gorm.ErrRecordNotFound:
		errs.NotFound(c, err, "Задача не найдена")
	default:
		errs.InternalError(c, err, "Ошибка при получении задачи")
	}
}
