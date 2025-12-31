package main

import (
	"log"
	"yaoyao-functions/database/seed/scripts"
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

	log.Println("🌱 Running seed command...")

	if err := scripts.SeedAll(db); err != nil {
		log.Fatal("[SEED] Failed to seed database:", err)
	}

	log.Println("[SEED] Seeding completed successfully!")
}
