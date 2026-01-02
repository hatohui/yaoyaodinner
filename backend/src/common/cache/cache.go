package cache

import (
	"time"
	redisClient "yaoyao-functions/src/common/redis-client"

	"github.com/redis/go-redis/v9"
)

func GetOrSet[T any](client *redis.Client, key string, expiration time.Duration, fetch func() (T, error)) (T, error) {
	var zero T
	if client == nil {
		return fetch()
	}

	val, err := redisClient.Get[T](client, key)
	if err == nil {
		return val, nil
	}

	val, err = fetch()
	if err != nil {
		return zero, err
	}

	_ = redisClient.Set(client, key, val, expiration)
	return val, nil
}