data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/lambda_placeholder.zip"

  source {
    content  = "placeholder"
    filename = "bootstrap"
  }
}

resource "aws_lambda_function" "yaoyao_function" {
  function_name = var.function_name
  role          = aws_iam_role.yaoyao_lambda_role.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  timeout       = 30
  memory_size   = 512

  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256
  
  layers = ["arn:aws:lambda:${var.aws_region}:753240598075:layer:LambdaAdapterLayerX86:25"]

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }

  environment {
    variables = {
      GIN_MODE        = "release"
      PORT            = "8080" 
      DB_HOST     = local.doppler_db_host
      DB_PORT     = local.doppler_db_port
      DB_USER     = local.doppler_db_user
      DB_PASSWORD = local.doppler_db_password
      DB_NAME     = local.doppler_db_name
      DB_SSLMODE  = local.doppler_db_sslmode
      REDIS_URL   = local.doppler_redis_url
      BUCKET_NAME = var.bucket_name
      CLOUDFLARE_ACCOUNT_ID        = local.doppler_cloudflare_account_id
      CLOUDFLARE_ACCESS_KEY_ID     = local.doppler_cloudflare_access_key
      CLOUDFLARE_SECRET_ACCESS_KEY = local.doppler_cloudflare_secret_key
      
    }
  }

  tags = {
    Name        = var.function_name
    Environment = "production"
  }
}

resource "aws_lambda_function_url" "yaoyao_function_url" {
  function_name      = aws_lambda_function.yaoyao_function.function_name
  authorization_type = "AWS_IAM"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive", "content-type"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "allow_cloudfront" {
  statement_id  = "AllowCloudFrontInvoke"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.yaoyao_function.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = var.cloudfront_distribution_arn
}

resource "aws_lambda_permission" "allow_cloudfront_invoke" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.yaoyao_function.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = var.cloudfront_distribution_arn
}
