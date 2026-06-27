# Secrets Manager entry for backend secrets
resource "aws_secretsmanager_secret" "db_secrets" {
  name                    = "${var.project_name}-backend-secrets-${var.environment}"
  description             = "Database and auth secrets for Odoo Cafe backend"
  recovery_window_in_days = 0 # Force delete when terraform destroy is run (useful for dev/test)

  tags = {
    Name = "${var.project_name}-secrets-${var.environment}"
  }
}

# Values for secrets
resource "aws_secretsmanager_secret_version" "db_secrets_val" {
  secret_id = aws_secretsmanager_secret.db_secrets.id
  secret_string = jsonencode({
    MONGO_URI  = "postgresql://${aws_rds_cluster.db.master_username}:${random_password.db_password.result}@${aws_rds_cluster.db.endpoint}:5432/odoocafe?sslmode=require"
    JWT_SECRET = var.jwt_secret
    EMAIL_USER = var.email_user
    EMAIL_PASS = var.email_pass
  })
}
