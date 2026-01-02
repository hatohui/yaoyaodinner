package cache

import (
	"time"

	"github.com/redis/go-redis/v9"
)

type CacheDecorator struct {
	RedisClient *redis.Client
	TTL         time.Duration
}

func NewCacheDecorator(redisClient *redis.Client, ttl time.Duration) *CacheDecorator {
	if ttl == 0 {
		ttl = 24 * time.Hour
	}
	return &CacheDecorator{
		RedisClient: redisClient,
		TTL:         ttl,
	}
}

func (d *CacheDecorator) GetOrSet(key string, fetch func() (any, error)) (any, error) {
	return GetOrSet(d.RedisClient, key, d.TTL, func() (any, error) {
		return fetch()
	})
}

func (d *CacheDecorator) IsEnabled() bool {
	return d.RedisClient != nil
}
