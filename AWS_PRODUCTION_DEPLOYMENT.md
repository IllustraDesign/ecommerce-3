# 🚀 IllustraDesign Studio - AWS Production Deployment Guide

## 📋 Table of Contents
- [Overview](#overview)
- [AWS Services Required](#aws-services-required)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Domain and SSL Setup](#domain-and-ssl-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Configuration](#security-configuration)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling and Performance](#scaling-and-performance)
- [Maintenance Guide](#maintenance-guide)
- [Cost Optimization](#cost-optimization)

---

## 🔎 Overview

This guide covers deploying IllustraDesign Studio to AWS using a scalable, secure, and production-ready architecture.

### Architecture Components:
- **Frontend**: React app hosted on S3 + CloudFront
- **Backend**: FastAPI on EC2 with Auto Scaling Group
- **Database**: MongoDB Atlas (managed) or EC2-hosted MongoDB
- **File Storage**: S3 for images and static assets
- **Load Balancer**: Application Load Balancer (ALB)
- **SSL/Security**: ACM certificates + WAF
- **Monitoring**: CloudWatch + AWS X-Ray

---

## 🔧 AWS Services Required

### Core Services:
- **EC2** - Backend application hosting
- **S3** - Frontend hosting and file storage
- **CloudFront** - CDN for global content delivery
- **Route 53** - DNS management
- **Certificate Manager (ACM)** - SSL certificates
- **Application Load Balancer** - Traffic distribution
- **Auto Scaling Groups** - Automatic scaling
- **VPC** - Network isolation

### Optional Services:
- **RDS** - If using PostgreSQL instead of MongoDB
- **ElastiCache** - Redis for caching
- **CloudWatch** - Monitoring and logging
- **WAF** - Web Application Firewall
- **Systems Manager** - Configuration management
- **Secrets Manager** - Secure credential storage

### Estimated Monthly Cost:
- **Small Setup**: $50-100/month
- **Medium Setup**: $200-400/month
- **Large Setup**: $500-1000/month

---

## 📋 Prerequisites

### AWS Account Setup:
1. **AWS Account** with billing configured
2. **IAM User** with administrative permissions
3. **AWS CLI** installed and configured
4. **Domain Name** (optional but recommended)

### Local Requirements:
- AWS CLI v2
- Docker (for containerization)
- Node.js and Python (for building)
- Git for code deployment

### Install AWS CLI:
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows - Download installer from AWS website
```

### Configure AWS CLI:
```bash
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region: us-east-1
# Default output format: json
```

---

## 🏗️ Infrastructure Setup

### 1. Create VPC and Networking

#### Create VPC:
```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=illustra-vpc}]'

# Note the VPC ID from output
export VPC_ID="vpc-xxxxxxxxx"
```

#### Create Subnets:
```bash
# Public subnet for load balancer
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=illustra-public-1a}]'

aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=illustra-public-1b}]'

# Private subnets for EC2 instances
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.3.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=illustra-private-1a}]'

aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.4.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=illustra-private-1b}]'
```

#### Create Internet Gateway:
```bash
# Create and attach Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=illustra-igw}]'

aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID
```

### 2. Security Groups

#### Create Security Groups:
```bash
# Load Balancer Security Group
aws ec2 create-security-group \
    --group-name illustra-alb-sg \
    --description "Security group for Application Load Balancer" \
    --vpc-id $VPC_ID

# EC2 Security Group
aws ec2 create-security-group \
    --group-name illustra-ec2-sg \
    --description "Security group for EC2 instances" \
    --vpc-id $VPC_ID

# Database Security Group
aws ec2 create-security-group \
    --group-name illustra-db-sg \
    --description "Security group for database" \
    --vpc-id $VPC_ID
```

#### Configure Security Group Rules:
```bash
# ALB Security Group - Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# EC2 Security Group - Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 8001 \
    --source-group $ALB_SG_ID

# Allow SSH access (temporary, remove in production)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0
```

---

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free account and cluster

2. **Configure Database**:
   - Choose AWS as provider
   - Select same region as your EC2 instances
   - Create database user and password
   - Add IP whitelist (0.0.0.0/0 for development)

3. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/illustra_design_ecommerce
   ```

### Option 2: Self-Hosted MongoDB on EC2

#### Launch MongoDB Instance:
```bash
# Create EC2 instance for MongoDB
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --count 1 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids $DB_SG_ID \
    --subnet-id $PRIVATE_SUBNET_ID \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=illustra-mongodb}]'
```

#### Install MongoDB:
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@mongodb-instance-ip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Configure MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use illustra_design_ecommerce
db.createUser({
  user: "illustra_user",
  pwd: "secure_password",
  roles: [{role: "readWrite", db: "illustra_design_ecommerce"}]
})
```

---

## 🚀 Application Deployment

### 1. Prepare Application Code

#### Backend Preparation:
```bash
# Clone repository
git clone <your-repo-url>
cd illustra-design-studio/backend

# Create production requirements.txt
pip freeze > requirements.txt

# Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
EOF

chmod +x start.sh
```

#### Frontend Build:
```bash
cd ../frontend

# Install dependencies
yarn install

# Build for production
REACT_APP_BACKEND_URL=https://api.yourdomain.com yarn build
```

### 2. EC2 Instance Setup

#### Create Launch Template:
```bash
# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y python3 python3-pip git nginx

# Install application
cd /opt
git clone <your-repo-url> illustra-design-studio
cd illustra-design-studio/backend

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
cat > /etc/systemd/system/illustra-backend.service << 'EOL'
[Unit]
Description=IllustraDesign Backend
After=network.target

[Service]
Type=exec
User=ec2-user
WorkingDirectory=/opt/illustra-design-studio/backend
Environment=PATH=/opt/illustra-design-studio/backend/venv/bin
ExecStart=/opt/illustra-design-studio/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOL

systemctl enable illustra-backend
systemctl start illustra-backend

# Configure nginx reverse proxy
cat > /etc/nginx/conf.d/illustra.conf << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

systemctl enable nginx
systemctl start nginx
EOF

# Create launch template
aws ec2 create-launch-template \
    --launch-template-name illustra-backend-template \
    --launch-template-data '{
        "ImageId": "ami-0abcdef1234567890",
        "InstanceType": "t3.medium",
        "KeyName": "your-key-pair",
        "SecurityGroupIds": ["'$EC2_SG_ID'"],
        "UserData": "'$(base64 -w 0 user-data.sh)'",
        "TagSpecifications": [{
            "ResourceType": "instance",
            "Tags": [{"Key": "Name", "Value": "illustra-backend"}]
        }]
    }'
```

### 3. Auto Scaling Group

#### Create Auto Scaling Group:
```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name illustra-backend-asg \
    --launch-template '{
        "LaunchTemplateName": "illustra-backend-template",
        "Version": "$Latest"
    }' \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 2 \
    --vpc-zone-identifier "$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2" \
    --health-check-type ELB \
    --health-check-grace-period 300
```

### 4. Application Load Balancer

#### Create Load Balancer:
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
    --name illustra-alb \
    --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application

# Create target group
aws elbv2 create-target-group \
    --name illustra-backend-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --health-check-protocol HTTP \
    --health-check-path /api/products \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
```

### 5. Frontend Deployment to S3

#### Create S3 Bucket:
```bash
# Create bucket for frontend
aws s3 mb s3://illustra-frontend-bucket

# Enable static website hosting
aws s3 website s3://illustra-frontend-bucket \
    --index-document index.html \
    --error-document error.html

# Set bucket policy for public read
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::illustra-frontend-bucket/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket illustra-frontend-bucket \
    --policy file://bucket-policy.json

# Upload frontend build
cd frontend
aws s3 sync build/ s3://illustra-frontend-bucket/ --delete
```

### 6. CloudFront Distribution

#### Create CloudFront Distribution:
```bash
cat > cloudfront-config.json << 'EOF'
{
    "CallerReference": "illustra-cf-$(date +%s)",
    "Aliases": {
        "Quantity": 1,
        "Items": ["yourdomain.com"]
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-illustra-frontend",
                "DomainName": "illustra-frontend-bucket.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-illustra-frontend",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "MinTTL": 0
    },
    "Comment": "IllustraDesign Frontend Distribution",
    "Enabled": true
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## 🌐 Domain and SSL Setup

### 1. Domain Setup with Route 53

#### Create Hosted Zone:
```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s)

# Note the nameservers and update your domain registrar
```

#### Create DNS Records:
```bash
# Create A record for main domain pointing to CloudFront
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "yourdomain.com",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "'$CLOUDFRONT_DOMAIN'",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }]
    }'

# Create A record for API subdomain pointing to ALB
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "api.yourdomain.com",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "'$ALB_DNS_NAME'",
                    "EvaluateTargetHealth": true,
                    "HostedZoneId": "'$ALB_HOSTED_ZONE_ID'"
                }
            }
        }]
    }'
```

### 2. SSL Certificate with ACM

#### Request Certificate:
```bash
# Request certificate for domain and subdomains
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names *.yourdomain.com \
    --validation-method DNS \
    --region us-east-1

# Note the certificate ARN
export CERT_ARN="arn:aws:acm:us-east-1:account:certificate/xxxxxx"
```

#### Validate Certificate:
```bash
# Get validation records
aws acm describe-certificate --certificate-arn $CERT_ARN

# Add the CNAME records to Route 53 for validation
# (AWS Console is easier for this step)
```

#### Update Load Balancer for HTTPS:
```bash
# Create HTTPS listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

# Update HTTP listener to redirect to HTTPS
aws elbv2 modify-listener \
    --listener-arn $HTTP_LISTENER_ARN \
    --default-actions Type=redirect,RedirectConfig='{
        "Protocol": "HTTPS",
        "Port": "443",
        "StatusCode": "HTTP_301"
    }'
```

---

## 📊 Monitoring and Logging

### 1. CloudWatch Setup

#### Create Log Groups:
```bash
# Create log group for backend application
aws logs create-log-group \
    --log-group-name /aws/ec2/illustra-backend

# Create log group for ALB access logs
aws logs create-log-group \
    --log-group-name /aws/elasticloadbalancing/illustra-alb
```

#### CloudWatch Alarms:
```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "illustra-high-cpu" \
    --alarm-description "High CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2

# Application Error Rate Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "illustra-error-rate" \
    --alarm-description "High error rate" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1
```

### 2. Application Monitoring

#### Backend Logging Configuration:
```python
# Add to backend/server.py
import logging
from pythonjsonlogger import jsonlogger

# Configure structured logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info({
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time": process_time
    })
    
    return response
```

---

## 🔐 Security Configuration

### 1. Environment Variables and Secrets

#### Use AWS Systems Manager Parameter Store:
```bash
# Store sensitive configuration
aws ssm put-parameter \
    --name "/illustra/prod/db-password" \
    --value "your-secure-password" \
    --type "SecureString"

aws ssm put-parameter \
    --name "/illustra/prod/jwt-secret" \
    --value "your-jwt-secret-key" \
    --type "SecureString"

aws ssm put-parameter \
    --name "/illustra/prod/aws-access-key" \
    --value "your-aws-access-key" \
    --type "SecureString"
```

#### Update Backend to Use Parameter Store:
```python
# Add to backend/server.py
import boto3

def get_parameter(name):
    ssm = boto3.client('ssm')
    response = ssm.get_parameter(Name=name, WithDecryption=True)
    return response['Parameter']['Value']

# Use in environment configuration
JWT_SECRET_KEY = get_parameter('/illustra/prod/jwt-secret')
```

### 2. Web Application Firewall (WAF)

#### Create WAF Web ACL:
```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
    --name illustra-waf \
    --scope CLOUDFRONT \
    --default-action Allow={} \
    --rules '[
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 1,
            "OverrideAction": {"None": {}},
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "CommonRuleSetMetric"
            }
        }
    ]'
```

### 3. Security Hardening

#### EC2 Security:
- Remove SSH access after initial setup
- Use IAM roles instead of access keys
- Enable VPC Flow Logs
- Regular security updates

#### Application Security:
- Enable HTTPS only
- Implement rate limiting
- Input validation and sanitization
- SQL injection prevention (for database queries)

---

## 💾 Backup and Recovery

### 1. Database Backup

#### MongoDB Atlas Backup:
- Automatic backups enabled by default
- Point-in-time recovery available
- Cross-region backup replication

#### Self-Hosted MongoDB Backup:
```bash
# Create backup script
cat > backup-mongodb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="illustra_backup_$DATE"

# Create backup
mongodump --host localhost --db illustra_design_ecommerce --out /backup/$BACKUP_NAME

# Compress backup
tar -czf /backup/$BACKUP_NAME.tar.gz /backup/$BACKUP_NAME

# Upload to S3
aws s3 cp /backup/$BACKUP_NAME.tar.gz s3://illustra-backups/

# Clean up local files older than 7 days
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-mongodb.sh
```

### 2. Application Code Backup

#### Automated Deployment Pipeline:
```bash
# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

# Pull latest code
git pull origin main

# Build frontend
cd frontend
yarn install
REACT_APP_BACKEND_URL=https://api.yourdomain.com yarn build

# Deploy frontend to S3
aws s3 sync build/ s3://illustra-frontend-bucket/ --delete

# Update backend
cd ../backend
sudo systemctl stop illustra-backend

# Backup current version
sudo cp -r /opt/illustra-design-studio /opt/illustra-design-studio.backup.$(date +%s)

# Deploy new version
sudo cp -r . /opt/illustra-design-studio/backend/
cd /opt/illustra-design-studio/backend
sudo -u ec2-user bash -c 'source venv/bin/activate && pip install -r requirements.txt'

# Start services
sudo systemctl start illustra-backend

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
EOF
```

---

## 📈 Scaling and Performance

### 1. Auto Scaling Configuration

#### Scaling Policies:
```bash
# Scale up policy
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name illustra-backend-asg \
    --policy-name scale-up \
    --policy-type StepScaling \
    --adjustment-type ChangeInCapacity \
    --step-adjustments '[
        {
            "MetricIntervalLowerBound": 0,
            "ScalingAdjustment": 1
        }
    ]'

# Scale down policy
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name illustra-backend-asg \
    --policy-name scale-down \
    --policy-type StepScaling \
    --adjustment-type ChangeInCapacity \
    --step-adjustments '[
        {
            "MetricIntervalUpperBound": 0,
            "ScalingAdjustment": -1
        }
    ]'
```

### 2. Performance Optimization

#### Database Optimization:
- MongoDB indexing strategy
- Connection pooling
- Query optimization
- Database monitoring

#### CDN Optimization:
- CloudFront caching policies
- Image optimization
- Static asset compression
- Geographic distribution

#### Application Optimization:
- API response caching
- Database query optimization
- Image resizing and compression
- Load balancer health checks

---

## 🔧 Maintenance Guide

### 1. Regular Maintenance Tasks

#### Weekly Tasks:
- Review CloudWatch metrics and alarms
- Check application logs for errors
- Monitor database performance
- Review security group rules

#### Monthly Tasks:
- Update dependencies and packages
- Review and optimize costs
- Security audit and penetration testing
- Backup verification and restore testing

### 2. Update Procedures

#### Application Updates:
1. Test changes in staging environment
2. Create backup of current production
3. Deploy during low-traffic hours
4. Monitor application metrics post-deployment
5. Rollback plan ready if issues occur

#### Infrastructure Updates:
1. Plan maintenance windows
2. Notify users of potential downtime
3. Update one component at a time
4. Verify functionality after each update

---

## 💰 Cost Optimization

### 1. Cost Monitoring

#### Set Up Billing Alerts:
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "illustra-billing-alarm" \
    --alarm-description "High billing alert" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 100 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=Currency,Value=USD
```

### 2. Cost Optimization Strategies

#### EC2 Optimization:
- Use appropriate instance types
- Reserved Instances for steady workloads
- Spot Instances for development/testing
- Auto Scaling to match demand

#### S3 Optimization:
- Lifecycle policies for old backups
- Intelligent Tiering for long-term storage
- CloudFront for reduced S3 data transfer

#### Database Optimization:
- MongoDB Atlas M2/M5 clusters for small loads
- Regular cleanup of old data
- Optimize queries to reduce compute

### Estimated Monthly Costs:
```
Small Setup (< 1000 users):
- EC2 t3.small x2: $30
- ALB: $20
- S3 + CloudFront: $10
- MongoDB Atlas M2: $57
- Total: ~$120/month

Medium Setup (1000-10000 users):
- EC2 t3.medium x2: $60
- ALB: $20
- S3 + CloudFront: $30
- MongoDB Atlas M10: $57
- Total: ~$170/month

Large Setup (10000+ users):
- EC2 c5.large x3: $200
- ALB: $20
- S3 + CloudFront: $50
- MongoDB Atlas M30: $285
- Total: ~$555/month
```

---

## 📞 Support and Troubleshooting

### Common Issues:

#### 1. Application Not Accessible
- Check security group rules
- Verify ALB health checks
- Check EC2 instance status
- Review application logs

#### 2. Database Connection Issues
- Verify MongoDB Atlas whitelist
- Check connection string format
- Test network connectivity
- Review database logs

#### 3. SSL Certificate Problems
- Verify certificate validation
- Check Route 53 DNS records
- Confirm certificate is in correct region
- Review CloudFront distribution settings

### Monitoring Commands:
```bash
# Check EC2 instances
aws ec2 describe-instances --filters Name=tag:Name,Values=illustra-backend

# Check ALB health
aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN

# View application logs
aws logs tail /aws/ec2/illustra-backend --follow

# Check CloudFront status
aws cloudfront get-distribution --id $DISTRIBUTION_ID
```

---

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring dashboards**
2. **Configure automated backups**
3. **Implement CI/CD pipeline**
4. **Add additional security measures**
5. **Optimize for performance and cost**
6. **Set up staging environment**

---

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Cost Optimization](https://aws.amazon.com/aws-cost-management/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)

**Happy Deploying! 🚀**