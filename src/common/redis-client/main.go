package redisClient

import (
	"context"
	"time"
	"yaoyao-functions/src/utils"

	"github.com/redis/go-redis/v9"
)

func Get[T any](client *redis.Client, key string) (T, error) {
	var result T
	ctx := context.Background()

	cached, err := client.Get(ctx, key).Result()
	if err != nil {
		return result, err
	}

	if str, ok := any(&result).(*string); ok {
		*str = cached
		return result, nil
	}

	if utils.TryParseJSON(cached, &result) {
		return result, nil
	}

	return result, err
}

func Set(client *redis.Client, key string, value interface{}, expiration ...time.Duration) error {
	ctx := context.Background()

	exp := time.Duration(0)
	
	if len(expiration) > 0 {
		exp = expiration[0]
	}

	if str, ok := value.(string); ok {
		return client.Set(ctx, key, str, exp).Err()
	}

	data, err := utils.MarshalJSON(value)
	if err != nil {
		return err
	}

	return client.Set(ctx, key, data, exp).Err()
}