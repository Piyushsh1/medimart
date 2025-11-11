from fastapi import APIRouter, HTTPException, Depends
from typing import List
import razorpay
import hmac
import hashlib
import os
from ..context.db import db
from ..context.models import Transaction, PaymentMethod, VerifyPaymentRequest
from ..context.security import get_current_user

router = APIRouter(tags=["payments"])

# Initialize Razorpay client with test keys
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_123456789")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "test_secret_key_123456789")

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    print(f"Warning: Razorpay client initialization failed: {e}")
    razorpay_client = None

@router.post("/payments/create-razorpay-order")
async def create_razorpay_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Create a Razorpay order for payment"""
    try:
        # Get order details
        order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if not razorpay_client:
            raise HTTPException(status_code=500, detail="Payment service not configured")
        
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(order["total_amount"] * 100),  # Amount in paise
            "currency": "INR",
            "receipt": order_id,
            "notes": {
                "order_id": order_id,
                "user_id": current_user["id"]
            }
        })
        
        # Update order with Razorpay order ID
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"razorpay_order_id": razorpay_order["id"]}}
        )
        
        # Create transaction record
        transaction = Transaction(
            user_id=current_user["id"],
            order_id=order_id,
            amount=order["total_amount"],
            payment_method="razorpay",
            status="initiated",
            razorpay_order_id=razorpay_order["id"]
        )
        await db.transactions.insert_one(transaction.dict())
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments/verify")
async def verify_payment(data: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    """Verify Razorpay payment signature"""
    try:
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != data.razorpay_signature:
            # Payment verification failed
            await db.orders.update_one(
                {"id": data.order_id},
                {"$set": {"payment_status": "failed"}}
            )
            await db.transactions.update_one(
                {"razorpay_order_id": data.razorpay_order_id},
                {"$set": {"status": "failed", "error_message": "Signature verification failed"}}
            )
            raise HTTPException(status_code=400, detail="Payment verification failed")
        
        # Payment verified successfully
        await db.orders.update_one(
            {"id": data.order_id},
            {"$set": {
                "payment_status": "completed",
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature
            }}
        )
        
        await db.transactions.update_one(
            {"razorpay_order_id": data.razorpay_order_id},
            {"$set": {
                "status": "success",
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature
            }}
        )
        
        return {"message": "Payment verified successfully", "status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments/methods", response_model=List[PaymentMethod])
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Get user's saved payment methods"""
    methods = await db.payment_methods.find({"user_id": current_user["id"]}).to_list(100)
    return [PaymentMethod(**method) for method in methods]

@router.post("/payments/methods", response_model=PaymentMethod)
async def save_payment_method(
    method_type: str,
    card_last4: str = None,
    card_network: str = None,
    upi_id: str = None,
    is_default: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Save a payment method for future use"""
    try:
        # If setting as default, unset other defaults
        if is_default:
            await db.payment_methods.update_many(
                {"user_id": current_user["id"]},
                {"$set": {"is_default": False}}
            )
        
        method = PaymentMethod(
            user_id=current_user["id"],
            method_type=method_type,
            card_last4=card_last4,
            card_network=card_network,
            upi_id=upi_id,
            is_default=is_default
        )
        
        await db.payment_methods.insert_one(method.dict())
        return method
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/payments/methods/{method_id}")
async def delete_payment_method(method_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a saved payment method"""
    result = await db.payment_methods.delete_one({"id": method_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Payment method deleted successfully"}

@router.get("/payments/transaction/{order_id}")
async def get_transaction(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get transaction details for an order"""
    transaction = await db.transactions.find_one({"order_id": order_id, "user_id": current_user["id"]})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**transaction)
