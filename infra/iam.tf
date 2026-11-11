resource "aws_iam_role" "yaoyao_lambda_role" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.yaoyao_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${var.function_name}-bedrock"
  role = aws_iam_role.yaoyao_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["bedrock:InvokeModel"]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/*.amazon.nova-*",
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/*.anthropic.claude-haiku-4-5-*",
          "arn:aws:bedrock:*::foundation-model/amazon.nova-*",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_invoke_self" {
  name = "${var.function_name}-invoke-self"
  role = aws_iam_role.yaoyao_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = aws_lambda_function.yaoyao_function.arn
      }
    ]
  })
}
