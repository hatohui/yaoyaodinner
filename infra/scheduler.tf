# EventBridge Scheduler invokes the Lambda directly; the Lambda Web Adapter
# turns the non-HTTP event into POST /api/scheduled with this input as the body.
resource "aws_iam_role" "scheduler_role" {
  name = "${var.function_name}-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "scheduler.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "scheduler_invoke_lambda" {
  name = "invoke-${var.function_name}"
  role = aws_iam_role.scheduler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = aws_lambda_function.yaoyao_function.arn
      }
    ]
  })
}

resource "aws_scheduler_schedule" "prune_table_audit" {
  name                         = "${var.function_name}-prune-table-audit"
  description                  = "Weekly: delete table history older than 7 days"
  schedule_expression          = "cron(0 4 ? * MON *)"
  schedule_expression_timezone = "Asia/Singapore"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.yaoyao_function.arn
    role_arn = aws_iam_role.scheduler_role.arn
    input    = jsonencode({ task = "prune-table-audit" })

    retry_policy {
      maximum_retry_attempts = 2
    }
  }
}
