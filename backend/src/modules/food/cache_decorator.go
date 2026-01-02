package food

import (
	"fmt"
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/common/cache"

	"github.com/redis/go-redis/v9"
)

func NewCachedService(inner FoodService, redisClient *redis.Client) FoodService {
	return NewCachedServiceWithTTL(inner, redisClient, 24*time.Hour)
}

func NewCachedServiceWithTTL(inner FoodService, redisClient *redis.Client, ttl time.Duration) FoodService {
	if redisClient == nil {
		return inner
	}
	return &cachedFoodService{
		inner:          inner,
		CacheDecorator: cache.NewCacheDecorator(redisClient, ttl),
	}
}

type cachedFoodService struct {
	inner FoodService
	*cache.CacheDecorator
}

func (s *cachedFoodService) GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, int64, error) {
	keyList := fmt.Sprintf(common.REDIS_KEY_FOOD_LIST_BY_PAGE, pageNumber, languageCode, categoryID, count)
	
	foods, err := cache.GetOrSet(s.RedisClient, keyList, s.TTL, func() ([]Food, error) {
		f, _, err := s.inner.GetFoodsByPageAndCount(languageCode, pageNumber, count, categoryID)
		return f, err
	})

	if err != nil {
		return nil, 0, err
	}

	keyTotal := fmt.Sprintf(common.REDIS_KEY_FOOD_COUNT, categoryID)
	
	total, err := cache.GetOrSet(s.RedisClient, keyTotal, s.TTL, func() (int64, error) {
		_, t, err := s.inner.GetFoodsByPageAndCount(languageCode, pageNumber, count, categoryID)
		return t, err
	})
	
	if err != nil {
		return nil, 0, err
	}

	return foods, total, nil
}
