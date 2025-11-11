from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    phone: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Pharmacy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    address: str
    phone: str
    rating: float = 4.5
    image: str
    is_open: bool = True
    delivery_time: str = "30-45 mins"
    minimum_order: float = 200.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Medicine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pharmacy_id: str
    name: str
    description: str
    price: float
    mrp: float
    discount_percentage: float = 0.0
    stock_quantity: int
    category: str
    image: str
    prescription_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CartItem(BaseModel):
    medicine_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pharmacy_id: str
    items: List[CartItem]
    total_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pharmacy_id: str
    items: List[CartItem]
    total_amount: float
    delivery_address: str
    phone: str
    status: str = "placed"
    payment_method: str = "cod"
    payment_status: str = "pending"  # pending, completed, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AddressCreate(BaseModel):
    label: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    phone: str
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    label: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    phone: str
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    medicine_id: str
    user_id: str
    rating: float
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Prescription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pharmacy_id: Optional[str] = None
    image_url: str
    notes: Optional[str] = ""
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LabTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    test_name: str
    description: str
    price: float
    lab_name: str
    test_type: str
    status: str = "scheduled"
    scheduled_date: datetime
    results_url: Optional[str] = None
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Consultation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    doctor_name: str
    specialization: str
    consultation_type: str
    price: float
    status: str = "scheduled"
    scheduled_date: datetime
    duration_minutes: int = 30
    symptoms: Optional[str] = ""
    diagnosis: Optional[str] = ""
    prescription_url: Optional[str] = None
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
