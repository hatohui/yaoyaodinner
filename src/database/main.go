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