package food

import (
	"context"
	"fmt"
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/redisClient"

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
	cacheCategory := categoryID
	if cacheCategory == "" {
		cacheCategory = "all"
	}
	key := fmt.Sprintf(common.REDIS_KEY_FOOD_LIST_BY_PAGE, pageNumber, languageCode, cacheCategory, count)

	offset := (pageNumber - 1) * count
	fmt.Printf("DEBUG: page=%d, count=%d, offset=%d, categoryID='%s'\n", pageNumber, count, offset, categoryID)

	var foodList []Food

	query := r.db.Table(common.TABLE_FOOD).
		Select("food.*, COALESCE(ft.name, food.name) as name, COALESCE(ft.description, food.description) as description").
		Joins("LEFT JOIN food_translation ft ON food.id = ft.food_id AND ft.language = ?", languageCode).
		Where("food.is_available = ?", true)

	if categoryID != "" {
		fmt.Printf("DEBUG: Adding category filter for '%s' (type: %T)\n", categoryID, categoryID)
		query = query.Where("food.category_id = ?", categoryID)
		
		// Let's also check what's in the database
		var dbCheck []struct {
			CategoryID string
			Count      int
		}
		r.db.Table(common.TABLE_FOOD).
			Select("category_id, COUNT(*) as count").
			Group("category_id").
			Scan(&dbCheck)
		fmt.Printf("DEBUG: Categories in DB: %+v\n", dbCheck)
	}

	query = query.Offset(offset).Limit(count)
	
	sql := query.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Find(&foodList)
	})
	fmt.Printf("DEBUG: SQL: %s\n", sql)

	err := query.Find(&foodList).Error

	if err != nil {
		fmt.Printf("DEBUG: Error: %v\n", err)
		return nil, err
	}

	fmt.Printf("DEBUG: Found %d foods\n", len(foodList))

	if r.redisClient != nil {
		redisClient.Set(r.redisClient, key, foodList, 24*time.Hour)
	}

	return foodList, nil
}

func (r *repository) GetTotalFoodCount(categoryID string) (int64, error) {
	var total int64

	query := r.db.Table(common.TABLE_FOOD).Where("is_available = ?", true)

	if categoryID != "" {
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
