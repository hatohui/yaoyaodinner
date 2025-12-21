package main

import (
	"context"
	"fmt"
	"log"
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
	gin.SetMode(gin.ReleaseMode)

	r := server.Start()
	ginLambda = ginadapter.New(r)
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	if err := config.LoadEnv(); err != nil {
		log.Println("WARNING: Error loading .env file: %v", err)
	}

	if config.GetEnvOr(common.LAMBDA_NAME_ENV, "") != "" {
		log.Println("[INIT] Starting lambda function...")
		
		lambda.Start(Handler)
		return 
	}

	fmt.Println("[INIT] Starting in server mode...")
	server.Start().Run()
}