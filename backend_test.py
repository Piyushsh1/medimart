#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Zomato for Pharmacies
Tests all backend endpoints including authentication, pharmacy management, 
medicine catalog, cart operations, and order management.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class PharmacyBackendTester:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://medishop-11.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_data = {
            "username": "testuser_pharmacy",
            "email": "testuser@pharmacy.com", 
            "full_name": "Test User Pharmacy",
            "phone": "+91 9876543210",
            "password": "testpassword123"
        }
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            request_headers.update(headers)
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=request_headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            response = self.make_request("POST", "/register", self.test_user_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("User Registration", True, "User registered successfully with JWT token")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing access_token or user in response", data)
                    return False
            elif response.status_code == 400:
                # User might already exist, try login instead
                self.log_test("User Registration", True, "User already exists (expected)", response.json())
                return self.test_user_login()
            else:
                self.log_test("User Registration", False, f"Unexpected status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "username": self.test_user_data["username"],
                "password": self.test_user_data["password"]
            }
            response = self.make_request("POST", "/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("User Login", True, "User logged in successfully with JWT token")
                    return True
                else:
                    self.log_test("User Login", False, "Missing access_token or user in response", data)
                    return False
            else:
                self.log_test("User Login", False, f"Login failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_sample_data_initialization(self):
        """Test sample data initialization"""
        try:
            response = self.make_request("POST", "/init-data")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Sample Data Initialization", True, "Sample data initialized successfully", data)
                return True
            else:
                self.log_test("Sample Data Initialization", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Sample Data Initialization", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_pharmacy_listing(self):
        """Test pharmacy listing endpoint"""
        try:
            response = self.make_request("GET", "/pharmacies")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.pharmacy_id = data[0]["id"]  # Store for later tests
                    self.log_test("Pharmacy Listing", True, f"Retrieved {len(data)} pharmacies")
                    return True
                else:
                    self.log_test("Pharmacy Listing", False, "No pharmacies found or invalid response format", data)
                    return False
            else:
                self.log_test("Pharmacy Listing", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Pharmacy Listing", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_individual_pharmacy(self):
        """Test individual pharmacy retrieval"""
        if not hasattr(self, 'pharmacy_id'):
            self.log_test("Individual Pharmacy", False, "No pharmacy ID available from previous test")
            return False
            
        try:
            response = self.make_request("GET", f"/pharmacies/{self.pharmacy_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "name" in data:
                    self.log_test("Individual Pharmacy", True, f"Retrieved pharmacy: {data['name']}")
                    return True
                else:
                    self.log_test("Individual Pharmacy", False, "Invalid pharmacy data structure", data)
                    return False
            else:
                self.log_test("Individual Pharmacy", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Individual Pharmacy", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_pharmacy_medicines(self):
        """Test pharmacy medicines listing"""
        if not hasattr(self, 'pharmacy_id'):
            self.log_test("Pharmacy Medicines", False, "No pharmacy ID available from previous test")
            return False
            
        try:
            response = self.make_request("GET", f"/pharmacies/{self.pharmacy_id}/medicines")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.medicine_id = data[0]["id"]  # Store for later tests
                    self.medicine_price = data[0]["price"]
                    self.log_test("Pharmacy Medicines", True, f"Retrieved {len(data)} medicines for pharmacy")
                    return True
                else:
                    self.log_test("Pharmacy Medicines", False, "No medicines found or invalid response format", data)
                    return False
            else:
                self.log_test("Pharmacy Medicines", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Pharmacy Medicines", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_individual_medicine(self):
        """Test individual medicine retrieval"""
        if not hasattr(self, 'medicine_id'):
            self.log_test("Individual Medicine", False, "No medicine ID available from previous test")
            return False
            
        try:
            response = self.make_request("GET", f"/medicines/{self.medicine_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "name" in data:
                    self.log_test("Individual Medicine", True, f"Retrieved medicine: {data['name']}")
                    return True
                else:
                    self.log_test("Individual Medicine", False, "Invalid medicine data structure", data)
                    return False
            else:
                self.log_test("Individual Medicine", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Individual Medicine", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_add_to_cart(self):
        """Test adding items to cart"""
        if not hasattr(self, 'medicine_id'):
            self.log_test("Add to Cart", False, "No medicine ID available from previous test")
            return False
            
        try:
            # Clear cart first to avoid pharmacy conflicts
            self.make_request("DELETE", "/cart/clear")
            
            # Add item to cart using query parameters
            response = self.make_request("POST", f"/cart/add?medicine_id={self.medicine_id}&quantity=2")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Add to Cart", True, "Item added to cart successfully", data)
                return True
            else:
                self.log_test("Add to Cart", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Add to Cart", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_get_cart(self):
        """Test retrieving cart contents"""
        try:
            response = self.make_request("GET", "/cart")
            
            if response.status_code == 200:
                data = response.json()
                if data and "items" in data:
                    self.log_test("Get Cart", True, f"Retrieved cart with {len(data['items'])} items")
                    return True
                elif data is None:
                    self.log_test("Get Cart", True, "Cart is empty (valid response)")
                    return True
                else:
                    self.log_test("Get Cart", False, "Invalid cart data structure", data)
                    return False
            else:
                self.log_test("Get Cart", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Cart", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_remove_from_cart(self):
        """Test removing items from cart"""
        if not hasattr(self, 'medicine_id'):
            self.log_test("Remove from Cart", False, "No medicine ID available from previous test")
            return False
            
        try:
            response = self.make_request("DELETE", f"/cart/remove/{self.medicine_id}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Remove from Cart", True, "Item removed from cart successfully", data)
                return True
            else:
                self.log_test("Remove from Cart", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Remove from Cart", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_clear_cart(self):
        """Test clearing entire cart"""
        try:
            response = self.make_request("DELETE", "/cart/clear")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Clear Cart", True, "Cart cleared successfully", data)
                return True
            else:
                self.log_test("Clear Cart", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Clear Cart", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_create_order(self):
        """Test order creation with minimum order validation"""
        if not hasattr(self, 'medicine_id'):
            self.log_test("Create Order", False, "No medicine ID available from previous test")
            return False
            
        try:
            # First add items to cart for order
            self.make_request("POST", f"/cart/add?medicine_id={self.medicine_id}&quantity=5")
            
            # Create order using query parameters
            import urllib.parse
            delivery_address = urllib.parse.quote("123 Test Street, Test City, Test State 123456")
            phone = urllib.parse.quote("+91 9876543210")
            
            response = self.make_request("POST", f"/orders?delivery_address={delivery_address}&phone={phone}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "status" in data:
                    self.order_id = data["id"]  # Store for later tests
                    self.log_test("Create Order", True, f"Order created successfully with ID: {data['id']}")
                    return True
                else:
                    self.log_test("Create Order", False, "Invalid order data structure", data)
                    return False
            else:
                self.log_test("Create Order", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Order", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_get_user_orders(self):
        """Test retrieving user order history"""
        try:
            response = self.make_request("GET", "/orders")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get User Orders", True, f"Retrieved {len(data)} orders")
                    return True
                else:
                    self.log_test("Get User Orders", False, "Invalid orders data structure", data)
                    return False
            else:
                self.log_test("Get User Orders", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get User Orders", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_get_specific_order(self):
        """Test retrieving specific order"""
        if not hasattr(self, 'order_id'):
            self.log_test("Get Specific Order", False, "No order ID available from previous test")
            return False
            
        try:
            response = self.make_request("GET", f"/orders/{self.order_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "status" in data:
                    self.log_test("Get Specific Order", True, f"Retrieved order with status: {data['status']}")
                    return True
                else:
                    self.log_test("Get Specific Order", False, "Invalid order data structure", data)
                    return False
            else:
                self.log_test("Get Specific Order", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Specific Order", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_update_order_status(self):
        """Test updating order status"""
        if not hasattr(self, 'order_id'):
            self.log_test("Update Order Status", False, "No order ID available from previous test")
            return False
            
        try:
            response = self.make_request("PUT", f"/orders/{self.order_id}/status?status=confirmed")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Update Order Status", True, "Order status updated successfully", data)
                return True
            else:
                self.log_test("Update Order Status", False, f"Failed with status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Update Order Status", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_authentication_protection(self):
        """Test that protected endpoints require authentication"""
        try:
            # Temporarily remove auth token
            original_token = self.auth_token
            self.auth_token = None
            
            response = self.make_request("GET", "/cart")
            
            # Restore auth token
            self.auth_token = original_token
            
            if response.status_code in [401, 403]:
                self.log_test("Authentication Protection", True, f"Protected endpoint correctly requires authentication (status: {response.status_code})")
                return True
            else:
                self.log_test("Authentication Protection", False, f"Expected 401 or 403, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication Protection", False, f"Exception occurred: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🧪 Starting Comprehensive Backend API Testing for Zomato for Pharmacies")
        print("=" * 80)
        
        # Authentication Tests
        print("\n📝 Testing Authentication System...")
        auth_success = self.test_user_registration()
        if not auth_success:
            auth_success = self.test_user_login()
        
        if not auth_success:
            print("❌ Authentication failed - cannot proceed with protected endpoint tests")
            return False
        
        # Sample Data Initialization
        print("\n🏥 Testing Sample Data Initialization...")
        self.test_sample_data_initialization()
        
        # Pharmacy Management Tests
        print("\n🏪 Testing Pharmacy Management...")
        self.test_pharmacy_listing()
        self.test_individual_pharmacy()
        
        # Medicine Catalog Tests
        print("\n💊 Testing Medicine Catalog...")
        self.test_pharmacy_medicines()
        self.test_individual_medicine()
        
        # Cart Management Tests
        print("\n🛒 Testing Cart Management...")
        self.test_add_to_cart()
        self.test_get_cart()
        self.test_remove_from_cart()
        self.test_clear_cart()
        
        # Order Management Tests
        print("\n📦 Testing Order Management...")
        self.test_create_order()
        self.test_get_user_orders()
        self.test_get_specific_order()
        self.test_update_order_status()
        
        # Security Tests
        print("\n🔒 Testing Security...")
        self.test_authentication_protection()
        
        # Print Summary
        self.print_test_summary()
        
        return True
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = PharmacyBackendTester()
    tester.run_all_tests()