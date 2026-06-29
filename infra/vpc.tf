# Fetch the default VPC
data "aws_vpc" "main" {
  default = true
}

# Fetch subnets belonging to the default VPC
data "aws_subnets" "all" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}
