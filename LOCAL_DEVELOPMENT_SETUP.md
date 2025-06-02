# 🚀 IllustraDesign Studio - Local Development Setup Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.9 or higher)
- **MongoDB** (v5.0 or higher)
- **Git** (latest version)
- **Yarn** (v1.22 or higher)
- **pip** (Python package manager)

### Optional Tools
- **MongoDB Compass** (GUI for MongoDB)
- **Postman** (API testing)
- **VS Code** (recommended IDE)

---

## 💻 System Requirements

### Minimum Requirements
- **RAM**: 8GB
- **Storage**: 5GB free space
- **OS**: Windows 10, macOS 10.15+, or Ubuntu 18.04+

### Recommended Requirements
- **RAM**: 16GB
- **Storage**: 10GB free space
- **CPU**: Multi-core processor

---

## 📥 Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd illustra-design-studio
```

### 2. Install Node.js Dependencies
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies using Yarn
yarn install

# Verify installation
yarn --version
node --version
```

### 3. Install Python Dependencies
```bash
# Navigate to backend directory
cd ../backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python --version
pip list
```

### 4. Install MongoDB

#### Windows:
1. Download MongoDB Community Server from [MongoDB website](https://www.mongodb.com/try/download/community)
2. Run the installer and follow setup wizard
3. MongoDB will start as a Windows service automatically

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### Ubuntu/Linux:
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## ⚙️ Environment Configuration

### 1. Backend Environment Variables
Create `/backend/.env` file:
```env
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="illustra_design_ecommerce"

# AWS S3 Configuration (Optional - fallback to base64 if not configured)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_BUCKET_NAME="your_bucket_name"
AWS_REGION="us-east-1"

# JWT Configuration
JWT_SECRET_KEY="your_super_secret_jwt_key_here"
JWT_ALGORITHM="HS256"

# Server Configuration
HOST="0.0.0.0"
PORT="8001"
```

### 2. Frontend Environment Variables
Create `/frontend/.env` file:
```env
# Development server configuration
REACT_APP_BACKEND_URL="http://localhost:8001"
PORT=3000

# Optional: WebSocket configuration for hot reload
WDS_SOCKET_PORT=3000
```

### 3. AWS S3 Setup (Optional)
If you want to use AWS S3 for image storage:

1. **Create AWS Account** and sign in to AWS Console
2. **Create S3 Bucket**:
   - Go to S3 service
   - Create new bucket with unique name
   - Enable public read access for uploaded images
   - Configure CORS policy
3. **Create IAM User**:
   - Go to IAM service
   - Create new user with programmatic access
   - Attach S3 full access policy
   - Save Access Key ID and Secret Access Key

**S3 CORS Configuration**:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

---

## 🗄️ Database Setup

### 1. Verify MongoDB Connection
```bash
# Connect to MongoDB shell
mongosh

# Check if connection is successful
show dbs

# Exit MongoDB shell
exit
```

### 2. Create Database and Collections
The application will automatically create the database and collections when you first run it.

### 3. Initialize Demo Data
The application includes a demo data initialization endpoint that creates:
- Admin user account
- Sample categories and subcategories
- Sample products
- Sample hero images

This will be initialized automatically when you first access the application.

---

## 🚀 Running the Application

### 1. Start MongoDB Service
Make sure MongoDB is running:
```bash
# Check MongoDB status
# Windows: Check Services app
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongod
```

### 2. Start Backend Server
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if using)
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Server should start at: http://localhost:8001
```

### 3. Start Frontend Development Server
```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Start development server
yarn start

# Application should open at: http://localhost:3000
```

### 4. Initialize Demo Data
Open your browser and navigate to:
```
http://localhost:8001/api/initialize-demo-data
```
This will create demo data including admin user and sample products.

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

### Default Login Credentials
- **Admin Email**: admin@illustradesign.com
- **Admin Password**: DesignStudio@22

---

## 🔄 Development Workflow

### 1. Code Structure
```
illustra-design-studio/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main application file
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── AdminComponents.js # Admin dashboard
│   │   └── index.js       # React entry point
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── .env              # Environment variables
└── docs/                  # Documentation
```

### 2. Development Best Practices

#### Backend Development:
```bash
# Always activate virtual environment
source venv/bin/activate

# Install new packages and update requirements.txt
pip install new-package
pip freeze > requirements.txt

# Run with hot reload for development
uvicorn server:app --reload
```

#### Frontend Development:
```bash
# Install new packages
yarn add package-name

# Start development server with hot reload
yarn start

# Build for production
yarn build
```

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request for review
```

---

## 🧪 Testing Guide

### 1. Backend API Testing

#### Manual Testing with cURL:
```bash
# Test health endpoint
curl http://localhost:8001/api/products

# Test admin login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@illustradesign.com", "password": "DesignStudio@22"}'

# Test protected endpoint (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8001/api/dashboard/stats
```

#### Automated Testing:
```bash
# Navigate to project root
cd illustra-design-studio

# Run backend tests
python backend_test.py
```

### 2. Frontend Testing

#### Manual Testing:
1. **Registration Flow**:
   - Go to http://localhost:3000
   - Click "Join Us" and create account
   - Verify email validation and registration

2. **Admin Dashboard**:
   - Login with admin credentials
   - Test product creation with images
   - Test category management
   - Test order management

3. **Shopping Flow**:
   - Browse products
   - Add items to cart
   - Test checkout process
   - Upload custom images for customizable products

#### Component Testing:
```bash
# Run React tests
cd frontend
yarn test
```

### 3. Database Testing
```bash
# Connect to MongoDB
mongosh

# Switch to application database
use illustra_design_ecommerce

# Check collections
show collections

# Query sample data
db.products.find().limit(5)
db.users.find({role: "admin"})
```

### 4. Integration Testing

#### End-to-End Testing Checklist:
- [ ] User registration and login
- [ ] Admin authentication and dashboard access
- [ ] Product CRUD operations
- [ ] Image upload functionality
- [ ] Shopping cart operations
- [ ] Order creation and management
- [ ] Customization feature in checkout

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Issues
**Problem**: `pymongo.errors.ServerSelectionTimeoutError`
**Solution**:
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB if not running
sudo systemctl start mongod  # Linux
brew services start mongodb/brew/mongodb-community  # macOS
```

#### 2. Port Already in Use
**Problem**: `EADDRINUSE: address already in use :::3000`
**Solution**:
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows

# Or use different port
PORT=3001 yarn start
```

#### 3. Python Virtual Environment Issues
**Problem**: Package installation conflicts
**Solution**:
```bash
# Deactivate current environment
deactivate

# Remove existing environment
rm -rf venv

# Create new environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Node.js Module Issues
**Problem**: Module not found errors
**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules
rm yarn.lock
yarn install
```

#### 5. CORS Issues
**Problem**: Cross-origin request blocked
**Solution**:
- Check that backend is running on port 8001
- Verify REACT_APP_BACKEND_URL in frontend/.env
- Ensure CORS is enabled in backend (already configured)

#### 6. Image Upload Issues
**Problem**: Images not uploading
**Solution**:
1. Check AWS credentials in backend/.env
2. Verify S3 bucket permissions
3. Fallback system should use base64 encoding if S3 fails
4. Check browser console for errors

### Getting Help

#### Check Logs:
```bash
# Backend logs
tail -f backend.log

# Frontend development server logs
# Check terminal where yarn start is running

# MongoDB logs
tail -f /var/log/mongodb/mongod.log  # Linux
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
```

#### Debug Mode:
```bash
# Backend debug mode
uvicorn server:app --reload --log-level debug

# Frontend debug mode
REACT_APP_DEBUG=true yarn start
```

---

## 📚 Additional Resources

### Documentation Links:
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Development Tools:
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [Postman](https://www.postman.com/) - API testing tool
- [React Developer Tools](https://reactjs.org/blog/2015/09/02/new-react-developer-tools.html) - Browser extension

### Learning Resources:
- [Python FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Beginner Guide](https://reactjs.org/tutorial/tutorial.html)
- [MongoDB University](https://university.mongodb.com/)

---

## 🎯 Next Steps

After successful local setup:

1. **Explore the Application**:
   - Create products with images
   - Test the shopping cart
   - Try the customization features

2. **Customize for Your Needs**:
   - Update branding and colors
   - Add your product categories
   - Configure payment integration

3. **Deploy to Production**:
   - Follow the AWS deployment guide
   - Set up monitoring and backups
   - Configure SSL certificates

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the troubleshooting section above
2. Review application logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all prerequisites are properly installed

Happy coding! 🚀