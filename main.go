package main

import (
	"context"
	"fmt"
	server "yaoyao-functions/cmd"
	"yaoyao-functions/common"
	"yaoyao-functions/config"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
)

var ginLambda *ginadapter.GinLambda

func init() {
	r := server.Start()
	ginLambda = ginadapter.New(r)
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	if config.LoadEnv() != nil {
		fmt.Errorf("[ENV] Failed to load environment variables.")
	}

	if config.GetEnvOr(common.LAMBDA_NAME_ENV, "") != "" {
		fmt.Println("[INIT] Starting lambda function...")
		
		lambda.Start(Handler)
		return 
	}

	fmt.Println("[INIT] Starting in server mode...")
	server.Start().Run()
}