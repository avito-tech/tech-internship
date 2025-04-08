package errs

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`             
	Message string `json:"message,omitempty"` 
}

type SuccessResponse struct {
	Data    interface{} `json:"data"`          
	Message string      `json:"message,omitempty"` 
}

func RespondWithError(c *gin.Context, statusCode int, err error, message ...string) {
	response := ErrorResponse{
		Error: err.Error(),
	}
	
	if len(message) > 0 {
		response.Message = message[0]
	}
	
	c.JSON(statusCode, response)
}

func InternalError(c *gin.Context, err error, message ...string) {
	RespondWithError(c, http.StatusInternalServerError, err, message...)
}

func BadRequest(c *gin.Context, err error, message ...string) {
	RespondWithError(c, http.StatusBadRequest, err, message...)
}

func NotFound(c *gin.Context, err error, message ...string) {
	RespondWithError(c, http.StatusNotFound, err, message...)
}

func Unauthorized(c *gin.Context, err error, message ...string) {
	RespondWithError(c, http.StatusUnauthorized, err, message...)
}

func Forbidden(c *gin.Context, err error, message ...string) {
	RespondWithError(c, http.StatusForbidden, err, message...)
}

func Success(c *gin.Context, data interface{}, message ...string) {
	response := SuccessResponse{
		Data: data,
	}
	
	if len(message) > 0 {
		response.Message = message[0]
	}
	
	c.JSON(http.StatusOK, response)
}