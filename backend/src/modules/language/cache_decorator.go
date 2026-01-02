package language

import (
	"time"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/common/cache"

	"github.com/redis/go-redis/v9"
)

func NewCachedService(inner LanguageService, redisClient *redis.Client) LanguageService {
	return NewCachedServiceWithTTL(inner, redisClient, 24*time.Hour)
}

func NewCachedServiceWithTTL(inner LanguageService, redisClient *redis.Client, ttl time.Duration) LanguageService {
	if redisClient == nil {
		return inner
	}
	return &cachedLanguageService{
		inner:          inner,
		CacheDecorator: cache.NewCacheDecorator(redisClient, ttl),
	}
}

type cachedLanguageService struct {
	inner LanguageService
	*cache.CacheDecorator
}

func (s *cachedLanguageService) GetAllLanguages() ([]Language, error) {
	return cache.GetOrSet(s.RedisClient, common.REDIS_KEY_LANGUAGE_LIST, s.TTL, func() ([]Language, error) {
		return s.inner.GetAllLanguages()
	})
}

func (s *cachedLanguageService) GetLanguageCodeList() ([]string, error) {
	return cache.GetOrSet(s.RedisClient, common.REDIS_KEY_LANGUAGE_CODES, s.TTL, func() ([]string, error) {
		return s.inner.GetLanguageCodeList()
	})
}