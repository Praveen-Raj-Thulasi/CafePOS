# Network Outputs
output "vpc_id" {
  value       = data.aws_vpc.main.id
  description = "ID of the VPC created"
}

# Container and Compute Outputs
output "ecr_repository_url" {
  value       = data.aws_ecr_repository.backend.repository_url
  description = "URL of the ECR repository to push backend Docker images to"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "Name of the ECS Cluster created"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

# API Routing Outputs
output "api_gateway_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "Public URL of the API Gateway HTTP API"
}

# Authentication Outputs
output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.pool.id
  description = "ID of the Cognito User Pool"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.client.id
  description = "Client ID of the Cognito App Client"
}


