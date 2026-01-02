package food

import (
	"yaoyao-functions/src/common"

	"gorm.io/gorm"
)

type FoodRepository interface {
	GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, error)
	GetTotalFoodCount(categoryID string) (int64, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) FoodRepository {
	return &repository{db: db}
}

func (r *repository) GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, error) {
	offset := (pageNumber - 1) * count
	var foodList []Food

	query := r.db.Table(common.TABLE_FOOD).
		Select("food.*, COALESCE(ft.name, food.name) as name, COALESCE(ft.description, food.description) as description").
		Joins("LEFT JOIN food_translation ft ON food.id = ft.food_id AND ft.language = ?", languageCode).
		Where("food.is_available = ?", true)

	if categoryID != "all" && categoryID != "" {
		query = query.Where("food.category_id = ?", categoryID)
	}

	err := query.Offset(offset).Limit(count).Find(&foodList).Error

	if err != nil {
		return nil, err
	}

	return foodList, nil
}

func (r *repository) GetTotalFoodCount(categoryID string) (int64, error) {
	var total int64

	query := r.db.Table(common.TABLE_FOOD).Where("is_available = ?", true)

	if categoryID != "all" && categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	err := query.Count(&total).Error
	if err != nil {
		return 0, err
	}

	return total, nil
}

