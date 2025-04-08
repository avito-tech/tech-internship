package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	FullName      string `gorm:"not null"`
	Email         string `gorm:"unique;not null"`
	Description   string `gorm:"not null"`
	AvatarURL     string `gorm:"not null"`
	AssignedTasks []Task `gorm:"foreignKey:AssigneeID"`
	TeamID        uint   `gorm:"not null"`
	Team          Team   `gorm:"foreignKey:TeamID"`
}

type Team struct {
	gorm.Model
	Name        string `gorm:"not null"`
	Description string
	Users       []User  `gorm:"foreignKey:TeamID"`
	Boards      []Board `gorm:"foreignKey:TeamID"`
}

type Board struct {
	gorm.Model
	Name        string `gorm:"not null"`
	Description string
	TeamID      uint
	Team        Team   `gorm:"foreignKey:TeamID"`
	Tasks       []Task `gorm:"foreignKey:BoardID"`
}

type Task struct {
	gorm.Model
	Title       string `gorm:"not null"`
	Description string
	Priority    string `gorm:"not null;default:'Medium'"`
	Status      string `gorm:"not null;default:'Backlog'"`
	AssigneeID  uint
	Assignee    User   `gorm:"foreignKey:AssigneeID"`
	BoardID     uint
	Board       Board  `gorm:"foreignKey:BoardID"`
}
