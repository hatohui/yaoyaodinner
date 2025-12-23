# Lambda function
resource "aws_lambda_function" "yaoyao_function" {
  function_name = var.function_name
  role          = aws_iam_role.yaoyao_lambda_role.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  timeout       = 30
  memory_size   = 512

  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }

  environment {
    variables = {
      GIN_MODE    = "release"
      LAMBDA_NAME_ENV = var.function_name
      DB_HOST     = var.db_host
      DB_PORT     = var.db_port
      DB_USER     = var.db_user
      DB_PASSWORD = var.db_password
      DB_NAME     = var.db_name
      DB_SSLMODE  = var.db_sslmode
      REDIS_URL   = var.redis_url
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

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive", "content-type"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "allow_function_url" {
  statement_id           = "AllowPublicFunctionURLInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.yaoyao_function.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}
