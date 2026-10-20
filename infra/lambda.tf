resource "aws_lambda_function" "yaoyao_function" {
  function_name = var.function_name
  role          = aws_iam_role.yaoyao_lambda_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda.repository_url}:latest"
  timeout       = 30
  memory_size   = 512

  lifecycle {
    ignore_changes = [image_uri]
  }

  environment {
    variables = {
      PORT     = "8080"
      NODE_ENV = "production"

      DATABASE_URL = local.doppler_database_url
      REDIS_URL    = local.doppler_redis_url

      BUCKET_NAME                  = local.doppler_bucket_name
      CLOUDFLARE_ACCOUNT_ID        = local.doppler_cloudflare_account_id
      CLOUDFLARE_API_TOKEN         = local.doppler_cloudflare_api_token
      CLOUDFLARE_ACCESS_KEY_ID     = local.doppler_cloudflare_access_key
      CLOUDFLARE_SECRET_ACCESS_KEY = local.doppler_cloudflare_secret_key
      CORS_ORIGIN                  = local.doppler_cors_origin

      GEMINI_API_KEY = local.doppler_gemini_api_key
      GEMINI_MODEL   = local.doppler_gemini_model
    }
  }

  tags = {
    Name        = var.function_name
    Environment = "production"
  }
}

resource "aws_lambda_function_url" "yaoyao_function_url" {
  function_name      = aws_lambda_function.yaoyao_function.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "allow_public_url" {
  statement_id           = "AllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.yaoyao_function.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}


