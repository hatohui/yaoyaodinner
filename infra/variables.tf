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
