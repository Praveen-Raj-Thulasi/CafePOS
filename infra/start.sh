#!/bin/bash
echo "Starting ECS Fargate tasks to resume service..."
aws ecs update-service \
  --cluster odoo-cafe-cluster-prod \
  --service odoo-cafe-backend-service-prod \
  --desired-count 1 \
  --region us-east-1

echo "Fargate tasks scaled to 1. Waiting for container to start..."
aws ecs wait services-stable \
  --cluster odoo-cafe-cluster-prod \
  --services odoo-cafe-backend-service-prod \
  --region us-east-1

echo "Backend is now running and stable!"
