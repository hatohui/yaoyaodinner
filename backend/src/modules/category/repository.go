package category

import (
	"context"
	"fmt"
	"time"
	"yaoyao-functions/src/common"
	redisClient "yaoyao-functions/src/common/redis-client"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	FetchAllCategories(languageCode string) ([]Category, error)
	ClearCategoryCache() error
	FetchCategoryByID(categoryID string, languageCode string) (*Category, error)
}

type repository struct {
	db          *gorm.DB
	redisClient *redis.Client
}

func NewRepository(db *gorm.DB, redisClient *redis.Client) CategoryRepository {
	return &repository{db: db, redisClient: redisClient}
}

func (r *repository) FetchAllCategories(languageCode string) ([]Category, error) {
	key := fmt.Sprintf(common.REDIS_KEY_CATEGORY_LIST, languageCode)

	categories, err := redisClient.Get[[]Category](r.redisClient, key)

	if err == nil {
		return categories, nil
	}

	var categoryList []Category

	err = r.db.Table(common.TABLE_CATEGORY).
		Select("category.*, COALESCE(ct.name, category.name) as name, COALESCE(ct.description, category.description) as description").
		Joins("LEFT JOIN category_translation ct ON category.id = ct.category_id AND ct.language = ?", languageCode).
		Find(&categoryList).Error

	if err != nil {
		return nil, err
	}

	redisClient.Set(r.redisClient, key, categoryList, 24*time.Hour)

	return categoryList, nil
}

func (r *repository) FetchCategoryByID(categoryID string, languageCode string) (*Category, error) {
	key := fmt.Sprintf(common.REDIS_KEY_CATEGORY_ID, categoryID, languageCode)
	category, err := redisClient.Get[Category](r.redisClient, key)

	if err == nil {
		return &category, nil
	}

	err = r.db.Table(common.TABLE_CATEGORY).
		Select("category.*, COALESCE(ct.name, category.name) as name, COALESCE(ct.description, category.description) as description").
		Joins("LEFT JOIN category_translation ct ON category.id = ct.category_id AND ct.language = ?", languageCode).
		Where("category.id = ?", categoryID).
		First(&category).Error

	if err != nil {
		return nil, err
	}

	redisClient.Set(r.redisClient, key, category, 24*time.Hour)

	return &category, nil
}

func (r *repository) ClearCategoryCache() error {
	if r.redisClient == nil {
		return nil
	}

	ctx := context.Background()
	iter := r.redisClient.Scan(ctx, 0, "category:list:*", 0).Iterator()

	for iter.Next(ctx) {
		r.redisClient.Del(ctx, iter.Val())
	}

	return iter.Err()
}
