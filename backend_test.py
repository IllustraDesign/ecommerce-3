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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, form_data=None):
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
                if form_data:
                    # For multipart/form-data
                    headers.pop('Content-Type', None)  # Let requests set the correct Content-Type
                    response = requests.post(url, data=form_data, headers=headers)
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

    def test_admin_login_legacy(self):
        """Test admin login with legacy endpoint"""
        success, response = self.run_test(
            "Admin Login (Legacy Endpoint)",
            "POST",
            "login",
            200,
            data=self.admin_credentials
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"Admin login successful with legacy endpoint, got token: {self.token[:10]}...")
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

    def test_user_registration_legacy(self):
        """Test user registration with legacy endpoint"""
        # Create a new user with different email to avoid conflicts
        legacy_user = self.test_user_credentials.copy()
        legacy_user["email"] = f"legacy_user{int(time.time())}@example.com"
        
        success, response = self.run_test(
            "User Registration (Legacy Endpoint)",
            "POST",
            "register",
            201,
            data=legacy_user
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

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "me",
            200
        )
        if success:
            print(f"Retrieved user profile for: {response.get('name', 'Unknown')}")
        return success

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
            if len(response) > 0:
                self.category_id = response[0]['id']
                print(f"Saved category ID: {self.category_id}")
        return success

    def test_get_subcategories(self):
        """Test getting subcategories"""
        if not hasattr(self, 'category_id'):
            print("❌ No category ID available for testing subcategories")
            return False
            
        success, response = self.run_test(
            "Get Subcategories",
            "GET",
            f"subcategories?category_id={self.category_id}",
            200
        )
        if success:
            print(f"Retrieved {len(response)} subcategories")
        return success

    def test_get_sizes(self):
        """Test getting sizes"""
        if not hasattr(self, 'category_id'):
            print("❌ No category ID available for testing sizes")
            return False
            
        success, response = self.run_test(
            "Get Sizes",
            "GET",
            f"sizes?category_id={self.category_id}",
            200
        )
        if success:
            print(f"Retrieved {len(response)} sizes")
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

    def test_add_to_cart_json(self):
        """Test adding a product to cart using JSON"""
        if not hasattr(self, 'product_id'):
            print("❌ No product ID available for testing")
            return False
            
        success, response = self.run_test(
            "Add to Cart (JSON)",
            "POST",
            "cart",
            201,
            data={
                "product_id": self.product_id,
                "quantity": 1,
                "size": "M"
            }
        )
        return success

    def test_add_to_cart_form(self):
        """Test adding a product to cart using form data"""
        if not hasattr(self, 'product_id'):
            print("❌ No product ID available for testing")
            return False
            
        form_data = {
            "product_id": self.product_id,
            "quantity": "1",
            "size": "M"
        }
        
        success, response = self.run_test(
            "Add to Cart (Form Data)",
            "POST",
            "cart/items",
            201,
            form_data=form_data
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
            print(f"Cart has {len(response)} items")
            if len(response) > 0:
                self.cart_item_id = response[0]['id']
                print(f"Saved cart item ID: {self.cart_item_id}")
        return success

    def test_update_cart_item(self):
        """Test updating cart item quantity"""
        if not hasattr(self, 'cart_item_id'):
            print("❌ No cart item ID available for testing")
            return False
            
        success, response = self.run_test(
            "Update Cart Item",
            "PUT",
            f"cart/{self.cart_item_id}",
            200,
            data={"quantity": 2}
        )
        return success

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        if not hasattr(self, 'cart_item_id'):
            print("❌ No cart item ID available for testing")
            return False
            
        success, response = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"cart/{self.cart_item_id}",
            200
        )
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
        if not hasattr(self, 'category_id'):
            print("❌ No category ID available for testing")
            return False
            
        success, response = self.run_test(
            "Filter Products by Category",
            "GET",
            f"products?category_id={self.category_id}",
            200
        )
        if success:
            print(f"Category filter returned {len(response)} products")
        return success

    def test_create_order(self):
        """Test creating an order"""
        # First add an item to cart
        self.test_add_to_cart_form()
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data={
                "billing_address": "123 Test Street, Test City",
                "phone": "9876543210"
            }
        )
        if success:
            print(f"Order created with ID: {response.get('id', 'Unknown')}")
            self.order_id = response.get('id')
        return success

    def test_get_orders(self):
        """Test getting orders"""
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        if success:
            print(f"Retrieved {len(response)} orders")
        return success

    def test_dashboard_stats(self):
        """Test getting dashboard stats (admin only)"""
        # Make sure we're using admin token
        self.test_admin_login()
        
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"Retrieved dashboard stats: {json.dumps(response, indent=2)}")
        return success

    def test_initialize_demo_data(self):
        """Test initializing demo data"""
        success, response = self.run_test(
            "Initialize Demo Data",
            "POST",
            "initialize-demo-data",
            200
        )
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
        tester.test_admin_login_legacy,
        tester.test_user_registration,
        tester.test_user_registration_legacy,
        tester.test_user_login,
        tester.test_get_user_profile,
        
        # Product and category tests
        tester.test_get_categories,
        tester.test_get_subcategories,
        tester.test_get_sizes,
        tester.test_get_products,
        tester.test_get_product_by_id,
        tester.test_search_products,
        tester.test_filter_by_category,
        
        # Cart tests
        tester.test_add_to_cart_json,
        tester.test_add_to_cart_form,
        tester.test_get_cart,
        tester.test_update_cart_item,
        tester.test_remove_from_cart,
        
        # Order tests
        tester.test_create_order,
        tester.test_get_orders,
        
        # Other tests
        tester.test_hero_images,
        tester.test_dashboard_stats,
        tester.test_initialize_demo_data,
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