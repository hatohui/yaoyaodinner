package utils

import (
	"fmt"

	"github.com/google/uuid"
)

func GenerateUUID() string {
	return uuid.New().String()
}

func GenerateUUIDWithPrefix(prefix string) string {
	return fmt.Sprintf("%s%s", prefix, uuid.New().String())
}

func ParseUUID(uuidStr string) (uuid.UUID, error) {
	return uuid.Parse(uuidStr)
}

func IsValidUUID(uuidStr string) bool {
	_, err := uuid.Parse(uuidStr)
	return err == nil
}
