package category

import (
	"fmt"
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/common/cache"

	"github.com/redis/go-redis/v9"
)

func NewCachedService(inner CategoryService, redisClient *redis.Client) CategoryService {
	return NewCachedServiceWithTTL(inner, redisClient, 24*time.Hour)
}

func NewCachedServiceWithTTL(inner CategoryService, redisClient *redis.Client, ttl time.Duration) CategoryService {
	if redisClient == nil {
		return inner
	}
	return &cachedCategoryService{
		inner:          inner,
		CacheDecorator: cache.NewCacheDecorator(redisClient, ttl),
	}
}

type cachedCategoryService struct {
	inner CategoryService
	*cache.CacheDecorator
}

func (s *cachedCategoryService) GetAllCategories(languageCode string) ([]Category, error) {
	key := fmt.Sprintf(common.REDIS_KEY_CATEGORY_LIST, languageCode)
	return cache.GetOrSet(s.RedisClient, key, s.TTL, func() ([]Category, error) {
		return s.inner.GetAllCategories(languageCode)
	})
}

func (s *cachedCategoryService) GetCategoryByID(categoryID string, languageCode string) (*Category, error) {
	key := fmt.Sprintf(common.REDIS_KEY_CATEGORY_ID, categoryID, languageCode)
	return cache.GetOrSet(s.RedisClient, key, s.TTL, func() (*Category, error) {
		return s.inner.GetCategoryByID(categoryID, languageCode)
	})
} 