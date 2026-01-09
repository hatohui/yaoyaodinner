package table

import (
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/common/cache"

	"github.com/redis/go-redis/v9"
)

func NewCachedService(inner TableService, redisClient *redis.Client) TableService {
	return NewCachedServiceWithTTL(inner, redisClient, 24*time.Hour)
}

func NewCachedServiceWithTTL(inner TableService, redisClient *redis.Client, ttl time.Duration) TableService {
	if redisClient == nil {
		return inner
	}
	return &cachedTableService{
		inner:          inner,
		CacheDecorator: cache.NewCacheDecorator(redisClient, ttl),
	}
}

type cachedTableService struct {
	inner TableService
	*cache.CacheDecorator
}

func (s *cachedTableService) GetTableByID(id string) (*Table, error) {
	return s.inner.GetTableByID(id)
}

func (s *cachedTableService) GetTables() ([]Table, error) {
	return cache.GetOrSet(s.RedisClient, common.REDIS_KEY_TABLE_LIST, s.TTL, func() ([]Table, error) {
		return s.inner.GetTables()
	})
}
