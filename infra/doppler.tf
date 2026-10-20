data "doppler_secrets" "yaoyao" {
  project = var.doppler_project
  config  = var.doppler_config
}

locals {
  doppler_database_url = lookup(data.doppler_secrets.yaoyao.map, "DATABASE_URL", "")
  doppler_redis_url    = lookup(data.doppler_secrets.yaoyao.map, "REDIS_URL", "")
  doppler_bucket_name  = lookup(data.doppler_secrets.yaoyao.map, "BUCKET_NAME", "")

  doppler_cloudfront_arn             = lookup(data.doppler_secrets.yaoyao.map, "CLOUDFRONT_ARN", "")
  doppler_cloudfront_distribution_id = split("/", lookup(data.doppler_secrets.yaoyao.map, "CLOUDFRONT_ARN", "/"))[1]

  doppler_cloudflare_account_id = lookup(data.doppler_secrets.yaoyao.map, "CLOUDFLARE_ACCOUNT_ID", "")
  doppler_cloudflare_api_token  = lookup(data.doppler_secrets.yaoyao.map, "CLOUDFLARE_API_TOKEN", "")
  doppler_cloudflare_access_key = lookup(data.doppler_secrets.yaoyao.map, "CLOUDFLARE_ACCESS_KEY_ID", "")
  doppler_cloudflare_secret_key = lookup(data.doppler_secrets.yaoyao.map, "CLOUDFLARE_SECRET_ACCESS_KEY", "")

  doppler_acm_certificate_arn = lookup(data.doppler_secrets.yaoyao.map, "ACM_CERTIFICATE_ARN", "")
  doppler_cors_origin         = lookup(data.doppler_secrets.yaoyao.map, "CORS_ORIGIN", "")

  doppler_gemini_api_key = lookup(data.doppler_secrets.yaoyao.map, "GEMINI_API_KEY", "")
  doppler_gemini_model   = lookup(data.doppler_secrets.yaoyao.map, "GEMINI_MODEL", "")
}
