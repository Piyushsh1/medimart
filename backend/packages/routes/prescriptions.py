from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..context.db import db
from ..context.models import Prescription
from ..context.security import get_current_user

router = APIRouter(tags=["prescriptions"])

@router.post("/prescriptions", response_model=Prescription)
async def upload_prescription(
    image_url: str,
    pharmacy_id: Optional[str] = None,
    notes: Optional[str] = "",
    current_user: dict = Depends(get_current_user),
):
    prescription = Prescription(
        user_id=current_user["id"],
        pharmacy_id=pharmacy_id,
        image_url=image_url,
        notes=notes,
    )
    await db.prescriptions.insert_one(prescription.dict())
    return prescription

@router.get("/prescriptions", response_model=List[Prescription])
async def get_prescriptions(current_user: dict = Depends(get_current_user)):
    prescriptions = (
        await db.prescriptions.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    )
    return [Prescription(**p) for p in prescriptions]

@router.get("/prescriptions/{prescription_id}", response_model=Prescription)
async def get_prescription(prescription_id: str, current_user: dict = Depends(get_current_user)):
    prescription = await db.prescriptions.find_one({"id": prescription_id, "user_id": current_user["id"]})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return Prescription(**prescription)
