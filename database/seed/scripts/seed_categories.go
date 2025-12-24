package scripts

import (
	"fmt"
	"log"
	"yaoyao-functions/src/modules/category"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedCategories seeds categories and their translations from JSON data
func SeedCategories(db *gorm.DB, dataFilePath string) error {
	log.Println("🌱 Seeding categories...")

	// Load category data from JSON
	data, err := LoadCategoryData(dataFilePath)
	if err != nil {
		return fmt.Errorf("failed to load category data: %w", err)
	}

	// Seed each category
	for i, catData := range data.Categories {
		categoryID := fmt.Sprintf("%d", i+1)

		cat := category.Category{
			ID:          categoryID,
			Name:        catData.Name,
			Description: catData.Description,
		}

		// Upsert category (insert or update if exists based on name)
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description"}),
		}).Create(&cat).Error; err != nil {
			return fmt.Errorf("failed to upsert category %s: %w", cat.Name, err)
		}

		// Seed translations for this category
		for lang, translations := range data.Translations {
			if i >= len(translations) {
				log.Printf("⚠️  Missing translation for category %s in language %s", cat.Name, lang)
				continue
			}

			translation := translations[i]
			catTranslation := category.CategoryTranslation{
				CategoryID:  cat.ID,
				Language:    lang,
				Name:        translation.Name,
				Description: translation.Description,
			}

			if err := db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "category_id"}, {Name: "language"}},
				DoUpdates: clause.AssignmentColumns([]string{"name", "description"}),
			}).Create(&catTranslation).Error; err != nil {
				return fmt.Errorf("failed to upsert translation for category %s (%s): %w", cat.Name, lang, err)
			}
		}
	}

	log.Printf("✅ Seeded %d categories with translations", len(data.Categories))
	return nil
}
