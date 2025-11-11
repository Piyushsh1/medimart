from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from ..context.db import db
from ..context.models import UserCreate, User, Token
from ..context.security import get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict["password"]

    new_user = User(**user_dict, hashed_password=hashed_password)
    await db.users.insert_one(new_user.dict())

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

    user_response = {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "phone": new_user.phone,
    }

    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

from ..context.security import verify_password
from ..context.models import UserLogin

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"username": user_login.username})
    if not user or not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["username"]}, expires_delta=access_token_expires)

    user_response = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"],
        "phone": user["phone"],
    }

    return {"access_token": access_token, "token_type": "bearer", "user": user_response}
