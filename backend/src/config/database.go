package config

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(connectionString string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})

	if err != nil {
		return nil, fmt.Errorf("[POSTGRES] Error connecting to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("[POSTGRES] Error getting database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetConnMaxLifetime(time.Minute * 5)

	return db, nil
}


func ConnectWithEnvForMigration() (*gorm.DB, error) {
	host := "localhost"
	port := GetEnvOr("DB_PORT", "5432")
	user := GetEnvOr("DB_USER", "admin")
	password := GetEnvOr("DB_PASSWORD", "password")
	dbname := GetEnvOr("DB_NAME", "authorizationdb")
	sslmode := GetEnvOr("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	return Connect(dsn)
}

func ConnectWithEnv() (*gorm.DB, error) {
	host := GetEnvOr("DB_HOST", "localhost")
	port := GetEnvOr("DB_PORT", "5432")
	user := GetEnvOr("DB_USER", "admin")
	password := GetEnvOr("DB_PASSWORD", "password")
	dbname := GetEnvOr("DB_NAME", "authorizationdb")
	sslmode := GetEnvOr("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	return Connect(dsn)
}

func InitDatabase() error {
	db, err := ConnectWithEnv()
	if err != nil {
		return err
	}

	DB = db
	return nil
}

func CloseDatabase() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
