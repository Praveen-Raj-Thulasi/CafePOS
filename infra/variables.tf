variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources in"
  default     = "us-east-1"
}

variable "existing_vpc_id" {
  type        = string
  description = "ID of the existing VPC to deploy into"
  default     = "vpc-0cd6535b8d0099bcf"
}

variable "existing_ecr_name" {
  type        = string
  description = "Name of the existing ECR repository"
  default     = "cafinity-backend"
}

variable "project_name" {
  type        = string
  description = "Name of the project used for naming resources"
  default     = "odoo-cafe"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
  default     = "prod"
}



variable "jwt_secret" {
  type        = string
  description = "Secret key for JWT generation/verification"
  sensitive   = true
}

variable "email_user" {
  type        = string
  description = "Email username for SMTP backend configuration"
}

variable "email_pass" {
  type        = string
  description = "Email password / app password for SMTP backend configuration"
  sensitive   = true
}
