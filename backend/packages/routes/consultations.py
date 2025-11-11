from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from ..context.db import db
from ..context.models import Consultation
from ..context.security import get_current_user

router = APIRouter(tags=["consultations"])

@router.get("/consultations", response_model=List[Consultation])
async def get_consultations(current_user: dict = Depends(get_current_user)):
    consultations = await db.consultations.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    return [Consultation(**consultation) for consultation in consultations]

@router.get("/consultations/{consultation_id}", response_model=Consultation)
async def get_consultation(consultation_id: str, current_user: dict = Depends(get_current_user)):
    consultation = await db.consultations.find_one({"id": consultation_id, "user_id": current_user["id"]})
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return Consultation(**consultation)

@router.post("/consultations", response_model=Consultation)
async def create_consultation(
    doctor_name: str,
    specialization: str,
    consultation_type: str,
    price: float,
    scheduled_date: str,
    duration_minutes: int = 30,
    symptoms: Optional[str] = "",
    notes: Optional[str] = "",
    current_user: dict = Depends(get_current_user),
):
    consultation = Consultation(
        user_id=current_user["id"],
        doctor_name=doctor_name,
        specialization=specialization,
        consultation_type=consultation_type,
        price=price,
        scheduled_date=datetime.fromisoformat(scheduled_date),
        duration_minutes=duration_minutes,
        symptoms=symptoms,
        notes=notes,
    )
    await db.consultations.insert_one(consultation.dict())
    return consultation

@router.put("/consultations/{consultation_id}/status")
async def update_consultation_status(
    consultation_id: str,
    status: str,
    diagnosis: Optional[str] = None,
    prescription_url: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    valid_statuses = ["scheduled", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    consultation = await db.consultations.find_one({"id": consultation_id, "user_id": current_user["id"]})
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    update_data = {"status": status, "updated_at": datetime.utcnow()}
    if diagnosis:
        update_data["diagnosis"] = diagnosis
    if prescription_url:
        update_data["prescription_url"] = prescription_url

    await db.consultations.update_one({"id": consultation_id}, {"$set": update_data})
    return {"message": "Consultation status updated successfully"}

@router.delete("/consultations/{consultation_id}")
async def delete_consultation(consultation_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.consultations.delete_one({"id": consultation_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return {"message": "Consultation deleted successfully"}
