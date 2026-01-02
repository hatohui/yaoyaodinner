package people

import "gorm.io/gorm"

type PeopleRepository interface {
	GetAllPeople() ([]People, error)
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
		return []People{}, err
	}

	return people, nil
}