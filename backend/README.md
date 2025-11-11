Backend (FastAPI) modular structure

This backend mirrors the layout of `flashmonitor__node-main` by organizing code under `packages/` with clear module boundaries.

Key entrypoint
- server.py: Thin runner that imports the assembled FastAPI app.

App assembly
- packages/context/app.py: Creates the FastAPI app, mounts Socket.IO, applies middleware, and includes all routers.
- packages/context/db.py: Loads env, connects to MongoDB via Motor, and exposes `db` and shutdown hook.
- packages/context/models.py: Pydantic models for the domain.
- packages/context/security.py: Auth helpers (hashing, JWT, dependency `get_current_user`).
- packages/context/socket.py: Socket.IO server and events.

HTTP API routers (prefixed with /api)
- packages/routes/index.py: Aggregates all routers under a single APIRouter.
- Auth: packages/routes/auth.py
- Pharmacies: packages/routes/pharmacies.py
- Medicines: packages/routes/medicines.py
- Cart: packages/routes/cart.py
- Orders: packages/routes/orders.py
- Profile: packages/routes/profile.py
- Addresses: packages/routes/addresses.py
- Prescriptions: packages/routes/prescriptions.py
- Reviews: packages/routes/reviews.py
- Lab Tests: packages/routes/lab_tests.py
- Consultations: packages/routes/consultations.py
- Init Data: packages/routes/init_data.py

Middleware
- packages/middleware/cors.py: Centralized CORS config.

Environment
- Copy `.env.example` to `.env` and set values for MONGO_URL, DB_NAME, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES.

Run (development)
- Ensure the virtualenv is active and dependencies are installed.
- Start: `python server.py` (defaults to 0.0.0.0:8000)

Notes
- Functionality preserved from previous monolithic server.py. Endpoints unchanged at `/api/...`, and Socket.IO remains at `/socket.io`.
