package main

import (
	"log"
	"yaoyao-functions/src/modules/account"
	"yaoyao-functions/src/modules/category"
	"yaoyao-functions/src/modules/category_translation"
	"yaoyao-functions/src/modules/feedback"
	"yaoyao-functions/src/modules/food"
	"yaoyao-functions/src/modules/food_translation"
	"yaoyao-functions/src/modules/food_variant"
	"yaoyao-functions/src/modules/language"
	"yaoyao-functions/src/modules/order"
	"yaoyao-functions/src/modules/people"
	"yaoyao-functions/src/modules/personal_note"
	"yaoyao-functions/src/modules/preset_menu"
	"yaoyao-functions/src/modules/preset_menu_food"
	"yaoyao-functions/src/modules/table"

	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	log.Println("Running AutoMigrate for all tables...")
	
	if err := db.AutoMigrate(
		&language.Language{},
		&category.Category{},
	); err != nil {
		return err
	}
	log.Println("✓ Migrated: Language, Category")

	if err := db.AutoMigrate(
		&food.Food{},
		&table.Table{},
		&people.People{},
	); err != nil {
		return err
	}
	log.Println("✓ Migrated: Food, Table, People")

	if err := db.AutoMigrate(
		&account.Account{},
		&food_variant.FoodVariant{},
		&food_translation.FoodTranslation{},
		&category_translation.CategoryTranslation{},
		&personal_note.PersonalNote{},
		&feedback.Feedback{},
	); err != nil {
		return err
	}
	log.Println("✓ Migrated: Account, FoodVariant, FoodTranslation, CategoryTranslation, PersonalNote, Feedback")

	// Migrate tables with multiple foreign keys
	if err := db.AutoMigrate(
		&order.Order{},
		&preset_menu.PresetMenu{},
		&preset_menu_food.PresetMenuFood{},
	); err != nil {
		return err
	}
	log.Println("✓ Migrated: Order, PresetMenu, PresetMenuFood")

	log.Println("✅ All tables migrated successfully!")
	return nil
}
