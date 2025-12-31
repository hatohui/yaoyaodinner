package images

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"yaoyao-functions/src/utils"
)

type Service interface {
	SignURL(folder string) (string, string, error)
}

type imageService struct{
}

func NewService() Service {
	return &imageService{}
}

func (s *imageService) SignURL(folder string) (string, string, error) {
	accountID := os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	accessKey := os.Getenv("CLOUDFLARE_ACCESS_KEY_ID")
	secret := os.Getenv("CLOUDFLARE_SECRET_ACCESS_KEY")
	bucket := os.Getenv("BUCKET_NAME")

	if accountID == "" || accessKey == "" || secret == "" || bucket == "" {
		return "", "", fmt.Errorf("missing Cloudflare R2 configuration")
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secret, "")),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return "", "", err
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})

	presignClient := s3.NewPresignClient(client)

	key := fmt.Sprintf("%s/%s", folder, utils.GenerateUUID())

	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}

	presignResult, err := presignClient.PresignPutObject(context.TODO(), input, func(opts *s3.PresignOptions) {
		opts.Expires = 15 * time.Minute
	})
	if err != nil {
		return "", "", err
	}

	return presignResult.URL, key, nil
}
