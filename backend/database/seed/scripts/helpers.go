package scripts

import (
	"github.com/google/uuid"
)

// generateCategoryID creates a unique ID for a category using UUID
func generateCategoryID(name string) string {
	return uuid.New().String()
}

// generateFoodID creates a unique ID for a food item using UUID
func generateFoodID(name, categoryID string) string {
	return uuid.New().String()
}

// generateVariantID creates a unique ID for a food variant using UUID
func generateVariantID(foodID, label string) string {
	return uuid.New().String()
}

// generateTableID creates a unique ID for a table using UUID
func generateTableID(name string) string {
	return uuid.New().String()
}

// strPtr returns a pointer to a string, or nil if empty
func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// floatPtr returns a pointer to a float64
func floatPtr(f float64) *float64 {
	return &f
}
