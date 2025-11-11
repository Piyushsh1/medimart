from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..context.db import db
from ..context.models import Address, AddressCreate
from ..context.security import get_current_user

router = APIRouter(tags=["addresses"])

@router.get("/addresses", response_model=List[Address])
async def get_addresses(current_user: dict = Depends(get_current_user)):
    addresses = await db.addresses.find({"user_id": current_user["id"]}).to_list(1000)
    return [Address(**addr) for addr in addresses]

@router.post("/addresses", response_model=Address)
async def create_address(address: AddressCreate, current_user: dict = Depends(get_current_user)):
    # Create address dict and set user_id from current user
    address_dict = address.dict()
    address_dict["user_id"] = current_user["id"]
    
    # Ensure address_line2 is set (can be empty string)
    if "address_line2" not in address_dict or address_dict["address_line2"] is None:
        address_dict["address_line2"] = ""
    
    # If this is set as default, unset all other defaults
    if address_dict.get("is_default", False):
        await db.addresses.update_many({"user_id": current_user["id"]}, {"$set": {"is_default": False}})
    
    # Insert the address
    await db.addresses.insert_one(address_dict)
    
    # Return the created address
    created_address = Address(**address_dict)
    return created_address

@router.put("/addresses/{address_id}")
async def update_address(
    address_id: str,
    label: str,
    address_line1: str,
    address_line2: str,
    city: str,
    state: str,
    pincode: str,
    phone: str,
    is_default: bool,
    latitude: float = None,
    longitude: float = None,
    current_user: dict = Depends(get_current_user),
):
    existing_address = await db.addresses.find_one({"id": address_id, "user_id": current_user["id"]})
    if not existing_address:
        raise HTTPException(status_code=404, detail="Address not found")

    if is_default:
        await db.addresses.update_many({"user_id": current_user["id"]}, {"$set": {"is_default": False}})

    await db.addresses.update_one(
        {"id": address_id},
        {
            "$set": {
                "label": label,
                "address_line1": address_line1,
                "address_line2": address_line2,
                "city": city,
                "state": state,
                "pincode": pincode,
                "phone": phone,
                "is_default": is_default,
                "latitude": latitude,
                "longitude": longitude,
            }
        },
    )
    return {"message": "Address updated successfully"}

@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.addresses.delete_one({"id": address_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted successfully"}
