package category

import (
	"yaoyao-functions/src/common"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	FetchAllCategories(languageCode string) ([]Category, error)
	FetchCategoryByID(categoryID string, languageCode string) (*Category, error)
}

type repository struct {
	db          *gorm.DB
}

func NewRepository(db *gorm.DB) CategoryRepository {
	return &repository{db: db}
}

func (r *repository) FetchAllCategories(languageCode string) ([]Category, error) {
	var categoryList []Category

	err := r.db.Table(common.TABLE_CATEGORY).
		Select("category.*, COALESCE(ct.name, category.name) as name, COALESCE(ct.description, category.description) as description").
		Joins("LEFT JOIN category_translation ct ON category.id = ct.category_id AND ct.language = ?", languageCode).
		Find(&categoryList).Error

	if err != nil {
		return nil, err
	}

	return categoryList, nil
}

func (r *repository) FetchCategoryByID(categoryID string, languageCode string) (*Category, error) {
	var category Category
	
	err := r.db.Table(common.TABLE_CATEGORY).
		Select("category.*, COALESCE(ct.name, category.name) as name, COALESCE(ct.description, category.description) as description").
		Joins("LEFT JOIN category_translation ct ON category.id = ct.category_id AND ct.language = ?", languageCode).
		Where("category.id = ?", categoryID).
		First(&category).Error

	if err != nil {
		return nil, err
	}

	return &category, nil
}