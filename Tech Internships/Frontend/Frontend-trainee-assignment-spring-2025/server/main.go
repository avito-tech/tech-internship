// @title Avito FE Tech Internship 2025 Wave 2 API
// @version 1.0
// @description API для управления задачами и досками
// @host localhost:8080
// @BasePath /api/v1
package main

import (
	"log"
	"time"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/docs"
	create_task_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/CreateTask"
	get_boards_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetBoards"
	get_task_by_id_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetTaskByID"
	get_tasks_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetTasks"
	get_tasks_on_board_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetTasksOnBoard"
	get_team_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetTeam"
	get_teams_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetTeams"
	get_user_tasks_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetUserTasks"
	get_users_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/GetUsers"
	update_task_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/UpdateTask"
	update_task_status_handler "github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/handlers/UpdateTaskStatus"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/models"
	"github.com/lev4rT/avito_fe_tech_internship_2025_wave2_backend/internal/seed"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("main.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db.AutoMigrate(&models.User{}, &models.Team{}, &models.Board{}, &models.Task{})
	seed.SeedDatabase(db)

	createTaskHandler := create_task_handler.NewCreateTaskHandler(db)
	getBoardsHandler := get_boards_handler.NewGetBoardsHandler(db)
	getTeamsHandler := get_teams_handler.NewGetTeamsHandler(db)
	getUsersHandler := get_users_handler.NewGetUsersHandler(db)
	getUserTasksHandler := get_user_tasks_handler.NewGetUserTasksHandler(db)
	updateTaskHandler := update_task_handler.NewUpdateTaskHandler(db)
	updateTaskStatusHandler := update_task_status_handler.NewUpdateTaskStatusHandler(db)
	getTeamHandler := get_team_handler.NewGetTeamHandler(db)
	getTaskByIDHandler := get_task_by_id_handler.NewGetTaskByIDHandler(db)
	getTasksOnBoardHandler := get_tasks_on_board_handler.NewGetTasksOnBoardHandler(db)
	getTasksHandler := get_tasks_handler.NewGetTasksHandler(db)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:    []string{"*"},
		AllowHeaders:    []string{"*"},
		ExposeHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge: 12 * time.Hour,
	}))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/swagger/doc.json")))

	api := r.Group("/api/v1")

	api.GET("/boards", getBoardsHandler.GetBoards)
	api.GET("/boards/:boardId", getTasksOnBoardHandler.GetTasksOnBoard)

	api.GET("/teams", getTeamsHandler.GetTeams)
	api.GET("/teams/:teamId", getTeamHandler.GetTeam)

	api.GET("/users", getUsersHandler.GetUsers)
	api.GET("/users/:id/tasks", getUserTasksHandler.GetUserTasks)

	api.GET("/tasks", getTasksHandler.GetTasks)
	api.POST("/tasks/create", createTaskHandler.CreateTask)
	api.PUT("/tasks/update/:taskId", updateTaskHandler.UpdateTask)
	api.PUT("/tasks/updateStatus/:taskId", updateTaskStatusHandler.UpdateTaskStatus)
	api.GET("/tasks/:taskId", getTaskByIDHandler.GetTaskByID)

	log.Println("Server is running on :8080")
	r.Run(":8080")
}
