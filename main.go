package main

import (
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	fmt.Println(request.Body)

	return &events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       request.Body,
	}, nil
}

func main() {
  lambda.Start(handler)
}