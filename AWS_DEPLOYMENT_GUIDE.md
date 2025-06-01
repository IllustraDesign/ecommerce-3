# IllustraDesign Studio - AWS Production Deployment Guide

## Architecture Overview

### Recommended AWS Architecture
```
Internet → CloudFront (CDN) → Application Load Balancer → EC2 (Backend) 
                            → S3 (Frontend Static Files)
                            → DocumentDB/MongoDB Atlas (Database)
                            → S3 (Image Storage)
```

### Cost Optimization
- Use **AWS Free Tier** where possible
- **EC2 t3.micro** for backend (free tier eligible)
- **S3** for static hosting and images
- **CloudFront** for global CDN
- **Route 53** for custom domain (optional)

## Step-by-Step AWS Deployment

### Phase 1: Setup AWS Account and IAM

#### 1.1. AWS Account Setup
1. Create AWS account at https://aws.amazon.com/
2. Complete billing setup
3. Verify email and phone number

#### 1.2. Create IAM User for Deployment
1. Go to **IAM Console** → Users → Create User
2. User name: `illustra-deployment-user`
3. Enable programmatic access
4. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AWSCodeDeployFullAccess`
   - `IAMFullAccess`
5. Download access keys (save securely)

#### 1.3. Create Application-Specific IAM Role
1. Create role: `IllustraDesignAppRole`
2. Attach policies:
   - `AmazonS3FullAccess`
   - `CloudWatchLogsFullAccess`
3. Note the Role ARN for later use

### Phase 2: Database Setup

#### Option A: MongoDB Atlas (Recommended - Easier)
1. Go to https://cloud.mongodb.com/
2. Create free cluster (M0 Sandbox)
3. Choose AWS as provider, same region as your app
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for development)
6. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

#### Option B: Amazon DocumentDB (AWS Native)
1. Go to **DocumentDB Console** → Create Cluster
2. Choose t3.medium instance (smallest available)
3. Set master username/password
4. Note the cluster endpoint
5. Connection string: `mongodb://username:password@docdb-cluster.region.docdb.amazonaws.com:27017/`

### Phase 3: S3 Setup for Images and Static Hosting

#### 3.1. Create S3 Bucket for Images
```bash
# Using AWS CLI (install from https://aws.amazon.com/cli/)
aws s3 mb s3://illustra-design-images-prod --region us-east-1
```

Or via Console:
1. Go to **S3 Console** → Create Bucket
2. Name: `illustra-design-images-prod`
3. Region: `us-east-1`
4. Uncheck "Block all public access"
5. Create bucket

#### 3.2. Configure Image Bucket Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::illustra-design-images-prod/*"
        }
    ]
}
```

#### 3.3. Create S3 Bucket for Frontend
```bash
aws s3 mb s3://illustra-design-frontend-prod --region us-east-1
```

Configure for static website hosting:
1. Properties → Static website hosting → Enable
2. Index document: `index.html`
3. Error document: `index.html` (for React Router)

### Phase 4: Backend Deployment on EC2

#### 4.1. Launch EC2 Instance
1. Go to **EC2 Console** → Launch Instance
2. Choose **Amazon Linux 2** AMI
3. Instance type: **t3.micro** (free tier)
4. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
   - Custom (8001) from anywhere (for API)
5. Create or use existing key pair
6. Launch instance

#### 4.2. Connect to EC2 Instance
```bash
# Download your key pair and set permissions
chmod 400 your-key.pem

# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-public-ip
```

#### 4.3. Setup EC2 Environment
```bash
# Update system
sudo yum update -y

# Install Python 3.9
sudo yum install python39 python39-pip -y

# Install Git
sudo yum install git -y

# Install Node.js (for build tools if needed)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo yum install nginx -y
```

#### 4.4. Clone and Setup Application
```bash
# Clone your repository
git clone https://github.com/your-username/illustra-design-studio.git
cd illustra-design-studio/backend

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4.5. Create Production Environment File
```bash
# Create production .env file
sudo nano /home/ec2-user/illustra-design-studio/backend/.env
```

Add production configuration:
```env
# Database Configuration (MongoDB Atlas or DocumentDB)
MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/illustra_design_ecommerce"
DB_NAME="illustra_design_ecommerce"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your_production_access_key"
AWS_SECRET_ACCESS_KEY="your_production_secret_key"
AWS_BUCKET_NAME="illustra-design-images-prod"
AWS_REGION="us-east-1"

# JWT Configuration
JWT_SECRET_KEY="your_super_secure_production_jwt_key_2025"
JWT_ALGORITHM="HS256"

# Production Settings
ENVIRONMENT="production"
```

#### 4.6. Setup PM2 for Backend
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Content:
```javascript
module.exports = {
  apps: [{
    name: 'illustra-backend',
    script: 'python',
    args: 'server.py',
    cwd: '/home/ec2-user/illustra-design-studio/backend',
    interpreter: '/home/ec2-user/illustra-design-studio/backend/venv/bin/python',
    env: {
      PORT: 8001,
      NODE_ENV: 'production'
    }
  }]
};
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4.7. Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/nginx.conf
```

Add server block:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Frontend (serve from S3 or local build)
    location / {
        proxy_pass http://illustra-design-frontend-prod.s3-website-us-east-1.amazonaws.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Start Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Phase 5: Frontend Deployment

#### 5.1. Build Frontend Locally
```bash
# On your local machine
cd frontend

# Update environment for production
echo "REACT_APP_BACKEND_URL=https://your-domain.com" > .env.production

# Build for production
npm run build
# or
yarn build
```

#### 5.2. Deploy to S3
```bash
# Upload build files to S3
aws s3 sync build/ s3://illustra-design-frontend-prod --delete

# Enable public access
aws s3 website s3://illustra-design-frontend-prod --index-document index.html --error-document index.html
```

### Phase 6: CDN Setup with CloudFront

#### 6.1. Create CloudFront Distribution
1. Go to **CloudFront Console** → Create Distribution
2. Origin Domain: `illustra-design-frontend-prod.s3-website-us-east-1.amazonaws.com`
3. Redirect HTTP to HTTPS: Yes
4. Default Root Object: `index.html`
5. Error Pages: Add custom error response
   - HTTP Error Code: 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

#### 6.2. Update Nginx Configuration
Update your EC2 Nginx to point to CloudFront:
```nginx
location / {
    proxy_pass https://your-cloudfront-domain.cloudfront.net;
}
```

### Phase 7: Domain Setup (Optional)

#### 7.1. Purchase Domain (Route 53 or External)
1. Go to **Route 53** → Register Domain
2. Choose your domain name
3. Complete registration

#### 7.2. Configure DNS
1. Create **Hosted Zone** in Route 53
2. Add **A Record** pointing to your EC2 Elastic IP
3. Add **CNAME** for www subdomain

#### 7.3. SSL Certificate (Let's Encrypt)
```bash
# On EC2 instance
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Phase 8: Monitoring and Logging

#### 8.1. CloudWatch Setup
1. Go to **CloudWatch** → Create Dashboard
2. Add metrics for:
   - EC2 CPU utilization
   - S3 requests
   - Application logs

#### 8.2. Application Logging
```python
# Add to server.py
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/illustra-backend.log'),
        logging.StreamHandler()
    ]
)
```

### Phase 9: Backup Strategy

#### 9.1. Database Backups
For MongoDB Atlas:
- Automatic backups included in free tier
- Configure backup retention policy

For DocumentDB:
```bash
# Create backup
aws docdb create-db-cluster-snapshot \
    --db-cluster-identifier illustra-cluster \
    --db-cluster-snapshot-identifier illustra-backup-$(date +%Y%m%d)
```

#### 9.2. S3 Versioning
```bash
# Enable versioning on buckets
aws s3api put-bucket-versioning \
    --bucket illustra-design-images-prod \
    --versioning-configuration Status=Enabled
```

## Deployment Automation

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install and Build Frontend
      run: |
        cd frontend
        npm install
        npm run build
    
    - name: Deploy to S3
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      run: |
        aws s3 sync frontend/build/ s3://illustra-design-frontend-prod --delete
        aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
    
    - name: Deploy Backend
      run: |
        # SSH to EC2 and update backend
        # Or use AWS CodeDeploy
```

## Cost Optimization Tips

### AWS Free Tier Usage
- **EC2**: 750 hours/month of t3.micro
- **S3**: 5GB storage, 20,000 GET requests
- **CloudFront**: 1TB data transfer out
- **Route 53**: First hosted zone free

### Monthly Cost Estimate
- **EC2 t3.micro**: $0 (free tier)
- **S3**: ~$1-5 depending on usage
- **CloudFront**: $0 (free tier)
- **MongoDB Atlas**: $0 (M0 free tier)
- **Route 53**: $0.50/month per hosted zone
- **Total**: ~$2-6/month for small business

## Security Best Practices

1. **Use IAM roles** instead of hardcoded keys where possible
2. **Enable CloudTrail** for audit logging
3. **Set up billing alerts** to monitor costs
4. **Use Security Groups** to restrict access
5. **Regular security updates** on EC2 instances
6. **Enable MFA** on AWS root account
7. **Use SSL/TLS** for all communications

## Troubleshooting

### Common Deployment Issues

#### Backend not accessible
```bash
# Check if service is running
pm2 status

# Check logs
pm2 logs illustra-backend

# Check ports
sudo netstat -tlnp | grep 8001
```

#### Frontend not loading
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket illustra-design-frontend-prod

# Check CloudFront cache
# Invalidate cache if needed
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### Database connection issues
```bash
# Test MongoDB connection
python3 -c "from pymongo import MongoClient; client = MongoClient('your_connection_string'); print(client.list_database_names())"
```

## Scaling Considerations

### When to Scale
- **CPU usage** consistently above 70%
- **Response times** getting slow
- **Error rates** increasing

### Scaling Options
1. **Vertical Scaling**: Upgrade to larger EC2 instance
2. **Horizontal Scaling**: Use Application Load Balancer + Auto Scaling
3. **Database Scaling**: MongoDB Atlas auto-scaling
4. **CDN**: CloudFront automatically scales

### Advanced Architecture
```
Route 53 → CloudFront → ALB → EC2 Auto Scaling Group
                            → RDS/DocumentDB
                            → ElastiCache (Redis)
                            → S3
```

This guide provides a complete production deployment strategy that can handle a growing custom printing business while keeping costs minimal during the startup phase.