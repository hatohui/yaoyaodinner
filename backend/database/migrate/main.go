package main

import (
	"log"
	"yaoyao-functions/src/config"
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

	log.Println("🔄 Starting database migration...")

	if err := AutoMigrate(db); err != nil {
		log.Fatal("[DATABASE] Failed to migrate database:", err)
	}

	log.Println("[DATABASE] Database migration completed successfully!")
}
