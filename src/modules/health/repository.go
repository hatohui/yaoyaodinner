package health

import (
	"context"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Repository interface {
	GetDatabaseConnection() bool
	GetRedisConnection() bool
}	

type repository struct{
	db *gorm.DB
	redisClient *redis.Client
}

func NewRepository(db *gorm.DB, redisClient *redis.Client) Repository {
	return &repository{db: db, redisClient: redisClient}
}

func (r *repository) GetDatabaseConnection() bool {
	sqlDB, err := r.db.DB()
	
	if err != nil {
		return false
	}

	err = sqlDB.Ping()
	
	if err != nil {
		return false
	}

	return true
}

func (r *repository) GetRedisConnection() bool {
	if r.redisClient == nil {
		return false
	}

	ctx := context.Background()
	_, err := r.redisClient.Ping(ctx).Result()
	
	if err != nil {
		return false
	}

	return true
}