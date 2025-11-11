from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..context.db import db
from ..context.models import Pharmacy
import math

router = APIRouter(tags=["pharmacies"])

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.get("/pharmacies", response_model=List[Pharmacy])
async def get_pharmacies(
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius: Optional[float] = Query(10.0)  # Default 10km radius
):
    pharmacies = await db.pharmacies.find().to_list(1000)
    pharmacy_list = [Pharmacy(**pharmacy) for pharmacy in pharmacies]
    
    # If location provided, filter by distance and add distance field
    if latitude is not None and longitude is not None:
        pharmacies_with_distance = []
        for pharmacy in pharmacy_list:
            if pharmacy.latitude and pharmacy.longitude:
                distance = calculate_distance(latitude, longitude, pharmacy.latitude, pharmacy.longitude)
                if distance <= radius:
                    pharmacy_dict = pharmacy.dict()
                    pharmacy_dict['distance'] = round(distance, 2)
                    pharmacies_with_distance.append(pharmacy_dict)
        
        # Sort by distance
        pharmacies_with_distance.sort(key=lambda x: x['distance'])
        return pharmacies_with_distance
    
    return pharmacy_list

@router.get("/pharmacies/{pharmacy_id}", response_model=Pharmacy)
async def get_pharmacy(pharmacy_id: str):
    pharmacy = await db.pharmacies.find_one({"id": pharmacy_id})
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return Pharmacy(**pharmacy)
