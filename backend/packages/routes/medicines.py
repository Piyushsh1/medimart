from fastapi import APIRouter, HTTPException
from typing import List
from ..context.db import db
from ..context.models import Medicine

router = APIRouter(tags=["medicines"])

@router.get("/pharmacies/{pharmacy_id}/medicines", response_model=List[Medicine])
async def get_pharmacy_medicines(pharmacy_id: str):
    medicines = await db.medicines.find({"pharmacy_id": pharmacy_id}).to_list(1000)
    return [Medicine(**medicine) for medicine in medicines]

@router.get("/medicines/{medicine_id}", response_model=Medicine)
async def get_medicine(medicine_id: str):
    medicine = await db.medicines.find_one({"id": medicine_id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return Medicine(**medicine)

@router.get("/medicines/{medicine_id}/alternatives", response_model=List[Medicine])
async def get_alternative_medicines(medicine_id: str):
    medicine = await db.medicines.find_one({"id": medicine_id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    alternatives = await db.medicines.find({
        "category": medicine["category"],
        "id": {"$ne": medicine_id},
    }).limit(10).to_list(10)
    return [Medicine(**m) for m in alternatives]
