from fastapi import Request
import asyncio

def visit_key_func(request: Request):
    data: dict = asyncio.run(request.json())
    username = request.cookies.get("username")
    visiting_user = data.get("visiting_user")
    
    return (username, visiting_user)

def matches_key(*args, **kwargs):
    request: Request = kwargs["kwargs"]["r"]
    username, session_id = request.cookies.get("username"), request.cookies.get("user_session")
    return f"{username}-matches-page-{session_id}"