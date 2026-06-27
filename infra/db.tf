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

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "db" {
  cluster_identifier      = "${var.project_name}-db-cluster-${var.environment}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.8"
  database_name           = "odoocafe"
  master_username         = "postgres"
  master_password         = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  skip_final_snapshot     = true
  apply_immediately       = true

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2.0
  }

  tags = {
    Name = "${var.project_name}-db-cluster-${var.environment}"
  }
}

# Aurora Instance inside the cluster
resource "aws_rds_cluster_instance" "db_instance" {
  identifier         = "${var.project_name}-db-instance-${var.environment}"
  cluster_identifier = aws_rds_cluster.db.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.db.engine
  engine_version     = aws_rds_cluster.db.engine_version
  publicly_accessible = false
  apply_immediately  = true

  tags = {
    Name = "${var.project_name}-db-instance-${var.environment}"
  }
}
