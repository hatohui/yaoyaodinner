package main

import (
	"log"
	"yaoyao-functions/src/config"
	"yaoyao-functions/src/modules/account"
	"yaoyao-functions/src/modules/category"
	"yaoyao-functions/src/modules/feedback"
	"yaoyao-functions/src/modules/food"
	"yaoyao-functions/src/modules/language"
	"yaoyao-functions/src/modules/order"
	"yaoyao-functions/src/modules/people"
	"yaoyao-functions/src/modules/personal_note"
	"yaoyao-functions/src/modules/preset_menu"
	"yaoyao-functions/src/modules/table"
)

func main() {
	config.LoadEnv()

	db, err := config.ConnectWithEnvForMigration()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}
	defer sqlDB.Close()

	log.Println("🔥 Starting database reset...")
	log.Println("Dropping all tables...")
	
	if err := db.Migrator().DropTable(
		&preset_menu.PresetMenuFood{},
		&preset_menu.PresetMenu{},
		&order.Order{},
	); err != nil {
		log.Printf("Warning: Failed to drop some tables: %v", err)
	}
	log.Println("✓ Dropped: Order, PresetMenu, PresetMenuFood")

	if err := db.Migrator().DropTable(
		&feedback.Feedback{},
		&personal_note.PersonalNote{},
		&category.CategoryTranslation{},
		&food.FoodTranslation{},
		&food.FoodVariant{},
		&account.Account{},
	); err != nil {
		log.Printf("Warning: Failed to drop some tables: %v", err)
	}
	
	log.Println("✓ Dropped: Account, FoodVariant, FoodTranslation, CategoryTranslation, PersonalNote, Feedback")

	if err := db.Migrator().DropTable(
		&people.People{},
		&table.Table{},
		&food.Food{},
	); err != nil {
		log.Printf("Warning: Failed to drop some tables: %v", err)
	}
	log.Println("✓ Dropped: Food, Table, People")

	if err := db.Migrator().DropTable(
		&category.Category{},
		&language.Language{},
	); err != nil {
		log.Printf("Warning: Failed to drop some tables: %v", err)
	}

	log.Println("✓ Dropped: Language, Category")
	log.Println("✅ All tables dropped successfully!")
	log.Println("🔄 Running migrations and seeding data...")
	
	if err := AutoMigrate(db); err != nil {
		log.Fatal("[DATABASE] Failed to migrate database:", err)
	}

	log.Println("✅ Database reset completed successfully!")
}
