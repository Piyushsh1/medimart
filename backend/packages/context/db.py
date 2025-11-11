from pathlib import Path
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env from backend/.env
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

if not MONGO_URL or not DB_NAME:
    raise RuntimeError('MONGO_URL and DB_NAME must be set in environment or .env')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def shutdown_db_client():
    client.close()

async def ensure_indexes():
    # Users
    await db.users.create_index("username", unique=True)
    await db.users.create_index("id", unique=True)
    # Pharmacies/Medicines
    await db.pharmacies.create_index("id", unique=True)
    await db.medicines.create_index("id", unique=True)
    await db.medicines.create_index("pharmacy_id")
    # Carts
    await db.carts.create_index("user_id", unique=True)
    # Orders
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    # Addresses/Reviews/Lab/Consultations
    await db.addresses.create_index("id", unique=True)
    await db.reviews.create_index("id", unique=True)
    await db.lab_tests.create_index("id", unique=True)
    await db.consultations.create_index("id", unique=True)
