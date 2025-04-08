package get_boards_handler

import (
	"github.com/gin-gonic/gin"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/errs"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"gorm.io/gorm"
)

type (
	GetBoardsHandler struct {
		db *gorm.DB
	}

	Handler interface {
		GetBoards(c *gin.Context)
	}
)

// NewGetBoardsHandler фабричная функция для создания обработчика
func NewGetBoardsHandler(db *gorm.DB) Handler {
	return &GetBoardsHandler{db: db}
}

// GetBoards обрабатывает запрос на получение списка досок
// @Summary Получить список всех досок
// @Description Возвращает массив досок с основной информацией и количеством задач в каждой
// @Tags Доски
// @Accept json
// @Produce json
// @Success 200 {array} models.GetBoardsResponse "Успешный ответ со списком досок"
// @Failure 500 {object} errs.ErrorResponse "Внутренняя ошибка сервера"
// @Router /boards [get]
func (h *GetBoardsHandler) GetBoards(c *gin.Context) {
	boards, err := h.fetchBoardsFromDB()
	if err != nil {
		errs.InternalError(c, err, "Ошибка при получении досок")
		return
	}

	response := h.prepareResponse(boards)
	errs.Success(c, response)
}

func (h *GetBoardsHandler) fetchBoardsFromDB() ([]models.Board, error) {
	var boards []models.Board
	if err := h.db.Preload("Tasks").Find(&boards).Error; err != nil {
		return nil, err
	}
	return boards, nil
}

func (h *GetBoardsHandler) prepareResponse(boards []models.Board) []models.GetBoardsResponse {
	response := make([]models.GetBoardsResponse, len(boards))
	for i, board := range boards {
		response[i] = models.GetBoardsResponse{
			ID:          board.ID,
			Name:        board.Name,
			Description: board.Description,
			TaskCount:   len(board.Tasks),
		}
	}
	return response
}
