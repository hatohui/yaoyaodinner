package language

import (
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/database"
	"yaoyao-functions/src/redisClient"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type LanguageRepository interface {
	FetchAllLanguages() ([]Language, error)
	GetLanguageCodeList() ([]string, error)
}

type repository struct {
	db          *gorm.DB
	redisClient *redis.Client
}

func NewRepository(db *gorm.DB, redisClient *redis.Client) LanguageRepository {
	return &repository{db: db, redisClient: redisClient}
}

func (r *repository) FetchAllLanguages() ([]Language, error) {
	languages, err := redisClient.Get[[]Language](r.redisClient, common.REDIS_KEY_LANGUAGE_LIST)

	if err == nil {
		return languages, nil
	}

	languages, err = database.FindAll[Language](r.db, common.TABLE_LANGUAGE)

	if err != nil {
		return nil, err
	}

	redisClient.Set(r.redisClient, common.REDIS_KEY_LANGUAGE_LIST, languages, 24*time.Hour)

	return languages, nil
}

func (r *repository) GetLanguageCodeList() ([]string, error) {
	
	codes, err := redisClient.Get[[]string](r.redisClient, common.REDIS_KEY_LANGUAGE_CODES)

	if err == nil {
			return codes, nil
	}

	if err := r.db.Table(common.TABLE_LANGUAGE).Pluck("code", &codes).Error; err != nil {
		return nil, err
	}

	redisClient.Set(r.redisClient, common.REDIS_KEY_LANGUAGE_CODES, codes, 24*time.Hour)

	return codes, nil
}
