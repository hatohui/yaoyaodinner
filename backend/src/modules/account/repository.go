package account

import "gorm.io/gorm"

type AccountRepository interface{}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) AccountRepository {
	return &repository{db: db}
}