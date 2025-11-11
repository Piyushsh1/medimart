from starlette.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def apply_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
