from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AWS S3 configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    region_name=os.environ['AWS_REGION']
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']

# Create the main app
app = FastAPI(title="IllustraDesign Studio API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return user

def upload_to_s3(file_content: bytes, filename: str, folder: str = "products") -> str:
    try:
        unique_filename = f"{folder}/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}_{filename}"
        s3_client.put_object(
            Bucket=os.environ['AWS_BUCKET_NAME'],
            Key=unique_filename,
            Body=file_content,
            ContentType='image/jpeg'
        )
        print(f"[S3 UPLOAD SUCCESS] {unique_filename}")
        return f"https://{os.environ['AWS_BUCKET_NAME']}.s3.{os.environ['AWS_REGION']}.amazonaws.com/{unique_filename}"
    except ClientError as e:
        print(f"[S3 UPLOAD ERROR] {e}")
        # Fallback to local storage if S3 fails
        try:
            import base64
            encoded_image = base64.b64encode(file_content).decode('utf-8')
            print("[FALLBACK] Returning base64 image string due to S3 error.")
            return f"data:image/jpeg;base64,{encoded_image}"
        except Exception as fallback_error:
            print(f"[FALLBACK ERROR] {fallback_error}")
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)} and fallback failed: {str(fallback_error)}")
    except Exception as e:
        print(f"[S3 UPLOAD GENERAL ERROR] {e}")
        # Fallback to local storage for any other errors
        try:
            import base64
            encoded_image = base64.b64encode(file_content).decode('utf-8')
            print("[FALLBACK] Returning base64 image string due to general error.")
            return f"data:image/jpeg;base64,{encoded_image}"
        except Exception as fallback_error:
            print(f"[FALLBACK ERROR] {fallback_error}")
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)} and fallback failed: {str(fallback_error)}")

# Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = "customer"  # customer or admin
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Size(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    subcategory_id: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category_id: str
    subcategory_id: Optional[str] = None
    price: float
    sizes: List[str] = []
    images: List[str] = []
    is_customizable: bool = False
    quantity: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    title: str
    description: str
    category_id: str
    subcategory_id: Optional[str] = None
    price: float
    sizes: List[str] = []
    images: List[str] = []  # <-- Add this line to accept images
    is_customizable: bool = False
    quantity: int = 0

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int
    size: Optional[str] = None
    custom_image_url: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    status: str = "preparing"  # preparing, dispatched, completed
    billing_address: str
    phone: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    billing_address: str
    phone: str

class HeroImage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_url: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    link_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Authentication endpoints
@api_router.post("/auth/register", status_code=201)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user.password)
    
    # Create user
    user_dict = user.dict()
    del user_dict['password']
    user_obj = User(**user_dict)
    
    # Store in database
    await db.users.insert_one({**user_obj.dict(), "hashed_password": hashed_password})
    
    # Create access token
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**{k: v for k, v in user.items() if k != "hashed_password"})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

# Backward compatibility
@api_router.post("/register", status_code=201)
async def register_legacy(user: UserCreate):
    return await register(user)

@api_router.post("/login")
async def login_legacy(user_data: UserLogin):
    return await login(user_data)

@api_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**{k: v for k, v in current_user.items() if k != "hashed_password"})

# Category endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**category) for category in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category: Category, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.categories.insert_one(category.dict())
    return category

# Subcategory endpoints
@api_router.get("/subcategories", response_model=List[SubCategory])
async def get_subcategories(category_id: Optional[str] = None):
    query = {"category_id": category_id} if category_id else {}
    subcategories = await db.subcategories.find(query).to_list(1000)
    return [SubCategory(**subcategory) for subcategory in subcategories]

@api_router.post("/subcategories", response_model=SubCategory)
async def create_subcategory(subcategory: SubCategory, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.subcategories.insert_one(subcategory.dict())
    return subcategory

# Size endpoints
@api_router.get("/sizes", response_model=List[Size])
async def get_sizes(category_id: Optional[str] = None):
    query = {"category_id": category_id} if category_id else {}
    sizes = await db.sizes.find(query).to_list(1000)
    return [Size(**size) for size in sizes]

@api_router.post("/sizes", response_model=Size)
async def create_size(size: Size, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.sizes.insert_one(size.dict())
    return size

# Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None, subcategory_id: Optional[str] = None, 
                      search: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if subcategory_id:
        query["subcategory_id"] = subcategory_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product_obj = Product(**product.dict())
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = Product(**{**existing_product, **product.dict()})
    await db.products.replace_one({"id": product_id}, updated_product.dict())
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Retrieve product to get image URLs
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete images from S3 if they are S3 URLs
    for image_url in product.get("images", []):
        try:
            bucket = os.environ['AWS_BUCKET_NAME']
            region = os.environ['AWS_REGION']
            s3_prefix = f"https://{bucket}.s3.{region}.amazonaws.com/"
            if image_url.startswith(s3_prefix):
                key = image_url[len(s3_prefix):]
                s3_client.delete_object(Bucket=bucket, Key=key)
                print(f"[S3 DELETE SUCCESS] {key}")
        except Exception as e:
            print(f"[S3 DELETE ERROR] {e}")
    
    # Delete product from DB
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Image upload endpoints
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), folder: str = Form("products"), 
                      current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    
    # Process image to maintain quality
    try:
        image = Image.open(io.BytesIO(content))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save with high quality
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=95, optimize=True)
        content = output.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")
    
    image_url = upload_to_s3(content, file.filename, folder)
    return {"image_url": image_url}

@api_router.post("/products/{product_id}/add-image")
async def add_product_image(product_id: str, file: UploadFile = File(...), 
                           current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    image_url = upload_to_s3(content, file.filename, "products")
    
    # Add image to product
    product["images"].append(image_url)
    await db.products.replace_one({"id": product_id}, product)
    
    return {"image_url": image_url, "message": "Image added to product"}

# Cart endpoints
@api_router.get("/cart", response_model=List[CartItem])
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart_items = await db.cart_items.find({"user_id": current_user["id"]}).to_list(1000)
    return [CartItem(**item) for item in cart_items]

@api_router.post("/cart", response_model=CartItem, status_code=201)
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    item.user_id = current_user["id"]
    
    # Check if item already exists
    existing_item = await db.cart_items.find_one({
        "user_id": current_user["id"],
        "product_id": item.product_id,
        "size": item.size
    })
    
    if existing_item:
        # Update quantity
        existing_item["quantity"] += item.quantity
        await db.cart_items.replace_one({"id": existing_item["id"]}, existing_item)
        return CartItem(**existing_item)
    else:
        await db.cart_items.insert_one(item.dict())
        return item

@api_router.post("/cart/items", response_model=CartItem, status_code=201)
async def add_to_cart_items(
    product_id: str = Form(...),
    quantity: int = Form(1),
    size: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    # Create cart item
    item = CartItem(
        user_id=current_user["id"],
        product_id=product_id,
        quantity=quantity,
        size=size
    )
    
    # Check if item already exists
    existing_item = await db.cart_items.find_one({
        "user_id": current_user["id"],
        "product_id": product_id,
        "size": size
    })
    
    if existing_item:
        # Update quantity
        existing_item["quantity"] += quantity
        await db.cart_items.replace_one({"id": existing_item["id"]}, existing_item)
        return CartItem(**existing_item)
    else:
        await db.cart_items.insert_one(item.dict())
        return item

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cart_items.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{item_id}", response_model=CartItem)
async def update_cart_item(
    item_id: str, 
    quantity: int, 
    current_user: dict = Depends(get_current_user)
):
    if quantity <= 0:
        # Remove item if quantity is 0 or negative
        await remove_from_cart(item_id, current_user)
        return {"message": "Item removed from cart"}
    
    result = await db.cart_items.update_one(
        {"id": item_id, "user_id": current_user["id"]}, 
        {"$set": {"quantity": quantity}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    updated_item = await db.cart_items.find_one({"id": item_id})
    return CartItem(**updated_item)

# Order endpoints
@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        orders = await db.orders.find().to_list(1000)
    else:
        orders = await db.orders.find({"user_id": current_user["id"]}).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Get cart items
    cart_items = await db.cart_items.find({"user_id": current_user["id"]}).to_list(1000)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and prepare order items
    total_amount = 0
    order_items = []
    
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if product:
            item_total = product["price"] * cart_item["quantity"]
            total_amount += item_total
            order_items.append({
                "product_id": product["id"],
                "product_title": product["title"],
                "quantity": cart_item["quantity"],
                "price": product["price"],
                "size": cart_item.get("size"),
                "custom_image_url": cart_item.get("custom_image_url"),
                "total": item_total
            })
    
    # Create order
    order = Order(
        user_id=current_user["id"],
        items=order_items,
        total_amount=total_amount,
        billing_address=order_data.billing_address,
        phone=order_data.phone
    )
    
    await db.orders.insert_one(order.dict())
    
    # Clear cart
    await db.cart_items.delete_many({"user_id": current_user["id"]})
    
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if status not in ["preparing", "dispatched", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# Hero image endpoints
@api_router.get("/hero-images", response_model=List[HeroImage])
async def get_hero_images():
    images = await db.hero_images.find({"is_active": True}).to_list(10)
    return [HeroImage(**image) for image in images]

@api_router.post("/hero-images", response_model=HeroImage)
async def create_hero_image(hero_image: HeroImage, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.hero_images.insert_one(hero_image.dict())
    return hero_image

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    total_products = await db.products.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find().to_list(1000)
    total_revenue = sum(order["total_amount"] for order in orders)
    
    return {
        "total_orders": total_orders,
        "total_users": total_users,
        "total_products": total_products,
        "total_revenue": total_revenue
    }

# Initialize demo data
@api_router.post("/initialize-demo-data")
async def initialize_demo_data():
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@illustradesign.com"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@illustradesign.com",
            "name": "Admin User",
            "role": "admin",
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("DesignStudio@22")
        }
        await db.users.insert_one(admin_user)
    
    # Create categories
    categories_data = [
        {"name": "Clothing", "description": "Custom printed clothing items"},
        {"name": "Mugs", "description": "Personalized mugs and drinkware"},
        {"name": "Business Cards", "description": "Professional business cards"},
        {"name": "Posters", "description": "Custom posters and prints"},
        {"name": "Accessories", "description": "Custom accessories and more"}
    ]
    
    for cat_data in categories_data:
        existing = await db.categories.find_one({"name": cat_data["name"]})
        if not existing:
            category = Category(**cat_data)
            await db.categories.insert_one(category.dict())
    
    # Create subcategories
    clothing_cat = await db.categories.find_one({"name": "Clothing"})
    if clothing_cat:
        subcategories_data = [
            {"name": "T-Shirts", "category_id": clothing_cat["id"]},
            {"name": "Hoodies", "category_id": clothing_cat["id"]},
            {"name": "Kids Wear", "category_id": clothing_cat["id"]}
        ]
        
        for subcat_data in subcategories_data:
            existing = await db.subcategories.find_one({"name": subcat_data["name"], "category_id": subcat_data["category_id"]})
            if not existing:
                subcategory = SubCategory(**subcat_data)
                await db.subcategories.insert_one(subcategory.dict())
    
    # Create sizes
    if clothing_cat:
        sizes_data = [
            {"name": "S", "category_id": clothing_cat["id"]},
            {"name": "M", "category_id": clothing_cat["id"]},
            {"name": "L", "category_id": clothing_cat["id"]},
            {"name": "XL", "category_id": clothing_cat["id"]},
            {"name": "XXL", "category_id": clothing_cat["id"]}
        ]
        
        for size_data in sizes_data:
            existing = await db.sizes.find_one({"name": size_data["name"], "category_id": size_data["category_id"]})
            if not existing:
                size = Size(**size_data)
                await db.sizes.insert_one(size.dict())
    
    # Create sample products
    tshirt_subcat = await db.subcategories.find_one({"name": "T-Shirts"})
    if tshirt_subcat and clothing_cat:
        products_data = [
            {
                "title": "Custom Cotton T-Shirt",
                "description": "High-quality cotton t-shirt perfect for custom printing. Comfortable fit and durable material.",
                "category_id": clothing_cat["id"],
                "subcategory_id": tshirt_subcat["id"],
                "price": 599.0,
                "sizes": ["S", "M", "L", "XL"],
                "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"],
                "is_customizable": True,
                "quantity": 100
            },
            {
                "title": "Premium Design T-Shirt",
                "description": "Premium quality t-shirt with pre-designed graphics. Perfect for casual wear.",
                "category_id": clothing_cat["id"],
                "subcategory_id": tshirt_subcat["id"],
                "price": 799.0,
                "sizes": ["S", "M", "L", "XL"],
                "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"],
                "is_customizable": False,
                "quantity": 50
            }
        ]
        
        for prod_data in products_data:
            existing = await db.products.find_one({"title": prod_data["title"]})
            if not existing:
                product = Product(**prod_data)
                await db.products.insert_one(product.dict())
    
    # Create hero images
    hero_images_data = [
        {
            "image_url": "https://images.unsplash.com/photo-1503694978374-8a2fa686963a",
            "title": "Custom Printing Excellence",
            "subtitle": "Design Your Dreams Into Reality",
            "link_url": "/products"
        },
        {
            "image_url": "https://images.pexels.com/photos/9324380/pexels-photo-9324380.jpeg",
            "title": "Personalized Products",
            "subtitle": "Made Just For You",
            "link_url": "/products"
        }
    ]
    
    for hero_data in hero_images_data:
        existing = await db.hero_images.find_one({"image_url": hero_data["image_url"]})
        if not existing:
            hero_image = HeroImage(**hero_data)
            await db.hero_images.insert_one(hero_image.dict())
    
    return {"message": "Demo data initialized successfully"}

# Razorpay order creation endpoint
@api_router.post("/create-razorpay-order")
async def create_razorpay_order(data: dict, current_user: dict = Depends(get_current_user)):
    import razorpay
    amount = data.get("amount")
    if not amount:
        raise HTTPException(status_code=400, detail="Amount is required")
    try:
        client = razorpay.Client(auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]))
        order = client.order.create({
            "amount": int(amount),
            "currency": "INR",
            "payment_capture": 1
        })
        return {
            "order_id": order["id"],
            "razorpay_key": os.environ["RAZORPAY_KEY_ID"]
        }
    except Exception as e:
        print("[RAZORPAY ERROR]", e)
        raise HTTPException(status_code=500, detail="Failed to create Razorpay order")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
