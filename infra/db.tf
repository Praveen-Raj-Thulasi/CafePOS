# DB Subnet Group (Required for Aurora)
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.project_name}-db-subnet-group-${var.environment}"
  subnet_ids = data.aws_subnets.all.ids

  tags = {
    Name = "${var.project_name}-db-subnet-group-${var.environment}"
  }
}

# Security Group for Aurora PostgreSQL
resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg-${var.environment}"
  description = "Allows incoming traffic from ECS tasks to Aurora DB"
  vpc_id      = data.aws_vpc.main.id

  # Allow ingress on PostgreSQL port 5432 only from ECS tasks security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  # Allow all egress
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg-${var.environment}"
  }
}

# Random password for DB master user
resource "random_password" "db_password" {
  length  = 16
  special = false
}

data "aws_rds_cluster" "db" {
  cluster_identifier = "${var.project_name}-aurora-cluster-${var.environment}"
}
