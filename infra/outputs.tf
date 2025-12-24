output "function_url" {
  description = "Lambda Function URL"
  value       = aws_lambda_function_url.yaoyao_function_url.function_url
}

output "function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.yaoyao_function.arn
}

output "cloudfront_url" {
  description = "CloudFront Distribution URL"
  value       = var.cloudfront_url
}

output "cloudfront_distribution_arn" {
  description = "CloudFront Distribution ARN"
  value       = var.cloudfront_distribution_arn
}

output "cloudfront_oac_id" {
  description = "CloudFront Origin Access Control ID - Use this in your CloudFront distribution origin settings"
  value       = aws_cloudfront_origin_access_control.lambda_oac.id
}