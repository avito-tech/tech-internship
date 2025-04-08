# Этап сборки
FROM golang:1.24.1-alpine AS builder

# Установка необходимых инструментов и зависимостей для SQLite
RUN apk add --no-cache git gcc musl-dev sqlite-dev

# Установка рабочей директории
WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o main ./cmd/service

FROM alpine:latest

RUN apk add --no-cache sqlite

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]