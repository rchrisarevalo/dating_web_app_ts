from fastapi import Request
import asyncio

def visit_key_func(request: Request):
    data: dict = asyncio.run(request.json())
    username = request.cookies.get("username")
    visiting_user = data.get("visiting_user")
    
    return (username, visiting_user)
    