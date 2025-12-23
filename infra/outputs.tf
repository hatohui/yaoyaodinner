output "function_url" {
  description = "Lambda Function URL"
  value       = aws_lambda_function_url.yaoyao_function_url.function_url
}

output "function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.yaoyao_function.arn
}
