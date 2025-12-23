package cmd

import (
	"log"
	"yaoyao-functions/src/config"

	"gorm.io/gorm"
)


func main() {
	config.LoadEnv()

	db, err := config.ConnectWithEnv()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}
	defer sqlDB.Close()

	log.Println("🔄 Starting database migration...")

	if err := MigrateAndSeed(db); err != nil {
		log.Fatal("[DATABASE] Failed to migrate database:", err)
	}

	log.Println("[DATABASE] Database migration completed successfully!")
}



func AutoMigrate(db *gorm.DB) error {
	return nil
}

func MigrateAndSeed(db *gorm.DB) error {
	return nil
}

func seedInitialData(db *gorm.DB) error {
	return nil
}
