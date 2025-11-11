import socketio

sio = socketio.AsyncServer(cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def join_room(sid, data):
    user_id = data.get('user_id')
    await sio.enter_room(sid, f"user_{user_id}")
    print(f"Client {sid} joined room user_{user_id}")
