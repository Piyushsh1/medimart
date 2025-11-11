from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..context.db import db
from ..context.models import Review
from ..context.security import get_current_user

router = APIRouter(tags=["reviews"])

@router.post("/medicines/{medicine_id}/reviews", response_model=Review)
async def add_review(medicine_id: str, rating: float, comment: str, current_user: dict = Depends(get_current_user)):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    medicine = await db.medicines.find_one({"id": medicine_id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    existing_review = await db.reviews.find_one({"medicine_id": medicine_id, "user_id": current_user["id"]})
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this medicine")

    review = Review(medicine_id=medicine_id, user_id=current_user["id"], rating=rating, comment=comment)
    await db.reviews.insert_one(review.dict())
    return review

@router.get("/medicines/{medicine_id}/reviews", response_model=List[dict])
async def get_medicine_reviews(medicine_id: str):
    reviews = await db.reviews.find({"medicine_id": medicine_id}).sort("created_at", -1).to_list(1000)
    enriched_reviews = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        enriched_reviews.append({**review, "user_name": user["full_name"] if user else "Unknown User"})
    return enriched_reviews
