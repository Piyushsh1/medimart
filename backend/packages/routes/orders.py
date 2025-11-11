from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from ..context.db import db
from ..context.models import Order, CreateOrderRequest
from ..context.security import get_current_user
from ..context.socket import sio

router = APIRouter(tags=["orders"])

@router.post("/orders", response_model=Order)
async def create_order(
    delivery_address: str, 
    phone: str, 
    payment_method: str = "cod",
    current_user: dict = Depends(get_current_user)
):
    """Create an order from cart"""
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart is empty")

    pharmacy = await db.pharmacies.find_one({"id": cart["pharmacy_id"]})
    if cart["total_amount"] < pharmacy["minimum_order"]:
        raise HTTPException(status_code=400, detail=f"Minimum order amount is ₹{pharmacy['minimum_order']}")

    # Determine payment status based on payment method
    payment_status = "completed" if payment_method == "cod" else "pending"

    new_order = Order(
        user_id=current_user["id"],
        pharmacy_id=cart["pharmacy_id"],
        items=cart["items"],
        total_amount=cart["total_amount"],
        delivery_address=delivery_address,
        phone=phone,
        payment_method=payment_method,
        payment_status=payment_status,
    )

    await db.orders.insert_one(new_order.dict())

    # Only clear cart and reduce stock for COD orders
    # For online payment, this will be done after payment verification
    if payment_method == "cod":
        await db.carts.delete_one({"user_id": current_user["id"]})
        
        for item in cart["items"]:
            await db.medicines.update_one(
                {"id": item["medicine_id"]},
                {"$inc": {"stock_quantity": -item["quantity"]}},
            )

    await sio.emit('order_created', {
        'order_id': new_order.id,
        'status': 'placed',
        'user_id': current_user["id"],
    })

    return new_order

@router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    valid_statuses = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )

    await sio.emit('order_status_updated', {
        'order_id': order_id,
        'status': status,
        'user_id': order["user_id"],
    })

    return {"message": "Order status updated successfully"}
