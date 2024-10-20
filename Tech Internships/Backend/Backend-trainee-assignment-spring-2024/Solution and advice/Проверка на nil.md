# Проверка на nil

**Ошибка:**
Не проверять указатели на nil (приводит к панике)

**Решение:**
Добавлять проверку на nil

**Пример с ошибкой:**

```go
func InitNilFieldsOfBanner(banner1 *entity.Banner, banner2 *entity.Banner) {
	if banner1.FeatureID == 0 {
		banner1.FeatureID = banner2.FeatureID
	}
	...
}

```

**Хороший пример:**

```go
func InitNilFieldsOfBanner(banner1 *entity.Banner, banner2 *entity.Banner) {
	if banner1 == nil && banner2 == nil {
		return
	}
	...
}

```
