# Бизнес-логика в handler

**Ошибка:**
Выносить бизнес-логику на уровень `handler`, отказываться от слоя `service` или `usecase`

В контексте веб-приложений, обработчики `handlers` обычно отвечают за прием и отправку HTTP-запросов, извлечение данных из запроса, вызов соответствующих методов и возвращение ответа клиенту. Эти обработчики не должны содержать сложную бизнес-логику, так как это делает их менее читаемыми и трудно поддерживаемыми.

Вместо этого, бизнес-логика должна быть вынесена в отдельный слой, часто называемый слоем `usecase` или слоем `service`. Здесь содержатся структуры или функции, которые реализуют конкретные бизнес-операции.

Использование слоя `usecase` позволяет лучше структурировать код, делает его более читаемым и поддерживаемым. Также это упрощает тестирование бизнес-логики, так как мы можем написать юнит-тесты для отдельных `usecase'ов` без необходимости имитировать весь цикл обработки HTTP-запроса.

**Решение:**

- Добавляем новый слой `usecase|services` в наше приложение, переносим всю бизнес-логику в этот слой
- Пишем код в `DDD` формате, в таком случаи в слое `entity` у моделей прописываем логику. `handler` выступает в роли фасада

**Пример с ошибкой:**

```go
func GetUserBanner(
	log *slog.Logger,
	userBannerGetter UserBannerGetter,
	bannerCache BannerCache,
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "internal.httpserver.handlers.user_banner.GetUserBanner"

		log = log.With("op", op)
		log = log.With("request_id", middleware.GetReqID(r.Context()))

		tagID, err := strconv.Atoi(r.URL.Query().Get("tag_id"))
		if err != nil {
			log.Error("error converting tagID", sl.Err(err))
			render.JSON(w, r, response.NewError(http.StatusBadRequest, "Incorrect data"))
			return
		}
		featureID, err := strconv.Atoi(r.URL.Query().Get("feature_id"))
		if err != nil {
			log.Error("error converting featureID", sl.Err(err))
			render.JSON(w, r, response.NewError(http.StatusBadRequest, "Incorrect data"))
			return
		}

		useLastRevision := false
		useLastRevisionStr := r.URL.Query().Get("use_last_revision")
		if useLastRevisionStr == "true" {
			useLastRevision = true
		} else if useLastRevisionStr != "false" && useLastRevisionStr != "" {
			log.Error("Incorrect data")
			render.JSON(w, r, response.NewError(http.StatusBadRequest, "Incorrect data"))
			return
		}

		isAdmin := r.Context().Value("isAdmin").(bool)

		var bannerContent json.RawMessage
		var bannerIsActive bool
		isCacheUsed := false
		if !useLastRevision { // Начинается бизнес-логика
			bannerContent, bannerIsActive, err = bannerCache.GetBanner(r.Context(), tagID, featureID)
			if err != nil {
				log.Error("Error fetching banner content from cache", sl.Err(err))
			} else {
				log.Info("Get data from cache, successful")
				isCacheUsed = true
			}
		}
		if useLastRevision || !isCacheUsed {
			bannerContent, bannerIsActive, err = userBannerGetter.GetUserBanner(r.Context(), tagID, featureID)
			if err != nil {
				if errors.Is(err, errs.ErrBannerNotFound) {
					log.Error("Banner is not found", sl.Err(err))
					render.JSON(w, r, response.NewError(http.StatusNotFound, "Banner is not found"))
					return
				}
				log.Error("Internal error", sl.Err(err))
				render.JSON(w, r, response.NewError(http.StatusInternalServerError, "Intrenal error"))
				return
			}
			err := bannerCache.SetBanner(r.Context(), tagID, featureID, &models.BannerForUser{bannerContent, bannerIsActive})
			if err != nil {
				log.Error("Error setting banner content in cache", sl.Err(err))
			} else {
				log.Info(
					"Data cached:",
					slog.Any("bannerContent", bannerContent),
					slog.Any("bannerIsActive", bannerIsActive),
					slog.Any("tagID", tagID),
					slog.Any("featureID", featureID))
			}
		}
		if !isAdmin && !bannerIsActive {
			log.Error("User have no access to inactive banner")
			render.JSON(w, r, response.NewError(http.StatusForbidden, errs.ErrUserDoesNotHaveAccess.Error()))
			return
		}
		log.Info("Successful respnose:", slog.Any("banner content", bannerContent))
		render.JSON(w, r, ResponseGet{
			response.NewSuccess(200),
			bannerContent,
		})
	}

}

```
