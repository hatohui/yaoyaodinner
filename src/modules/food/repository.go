package food

import (
	"context"
	"fmt"
	"time"
	"yaoyao-functions/src/common"
	redisClient "yaoyao-functions/src/common/redis-client"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type FoodRepository interface {
	GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, error)
	GetTotalFoodCount(categoryID string) (int64, error)
	ClearFoodCache() error
}

type repository struct {
	db          *gorm.DB
	redisClient *redis.Client
}

func NewRepository(db *gorm.DB, redisClient *redis.Client) FoodRepository {
	return &repository{db: db, redisClient: redisClient}
}

func (r *repository) GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, error) {
	key := fmt.Sprintf(common.REDIS_KEY_FOOD_LIST_BY_PAGE, pageNumber, languageCode, categoryID, count)

	foods, err := redisClient.Get[[]Food](r.redisClient, key)

	if err == nil {
			return foods, nil
	}

	offset := (pageNumber - 1) * count
	var foodList []Food

	query := r.db.Table(common.TABLE_FOOD).
		Select("food.*, COALESCE(ft.name, food.name) as name, COALESCE(ft.description, food.description) as description").
		Joins("LEFT JOIN food_translation ft ON food.id = ft.food_id AND ft.language = ?", languageCode).
		Where("food.is_available = ?", true)

	if categoryID != "all" && categoryID != "" {
		query = query.Where("food.category_id = ?", categoryID)
	}

	err = query.Offset(offset).Limit(count).Find(&foodList).Error

	if err != nil {
		return nil, err
	}

	redisClient.Set(r.redisClient, key, foodList, 24*time.Hour)

	return foodList, nil
}

func (r *repository) GetTotalFoodCount(categoryID string) (int64, error) {
	var total int64
	query := r.db.Table(common.TABLE_FOOD).Where("is_available = ?", true)

	if categoryID != "all" && categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	err := query.Count(&total).Error
	return total, err
}

func (r *repository) ClearFoodCache() error {
	if r.redisClient == nil {
		return nil
	}

	ctx := context.Background()
	iter := r.redisClient.Scan(ctx, 0, "food:list:page:*", 0).Iterator()

	for iter.Next(ctx) {
		r.redisClient.Del(ctx, iter.Val())
	}

	return iter.Err()
}
