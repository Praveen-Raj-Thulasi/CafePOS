# API Gateway HTTP API (Lighter, faster, cheaper than REST API)
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"] # Adjust to CloudFront distribution URL or custom domain in production
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }

  tags = {
    Name = "${var.project_name}-api-gateway-${var.environment}"
  }
}

# Default deployment stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw_logs.arn
    format          = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name = "${var.project_name}-api-stage-${var.environment}"
  }
}

# CloudWatch Log Group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/apigateway/${var.project_name}-api-${var.environment}"
  retention_in_days = 14
}

# HTTP proxy integration linking API Gateway to our public ALB
resource "aws_apigatewayv2_integration" "backend" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "HTTP_PROXY"
  integration_uri  = "http://${aws_lb.main.dns_name}"

  integration_method     = "ANY"
  payload_format_version = "1.0" # Required for simple proxying

  connection_type = "INTERNET"
}

# Route everything (wildcard) to the backend ALB proxy integration
resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

# Route for default root path "/" to the backend ALB proxy integration
resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}
