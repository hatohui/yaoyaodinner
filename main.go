package main

import (
	"context"
	"log"
	"os"
	server "yaoyao-functions/src/cmd"
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/config"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"
)

var ginLambda *ginadapter.GinLambda

func init() {
	if (os.Getenv("GIN_MODE") == "release") {
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

	r := server.Start(config.DB, config.RedisClient)
	ginLambda = ginadapter.New(r)
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	if config.GetEnvOr(common.LAMBDA_NAME_ENV, "") != "" {
		log.Println("[INIT] Lambda function started.")
		lambda.Start(Handler)
		return 
	}

	log.Println("[INIT] Server started in server mode.")
	server.Start(config.DB, config.RedisClient).Run()
}