from fastapi import Request
import asyncio

def visit_key_func(request: Request):
    data: dict = asyncio.run(request.json())
    username = request.cookies.get("username")
    visiting_user = data.get("visiting_user")
    
    return (username, visiting_user)

def chat_req_key_func(request: Request):
    data: dict = asyncio.run(request.json())
    username = request.cookies.get("username")
    requestee = data.get("requestee")

    return (username, requestee)

async def user_profiles_key(*args, **kwargs):
    request: Request = kwargs["request"]
    username = request.cookies.get("username")
    session = request.cookies.get("user_session")
    key = f"{username}-user_profiles-{session}"

    return key

async def search_hist_key(*args, **kwargs):
    request: Request = kwargs["request"]
    username = request.cookies.get("username")
    session = request.cookies.get("user_session")
    key = f"{username}-search-hist-{session}"

    return key

async def messaged_users_key(*args, **kwargs):
    request: Request = kwargs["request"]
    username = request.cookies.get("username")
    session = request.cookies.get("user_session")
    key = f"{username}-messaged_users-{session}"

    return key

async def notif_key(*args, **kwargs):
    request: Request = kwargs["request"]
    username = request.cookies.get("username")
    session = request.cookies.get("user_session")
    key = f"{username}-notif-{session}"

    return key