variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources in"
  default     = "us-east-1"
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
