
import requests
import sys
import uuid
import os
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class IllustraDesignAPITester:
    def __init__(self, base_url="https://8ac0c223-0880-40af-ab0c-82a50ff379d3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None
        self.test_category_id = None
        self.test_subcategory_id = None
        self.test_size_id = None
        self.test_product_id = None
        self.test_order_id = None
        self.uploaded_image_url = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # For file uploads, don't use JSON
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, headers=headers, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json() if response.text else 'No content'}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@illustradesign.com", "password": "DesignStudio@22"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"✅ Admin login successful, token received")
            return True
        return False

    def test_user_login(self):
        """Test regular user login"""
        # First register a test user
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "Register Test User",
            "POST",
            "api/auth/register",
            201,
            data={
                "name": "Test User",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if not success:
            return False
            
        # Now login with the test user
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": test_email, "password": "TestPass123!"}
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"✅ User login successful, token received")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False
            
        success, response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Dashboard stats: {response}")
            return True
        return False

    def test_category_management(self):
        """Test category management"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False
            
        # Create a new category
        category_name = f"Test Category {uuid.uuid4().hex[:8]}"
        success, response = self.run_test(
            "Create Category",
            "POST",
            "api/categories",
            200,  # API returns 200 instead of 201
            data={"name": category_name},
            token=self.admin_token
        )
        
        if not success:
            return False
            
        self.test_category_id = response.get("id")
        print(f"✅ Created category with ID: {self.test_category_id}")
        
        # Create a subcategory
        subcategory_name = f"Test Subcategory {uuid.uuid4().hex[:8]}"
        success, response = self.run_test(
            "Create Subcategory",
            "POST",
            "api/subcategories",
            200,  # API returns 200 instead of 201
            data={
                "name": subcategory_name,
                "category_id": self.test_category_id
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        self.test_subcategory_id = response.get("id")
        print(f"✅ Created subcategory with ID: {self.test_subcategory_id}")
        
        # Create a size
        size_name = f"Test Size {uuid.uuid4().hex[:8]}"
        success, response = self.run_test(
            "Create Size",
            "POST",
            "api/sizes",
            200,  # API returns 200 instead of 201
            data={
                "name": size_name,
                "category_id": self.test_category_id
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        self.test_size_id = response.get("id")
        print(f"✅ Created size with ID: {self.test_size_id}")
        
        return True

    def test_product_management(self):
        """Test product management"""
        if not self.admin_token or not self.test_category_id or not self.test_subcategory_id:
            print("❌ Required data not available, skipping test")
            return False
            
        # Create a new product
        product_name = f"Test Product {uuid.uuid4().hex[:8]}"
        success, response = self.run_test(
            "Create Product",
            "POST",
            "api/products",
            201,
            data={
                "title": product_name,
                "description": "This is a test product",
                "price": 29.99,
                "quantity": 100,
                "category_id": self.test_category_id,
                "subcategory_id": self.test_subcategory_id,
                "sizes": ["S", "M", "L"],
                "is_customizable": True,
                "images": []
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        self.test_product_id = response.get("id")
        print(f"✅ Created product with ID: {self.test_product_id}")
        
        # Update the product
        success, response = self.run_test(
            "Update Product",
            "PUT",
            f"api/products/{self.test_product_id}",
            200,
            data={
                "title": product_name + " (Updated)",
                "description": "This is an updated test product",
                "price": 39.99,
                "quantity": 50,
                "category_id": self.test_category_id,
                "subcategory_id": self.test_subcategory_id,
                "sizes": ["S", "M", "L", "XL"],
                "is_customizable": True,
                "images": []
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Updated product successfully")
        
        # Get the product
        success, response = self.run_test(
            "Get Product",
            "GET",
            f"api/products/{self.test_product_id}",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Retrieved product successfully")
        
        return True

    def test_order_management(self):
        """Test order management"""
        if not self.admin_token or not self.test_product_id:
            print("❌ Required data not available, skipping test")
            return False
            
        # Create a test order (first we need to create a cart)
        success, response = self.run_test(
            "Create Order",
            "POST",
            "api/orders",
            201,
            data={
                "billing_address": "123 Test St, Test City, TS 12345",
                "phone": "1234567890"
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        self.test_order_id = response.get("id")
        print(f"✅ Created order with ID: {self.test_order_id}")
        
        # Update order status
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"api/orders/{self.test_order_id}/status",
            200,
            data={"status": "dispatched"},
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Updated order status successfully")
        
        return True

    def test_cart_functionality(self):
        """Test cart functionality"""
        if not self.admin_token or not self.test_product_id:
            print("❌ Required data not available, skipping test")
            return False
            
        # Add item to cart
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "api/cart/items",
            201,
            data={
                "product_id": self.test_product_id,
                "quantity": 2,
                "size": "M"
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        cart_item_id = response.get("id")
        print(f"✅ Added item to cart with ID: {cart_item_id}")
        
        # Get cart
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "api/cart",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Retrieved cart successfully with {len(response)} items")
        
        # Remove from cart
        success, _ = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"api/cart/{cart_item_id}",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Removed item from cart successfully")
        
        return True

    def test_regular_user_admin_access(self):
        """Test that regular users cannot access admin features"""
        if not self.user_token:
            print("❌ User token not available, skipping test")
            return False
            
        # Try to access admin dashboard
        success, _ = self.run_test(
            "User Access to Admin Dashboard",
            "GET",
            "api/dashboard/stats",
            403,  # Expecting forbidden
            token=self.user_token
        )
        
        if success:
            print("✅ Regular user correctly denied access to admin dashboard")
        else:
            print("❌ Regular user was not properly restricted from admin dashboard")
            return False
            
        # Try to create a category
        success, _ = self.run_test(
            "User Access to Category Creation",
            "POST",
            "api/categories",
            403,  # Expecting forbidden
            data={"name": "Unauthorized Category"},
            token=self.user_token
        )
        
        if success:
            print("✅ Regular user correctly denied access to category creation")
        else:
            print("❌ Regular user was not properly restricted from category creation")
            return False
            
        return True

    def test_product_deletion(self):
        """Test product deletion"""
        if not self.admin_token or not self.test_product_id:
            print("❌ Required data not available, skipping test")
            return False
            
        success, _ = self.run_test(
            "Delete Product",
            "DELETE",
            f"api/products/{self.test_product_id}",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"✅ Deleted product successfully")
            return True
        return False
        
    def create_test_image(self):
        """Create a test image for upload testing"""
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color = (73, 109, 137))
        img_io = BytesIO()
        img.save(img_io, 'JPEG')
        img_io.seek(0)
        return img_io
        
    def test_image_upload_fallback(self):
        """Test image upload with fallback system"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False
            
        # Create a test image
        img_io = self.create_test_image()
        
        # Test image upload
        files = {'file': ('test_image.jpg', img_io, 'image/jpeg')}
        data = {'folder': 'test'}
        
        url = f"{self.base_url}/api/upload-image"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print("\n🔍 Testing Image Upload with Fallback...")
        self.tests_run += 1
        
        try:
            response = requests.post(url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                response_data = response.json()
                image_url = response_data.get('image_url', '')
                
                # Check if it's a base64 image (fallback) or S3 URL
                if image_url.startswith('data:image/jpeg;base64,'):
                    print("✅ Image upload fallback to base64 is working")
                    # Verify it's a valid base64 image
                    try:
                        # Extract the base64 part
                        base64_data = image_url.split(',')[1]
                        # Try to decode it
                        base64.b64decode(base64_data)
                        print("✅ Valid base64 image data")
                    except:
                        print("❌ Invalid base64 image data")
                        return False
                elif image_url.startswith('https://'):
                    print("✅ Image uploaded to S3 successfully")
                else:
                    print("❌ Unexpected image URL format")
                    return False
                
                self.uploaded_image_url = image_url
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    print(f"Response: {response.json() if response.text else 'No content'}")
                except:
                    print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False
            
    def test_product_image_upload(self):
        """Test adding an image to a product"""
        if not self.admin_token or not self.test_product_id:
            print("❌ Required data not available, skipping test")
            return False
            
        # Create a test image
        img_io = self.create_test_image()
        
        # Test product image upload
        files = {'file': ('product_image.jpg', img_io, 'image/jpeg')}
        
        url = f"{self.base_url}/api/products/{self.test_product_id}/add-image"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print("\n🔍 Testing Product Image Upload...")
        self.tests_run += 1
        
        try:
            response = requests.post(url, headers=headers, files=files)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                response_data = response.json()
                image_url = response_data.get('image_url', '')
                
                # Check if it's a base64 image (fallback) or S3 URL
                if image_url.startswith('data:image/jpeg;base64,'):
                    print("✅ Product image upload fallback to base64 is working")
                elif image_url.startswith('https://'):
                    print("✅ Product image uploaded to S3 successfully")
                else:
                    print("❌ Unexpected image URL format")
                    return False
                
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    print(f"Response: {response.json() if response.text else 'No content'}")
                except:
                    print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_checkout_flow(self):
        """Test the complete checkout flow"""
        if not self.admin_token or not self.test_product_id:
            print("❌ Required data not available, skipping test")
            return False
            
        # 1. Add item to cart
        success, response = self.run_test(
            "Add to Cart for Checkout",
            "POST",
            "api/cart/items",
            201,
            data={
                "product_id": self.test_product_id,
                "quantity": 1,
                "size": "M"
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        print(f"✅ Added item to cart for checkout")
        
        # 2. Create order (checkout)
        success, response = self.run_test(
            "Complete Checkout",
            "POST",
            "api/orders",
            201,
            data={
                "billing_address": "456 Checkout St, Test City, TS 12345",
                "phone": "9876543210"
            },
            token=self.admin_token
        )
        
        if not success:
            return False
            
        order_id = response.get("id")
        print(f"✅ Checkout completed successfully, order created with ID: {order_id}")
        
        # 3. Verify cart is empty after checkout
        success, response = self.run_test(
            "Verify Cart Empty After Checkout",
            "GET",
            "api/cart",
            200,
            token=self.admin_token
        )
        
        if success and len(response) == 0:
            print(f"✅ Cart is empty after checkout as expected")
            return True
        else:
            print(f"❌ Cart is not empty after checkout")
            return False

def main():
    # Setup
    tester = IllustraDesignAPITester()
    
    # Run tests
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
        
    if not tester.test_user_login():
        print("❌ User login failed, continuing with other tests")
    
    # Test admin dashboard (priority 2)
    tester.test_admin_dashboard()
    
    # Test image upload with fallback (priority 1)
    tester.test_image_upload_fallback()
    
    if not tester.test_category_management():
        print("❌ Category management failed, continuing with other tests")
    
    # Test product management with image upload (priority 3)
    if not tester.test_product_management():
        print("❌ Product management failed, continuing with other tests")
    else:
        # Test product image upload if product management succeeded
        tester.test_product_image_upload()
    
    tester.test_cart_functionality()
    
    # Test order system (priority 4)
    tester.test_checkout_flow()
    
    if not tester.test_order_management():
        print("❌ Order management failed, continuing with other tests")
    
    tester.test_regular_user_admin_access()
    
    if tester.test_product_id:
        tester.test_product_deletion()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
