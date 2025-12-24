package main

import (
	"fmt"
	"log"
	"os"
	server "yaoyao-functions/src/cmd"
	"yaoyao-functions/src/config"

	"github.com/gin-gonic/gin"
)

func main() {
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := config.LoadEnv(); err != nil {
		log.Printf("[ENV] WARNING: Error loading .env file: %v", err)
	}

	if err := config.InitDatabase(); err != nil {
		log.Fatalf("[INIT] Failed to connect to database: %v", err)
	} else {
		log.Println("[INIT] Database connection established.")
	}

	if err := config.InitRedis(); err != nil {
		log.Printf("[INIT] WARNING: Failed to connect to Redis: %v", err)
	} else {
		log.Println("[INIT] Redis connection established.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := server.Start(config.DB, config.RedisClient)

	log.Printf("[INIT] Server starting on port %s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("[INIT] Failed to start server: %v", err)
	}
}
