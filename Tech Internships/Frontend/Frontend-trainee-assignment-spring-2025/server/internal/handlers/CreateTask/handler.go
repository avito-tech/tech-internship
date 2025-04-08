package create_task_handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type DBInterface interface {
	First(dest interface{}, conds ...interface{}) *gorm.DB
	Create(value interface{}) *gorm.DB
}

type (
	CreateTaskHandler struct {
		db DBInterface
	}

	Handler interface {
		CreateTask(c *gin.Context)
	}
)

func NewCreateTaskHandler(db DBInterface) Handler {
	return &CreateTaskHandler{db: db}
}

// CreateTask обрабатывает запрос на создание новой задачи
// @Summary Создать новую задачу
// @Description Создает новую задачу с указанными параметрами
// @Tags Задачи
// @Accept  json
// @Produce  json
// @Param input body models.CreateTaskRequest true "Данные для создания задачи"
// @Success 201 {object} models.CreateTaskResponse "Задача успешно создана"
// @Failure 400 {object} errs.ErrorResponse "Неверный формат данных или параметры"
// @Failure 404 {object} errs.ErrorResponse "Доска или пользователь не найдены"
// @Failure 500 {object} errs.ErrorResponse "Ошибка сервера при создании задачи"
// @Router /tasks/create [post]
func (h *CreateTaskHandler) CreateTask(c *gin.Context) {
	var input models.CreateTaskRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		errs.BadRequest(c, err, "Неверный формат данных")
		return
	}

	if err := ValidateInput(&input); err != nil {
		errs.BadRequest(c, err, "")
		return
	}

	task, err := h.createTaskInDB(&input)
	if err != nil {
		handleDatabaseError(c, err)
		return
	}

	errs.Success(c, models.CreateTaskResponse{
		ID: task.ID,
	})
}

func ValidateInput(input *models.CreateTaskRequest) error {
	if input.Priority == "" {
		input.Priority = "Medium"
	} else {
		validPriorities := map[string]bool{"Low": true, "Medium": true, "High": true}
		if !validPriorities[input.Priority] {
			return errors.New("неверное значение приоритета. Допустимые значения: Low, Medium, High")
		}
	}
	return nil
}

func (h *CreateTaskHandler) createTaskInDB(input *models.CreateTaskRequest) (*models.Task, error) {
	var board models.Board
	if err := h.db.First(&board, input.BoardID).Error; err != nil {
		return nil, err
	}

	var user models.User
	if err := h.db.First(&user, input.AssigneeID).Error; err != nil {
		return nil, err
	}

	task := models.Task{
		Title:       input.Title,
		Description: input.Description,
		Priority:    input.Priority,
		Assignee:    user,
		Board:       board,
	}

	if err := h.db.Create(&task).Error; err != nil {
		return nil, err
	}

	return &task, nil
}

func handleDatabaseError(c *gin.Context, err error) {
	switch err {
	case gorm.ErrRecordNotFound:
		errs.NotFound(c, err, "Ресурс не найден")
	default:
		errs.InternalError(c, err, "Ошибка при работе с базой данных")
	}
}