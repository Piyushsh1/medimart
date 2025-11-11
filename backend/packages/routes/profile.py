from fastapi import APIRouter, Depends, HTTPException
from ..context.db import db
from ..context.security import get_current_user

router = APIRouter(tags=["profile"])

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_response = {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "phone": current_user["phone"],
        "created_at": current_user.get("created_at"),
    }
    return user_response

@router.put("/profile")
async def update_profile(full_name: str, email: str, phone: str, current_user: dict = Depends(get_current_user)):
    existing_user = await db.users.find_one({"email": email, "id": {"$ne": current_user["id"]}})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"full_name": full_name, "email": email, "phone": phone}},
    )

    return {"message": "Profile updated successfully"}
