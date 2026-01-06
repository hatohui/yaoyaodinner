package table

import "gorm.io/gorm"

type TableRepository interface {
	GetTables() []Table
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) TableRepository {
	return &repository{db: db}
}

func (r *repository) GetTables() []Table {
	var tables []Table
	r.db.Find(&tables)
	return tables
}