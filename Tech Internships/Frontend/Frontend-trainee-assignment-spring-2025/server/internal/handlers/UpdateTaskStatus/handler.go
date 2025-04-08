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
	UpdateTaskStatusHandler struct {
		db *gorm.DB
	}

	Handler interface {
		UpdateTaskStatus(c *gin.Context)
	}
)

func NewUpdateTaskStatusHandler(db *gorm.DB) Handler {
	return &UpdateTaskStatusHandler{db: db}
}

// @Summary Обновить статус задачи
// @Description Обновляет статус задачи по указанному ID
// @Tags Задачи
// @Accept json
// @Produce json
// @Param taskId path int true "ID задачи"
// @Param input body models.UpdateTaskStatusRequest true "Данные для обновления статуса задачи"
// @Success 200 {object} models.UpdateTaskStatusResponse
// @Failure 400 {object} errs.ErrorResponse "Некорректные данные"
// @Failure 404 {object} errs.ErrorResponse "Задача не найдена"
// @Failure 500 {object} errs.ErrorResponse "Ошибка при обновлении статуса задачи"
// @Router /tasks/updateStatus/{taskId} [put]
func (h *UpdateTaskStatusHandler) UpdateTaskStatus(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		errs.BadRequest(c, err, "Некорректный taskID")
		return
	}

	var input models.UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		errs.BadRequest(c, err, "Некорректные данные")
		return
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

	// Обновляем только статус
	if err := h.db.Model(&models.Task{}).Where("id = ?", taskID).Update("status", input.Status).Error; err != nil {
		errs.InternalError(c, err, "Ошибка при обновлении статуса задачи")
		return
	}

	response := models.UpdateTaskStatusResponse{Message: "Статус задачи обновлен"}
	errs.Success(c, response)
}
