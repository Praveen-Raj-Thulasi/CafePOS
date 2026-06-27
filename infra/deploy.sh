#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Color output configurations
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Odoo Cafe AWS Infrastructure Deployment   ${NC}"
echo -e "${GREEN}=============================================${NC}"

# Check if terraform is installed
if ! command -v terraform &> /dev/null
then
    echo -e "${RED}Error: terraform is not installed.${NC}"
    echo -e "Please install it using your package manager:"
    echo -e "  - Arch Linux: ${YELLOW}sudo pacman -S terraform${NC}"
    echo -e "  - Ubuntu/Debian: ${YELLOW}sudo apt-get install terraform${NC}"
    echo -e "  - macOS: ${YELLOW}brew install terraform${NC}"
    echo -e "Or download it from: ${YELLOW}https://www.terraform.io/downloads${NC}"
    exit 1
fi

echo -e "${GREEN}[✔] Terraform is installed.${NC}"

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null
then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    exit 1
fi

# Verify AWS identity/credentials are loaded
if ! aws sts get-caller-identity &> /dev/null
then
    echo -e "${RED}Error: AWS CLI is not authenticated.${NC}"
    echo -e "Please run ${YELLOW}aws configure${NC} to set up your access key and secret key."
    exit 1
fi

echo -e "${GREEN}[✔] AWS CLI is configured and authenticated.${NC}"

# Navigate to the infra directory if not already there
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Initialize Terraform configuration
echo -e "\n${YELLOW}Initializing Terraform...${NC}"
terraform init

# Validate configuration
echo -e "\n${YELLOW}Validating Terraform files...${NC}"
terraform validate

# Create dry-run execution plan
echo -e "\n${YELLOW}Creating Terraform plan...${NC}"
terraform plan -out=tfplan

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}Plan created successfully as 'tfplan'!${NC}"
echo -e "To apply these changes and build the infrastructure, run:"
echo -e "  ${YELLOW}cd infra && terraform apply tfplan${NC}"
echo -e "${GREEN}=============================================${NC}"
