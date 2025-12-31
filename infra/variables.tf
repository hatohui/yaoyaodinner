variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
  default     = "yaoyao-function"
}

variable "db_host" {
  description = "Database host"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_port" {
  description = "Database port"
  type        = string
  default     = "5432"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = ""
}

variable "db_sslmode" {
  description = "Database SSL mode"
  type        = string
  default     = "require"
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  default     = ""
  sensitive   = true
}

variable "doppler_token" {
  type        = string
  description = "A token to authenticate with Doppler"
  default     = ""
  sensitive   = true
}

variable "doppler_project" {
  description = "Doppler project name"
  type        = string
  default     = ""
}

variable "doppler_config" {
  description = "Doppler config name"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN allowed to invoke Lambda"
  type        = string
}

variable "cloudfront_url" {
  description = "CloudFront distribution URL"
  type        = string
}

variable "bucket_name" {
  description = "S3 Bucket name for storing images"
  type        = string
}