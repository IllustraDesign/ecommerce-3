import requests
import json
import sys
import time
from datetime import datetime

class IllustraDesignAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_credentials = {
            "email": "admin@illustradesign.com",
            "password": "DesignStudio@22"
        }
        self.test_user_credentials = {
            "name": f"Test User {int(time.time())}",
            "email": f"testuser{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "phone": "9876543210",
            "address": "123 Test Street, Test City"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
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
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.admin_credentials
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"Admin login successful, got token: {self.token[:10]}...")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            201,
            data=self.test_user_credentials
        )
        return success

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_user_credentials["email"],
                "password": self.test_user_credentials["password"]
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"User login successful, got token: {self.token[:10]}...")
            return True
        return False

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        if success:
            print(f"Retrieved {len(response)} categories")
        return success

    def test_get_products(self):
        """Test getting products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        if success:
            print(f"Retrieved {len(response)} products")
            if len(response) > 0:
                self.product_id = response[0]['id']
                print(f"Saved product ID: {self.product_id}")
        return success

    def test_get_product_by_id(self):
        """Test getting a product by ID"""
        if not hasattr(self, 'product_id'):
            print("❌ No product ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Product by ID",
            "GET",
            f"products/{self.product_id}",
            200
        )
        return success

    def test_add_to_cart(self):
        """Test adding a product to cart"""
        if not hasattr(self, 'product_id'):
            print("❌ No product ID available for testing")
            return False
            
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart/items",
            201,
            data={
                "product_id": self.product_id,
                "quantity": 1,
                "size": "M"
            }
        )
        return success

    def test_get_cart(self):
        """Test getting cart contents"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        if success:
            print(f"Cart has {len(response.get('items', []))} items")
        return success

    def test_hero_images(self):
        """Test getting hero images"""
        success, response = self.run_test(
            "Get Hero Images",
            "GET",
            "hero-images",
            200
        )
        if success:
            print(f"Retrieved {len(response)} hero images")
        return success

    def test_search_products(self):
        """Test searching products"""
        success, response = self.run_test(
            "Search Products",
            "GET",
            "products?search=custom",
            200
        )
        if success:
            print(f"Search returned {len(response)} products")
        return success

    def test_filter_by_category(self):
        """Test filtering products by category"""
        # First get categories
        success, categories = self.run_test(
            "Get Categories for Filter Test",
            "GET",
            "categories",
            200
        )
        
        if not success or not categories:
            return False
            
        category_id = categories[0]['id'] if categories else None
        
        if not category_id:
            print("❌ No category ID available for testing")
            return False
            
        success, response = self.run_test(
            "Filter Products by Category",
            "GET",
            f"products?category_id={category_id}",
            200
        )
        if success:
            print(f"Category filter returned {len(response)} products")
        return success

def main():
    # Get the backend URL from the environment
    backend_url = "https://ae7eb85d-9591-4143-a448-5d11ae9fdf91.preview.emergentagent.com"
    
    print(f"Testing IllustraDesign eCommerce API at: {backend_url}")
    
    # Initialize the tester
    tester = IllustraDesignAPITester(backend_url)
    
    # Run the tests
    tests = [
        # Authentication tests
        tester.test_admin_login,
        tester.test_user_registration,
        tester.test_user_login,
        
        # Product and category tests
        tester.test_get_categories,
        tester.test_get_products,
        tester.test_get_product_by_id,
        tester.test_search_products,
        tester.test_filter_by_category,
        
        # Cart tests
        tester.test_add_to_cart,
        tester.test_get_cart,
        
        # Other tests
        tester.test_hero_images,
    ]
    
    # Run all tests
    for test_func in tests:
        test_func()
    
    # Print results
    print("\n" + "="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("="*50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())