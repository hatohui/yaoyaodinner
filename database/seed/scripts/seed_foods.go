package scripts

import (
	"fmt"
	"log"
	"yaoyao-functions/src/modules/category"
	"yaoyao-functions/src/modules/food"
	"yaoyao-functions/src/modules/food_translation"
	"yaoyao-functions/src/modules/food_variant"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedFoods(db *gorm.DB, foodsDir string) error {
	log.Println("🌱 Seeding foods...")

	datasets, err := LoadAllFoodDatasets(foodsDir)
	if err != nil {
		return fmt.Errorf("failed to load food datasets: %w", err)
	}

	totalSeeded := 0

	for _, dataset := range datasets {
		categoryName := dataset.Key

		var cat category.Category
		if err := db.Where("name = ?", categoryName).First(&cat).Error; err != nil {
			log.Printf("⚠️  Category not found for key: %s, skipping", categoryName)
			continue
		}
		seeded := 0

		for _, item := range dataset.Items {
			if err := db.Transaction(func(tx *gorm.DB) error {
				foodID := generateFoodID(item.Name, cat.ID)

				foodRecord := food.Food{
					ID:          foodID,
					Name:        item.Name,
					Description: item.Description,
					ImageURL:    item.ImageURL,
					CategoryID:  cat.ID,
					IsAvailable: true,
					IsChecked:   true,
				}

				if err := tx.Clauses(clause.OnConflict{
					Columns: []clause.Column{{Name: "id"}},
					DoUpdates: clause.AssignmentColumns([]string{
						"name", "description", "image_url", "category_id",
					}),
				}).Create(&foodRecord).Error; err != nil {
					return fmt.Errorf("failed to upsert food %s: %w", item.Name, err)
				}

				if err := tx.Where("food_id = ?", foodID).
					Delete(&food_variant.FoodVariant{}).Error; err != nil {
					return fmt.Errorf("failed to delete old variants for food %s: %w", item.Name, err)
				}

				for _, v := range item.Variants {
					variantID := generateVariantID(foodID, v.Label)
					variant := food_variant.FoodVariant{
						ID:          variantID,
						FoodID:      foodID,
						Label:       v.Label,
						Price:       v.Price,
						Currency:    v.Currency,
						IsSeasonal:  v.IsSeasonal,
						IsAvailable: true, 
					}

					if err := tx.Create(&variant).Error; err != nil {
						return fmt.Errorf("failed to create variant %s for food %s: %w", v.Label, item.Name, err)
					}
				}

				if err := tx.Where("food_id = ?", foodID).
					Delete(&food_translation.FoodTranslation{}).Error; err != nil {
					return fmt.Errorf("failed to delete old translations for food %s: %w", item.Name, err)
				}

				for lang, trans := range item.Translations {
					translation := food_translation.FoodTranslation{
						FoodID:      foodID,
						Language:    lang,
						Name:        trans.Name,
						Description: trans.Description,
					}

					if err := tx.Create(&translation).Error; err != nil {
						return fmt.Errorf("failed to create translation (%s) for food %s: %w", lang, item.Name, err)
					}
				}

				return nil
			}); err != nil {
				return err
			}

			seeded++
		}

		log.Printf("✅ Seeded %d items for category: %s", seeded, categoryName)
		totalSeeded += seeded
	}

	log.Printf("✅ Total foods seeded: %d", totalSeeded)
	return nil
}
