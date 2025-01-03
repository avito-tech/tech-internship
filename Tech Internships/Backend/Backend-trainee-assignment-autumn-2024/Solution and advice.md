# Стажировки для Backend-разработчиков в Авито: на что мы смотрим при проверке работ
Наши разработчики проанализировали тестовые задания кандидатов прошедшего отбора и написали статью о лучших подходах и наиболее частых ошибках в работах.  Все совпадения, конечно же, случайны :)
# Инструкция для запуска проекта
Проверяющие должны просмотреть много кода и проверить работоспособность нескольких проектов.  
Помогите им быстрее перейти к интересному — к вашему коду и тестированию логики приложения. Для этого подготовьте понятную инструкцию по проекту.  
Это точно будет отмечено при проверке и поможет вам выделиться среди других кандидатов.
## О чём можно написать
Как запустить проект. Например:  
```markdown
Для запуска проекта нужно выполнить команду `docker-compose up`.
После этого сервис будет доступен на порту `:8080`
```
## Проверка
Перед отправкой нужно проверить, что проект без проблем запускается с 0:  
- указанный в инструкции скрипт завершается без ошибок;
- миграции базы данных успешно проходят;  
- сервис запускается;  
- API сервиса работает.
# Проект должен запускаться
Проекты некоторых кандидатов не запускались на компьютере проверяющего.
Проверьте, что ваш сервис запускается «с нуля», а базу данных легко мигрировать.  
Правилом хорошего тона считается добавить Dockerfile и параметры окружения (ENV-параметры), чтобы сервис можно было запускать на любой системе.
# Формат ответа
Часто кандидаты забывают соблюсти формат ответа, который указан [в задании](https://github.com/avito-tech/tech-internship/blob/main/Tech%20Internships/Backend/Backend-trainee-assignment-autumn-2024/openapi.yml).
В итоге возвращается ответ в формате `json`, даже когда нужен `text/plain`,  или для некоторых случаев не проставляется нужный заголовок.
Исправить это просто — внимательность и  
```go  
w.Header().Set("Content-Type", "application/json")  
```
# Валидация входных данных
Если не проверять входные данные на корректность,   пользователь может случайно (или намеренно) повредить или получить доступ к данным других юзеров,  а в худшем случае — ко всей базе данных.
## Базовые валидации
 Добавляйте валидации в контроллерах при парсинге запросов, чтобы  по системе передавались  корректные данные.  
Если валидация не прошла — сразу возвращать ошибку.
Например:  
```go

type TenderServiceType string

const (  
	TenderServiceTypeConstruction TenderServiceType = "Construction"  
	TenderServiceTypeDelivery     TenderServiceType = "Delivery"  
	TenderServiceTypeManufacture  TenderServiceType = "Manufacture"  
)

func (tst TenderServiceType) Validate() bool {  
	switch tst {  
	case TenderServiceTypeConstruction, TenderServiceTypeDelivery, TenderServiceTypeManufacture:  
		return true  
	default:  
		return false  
	}  
}

// ...

types := r.URL.Query()["service_type"]

serviceTypes := make([]TenderServiceType{}, 0, len(types))  
for _, t := range types {  
	tst := TenderServiceType(t)  
	if !tst.Validate() {  
		continue  
	}  
	serviceTypes = append(serviceTypes, tst)  
}

if len(serviceTypes) == 0 {  
	// возвращаем ошибку  
}  
```

## Специфические валидации
Важно не забывать про отношения между сущностями.  
Допустим, пользователь Вася авторизован, но у него нет прав на изменение предложения, которое создал пользователь Петя.
**Для таких проверок можно или делать дополнительный запрос в базу данных**:
```go  
func (s *Storage) checkRelationToOrganization(ctx context.Context, userId, orgId uuid.UUID) bool {  
	res := 0  
	query := `SELECT 1 FROM organization_responsible WHERE user_id = $1 AND organization_id = $2;`  
	_ = s.conn.QueryRow(ctx, query, userId, orgId).Scan(&res) // ошибку нужно обязательно обработать  
	return res > 0  
}  
```

или при обычном запросе добавить дополнительное условие.
** о построении запросов к базе данных есть отдельный раздел.
Особенно важно проверять авторизацию пользователя.  Подробнее можно почитать в [разборе заданий предыдущей волны](https://github.com/avito-tech/tech-internship/blob/main/Tech%20Internships/Backend/Backend-trainee-assignment-spring-2024/Solution%20and%20advice/%D0%90%D0%B2%D1%82%D0%BE%D1%80%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F.md)
# Code Style
Следование общепринятым рекомендациям по стилю кода делает его более понятным, читаемым, поддерживаемым, упрощает внесение изменений.

Наиболее частые проблемы:  
- не используется линтер, например golangci-lint, который мог бы исправить часть допущенных ошибок;  
- аналогично для языка python не соблюдается PEP8, не используется линтер, например flake8;  
- магические строки (не вынесены в константы);  
- нет логических разделений между блоками;  
- мега-структуры/интерфейсы с большой зоной ответственности;  
- не оборачиваются ошибки;  
- импорты не отсортированы;  
- не пробрасывается контекст.
# Меньше повторяющегося кода
Проверяющий смотрит не только, насколько правильно работает код, но и как легко его поддерживать в дальнейшем.
Если в коде часто встречаются дубли (много одинаковых строк), такой код сложнее поддерживать, он больше подвержен ошибкам.  
Старайтесь выносить повторяющуюся логику в отдельные функции.
Например:

```go  
func respondWithError(w http.ResponseWriter, statusCode int, handlerName string, err error) {  
	slog.Error(err.Error(), "handler", handlerName)

	w.Header().Set("Content-Type", "application/json")  
	w.WriteHeader(statusCode)  
	_, _ = w.Write([]byte(`{"error":"Error occurred"}`))  
}  
```
# Бизнес-логика на своём месте
Часто кандидаты помещают всю логику или на уровень хэндлера (контроллера), или на уровень работы с базой данных.
Это лишает приложение гибкости. Лучше разделять его на разные слои.  
- Если транспортный слой (хэндлеры) содержит основную логику, то её сложно переиспользовать,если в дальнейшем мы захотим поменять или добавить новый протокол (например, grpc+rest api).  
- Если логика вынесена на уровень инфраструктуры (баз данных), то это затруднит работу с разными хранилищами.  
Такую логику обычно выносят на уровень сервисов.
Следует ограничивать взаимодействие между слоями, например, использование базы данных в хендлере.  
Для управления направлением зависимостей между слоями лучше использовать интерфейсы.

Хороший пример:  
```go  
// internal/usecase/tender/deps.go  
type TenderRepository interface {  
    GetTenderById(ctx context.Context, tenderID uuid.UUID) (model.Tender, error)  
}

// internal/usecase/tender.go  
type TenderUsecase struct {  
    tenderRepository TenderRepository  
}

// internal/repository/tender/repository.go  
func (r *Repository) GetTenderById(ctx context.Context, id uuid.UUID) (tender.Tender, error) {  
    // implementation of TenderRepository  
}  
```

Интерфейс `TenderRepository` можно использовать для генерации моков для тестирования usecase-а.

На тему разделения логики на слои можно почитать про Чистую или Гексагональную Архитектуры.

Также рекомендуем почитать [совет для прошлой волны](https://github.com/avito-tech/tech-internship/blob/main/Tech%20Internships/Backend/Backend-trainee-assignment-spring-2024/Solution%20and%20advice/%D0%91%D0%B8%D0%B7%D0%BD%D0%B5%D1%81-%D0%BB%D0%BE%D0%B3%D0%B8%D0%BA%D0%B0%20%D0%B2%20handler.md).

# Код покрыт тестами

Самый распространённый недочёт в этой волне — отсутствие тестов.

Задание было очень объёмным,но всё-таки стоитнаписать хотя бы несколько тестов для того, чтобы показать свои навыки и понимание темы.  
В идеале покрыть тестами несколько типичных методов: хэндлер, сервис, метод для работы с базой данных.

Лучше использовать табличные тесты, это обычно позволяет сократить количество кода в тестовых файлах.

# Логирование ошибок

В реальных системах, использующих микросервисы, применяются 4 вида сигналов для наблюдения за состоянием системы:логи, метрики, алерты и распределённый трейсинг.

Проще всего добавить в свой сервислоги.
Сделать это можно, например, так:
Инициализируем логгер в файле `main.go` и передаём его в конструкторы, например, сервисов.  
```go  
lgr := slog.New(slog.NewJSONHandler(os.Stderr, nil))

serviceBid := service.NewBidService(lgr)  
```

При обработке запросов внутри сервисов мы сможем логировать важную информацию.

```go  
func NewBidService(lgr *slog.Logger) *BidService {  
	return &BidService{  
		lgr: lgr,  
	}  
}

func (s *BidService) CreateBid(ctx context.Context, data *Request) (Response, error) {  
	if bid.Name == "" {  
		s.lgr.With(  
			slog.String("username", data.UserName),  
		).Error("creating a bid: username is empty")

		return Response{}, ErrUsernameFieldEmpty  
	}  
}  
```

Конечно, в сервисах лучше использовать интерфейсы на сущности, это упрощает тестирование через мок-объекты.  
Но это уже немного другая тема.

# Пользователь не должен видеть полные ошибки

Часто пользователю отправляются ошибки напрямую из, например, базы данных.  Ему такая информация не нужна.  
Более того, таким образом мы облегчаем злоумышленнику задачу взлома нашей базы данных - ему будет легче сразу видеть результат своих действий.  
Особенно это опасно, если мы не озаботились валидацией пользовательских данных и правильной генерацией SQL-запросов.

```go  
func (s *BidService) CreateBid(ctx context.Context, data *Request) (Response, error) {  
	err := s.db.CreateBid(ctx, data)  
	if err != nil {  
		s.lgr.With(  
			slog.Any("username", bid.UserName),  
		).Error("creating a bid: " + err.Error())

		return Response{}, InternalError  
	}  
}  
```
Выше показан упрощённый пример. Обычно ошибки подменяются на пользовательские на транспортном уровне.

# Грамотное использование транзакций

При добавлении или изменении данных в базе важно использовать транзакции. Часто изменения касаются нескольких таблиц в рамках одной операции со стороны пользователя. Чтобы сохранить консистентность данных, все изменения лучше делать в рамках одной транзакции.

Пример того, как это можно реализовать:  
```go  
func (s *Storage) SubmitBidDecision(ctx context.Context, bidID, tenderID uuid.UUID) (err error) {  
	tx, err := s.conn.Begin(ctx)  
	if err != nil {  
		return fmt.Errorf("starting transaction: %w", err)  
	}

	defer func() {  
		var e error  
		if err == nil {  
			e = tx.Commit(ctx)  
		} else {  
			e = tx.Rollback(ctx)  
		}

		if err == nil && e != nil {  
			err = fmt.Errorf("finishing transaction: %w", e)  
		}  
	}()

	queryBid := `  
UPDATE bid   
SET   
	status = $1  
WHERE id = $2 ;`

	if _, err = tx.Exec(ctx, queryBid, model.BidStatusApproved, bidID); err != nil {  
		return fmt.Errorf("updating bids: %w", err)  
	}

	queryTender := `  
UPDATE tender   
SET   
	status = $1  
WHERE id = $2;`

	if _, err = tx.Exec(ctx, queryTender, model.TenderStatusClosed, tenderID); err != nil {  
		return fmt.Errorf("updating tenders: %w", err)  
	}

	return nil  
}  
```

*вопросу правильного построения запросов к базе данных посвящён отдельный совет.

При этом не стоит использовать транзакции всегда.  
Об этом можно прочитать в [совете для предыдущей волны](https://github.com/avito-tech/tech-internship/blob/main/Tech%20Internships/Backend/Backend-trainee-assignment-spring-2024/Solution%20and%20advice/%D0%9F%D0%BE%D0%B2%D1%81%D0%B5%D0%BC%D0%B5%D1%81%D1%82%D0%BD%D0%BE%D0%B5%20%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%82%D1%80%D0%B0%D0%BD%D0%B7%D0%B0%D0%BA%D1%86%D0%B8%D0%B9.md)

## Альтернативные варианты работы с транзакцией

Кроме ручной работы с транзакциями в слое базы данных можно использовать менеджер транзакций,у нас есть отличная [статья на хабре про него](https://habr.com/ru/companies/avito/articles/727168/).

## Защита от ошибок при конкурентном использовании (продвинутый кейс)

Пример выше не гарантирует, что конкурентная транзакция уже не изменила статус тендера.
Чтобы обеспечить корректную работу сервиса в этой ситуации, необходимо дополнительно проработать логику:

- использовать явные блокировки https://postgrespro.ru/docs/postgrespro/17/explicit-locking;  
- полагаться на уровни изоляции в транзакции, например, создать транзакцию с уровнем Repeatable read/Serializable,внутри транзакции запросить статус тендера и рассчитывать на то,  
что база данных автоматически отклонит транзакцию в случае, если параллельная транзакция изменит статус;  
- в рамках одного запроса сделать проверку статуса и его обновление, с этим может помочь CTE.

# Построение запросов к базе данных

Для безопасной вставки пользовательских данных в базу нужно их экранировать.  Обычно для простоты экранируют все данные, которые добавляются/изменяются в базе.

Также для переиспользования одного query в разных SQL-запросах (например, с разными условиями `where`, для использования в подзапросах и т.п.),  
часто прибегают к помощи SQL generators или SQL Query Builders.

В рамках тестового задания использование генераторов может быть чрезмерным, поэтому проще воспользоваться билдером запросов, например, [Squirrel](https://github.com/Masterminds/squirrel).

Пример использования:  
```go  
func (s *Storage) SubmitBidDecision(ctx context.Context, bidID, tenderID uuid.UUID) (err error) {  
	// ...

	// достаточно инициализировать builder один раз и присвоить структуре.  
	builder := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	query, args, err := builder.Update("bid").  
		Set("status", model.BidStatusApproved).  
		Where(squirrel.Eq{"id": bidID}).  
		ToSql()  
	if err != nil {  
		return fmt.Errorf("building query: %w", err)  
	}

	_, err = s.conn.Exec(ctx, query, args...)  
	if err != nil {  
		return fmt.Errorf("executing query: %w", err)  
	}

	// ...

	return nil  
}  
```

Таким образом мы гарантируем, что данные для вставки будут экранированы. Более того, в Squirrel есть приятные бонусы, например, кэширование prepared statements.

Эта тема также обсуждалась в [советах к прошлой волне](https://github.com/avito-tech/tech-internship/blob/main/Tech%20Internships/Backend/Backend-trainee-assignment-spring-2024/Solution%20and%20advice/%D0%9F%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B4%D0%B8%D0%BD%D0%B0%D0%BC%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D1%85%20%D0%B7%D0%B0%D0%BF%D1%80%D0%BE%D1%81%D0%BE%D0%B2%20%D0%BA%20%D0%91%D0%94.md).  
