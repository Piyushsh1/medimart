from pathlib import Path
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env from backend/.env
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / '.env')

# Use environment variables for credentials/host and database
import logging
from pymongo.errors import OperationFailure

# Support several common env names so the project works with different setups:
# - MONGO_URI or MONGO_URL for the connection string
# - MONGO_DB or DB_NAME for the database name
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or os.getenv("MONGO_CONNECTION") or "mongodb://localhost:27017"
MONGO_DB = os.getenv("MONGO_DB") or os.getenv("DB_NAME") or os.getenv("MONGO_DB_NAME") or "medimart"

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB]

async def shutdown_db_client():
    client.close()

async def ensure_indexes():
    """Create required indexes. If the server requires authentication but
    the connection string lacks credentials, skip index creation for development.
    """
    try:
        # Test connection first
        await client.admin.command('ping')
        
        await db.users.create_index("username", unique=True)
        await db.users.create_index("id", unique=True)
        await db.pharmacies.create_index("id", unique=True)
        await db.medicines.create_index("id", unique=True)
        await db.medicines.create_index("pharmacy_id")

        await db.carts.create_index("user_id", unique=True)
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("user_id")
        await db.addresses.create_index("id", unique=True)
        await db.reviews.create_index("id", unique=True)
        await db.lab_tests.create_index("id", unique=True)
        await db.consultations.create_index("id", unique=True)
        
        logger.info("MongoDB indexes created successfully")
        
    except OperationFailure as e:
        logger.error("MongoDB operation failed: %s", e)
        
        if e.code == 13:  # Unauthorized
            logger.warning(
                "MongoDB requires authentication for index creation. "
                "Skipping index creation for development. "
                "In production, ensure proper authentication is configured."
            )
            # Don't raise an error, just log the warning and continue
            return
        elif e.code == 18:  # AuthenticationFailed
            logger.warning(
                "MongoDB authentication failed. "
                "Skipping index creation for development. "
                f"Connection string: {MONGO_URI.replace(':password@', ':****@') if ':' in MONGO_URI and '@' in MONGO_URI else MONGO_URI}"
            )
            # Don't raise an error, just log the warning and continue
            return
        else:
            raise RuntimeError(f"MongoDB operation failed: {e}") from e
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        raise RuntimeError(
            "Cannot connect to MongoDB. Please ensure MongoDB is running and "
            f"connection details are correct. Connection string: {MONGO_URI}"
        ) from e
