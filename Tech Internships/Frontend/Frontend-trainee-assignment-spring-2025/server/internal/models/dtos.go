package models

// GetBoardsResponse представляет структуру ответа для списка досок
// @Description Содержит основную информацию о доске и количество задач
type GetBoardsResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	TaskCount   int    `json:"taskCount"`
}

// AssigneeUserForTask содержит сокращенную информацию о пользователе-исполнителе
// @Description Упрощенная модель пользователя для отображения в задачах
type AssigneeUserForTask struct {
	ID        uint   `json:"id"`
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatarUrl"`
}

// GetTasksResponse представляет ответ со списком задач
// @Description Содержит основные данные о задачах с информацией об исполнителях и досках
type GetTasksResponse struct {
	ID          uint                `json:"id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Priority    string              `json:"priority" enums:"Low,Medium,High" example:"Medium"`
	Status      string              `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
	Assignee    AssigneeUserForTask `json:"assignee"`
	BoardID     uint                `json:"boardId"`
	BoardName   string              `json:"boardName"`
}

// GetTeamsResponse представляет ответ с информацией о командах
// @Description Содержит данные о команде, включая количество пользователей и досок
type GetTeamsResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	UsersCount  int    `json:"usersCount"`
	BoardsCount int    `json:"boardsCount"`
}

// GetUsersResponse представляет ответ с информацией о пользователях
// @Description Содержит данные о пользователе, включая информацию о команде и количестве задач
type GetUsersResponse struct {
	ID          uint   `json:"id"`
	FullName    string `json:"fullName"`
	Email       string `json:"email"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatarUrl"`
	TeamID      uint   `json:"teamId"`
	TeamName    string `json:"teamName"`
	TasksCount  int    `json:"tasksCount"`
}

// CreateTaskRequest содержит данные для создания задачи
// @Description Запрос на создание новой задачи
type CreateTaskRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=100"`
	Description string `json:"description" binding:"required,min=1,max=500"`
	Priority    string `json:"priority" enums:"Low,Medium,High" example:"Medium"`
	AssigneeID  uint   `json:"assigneeId" binding:"required"`
	BoardID     uint   `json:"boardId" binding:"required"`
}

// CreateTaskResponse содержит результат создания задачи
// @Description Ответ после успешного создания задачи
type CreateTaskResponse struct {
	ID uint `json:"id"`
}

// GetUserTasksResponse представляет ответ с информацией о задачах пользователя
// @Description Содержит данные о задаче, включая информацию о доске
type GetUserTasksResponse struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
	BoardName   string `json:"boardName"`
	Priority    string `json:"priority" enums:"Low,Medium,High" example:"Medium"`
}

// UpdateTaskRequest содержит данные для обновления задачи
// @Description Запрос на обновление существующей задачи
type UpdateTaskRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=100"`
	Description string `json:"description" binding:"required,min=1,max=500"`
	Priority    string `json:"priority" enums:"Low,Medium,High" example:"Medium"`
	Status      string `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
	AssigneeID  uint   `json:"assigneeId" binding:"required"`
}

// UpdateTaskResponse содержит результат обновления задачи
// @Description Ответ после успешного обновления задачи
type UpdateTaskResponse struct {
	Message string `json:"message"`
}

// GetTaskByIDResponse представляет ответ с полной информацией о задаче
// @Description Содержит полные данные задачи, включая информацию об исполнителе и доске
type GetTaskByIDResponse struct {
	ID          uint                `json:"id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Priority    string              `json:"priority" enums:"Low,Medium,High" example:"High"`
	Status      string              `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
	Assignee    AssigneeUserForTask `json:"assignee"`
	BoardName   string              `json:"boardName"`
}

// GetTasksOnBoardResponse содержит информацию о задачах на доске
// @Description Ответ с данными задач, принадлежащих конкретной доске
type GetTasksOnBoardResponse struct {
	ID          uint                `json:"id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Priority    string              `json:"priority" enums:"Low,Medium,High" example:"Medium"`
	Status      string              `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
	Assignee    AssigneeUserForTask `json:"assignee"`
}

// GetTeamBoards представляет информацию о досках команды
// @Description Содержит данные о досках, принадлежащих команде
type GetTeamBoards struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// GetTeamUsers представляет информацию о пользователях команды
// @Description Содержит данные о пользователях, принадлежащих команде
type GetTeamUsers struct {
	ID          uint   `json:"id"`
	FullName    string `json:"fullName"`
	Email       string `json:"email"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatarUrl"`
}

// GetTeamResponse представляет ответ с информацией о команде
// @Description Содержит данные о команде, включая пользователей и доски
type GetTeamResponse struct {
	ID          uint            `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Users       []GetTeamUsers  `json:"users"`
	Boards      []GetTeamBoards `json:"boards"`
}

type UpdateTaskStatusRequest struct {
	Status string `json:"status" enums:"Backlog,InProgress,Done" example:"Done"`
}

type UpdateTaskStatusResponse struct {
	Message string `json:"message"`
}
