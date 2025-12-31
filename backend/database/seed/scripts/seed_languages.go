package scripts

import (
	"fmt"
	"log"
	"yaoyao-functions/src/modules/language"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedLanguages seeds the language data required for translations
func SeedLanguages(db *gorm.DB) error {
	log.Println("🌱 Seeding languages...")

	languages := []language.Language{
		{Code: "en", Name: "English", Direction: "LTR"},
		{Code: "zh", Name: "中文 (Chinese)", Direction: "LTR"},
		{Code: "vi", Name: "Tiếng Việt (Vietnamese)", Direction: "LTR"},
		{Code: "th", Name: "ไทย (Thai)", Direction: "LTR"},
	}

	for _, lang := range languages {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "code"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "direction"}),
		}).Create(&lang).Error; err != nil {
			return fmt.Errorf("failed to upsert language %s: %w", lang.Code, err)
		}
	}

	log.Printf("✅ Seeded %d languages", len(languages))
	return nil
}
