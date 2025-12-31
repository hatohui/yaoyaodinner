package scripts

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// SeedAll runs all seeding operations in the correct order
func SeedAll(db *gorm.DB) error {
	log.Println("🌱 Starting seed process...")

	if err := SeedLanguages(db); err != nil {
		return fmt.Errorf("failed to seed languages: %w", err)
	}

	if err := SeedCategories(db, "database/seed/data/categories.json"); err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}

	if err := SeedFoods(db, "database/seed/data/foods"); err != nil {
		return fmt.Errorf("failed to seed foods: %w", err)
	}

	if err := SeedTables(db, "database/seed/data/tables.json"); err != nil {
		return fmt.Errorf("failed to seed tables: %w", err)
	}

	log.Println("✅ All seed data loaded successfully!")
	return nil
}
