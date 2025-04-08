package handlers

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	UpdateTaskHandler struct {
		db *gorm.DB
	}

	Handler interface {
		UpdateTask(c *gin.Context)
	}
)

func NewUpdateTaskHandler(db *gorm.DB) Handler {
	return &UpdateTaskHandler{db: db}
}

// @Summary Обновить задачу
// @Description Обновляет задачу по указанному ID
// @Tags Задачи
// @Accept json
// @Produce json
// @Param taskId path int true "ID задачи"
// @Param input body models.UpdateTaskRequest true "Данные для обновления задачи"
// @Success 200 {object} models.UpdateTaskResponse
// @Failure 400 {object} errs.ErrorResponse "Некорректные данные"
// @Failure 404 {object} errs.ErrorResponse "Задача не найдена"
// @Failure 500 {object} errs.ErrorResponse "Ошибка при обновлении задачи"
// @Router /tasks/update/{taskId} [put]
func (h *UpdateTaskHandler) UpdateTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		errs.BadRequest(c, err, "Некорректный taskID")
		return
	}

	var input models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		errs.BadRequest(c, err, "Некорректные данные")
		return
	}

	if input.Priority == "" {
		input.Priority = "Medium"
	} else {
		// Проверяем, что Priority соответствует допустимым значениям
		validPriorities := map[string]bool{
			"Low":    true,
			"Medium": true,
			"High":   true,
		}
		if !validPriorities[input.Priority] {
			errs.BadRequest(c, errors.New("Неверное значение приоритета. Допустимые значения: Low, Medium, High."), "")
			return
		}
	}

	// Проверка статуса
	validStatuses := map[string]bool{
		"Backlog":    true,
		"InProgress": true,
		"Done":       true,
	}
	if !validStatuses[input.Status] {
		errs.BadRequest(c, errors.New("Неверное значение статуса. Допустимые значения: Backlog, InProgress, Done."), "")
		return
	}

	if err := h.db.Model(&models.Task{}).Where("id = ?", taskID).Updates(input).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при обновлении задачи")
		return
	}

	errs.Success(c, models.UpdateTaskResponse{
		Message: "Задача обновлена",
	})
}
