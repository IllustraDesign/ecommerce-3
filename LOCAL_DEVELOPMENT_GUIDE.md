# IllustraDesign Studio - Local Development Setup Guide

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Python** (v3.8 or higher)
   - Download from: https://python.org/
   - Verify installation: `python --version` or `python3 --version`

3. **MongoDB**
   - **Option A**: Install locally from https://mongodb.com/try/download/community
   - **Option B**: Use MongoDB Atlas (cloud) from https://cloud.mongodb.com/
   - **Option C**: Use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

4. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### AWS Account Setup (for image storage)
1. Create AWS account at https://aws.amazon.com/
2. Create IAM user with S3 permissions
3. Generate Access Key ID and Secret Access Key
4. Create S3 bucket for image storage

## Step-by-Step Local Setup

### 1. Clone/Download the Project
```bash
# If using git (recommended)
git clone <your-repository-url>
cd illustra-design-studio

# OR download and extract the project files to a folder
```

### 2. Backend Setup

#### 2.1. Navigate to Backend Directory
```bash
cd backend
```

#### 2.2. Create Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 2.3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

#### 2.4. Create Environment Variables
Create a `.env` file in the backend directory:
```bash
# Create .env file
touch .env  # On Windows: type nul > .env
```

Add the following content to `.env`:
```env
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="illustra_design_ecommerce"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your_aws_access_key_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key_here"
AWS_BUCKET_NAME="illustra-design-ecommerce-bucket"
AWS_REGION="us-east-1"

# JWT Configuration
JWT_SECRET_KEY="illustra_design_jwt_secret_key_2025"
JWT_ALGORITHM="HS256"
```

#### 2.5. Start MongoDB
```bash
# If installed locally:
mongod

# If using Docker:
docker start mongodb

# If using MongoDB Atlas: 
# Update MONGO_URL in .env with your Atlas connection string
```

#### 2.6. Start Backend Server
```bash
# Make sure virtual environment is activated
python server.py

# OR using uvicorn directly:
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available at: http://localhost:8001

### 3. Frontend Setup

#### 3.1. Open New Terminal and Navigate to Frontend
```bash
cd frontend
```

#### 3.2. Install Frontend Dependencies
```bash
# Using npm:
npm install

# OR using yarn (recommended):
yarn install
```

#### 3.3. Create Frontend Environment Variables
Create a `.env` file in the frontend directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### 3.4. Start Frontend Development Server
```bash
# Using npm:
npm start

# OR using yarn:
yarn start
```

Frontend will be available at: http://localhost:3000

### 4. Initialize Demo Data

#### 4.1. Initialize Admin User and Demo Products
```bash
# Open new terminal and run:
curl -X POST "http://localhost:8001/api/initialize-demo-data"
```

#### 4.2. Verify Setup
1. Visit http://localhost:3000
2. You should see the IllustraDesign Studio homepage
3. Login as admin: admin@illustradesign.com / DesignStudio@22
4. Access admin dashboard at: http://localhost:3000/admin

## AWS S3 Setup

### 1. Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. Use bucket name: `illustra-design-ecommerce-bucket`
4. Choose region: `us-east-1`
5. Uncheck "Block all public access" (for public image URLs)
6. Create bucket

### 2. Configure Bucket Policy
Add this bucket policy to make images publicly accessible:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::illustra-design-ecommerce-bucket/*"
        }
    ]
}
```

### 3. Create IAM User
1. Go to AWS Console → IAM → Users
2. Create user: `illustra-design-s3-user`
3. Attach policy: `AmazonS3FullAccess`
4. Generate Access Keys
5. Add keys to backend `.env` file

## Development Workflow

### Starting Development
```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python server.py

# Terminal 3: Start Frontend
cd frontend
yarn start
```

### Making Changes
1. **Backend changes**: Server auto-reloads with `--reload` flag
2. **Frontend changes**: React dev server auto-reloads
3. **Database changes**: Use admin dashboard or API endpoints

### Adding Products
1. Login as admin: admin@illustradesign.com / DesignStudio@22
2. Go to admin dashboard: http://localhost:3000/admin
3. Use Products tab to add new products
4. Use Categories tab to organize products

## Troubleshooting

### Common Issues

#### Backend not starting
```bash
# Check Python version
python --version

# Check if port 8001 is in use
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Check MongoDB connection
mongo  # or mongosh for newer versions
```

#### Frontend not starting
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Check Node.js version
node --version
```

#### Database connection issues
```bash
# Check MongoDB is running
ps aux | grep mongod  # macOS/Linux
tasklist | findstr mongod  # Windows

# Check connection string in .env
# Ensure MONGO_URL matches your MongoDB setup
```

#### CORS issues
- Ensure backend is running on port 8001
- Check REACT_APP_BACKEND_URL in frontend .env
- Verify CORS is properly configured in server.py

### Environment Variables Checklist
- [ ] Backend `.env` has all required variables
- [ ] Frontend `.env` has REACT_APP_BACKEND_URL
- [ ] AWS credentials are valid
- [ ] MongoDB connection string is correct

### Ports Used
- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- MongoDB: mongodb://localhost:27017

## Development Tips

1. **Use browser developer tools** to debug frontend issues
2. **Check backend logs** for API errors
3. **Use Postman or curl** to test API endpoints
4. **Keep both terminals running** during development
5. **Use git** for version control and backups

## Next Steps

After local setup:
1. Test all functionality (products, cart, admin)
2. Add your real product data
3. Customize branding and content
4. Set up production deployment (see AWS deployment guide)
5. Configure custom domain
6. Set up monitoring and backups