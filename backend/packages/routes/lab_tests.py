from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from ..context.db import db
from ..context.models import LabTest
from ..context.security import get_current_user

router = APIRouter(tags=["lab-tests"])

@router.get("/lab-tests", response_model=List[LabTest])
async def get_lab_tests(current_user: dict = Depends(get_current_user)):
    lab_tests = await db.lab_tests.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(1000)
    return [LabTest(**test) for test in lab_tests]

@router.get("/lab-tests/{test_id}", response_model=LabTest)
async def get_lab_test(test_id: str, current_user: dict = Depends(get_current_user)):
    lab_test = await db.lab_tests.find_one({"id": test_id, "user_id": current_user["id"]})
    if not lab_test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    return LabTest(**lab_test)

@router.post("/lab-tests", response_model=LabTest)
async def create_lab_test(
    test_name: str,
    description: str,
    price: float,
    lab_name: str,
    test_type: str,
    scheduled_date: str,
    notes: Optional[str] = "",
    current_user: dict = Depends(get_current_user),
):
    lab_test = LabTest(
        user_id=current_user["id"],
        test_name=test_name,
        description=description,
        price=price,
        lab_name=lab_name,
        test_type=test_type,
        scheduled_date=datetime.fromisoformat(scheduled_date),
        notes=notes,
    )
    await db.lab_tests.insert_one(lab_test.dict())
    return lab_test

@router.put("/lab-tests/{test_id}/status")
async def update_lab_test_status(
    test_id: str,
    status: str,
    results_url: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    valid_statuses = ["scheduled", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    lab_test = await db.lab_tests.find_one({"id": test_id, "user_id": current_user["id"]})
    if not lab_test:
        raise HTTPException(status_code=404, detail="Lab test not found")

    update_data = {"status": status, "updated_at": datetime.utcnow()}
    if results_url:
        update_data["results_url"] = results_url

    await db.lab_tests.update_one({"id": test_id}, {"$set": update_data})
    return {"message": "Lab test status updated successfully"}

@router.delete("/lab-tests/{test_id}")
async def delete_lab_test(test_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.lab_tests.delete_one({"id": test_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lab test not found")
    return {"message": "Lab test deleted successfully"}
