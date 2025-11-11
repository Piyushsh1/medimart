from fastapi import APIRouter

from .auth import router as auth_router
from .pharmacies import router as pharmacies_router
from .medicines import router as medicines_router
from .cart import router as cart_router
from .orders import router as orders_router
from .profile import router as profile_router
from .addresses import router as addresses_router
from .prescriptions import router as prescriptions_router
from .reviews import router as reviews_router
from .lab_tests import router as lab_tests_router
from .consultations import router as consultations_router
from .init_data import router as init_data_router
from .payments import router as payments_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(pharmacies_router)
api_router.include_router(medicines_router)
api_router.include_router(cart_router)
api_router.include_router(orders_router)
api_router.include_router(profile_router)
api_router.include_router(addresses_router)
api_router.include_router(prescriptions_router)
api_router.include_router(reviews_router)
api_router.include_router(lab_tests_router)
api_router.include_router(consultations_router)
api_router.include_router(init_data_router)
api_router.include_router(payments_router)
