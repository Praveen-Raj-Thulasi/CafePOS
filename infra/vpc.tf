# Reference the existing VPC
data "aws_vpc" "main" {
  id = var.existing_vpc_id
}

# Fetch subnets belonging to the existing VPC
data "aws_subnets" "all" {
  filter {
    name   = "vpc-id"
    values = [var.existing_vpc_id]
  }
}
