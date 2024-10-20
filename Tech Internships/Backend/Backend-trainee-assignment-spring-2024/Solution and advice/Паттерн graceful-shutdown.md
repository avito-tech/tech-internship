# Паттерн graceful-shutdown

**Ошибка:**
Без graceful shutdown приложение может просто отключиться, оставив открытыми соединения с базой данных, внешними сервисами или клиентами. Это может привести к утечкам ресурсов и проблемам с производительностью

**Решение:**
Реализовать паттерн в своем коде через каналы и сигналы

**Пример с ошибкой:**

```go
	// Routes
	r := gin.New()
	v1.NewRouter(r, middlewares, authService, bannerService)

	r.Run(fmt.Sprintf(":%d", config.HTTP.Port))

```

**Хороший пример:**

```go
func main() {
	router := gin.Default()
	router.GET("/", func(c *gin.Context) {
		time.Sleep(5 * time.Second)
		c.String(http.StatusOK, "Welcome Gin Server")
	})

	srv := &http.Server{
		Addr:    ":8080",
		Handler: router.Handler(),
	}

	go func() {
		// service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall. SIGKILL but can"t be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown Server ...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server Shutdown:", err)
	}
	// catching ctx.Done(). timeout of 5 seconds.
	select {
	case <-ctx.Done():
		log.Println("timeout of 5 seconds.")
	}
	log.Println("Server exiting")
}

```
