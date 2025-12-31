package database

import "gorm.io/gorm"

func FindAll[T any](db *gorm.DB, table string) ([]T, error) {
	var models []T

	result := db.Table(table).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	return models, nil
}

func FindByColumn[T any](db *gorm.DB, table string, column string) ([]T, error) {
	var models []T

	result := db.Table(table).Pluck(column, &models)

	if result.Error != nil {
		return nil, result.Error
	}

	return models, nil
}

func FindByPageAndCountWhere[T any](db *gorm.DB, table string, pageNumber int, count int, where string, args ...interface{}) ([]T, error) {
	var models []T

	offset := (pageNumber - 1) * count

	result := db.Table(table).Where(where, args...).Offset(offset).Limit(count).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	return models, nil
}