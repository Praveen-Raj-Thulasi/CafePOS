#!/bin/bash
echo "Stopping ECS Fargate tasks to pause billing..."
aws ecs update-service \
  --cluster odoo-cafe-cluster-prod \
  --service odoo-cafe-backend-service-prod \
  --desired-count 0 \
  --region us-east-1

echo "Fargate tasks scaled to 0. Backend is now paused."
