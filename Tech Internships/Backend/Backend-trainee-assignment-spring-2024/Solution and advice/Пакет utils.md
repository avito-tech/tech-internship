# Пакет utils

**Ошибка:**
Создания пакета `utils` для выноса дополнительного функционала

Пакет должен нести функционально название. Эти пакеты содержат множество несвязанных функций, поэтому их полезность трудно описать в терминах того, что предоставляет пакет.

**Решение:**
Распределить код в нужных пакетах. Данный пример можно вынести в пакет `entity`

**Пример с ошибкой:**

```go
package utils

func InitNilFieldsOfBanner(banner1 *entity.Banner, banner2 *entity.Banner) {
	if banner1.FeatureID == 0 {
		banner1.FeatureID = banner2.FeatureID
	}
	...
}

```

**Хороший пример:**

```go
package entity

func InitNilFieldsOfBanner(banner1 *Banner, banner2 *Banner) {
....
}

```
