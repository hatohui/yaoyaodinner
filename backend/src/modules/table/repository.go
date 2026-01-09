package table

import "gorm.io/gorm"

type TableRepository interface {
	GetTables() []Table
	GetTableByID(id string) *Table
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

func (r *repository) GetTableByID(id string) *Table {
	var table Table
	result := r.db.First(&table, "id = ?", id)
	if result.Error != nil {
		return nil
	}
	return &table
}