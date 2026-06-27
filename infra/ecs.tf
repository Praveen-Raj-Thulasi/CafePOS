# Reference existing ECR repository
data "aws_ecr_repository" "backend" {
  name = var.existing_ecr_name
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-ecs-cluster-${var.environment}"
  }
}

# CloudWatch Log Group for ECS container stdout/stderr logs
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.project_name}-backend-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-ecs-logs-${var.environment}"
  }
}

# Application Load Balancer (ALB) - Publicly accessible
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = slice(data.aws_subnets.all.ids, 0, 2)

  tags = {
    Name = "${var.project_name}-alb-${var.environment}"
  }
}

# ALB Target Group pointing to the ECS tasks
resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-tg-${var.environment}"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "ip" # Required for Fargate networking mode (awsvpc)

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-299"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.project_name}-tg-${var.environment}"
  }
}

# Redirect HTTP traffic to the backend target group (For port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ECS Task Definition defining the container environment
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${data.aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
      environment = [
        {
          name  = "PORT"
          value = "5000"
        }
      ]
      secrets = [
        {
          name      = "MONGO_URI"
          valueFrom = "${aws_secretsmanager_secret.db_secrets.arn}:MONGO_URI::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.db_secrets.arn}:JWT_SECRET::"
        },
        {
          name      = "EMAIL_USER"
          valueFrom = "${aws_secretsmanager_secret.db_secrets.arn}:EMAIL_USER::"
        },
        {
          name      = "EMAIL_PASS"
          valueFrom = "${aws_secretsmanager_secret.db_secrets.arn}:EMAIL_PASS::"
        }
      ]
    }
  ])

  tags = {
    Name = "${var.project_name}-task-def-${var.environment}"
  }
}

# ECS Service maintaining the running containers
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = slice(data.aws_subnets.all.ids, 0, 2)
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true # Default VPC subnets require public IPs for outbound internet route
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 5000
  }

  depends_on = [
    aws_lb_listener.http
  ]

  tags = {
    Name = "${var.project_name}-ecs-service-${var.environment}"
  }
}
