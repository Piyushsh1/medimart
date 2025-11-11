from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..context.db import db
from ..context.models import Cart, CartItem
from ..context.security import get_current_user

router = APIRouter(tags=["cart"])

@router.get("/cart", response_model=Optional[Cart])
async def get_cart(current_user: dict = Depends(get_current_user)):
    """
    Return the user's cart. If any cart items reference medicines that no longer exist
    (e.g., after re-initializing seed data), those items are pruned and the cart total
    is recalculated. If no items remain, the cart is deleted and None is returned.
    """
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        return None

    items = cart.get("items", [])
    if not items:
        await db.carts.delete_one({"user_id": current_user["id"]})
        return None

    # Filter out items whose medicine no longer exists
    valid_items = []
    for item in items:
        med = await db.medicines.find_one({"id": item.get("medicine_id")})
        if med:
            valid_items.append(item)

    # If items were pruned, update cart; if empty, delete cart
    if len(valid_items) != len(items):
        if not valid_items:
            await db.carts.delete_one({"user_id": current_user["id"]})
            return None
        total_amount = sum(i["price"] * i["quantity"] for i in valid_items)
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"items": valid_items, "total_amount": total_amount}},
        )
        cart["items"] = valid_items
        cart["total_amount"] = total_amount

    return Cart(**cart)

@router.post("/cart/add")
async def add_to_cart(medicine_id: str, quantity: int, current_user: dict = Depends(get_current_user)):
    medicine = await db.medicines.find_one({"id": medicine_id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    if medicine["stock_quantity"] < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart = await db.carts.find_one({"user_id": current_user["id"]})

    cart_item = CartItem(medicine_id=medicine_id, quantity=quantity, price=medicine["price"])

    if not cart:
        new_cart = Cart(
            user_id=current_user["id"],
            pharmacy_id=medicine["pharmacy_id"],
            items=[cart_item],
            total_amount=cart_item.price * quantity,
        )
        await db.carts.insert_one(new_cart.dict())
    else:
        items = cart.get("items", [])
        if not items or len(items) == 0:
            cart_dict = {
                "pharmacy_id": medicine["pharmacy_id"],
                "items": [cart_item.dict()],
                "total_amount": cart_item.price * quantity,
            }
            await db.carts.update_one({"user_id": current_user["id"]}, {"$set": cart_dict})
        else:
            if cart["pharmacy_id"] != medicine["pharmacy_id"]:
                raise HTTPException(status_code=400, detail="Can only order from one pharmacy at a time")

            item_found = False
            for item in items:
                if item["medicine_id"] == medicine_id:
                    item["quantity"] += quantity
                    item_found = True
                    break

            if not item_found:
                items.append(cart_item.dict())

            total_amount = sum(item["price"] * item["quantity"] for item in items)

            await db.carts.update_one(
                {"user_id": current_user["id"]},
                {"$set": {"items": items, "total_amount": total_amount}},
            )

    return {"message": "Item added to cart successfully"}

@router.delete("/cart/remove/{medicine_id}")
async def remove_from_cart(medicine_id: str, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = [item for item in cart["items"] if item["medicine_id"] != medicine_id]
    total_amount = sum(item["price"] * item["quantity"] for item in items)

    if not items:
        await db.carts.delete_one({"user_id": current_user["id"]})
    else:
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"items": items, "total_amount": total_amount}},
        )

    return {"message": "Item removed from cart successfully"}

@router.put("/cart/update")
async def update_cart_item(medicine_id: str, quantity: int, current_user: dict = Depends(get_current_user)):
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    medicine = await db.medicines.find_one({"id": medicine_id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    if medicine["stock_quantity"] < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    if quantity == 0:
        items = [item for item in cart["items"] if item["medicine_id"] != medicine_id]
    else:
        items = cart["items"]
        item_found = False
        for item in items:
            if item["medicine_id"] == medicine_id:
                item["quantity"] = quantity
                item_found = True
                break
        if not item_found:
            raise HTTPException(status_code=404, detail="Item not found in cart")

    total_amount = sum(item["price"] * item["quantity"] for item in items)

    if not items:
        await db.carts.delete_one({"user_id": current_user["id"]})
        return {"message": "Cart is now empty"}
    else:
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"items": items, "total_amount": total_amount}},
        )

    return {"message": "Cart updated successfully", "total_amount": total_amount}

@router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": current_user["id"]})
    return {"message": "Cart cleared successfully"}
