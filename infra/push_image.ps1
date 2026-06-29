$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text).Trim()
$ECR_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/odoo-cafe-backend-prod"

Write-Host "Authenticating Docker with AWS ECR..." -ForegroundColor Yellow
$PASSWORD = aws ecr get-login-password --region us-east-1
docker login --username AWS --password $PASSWORD $ECR_URL

Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t odoo-cafe-backend-prod ../backend

Write-Host "Tagging Docker image..." -ForegroundColor Yellow
docker tag odoo-cafe-backend-prod:latest "${ECR_URL}:latest"

Write-Host "Pushing Docker image to ECR..." -ForegroundColor Yellow
docker push "${ECR_URL}:latest"

Write-Host "Forcing ECS to deploy the new image..." -ForegroundColor Yellow
aws ecs update-service --cluster odoo-cafe-cluster-prod --service odoo-cafe-backend-service-prod --force-new-deployment --no-cli-pager

Write-Host "Done!" -ForegroundColor Green
