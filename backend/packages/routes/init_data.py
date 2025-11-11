from fastapi import APIRouter
from datetime import datetime
from uuid import uuid5, NAMESPACE_DNS
from ..context.db import db

router = APIRouter(tags=["init"]) 

def _pid(name: str) -> str:
    return str(uuid5(NAMESPACE_DNS, f"pharmacy:{name}"))

def _mid(pharmacy_id: str, idx: int) -> str:
    return str(uuid5(NAMESPACE_DNS, f"medicine:{pharmacy_id}:{idx}"))

@router.post("/init-data")
async def initialize_data():
    """Idempotent sample data initialization.
    - Stable IDs using uuid5, so re-running doesn't invalidate existing cart references.
    - Uses upserts instead of destructive deletes.
    - Skips work if pharmacies already exist (first-run only behavior optional).
    """

    existing = await db.pharmacies.count_documents({})
    if existing > 0:
        # Already initialized; keep user carts intact
        return {"message": "Data already initialized; skipping."}

    pharmacies = [
        {
            "id": _pid("Kiran Pharmacy"),
            "name": "Kiran Pharmacy",
            "description": "Your trusted neighborhood pharmacy with 24/7 service",
            "address": "123 Main Street, Mumbai, Maharashtra 400001",
            "phone": "+91 9876543210",
            "rating": 4.5,
            "image": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            "is_open": True,
            "delivery_time": "30-45 mins",
            "minimum_order": 200.0,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "created_at": datetime.utcnow(),
        },
        {
            "id": _pid("Piyush Pharmacy"),
            "name": "Piyush Pharmacy",
            "description": "Quality medicines and healthcare products at best prices",
            "address": "456 Park Road, Delhi, Delhi 110001",
            "phone": "+91 9876543211",
            "rating": 4.3,
            "image": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            "is_open": True,
            "delivery_time": "25-40 mins",
            "minimum_order": 250.0,
            "latitude": 28.6139,
            "longitude": 77.2090,
            "created_at": datetime.utcnow(),
        },
        {
            "id": _pid("Sumit Medical Store"),
            "name": "Sumit Medical Store",
            "description": "Complete medical solutions with expert consultation",
            "address": "789 Medical Lane, Bangalore, Karnataka 560001",
            "phone": "+91 9876543212",
            "rating": 4.7,
            "image": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            "is_open": True,
            "delivery_time": "20-35 mins",
            "minimum_order": 300.0,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "created_at": datetime.utcnow(),
        },
    ]

    for p in pharmacies:
        await db.pharmacies.update_one({"id": p["id"]}, {"$set": p}, upsert=True)

    categories = ["Pain Relief", "Cold & Flu", "Vitamins", "Antibiotics", "Diabetes Care", "Heart Care"]

    for p in pharmacies:
        for i in range(15):
            m = {
                "id": _mid(p["id"], i),
                "pharmacy_id": p["id"],
                "name": f"Medicine {i+1} - {p['name'][:5]}",
                "description": f"Effective treatment for various conditions - {i+1}",
                "price": round(50 + (i * 25), 2),
                "mrp": round(70 + (i * 35), 2),
                "discount_percentage": round(10 + (i % 3) * 5, 1),
                "stock_quantity": 50 + (i * 5),
                "category": categories[i % len(categories)],
                "image": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                "prescription_required": i % 4 == 0,
                "created_at": datetime.utcnow(),
            }
            await db.medicines.update_one({"id": m["id"]}, {"$set": m}, upsert=True)

    return {"message": "Sample data initialized (idempotent)"}
