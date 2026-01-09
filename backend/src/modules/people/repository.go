package people

import "gorm.io/gorm"

type PeopleRepository interface {
	GetAllPeople() ([]People, error)
	GetPeopleByTableID(tableID string) ([]People, error)
}

type repository struct {
	database *gorm.DB
}

func NewRepository(db *gorm.DB) PeopleRepository {
	return &repository{database: db}
}

func (r *repository) GetAllPeople() ([]People, error) {
	var people []People
	err := r.database.Find(&people).Error

	if err != nil {
		return nil, err
	}

	return people, nil
}

func (r *repository) GetPeopleByTableID(tableID string) ([]People, error) {
	var people []People
	err := r.database.Joins("Table").Where("table_id = ?", tableID).Find(&people).Error

	if err != nil {
		return nil, err
	}

	return people, nil
}