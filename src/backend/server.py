from fastapi import FastAPI, Request, Response, HTTPException, Depends, APIRouter
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache
from passlib.context import CryptContext
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from main import run_matching_algorithm
from rating_sys import (calculate_rating, 
                        average_rating, 
                        update_rating, 
                        delete_rating, 
                        insert_rating)
from key_pref.key_prefixes import (visit_key_func, 
                                   search_hist_key, 
                                   user_profiles_key,
                                   messaged_users_key,
                                   notif_key)
from helpers.helper import *
from similarity_calculations import filter_matches

import jwt
import datetime as dt
import psycopg2 as p
import base64
import json
import os
import asyncio

PATH = 'secret.env'

server = FastAPI(debug=True)

FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

# Load the .env file from the path specified above.
load_dotenv(PATH)

# Load environment variables from the .env file.
SK_KEY=os.getenv('SK_KEY') if os.getenv("SK_KEY") else os.environ["SK_KEY"]
DB_KEY=os.getenv('DB_KEY') if os.getenv("SK_KEY") else os.environ["SK_KEY"]

server.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

context = CryptContext(schemes=['bcrypt'], deprecated='auto')

limit = Limiter(
    key_func=get_remote_address,
    default_limits=["500/minute"],
    storage_uri="memory://",
    strategy="fixed-window"
)

server.state.limiter = limit
server.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

async def create_connection() -> p.extensions.connection:
    try:
        db: p.extensions.connection = p.connect(DB_KEY)
        
        return db
    
    except p.DatabaseError as e:
        return "error"

async def terminate_connection(db: p.extensions.connection):
    db.close()
    
async def check_token(request: Request):
    if request.cookies.get("user_session") != None:
        try:
            decode_token: dict = jwt.decode(request.cookies.get("user_session"), str(SK_KEY), ["HS256"], verify=True)
            
            if decode_token and decode_token["iss"] == request.headers.get('referer'):
                session_verified = await verify_session(request.cookies.get("username"), request.cookies.get("user_session"), str(DB_KEY), str(SK_KEY), request)
                
                if session_verified:
                    return True
                else:
                    raise jwt.InvalidTokenError
            else:
                raise jwt.InvalidTokenError
        
        except jwt.InvalidTokenError:
            raise HTTPException(498, {"message": "Invalid token!"})
        
        except RuntimeError:
            raise HTTPException(500, {"message": "There was a run time error. Please try again."})
        
        except jwt.InvalidKeyError:
            raise HTTPException(403, {"message": "Invalid key used."})
            
    else:
        raise HTTPException(status_code=401, detail={"message": "Can't access API endpoint."})

protected_route = APIRouter(dependencies=[Depends(check_token)])

@server.get("/")
async def index():
    return {"status": "Working!"}

@server.post("/login")
async def login(request: Request, response: Response):
    data = await request.form()
    
    # Create a payload storing the user's username, their role,
    # the date they submitted their request to generate a token,
    # and a duration of 2 hours until the user logs out of the 
    # session.
    payload = {
        "username": data["username"],
        "role": "User",
        "iss": request.headers.get('referer'),
        "iat": dt.datetime.now(),
        "exp": int((dt.datetime.now() + dt.timedelta(hours=2, minutes=0)).timestamp())
    }
    
    # Handle exceptions in case a malicious actor attempts to make
    # unauthorized requests to any of the endpoints below.
    try:
        db: p.extensions.connection = await create_connection()
        cursor: p.extensions.cursor = db.cursor()
        verified_user = await user_verified(data["username"], data["password"], cursor)
        
        if verified_user:
            # Create a token so that it can be stored in a cookie and act
            # as an authenticator when logging in, persisting the session
            # or accessing API endpoints.
            generate_token = jwt.encode(payload, key=SK_KEY, algorithm='HS256')
            
            profile_pic = await retrieve_profile_pic(data["username"], db)

            # Configure the cookie's settings (such as securing it and making it an HttpOnly cookie to prevent users from using JavaScript to manipulate it through unauthorized means).
            response.set_cookie(key="user_session", value=generate_token, max_age=dt.timedelta(hours=2, minutes=0).seconds, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
            response.set_cookie(key="username", value=data["username"], max_age=dt.timedelta(hours=2, minutes=0).seconds, path="/", domain="localhost", httponly=True, secure=True, samesite='strict')
            session_inserted: int = await insert_session(data["username"], generate_token, db, cursor)

            if session_inserted:
                # Return response.
                return {"verified": True, "profile_pic": profile_pic, "token": generate_token}
            else:
                raise HTTPException(429, {"error": "You logged in into many sessions. Please log out from one of them and try again later."})
        
        else:
            raise jwt.InvalidKeyError
    
    # Handle exceptions with JWT token should they occur.   
    except jwt.InvalidKeyError:
        raise HTTPException(401, {"error": "You provided an invalid key"})

    except jwt.InvalidSignatureError:
        raise HTTPException(403, {"error": "You provided an invalid signature"})
    
    except jwt.InvalidTokenError:
        raise HTTPException(498, {"error": "The token that was generated was invalid"})
    
    finally:
        await terminate_connection(db)
        
@server.post("/logout")
async def logout(request: Request, response: Response):
    # Check to see if the cookie exists.
    if request.cookies.get("user_session") != None:
        # Create database and cursor for deleting the session.
        db = await create_connection()
        cursor = db.cursor()

        # Destroy both the user_session and username cookies to render the tokens unusable by any malicious actors.
        await delete_session(request.cookies.get("username"), request.cookies.get("user_session"), db, cursor)
        response.set_cookie(key="user_session", value=request.cookies.get("user_session"), max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        response.set_cookie(key="username", value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')

        await FastAPICache.clear()

        # Return the response indicating that the cookies have been deleted.
        return {"message": "Cookie has been deleted!"}
    
    # If the cookie does not exist, return an error message.
    else:
        raise HTTPException(500, {"message": "Cookie does not exist. It may have expired or not have existed. Logging out..."})
    
@server.post("/signup")
async def signup(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    hash_password = context.hash(data["password"])
    
    height = str(int(data["height_feet"])) + "'" + str(int(data["height_inches"])) + "''"
    
    age_verified = await verify_age(data["age"], data["state"])
    
    if age_verified:
        try:
            statement = '''
                CALL sign_up(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s)
            '''
            params = [
                      data["first_name"], 
                      data["middle_name"], 
                      data["last_name"],
                      data["username"], 
                      hash_password, 
                      data["birth_month"],
                      data["birth_date"], 
                      data["birth_year"], 
                      data["state"],
                      data["city"], 
                      "now()", 
                      data["age"], 
                      data["interests"], 
                      height, 
                      data["gender"],
                      data["sexual_orientation"], 
                      data["interested_in"], 
                      data["state"],
                      data["city"], 
                      data["relationship_status"], 
                      0.0, 
                      "true", 
                      data["so_filter_choice"], 
                      0, 
                      data["pic"]
                    ]
            
            cursor.execute(statement, params)
            db.commit()

            # Return response.
            return {"message": "Successfully registered for an account!"}
            
        except db.DatabaseError:
            return {"message": "An error occurred with the database. Please try again later."}, 500
        
        except Exception:
            return {"message": "A server error has occurred. Please try again later."}, 500
        
        finally:
            await terminate_connection(db)
    
    else:
        raise HTTPException(403, {"message": "Failed to verify account. You are underage."})
    
@protected_route.post("/check_login")
async def check_login(request: Request):
    session_tok = request.cookies.get("user_session")
    username_cookie = request.cookies.get("username")
    
    try:
        db: p.extensions.connection = await create_connection()
        
        user = await retrieve_banned_user(db, username_cookie)
        
        if "username" in user and user["username"] == username_cookie:
            raise HTTPException(403, {"verified": False})

        if session_tok != None and username_cookie != None:
            profile_pic = await retrieve_profile_pic(username_cookie, db)
            return {"verified": True, "username": username_cookie, "profile_pic": profile_pic}
        else:
            raise HTTPException(401, {"verified": False})
        
    except db.DatabaseError:
        raise HTTPException(500, {"message": "There was an error retrieving information from the database. Please try again."})
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/visit")
@limit.limit(os.environ["VISIT_LIMIT"], key_func=visit_key_func)
def visit(request: Request):
    data: dict = asyncio.run(request.json())
    db: p.extensions.connection = asyncio.run(create_connection())
    cursor: p.extensions.cursor = db.cursor()
    current_user: str = request.cookies.get("username")
    
    try:
        asyncio.run(log_visit(current_user, data["visiting_user"], db, cursor))
        return {"message": "Successfully counted visit!"}
    
    except db.DatabaseError:
        return {"message": "There was an error logging the profile visit. Please try again."}, 500
    
    except Exception:
        return {"message": "Server error. Please try again."}, 500
    
    finally:
        asyncio.run(terminate_connection(db))
        
@protected_route.post("/profile")
async def profile(r: Request):
    db: p.extensions.connection = await create_connection()
    
    data: dict = await r.json()
    username: str = ""
    
    # If the provided username in the JSON body request
    # from the client is not present, then use the
    # current user's username (if and only if the
    # request is associated with said current user).
    if "username" not in data:
        username = r.cookies.get("username")
        
    # However, if it does when retrieving the profile details of
    # another user, store their username from the JSON body
    # request into the username variable.
    else:
        username = data["username"]
    
    try:
        profile_info = await retrieve_profile(db, username)
        return profile_info
    
    except db.DatabaseError:
        return {"message": "Failed to retrieve profile information!"}, 500
    
    except Exception:
        return {"message": "A server error happened. Please try again."}, 500
    
    finally:
        await terminate_connection(db)
        
@server.post("/retrieve_pic")
async def retrieve_pic(request: Request):
    form_data = await request.form()
    pic = await form_data.get('pic').read()
    pic = base64.b64encode(bytes(pic)).decode('utf-8')
    
    return {"pic": pic}

@protected_route.route("/update_profile_pic", methods=["POST"])
async def update_profile_pic(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        # The name within the bracket of the .files and .form functions
        # represent the name that was defined in the HTML input tag.
        req = await request.form()
        username = request.cookies.get("username") if request.cookies.get("username") is not None else ""
        image_uri = bytes(base64.b64encode(await req.get('new-profile-pic').read())).decode('utf-8')
        
        # Commit new profile pic to database.
        update_information = [image_uri, username]
        update_stmt = "UPDATE Photos SET uri=%s WHERE username=%s"
        cursor.execute(update_stmt, update_information)
        db.commit()

        return RedirectResponse("http://localhost:5173/profile/options/update", status_code=302)
    
    except Exception as e:
        return RedirectResponse(location="http://localhost:5173/profile/options/update", status_code=302)
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/name")
async def update_name(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        # Update first, middle name, and last name of user where possible in the Users table.
        statement = "UPDATE Users SET first_name=%s, middle_name=%s, last_name=%s WHERE username=%s"
        params = [data["first_name"], data["middle_name"], data["last_name"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        try:
            # Update first, middle name, and last name of user where possible in the Profiles table.
            statement = "UPDATE Profiles SET first_name=%s, middle_name=%s, last_name=%s WHERE username=%s"
            params = [data["first_name"], data["middle_name"], data["last_name"], request.cookies.get("username")]
            cursor.execute(statement, params)
            db.commit()
            
            return {"message": "Successfully updated name!"}
            
        except db.DatabaseError:
            return {"message": "Failed to update name."}, 500
        
    except db.DatabaseError:
        return {"message": "Failed to update name!"}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/DOB")
async def update_DOB(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        # Check if the user was lying about their DOB when they originally registered for an account.
        they_told_the_truth = await determine_account_registration_age(cursor, request.cookies.get("username"), data["birth_month"], data["birth_date"], data["birth_year"])
        
        # If they did tell the truth about their DOB when originally registering for their account, 
        # they can go ahead and change it.
        if they_told_the_truth:
            statement = "UPDATE Users SET birth_month=%s, birth_date=%s, birth_year=%s WHERE username=%s"
            params = [data["birth_month"], data["birth_date"], data["birth_year"], request.cookies.get("username")]
            cursor.execute(statement, params)
            db.commit()
        
            return {"message": "Successfully updated birthday!"}
        
        # Otherwise, insert their username into the Banned table to ban them from using the service.
        else:
            statement = "INSERT INTO Banned (username, time_banned, reason, ban_lift_time) VALUES (%s, %s, %s, %s)"
            params = [request.cookies.get("username"), "now()", "Registered for an account while underage", "now()"]
            cursor.execute(statement, params)
            db.commit()
            
            raise HTTPException(403, {"message": "Failed to update birthday. You were underage when you originally registered for an account."})

    except db.DatabaseError as e:
        print(e)
        raise HTTPException(500, {"message": "Error updating date of birth!"})
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/username")
async def update_username(request: Request, response: Response):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Users SET username=%s WHERE username=%s"
        params = [data["new_username"], request.cookies.get("username")]
        
        cursor.execute(statement, params)
        db.commit()
        
        response.set_cookie("username", data["new_username"], max_age=dt.timedelta(hours=2).seconds, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        
        return {"cookie": "%s" % data["new_username"]}
    
    except db.DatabaseError:
        return {"message": "Error updating username!"}
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/height")
async def update_height(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    new_height: str = data["new_height_feet"] + "'" + data["new_height_inches"] + "''"
    
    try:
        statement: str = "UPDATE Profiles SET height=%s WHERE username=%s"
        params: list = [new_height, request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        return {"message": "Successfully updated height!"}
    
    except db.DatabaseError:
        return {"message": "Error updating height."}, 500
        
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/gender")
async def update_gender(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET gender=%s WHERE username=%s"
        params = [data["new_gender"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit() 
        
        return {"message": "Successfully updated gender!"}
        
    except db.DatabaseError:
        return {"message": "Error updating gender."}, 500
        
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/sexual_orientation")
async def update_sexual_orientation(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET sexual_orientation=%s WHERE username=%s"
        params = [data["new_sexual_orientation"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        return {"message": "Successfully updated sexual orientation!"}
        
    except db.DatabaseError:
        return {"message": "Error updating sexual orientation."}, 500
        
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/relationship_status")
async def update_relationship_status(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET relationship_status=%s WHERE username=%s"
        params = [data["new_relationship_status"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()

        return {"message": "Successfully updated relationship status!"}
    
    except db.DatabaseError:
        return {"message": "Error updating relationship status."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/update_profile/bio")
async def update_bio(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET interests=%s WHERE username=%s"
        params = [data["new_bio"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        return {"message": "Successfully updated bio!"}
    
    except db.DatabaseError:
        return {"message": "Error updating bio."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.get('/privacy/check_recommendation_settings')
async def check_recommendation_settings(request: Request):
    username = request.cookies.get("username")
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "SELECT used, use_so_filter FROM Recommendation_Settings WHERE username=%s"
        params = [username]
        cursor.execute(statement, params)
        
        used = [{"used": records[0], "use_so_filter": records[1] if await using_so_filter(username, cursor) else "false"} for records in cursor][0]
        
        return used
    
    except db.DatabaseError:
        return {"message": "Failed to retrieve recommendation settings for user."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.put("/privacy/change_recommendation_settings")
async def change_recommendation_settings(request: Request):
    data: dict = await request.json()
    username: str = request.cookies.get("username")
    query: str = request.query_params.get("rs")
    
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        if query == 'match':
            params: list = [data["check_value"], username]
            statement: str = "UPDATE Recommendation_Settings SET used=%s WHERE username=%s"
            cursor.execute(statement, params)
            db.commit()
        
        elif query == 'so_filter':
            params: list = [data["check_value"], username]
            statement: str = "UPDATE Recommendation_Settings SET use_so_filter=%s WHERE username=%s"
            cursor.execute(statement, params)
            db.commit()
            
        else:
            raise HTTPException(400, {"message": "Invalid query or request"})
        
        return {"message": data["check_value"]}
    
    except db.DatabaseError:
        raise HTTPException(500, {"message": "Failed to update recommendation settings."})
    
    except Exception:
        raise HTTPException(500, {"message": "A server error has occurred. Please try again later."})
    
    finally:
        await terminate_connection(db)
        
@protected_route.route("/privacy/download_data", methods=["POST", "GET"])
async def download_data(request: Request):
    if request.method == "POST":
        # Retrieve payload information.
        requested_info: dict = await request.json()
        
        # Boolean variable that will act as a status marker
        # if the user requested data to be downloaded.
        user_requested_data: bool = False
        
        # Dictionary containing user's information, which will then
        # be saved to a file and automatically downloaded to a user's
        # computer in JSON format.
        json_user_info: dict = {}

        try:
            # Create database connection and cursor.
            db: p.extensions.connection = await create_connection()
            cursor: p.extensions.cursor = db.cursor()

            # Compare the confirmed password entered by the user after they have clicked the button
            # to download their data with their password stored in the database.
            cursor.execute("SELECT password FROM Users WHERE username=%s", [request.cookies.get("username")])
            
            # Retrieve the password.
            password = [p[0] for p in cursor][0]
            
            # Verify the entered password with the hash of the retrieved password.
            password_verified = await user_verified(request.cookies.get("username"), password, cursor)
            
            # If their password was successfully verified, then proceed.
            if password_verified:
                # Check to see if they requested their profile information.      
                if requested_info["profileInfo"] or requested_info["everything"]:
                    user_requested_data = True
                    
                    statement = '''
                        SELECT P.username, P.first_name, P.middle_name, P.last_name, 
                        P.interests, P.height, P.gender, P.sexual_orientation, P.relationship_status, 
                        U.birth_month, U.birth_date, U.birth_year, U.city, U.state 
                        FROM Profiles P, Users U WHERE P.username=%s AND P.username=U.username
                    '''
                    
                    params = [request.cookies.get("username")]
                    
                    cursor.execute(statement, params)
                    
                    json_user_info["user_profile"] = [
                        {
                            "username": col[0],
                            "first_name": col[1],
                            "middle_name": col[2],
                            "last_name": col[3],
                            "interests": col[4],
                            "height": col[5],
                            "gender": col[6],
                            "sexual_orientation": col[7],
                            "relationship_status": col[8],
                            "birth_month": col[9],
                            "birth_date": col[10],
                            "birth_year": col[11],
                            "city": col[12],
                            "state": col[13]
                        }
                        for col in cursor
                    ][0]
                
                # Check to see if they requested their message history.    
                if requested_info["messageHistory"] or requested_info["everything"]:
                    user_requested_data = True
                    
                    statement = "SELECT * FROM Messages WHERE message_from=%s ORDER BY date_and_time DESC"
                    params = [request.cookies.get("username")]
                    
                    cursor.execute(statement, params)

                    json_user_info["messages"] = [
                        {
                            "message_from": col[0],
                            "message_to": col[1],
                            "date_and_time": str(col[2]),
                            "message": col[3]
                        }
                        for col in cursor
                    ]
                
                # Check to see if they requested their rating history.    
                if requested_info["ratingsMade"] or requested_info["everything"]:
                    user_requested_data = True
                    
                    statement = "SELECT rater, ratee, rating_type, rating_made FROM User_Rating_Labels WHERE rater=%s ORDER BY rating_made DESC"
                    params = [request.cookies.get("username")]
                    
                    cursor.execute(statement, params)
                    
                    json_user_info["rating_history"] = [
                        {
                            "rater": col[0],
                            "ratee": col[1],
                            "rating_type": col[2],
                            "rating_made": str(col[3])
                        }
                        for col in cursor
                    ]
                    
                # If the user has requested data, then send their data to be downloaded.
                if user_requested_data:
                    with open("user_info.json", "w") as f:
                        json.dump(json_user_info, f)
                        
                    return {"message": "Successfully downloaded data!"}
                
                # Otherwise, cancel their request if they did not select any of the
                # following options.
                else:
                    return {"message": "User did not request data. Cancelling request..."}, 400
                
            # If not, return an error message telling the user that they entered the wrong password.
            else:
                return {"message": "Failed to verify password. Please try again."}, 403
        
        except db.DatabaseError:
            return {"message": "Failed to connect to database."}, 500
        
        except Exception as e:
            return {"message": "Exception was thrown"}, 500
        
        finally:
            await terminate_connection(db)
    
    elif request.method == "GET":
        if os.path.isfile("user_info.json"):
            json_file = open("user_info.json", "rb")
            return StreamingResponse(json_file)
        
# @protected_route.post("/report_user")
# async def report_user(request: Request):
#     db: p.extensions.connection = await create_connection()
#     cursor: p.extensions.cursor = db.cursor()
#     try:
#         data = await request.form()
#         reporting_user = data['reporting-user']
#         reported_user = data['reported-user']
#         reason = data['reason-description']
        
#         # To store any files uploaded by user.
#         files_list = []
        
#         # Default report status when user is making their report.
#         status = "Pending"  
        
#         # To store information that will be used to insert into the database.
#         db_info = [reporting_user, reported_user, reason, "", "", "", status]
        
#         try:
#             # Section that separately handles each of the three files
#             # provided that at least one of them was uploaded.
#             if secure_filename(request.files['file1'].filename) != "":
#                 file1 = request.files['file1']
#                 secure_file1 = secure_filename(file1.filename)
#                 file1.save("../documents/%s" % secure_file1)
#                 files_list.append(secure_file1)
        
#             if secure_filename(request.files['file2'].filename) != "":
#                 file2 = request.files['file2']
#                 secure_file2 = secure_filename(file2.filename)
#                 file2.save("../documents/%s" % secure_file2)
#                 files_list.append(secure_file2)
            
#             if secure_filename(request.files['file3'].filename) != "":
#                 file3 = request.files['file3']
#                 secure_file3 = secure_filename(file3.filename)
#                 file3.save('../documents/%s' % secure_file3)
#                 files_list.append(secure_file3)
            
#             db_info_index_for_docs = 3
            
#             # Go through each file and store the base64 version into the db_info
#             # array for use when inserting it into the database.      
#             for file_doc in files_list:
#                 if os.path.isfile('../documents/%s' % file_doc):
#                     with open('../documents/%s' % file_doc, "rb") as f:
#                         current_file = f.read()
#                         base64_encoding_file = base64.b64encode(current_file).decode('utf-8')
#                         db_info[db_info_index_for_docs] = base64_encoding_file
#                         db_info_index_for_docs += 1
                    
#                     # Close and remove the file temporarily stored in the documents folder.
#                     f.close()
#                     os.remove("../documents/%s" % file_doc)
            
             
#             query = "INSERT INTO Reports (reporting_user, reported_user, date_and_time, reason, document1, document2, document3, report_status) VALUES (%s, %s, now(), %s, %s, %s, %s, %s)"
#             cursor.execute(query, db_info)
            
#             return RedirectResponse("http://localhost:5173/privacy/options/view_blocked_users")
        
#         except db.DatabaseError as e:
#             return {"message": e}
        
#         except Exception as e:
#             return {"message": e}
        
#     except Exception as e:
#         return {"message": e}
    
#     finally:
#         await terminate_connection(db)
#         # Configure memory size back to 1 MB.
#         server.config["MAX_CONTENT_LENGTH"] = 1 * 1000 * 1000

@protected_route.post("/search")
async def search(request: Request):
    statement = "SELECT * FROM get_user_profiles(%s)"
    
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    data: dict = await request.json()
    
    params = [data["username"]]
    
    try:
        cursor.execute(statement, params)

        search_results: list[dict[str, any]] = [
            {col[0]: record for col, record in zip(cursor.description, records)} 
            for records in cursor
        ]

        for record in search_results:
            record.update({"uri": bytes(record["uri"]).decode('utf-8')})
        
        return search_results
    
    except db.DatabaseError as e:
        raise HTTPException(500, {"message": "Failed to retrieve search terms! %s" % e})
    
    finally:
        await terminate_connection(db)
        
@protected_route.get("/retrieve_search_history")
@cache(expire=120, key_builder=search_hist_key)
async def retrieve_search_history(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = '''
            SELECT search_term FROM Search_History WHERE username=%s ORDER BY date_and_time DESC LIMIT 10
        '''
        username = request.cookies.get("username")
        params = [username]
        cursor.execute(statement, params)
        
        search_terms = [{"search_term": record[0]} for record in cursor]
        
        return search_terms
    
    except db.DatabaseError as e:
        raise HTTPException(500, {"message": e})
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/insert_search_history")
def insert_search_history(request: Request):
    db: p.extensions.connection = asyncio.run(create_connection())
    cursor: p.extensions.cursor = db.cursor()
    data: dict = asyncio.run(request.json())
    
    try:
        # Attempt to retrieve the search term from the database associated with the user's search
        # history.
        statement = "SELECT search_term FROM Search_History WHERE username=%s AND search_term=%s"
        params = [request.cookies.get("username"), data["search_term"]]
        cursor.execute(statement, params)
        
        # Stores the retrieved search term from the database in a list
        # should it exist.
        retrieved_search_term = [record[0] for record in cursor]
        
        # If the search term is not in the database, then...
        if data["search_term"] not in retrieved_search_term:
            # Create an INSERT query to insert the search term into the database.
            statement = '''
                INSERT INTO Search_History (username, search_term, date_and_time) VALUES (%s, %s, now())
            '''
            
            # Parameter values that will be used to insert the search term and
            # associated information in a row into the table.
            params = [request.cookies.get("username"), data["search_term"]]
            
            # Execute and commit the query into the database.
            cursor.execute(statement, params)
            db.commit()
            
            # Return a status code of 200 to indicate that the search term has been inserted.
            return {"message": "Search term has been inserted!"}

        # If the search term does exist, then...
        else:
            # Create an UPDATE query to update the date and time of the search term.
            statement = "UPDATE Search_History SET date_and_time=now() WHERE username=%s AND search_term=%s"
            
            # Parameter values that will be used to update the date and time of the search term.
            params = [request.cookies.get("username"), data["search_term"]]
            
            # Execute and commit the query into the database.
            cursor.execute(statement, params)
            db.commit()
            
            # Return a status code of 200 to indicate the search term date and time have been updated.
            return {"message": "Search term time has been updated!"}
    
    except db.DatabaseError:
        return {"message": "Could not find search term!"}, 500
    
    except Exception as e:
        return {"message": "Failed to insert or update search term."}, 500
    
    finally:
        asyncio.run(terminate_connection(db))
        
@protected_route.post("/clear_search_history")
async def clear_search_history(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "DELETE FROM Search_History WHERE username=%s"
        params = [request.cookies.get("username")]
        
        cursor.execute(statement, params)
        db.commit()
        
        return {"message": "Search history cleared!"}
    
    except db.DatabaseError as e:
        return {"message": e}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/clear_search_history_term")
async def clear_search_history_term(request: Request):
    search_term = request.query_params.get("search_term")
    username = request.cookies.get("username")
    params = [username, search_term]
    
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "DELETE FROM Search_History WHERE username=%s AND search_term=%s"
        cursor.execute(statement, params)
        db.commit()
        
        # Send updated search history to user after search term is deleted.
        try:
            statement = "SELECT search_term FROM Search_History WHERE username=%s ORDER BY date_and_time DESC LIMIT 10"
            params = [username]
            cursor.execute(statement, params)
            db.commit()
            
            updated_search_history = [{"search_term": record[0]} for record in cursor]
            
            return updated_search_history
        
        except db.DatabaseError as e:
            return {"message": "Failed to retrieve updated search history!"}, 500
        
    except db.DatabaseError as e:
        return {"message": "Invalid username or search term!"}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.get("/get_user_profiles")
@cache(expire=300, key_builder=user_profiles_key)
async def get_user_profiles(request: Request):
    db: p.extensions.connection = await create_connection()
    username: str = request.cookies.get("username")
    
    try:
        profile_routes = await retrieve_user_routes(db, username)
        return profile_routes
    
    except db.DatabaseError as e:
        return {"message": "Failed to get basic profile details!"}, 500
    
    except Exception as e:
        return {"message": "There was a server error. Please try again!"}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.get("/check_messaged_users")
@cache(expire=120, key_builder=messaged_users_key)
async def check_messaged_users(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "SELECT * FROM Recent_Messages(%s)"
        params = [request.cookies.get("username")]
        
        cursor.execute(statement, params)
        
        messages = [
            {
                "user2": record[0],
                "message": record[1],
                "sent_time": record[2],
                "first_name": record[3],
                "uri": bytes(record[4]).decode('utf-8'),
                "rating_type": record[5]
            }
            for record in cursor
        ]
        
        return messages

    except db.DatabaseError:
        raise HTTPException(500, {"message": "Failed to retrieve messaged users."})
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/retrieve_messages")
async def retrieve_messages(r: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    data: dict = await r.json()
    sender: str = r.cookies.get("username")
    
    try:
        params = [sender, data["receiver"], data["receiver"], sender]
        statement = '''
            SELECT message, message_from FROM Messages WHERE (message_from=%s AND message_to=%s) 
            OR (message_from=%s AND message_to=%s) ORDER BY date_and_time ASC
        '''
        
        cursor.execute(statement, params)
        
        messages = [
            {
                "message": record[0],
                "message_from": record[1]
            }
            for record in cursor
        ]
        
        return messages
        
    except db.DatabaseError as e:
        raise HTTPException(500, {"message": "Failed to retrieve messages."})
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/post_message")
async def post_message(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    data: dict = await request.json()
    sender: str = request.cookies.get("username")
    
    try:
        statement = '''
            INSERT INTO Messages (message_from, message_to, date_and_time, message) 
            VALUES (%s, %s, now(), %s)
        '''
        params = [sender, data["recipient_user"], data["message"]]
        
        cursor.execute(statement, params)
        db.commit()
            
        try:
            statement = '''
                UPDATE Notifications SET notification_counter=notification_counter + 1 WHERE username=%s
            '''
            params = [data["recipient_user"]]
            
            cursor.execute(statement, params)
            db.commit()
                        
            try:
                statement = '''
                    SELECT message, message_from FROM Messages WHERE (message_from=%s AND message_to=%s) 
                    OR (message_from=%s AND message_to=%s) ORDER BY date_and_time ASC
                '''
                params = [sender, data["recipient_user"], data["recipient_user"], sender]

                cursor.execute(statement, params)
                
                messages = [
                    {
                        "message": record[0],
                        "message_from": record[1]
                    }
                    for record in cursor
                ]
                
                return messages
            
            except db.DatabaseError:
                return {"message": "Failed to retrieve new messages."}, 500
        
        except db.DatabaseError:
            return {"message": "Failed to update notification counter."}, 500
        
    except db.DatabaseError as e:
        return {"message": "Message failed to send."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/retrieve_message_profile_pics")
async def retrieve_message_profile_pics(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "SELECT uri FROM Photos WHERE username=%s"
        params = [data["receiver"]]
        cursor.execute(statement, params)
        
        receiver_profile_pic = [
            {
                "receiver_pic": bytes(record[0]).decode('utf-8')
            }
            for record in cursor
        ][0]
        
        return receiver_profile_pic
    
    except db.DatabaseError:
        return {"message": "Message failed to send."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.get("/retrieve_notification_count")
@cache(expire=120, key_builder=notif_key)
async def retrieve_notification_count(request: Request):
    username = request.query_params.get("username")
    db: p.extensions.connection = await create_connection()
    
    if username:
        try:
            notification_count: dict[str, any] = await retrieve_notifications(db, username)
            return notification_count

        except db.DatabaseError:
            raise HTTPException(500, {"message": "Failed to retrieve notification count for user!"})
        
        finally:
            await terminate_connection(db)
    
    else:
        raise HTTPException(400, {"message": "Missing username for query parameter."})
    
@protected_route.put("/clear_notification_count")
def clear_notification_count(request: Request):
    username = request.query_params.get("username")
    db: p.extensions.connection = asyncio.run(create_connection())
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "UPDATE Notifications SET notification_counter=%s WHERE username=%s"
        params = [0, username]
        cursor.execute(statement, params)
        db.commit()
        
        try:
            statement = "SELECT notification_counter FROM Notifications WHERE username=%s"
            params = [username]
            cursor.execute(statement, params)
            
            notification_count = [{"notification_counter": record[0]} for record in cursor]
            
            return notification_count
        
        except db.DatabaseError:
            return {"message": "Failed to retrieve notification counter."}, 500
        
    except db.DatabaseError:
        return {"message": "Failed to clear notification counter."}, 500
    
    finally:
        asyncio.run(terminate_connection(db))
        
@protected_route.put("/update_password")
async def update_password(request: Request):
    data: dict = await request.json()
    username = request.cookies.get("username")
    new_password = context.hash(data["new_password"])
    
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = "SELECT password FROM Users WHERE username=%s"
        params = [username]
        cursor.execute(statement, params)
        
        selected_password = [{"password": record[0]} for record in cursor][0]
        
        password_verified = context.verify(data["old_password"], selected_password["password"])
        
        if password_verified:
            try:
                statement = "UPDATE Users SET password=%s WHERE username=%s"
                params = [new_password, username]
                cursor.execute(statement, params)
                db.commit()
                
                return {"message": "Password successfully updated!"}
            
            except db.DatabaseError:
                return {"message": "Password failed to update!"}, 500
        else:
            return {"message": "You typed in your old password incorrectly."}, 403
    
    except db.DatabaseError:
        return {"message": "Failed to execute query!"}, 500
    
    finally:
        await terminate_connection(db) 
    
@protected_route.post("/delete_account")
async def delete_account(request: Request, response: Response):
    # Retrieve username from cookie.
    username: str = request.cookies.get("username")

    # Stores inputted password from client.
    data: dict = await request.json()
    
    # Initialize the database connection and cursor.
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        # Verify password before proceeding with actual account deletion.
        statement: str = "SELECT password FROM Users WHERE username=%s"
        params: list = [username]
        cursor.execute(statement, params)
        
        retrieved_password = [db_pwd[0] for db_pwd in cursor.fetchall()][0]
        
        password_verified: bool = context.verify(data["password"], retrieved_password)
        
        if password_verified:
            statement: str = "DELETE FROM Users WHERE username=%s"
            params: list = [username]
            cursor.execute(statement, params)
            db.commit()
            
            response.set_cookie('user_session', value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
            response.set_cookie('username', value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        
            return {"message": "Session terminated."}

        else:
            return {"message": "Incorrect password!"}, 401
    
    except db.DatabaseError:
        return {"message": "Failed to delete account!"}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/block")
async def block(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    username = request.cookies.get("username")
    
    # If the user is not blocked, but the logged in user (the blocker) is intending
    # to do so, then enforce the block using the blocker's username and intended
    # blockee's username.
    if not data["block_requested"]:
        try:
            statement = '''
                SELECT B.blockee from Blocked B WHERE (B.blocker=%s AND B.blockee=%s) 
                OR (B.blocker=%s AND B.blockee=%s)
            '''
            params = [username, data["profile_user"], data["profile_user"], username]
            blocked_already = False

            cursor.execute(statement, params)
            
            blocked_user_record = [blocked for blocked in cursor]
            
            # If the list contains a record, then set 'blocked_already' to true.
            #
            # Otherwise, set it to false.
            if blocked_user_record:
                blocked_already = True
            else:
                blocked_already = False
            
            # Edge case to prevent user from blocking another user after being blocked by the latter.
            if not blocked_already:
                try:
                    statement = "INSERT INTO Blocked (blocker, blockee) VALUES (%s, %s)"
                    params = [username, data["profile_user"]]
                    cursor.execute(statement, params)
                    db.commit()
                    
                    return {"message": "Blocked user."}
                    
                except db.DatabaseError as e:
                    return {"message": "Failed to block user."}, 500
            
            
            # Redirects user to their profile page in the event where they attempt
            # to block another user, but the latter had already performed the operation
            # earlier.            
            else:
                return RedirectResponse("http://localhost:5173/")
        
        except db.DatabaseError:
            return {"message": "Failed to check edge case."}, 500
        
        finally:
            await terminate_connection(db)
    
    # Otherwise, remove the block.
    else:
        # Execute query using the blocker's username to retrieve the blocked user's block status
        # in order to release said block.
        try:
            statement = "DELETE FROM Blocked WHERE blocker=%s AND blockee=%s"
            params = [username, data["profile_user"]]
            
            cursor.execute(statement, params)
            db.commit()
            
            return {"message": "You have unblocked %s." % data["profile_user"]}
        
        except db.DatabaseError:
            return {"message": "Failed to unblock user."}, 500
        
        finally:
            await terminate_connection(db)
            
@protected_route.get("/retrieve_blocked_users")
async def retrieve_blocked_users(request: Request):
    username = request.cookies.get("username")
    
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = '''
            SELECT B.blockee, P.first_name, P2.uri 
            FROM Blocked B, Profiles P, Photos P2 WHERE B.blocker=%s 
            AND P.username=B.blockee AND B.blockee=P2.username 
            ORDER BY P.last_name, P.first_name
        '''
        params = [username]
        
        cursor.execute(statement, params)
        
        blocked_users = [
            {
                "blockee": record[0],
                "first_name": record[1],
                "uri": bytes(record[2]).decode('utf-8')
            }
            for record in cursor
        ]
        
        return blocked_users
    
    except db.DatabaseError:
        return {"message": "Failed to retrieve blocked users."}, 500
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/retrieve_block_status")
async def retrieve_block_status(request: Request):
    data: dict = await request.json()
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        statement = '''
            SELECT B.blockee, P.uri from Blocked B, Photos P 
            WHERE (B.blocker=%s AND B.blockee=%s) 
            OR (B.blocker=%s AND B.blockee=%s) 
            AND B.blockee=P.username
        '''
        params = [data["logged_in_user"], data["profile_user"], data["profile_user"], data["logged_in_user"]]
        cursor.execute(statement, params)
        
        user_block_status = [
            {
                "blockee": record[0],
                "uri": bytes(record[1]).decode('utf-8')
            }
            for record in cursor
        ]
        
        return user_block_status
    
    except db.DatabaseError:
        return {"message": "Could not retrieve information!"}, 500
    
    finally:
        await terminate_connection(db)
        
# WILL BE DONE AT A LATER DATE.
# Feature will be postponed until further notice.
@protected_route.post("/get_location")
async def get_location(request: Request):
    try:
        location_info = await request.json()
        
        return {"status": "Works!"}
    
    except Exception as e:
        return {"message": e}
    
@protected_route.post("/rating")
async def rating(request: Request):
    db: p.extensions.connection = await create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        rating_type = request.query_params.get('rt')
        username = request.query_params.get('user')
        logged_in_user = request.cookies.get('username')
        
        # Retrieve the records of the rater and ratee to check if such record(s)
        # exist.
        statement = "SELECT rater, ratee FROM User_Rating_Labels WHERE rater=%s AND ratee=%s"
        rating_list_parameters = [logged_in_user, username]
        cursor.execute(statement, rating_list_parameters)
        
        # Access the tuple containing the username of the rater and the ratee
        rater_ratee_record = [record for record in cursor]
        
        # Variable to store calculated rating.
        rating = 0.0

        # Check if the tuple is empty and if the usernames of the rater and the ratee are in it.
        # If the list is empty, insert the record in the table.
        if not rater_ratee_record:
            # Update the ratee's rating score in the database.
            rating = calculate_rating(cursor, username, logged_in_user, rating_type)
            
            # Update the rating made by the rater (the one who rates the user),
            # as well as that of the ratee (the one who was rated).
            insert_rating(cursor, logged_in_user, username, rating_type, rating)
            
            # Commit changes to database.
            db.commit()
        
        else:
            # Check to see if the user is clicking on the same rating type as the one
            # they have used to originally rate them.
            statement = "SELECT rating_type FROM User_Rating_Labels WHERE ratee=%s AND rater=%s"
            rating_list_parameters = [username, logged_in_user]
            cursor.execute(statement, rating_list_parameters)
            
            # Store the original rating type from the database into a list.
            retrieved_rate_type = [record[0] for record in cursor]
            
            # If the ratee's previous rating type (positive, negative, or neutral) is the same as the one
            # provided by the client, then update it to NULL in the database and decrease the original
            # rating of the ratee.
            if rating_type in retrieved_rate_type:
                # Delete the record of the rater's rating of the ratee
                # and update the latter's rating score to 0.
                delete_rating(cursor, logged_in_user, username)
                
                # Commit changes to database.
                db.commit()
                
                # Update the ratee's rating score.
                update_rating(cursor, username)
                
                # Again, commit the changes to the database.
                db.commit()
            
            # Otherwise, change it to the new rating type that they have been given by the current user.
            else: 
                # Just like the if statement above, delete the record of
                # the rater's rating of the ratee and update the latter's
                # rating score to 0. 
                # 
                # Unlike the if statement where if the rater clicked the
                # same icon that they used to originally rate the
                # ratee, it is temporarily updated to 0 so that
                # once the new rating is calculated below, it can
                # be used to subsequently replace the ratee's original 
                # rating score.
                delete_rating(cursor, logged_in_user, username)
                db.commit()
                update_rating(cursor, username)
                db.commit()
                
                # Calculate the new rating score of the ratee based on how they were
                # rated by the rater.
                score = calculate_rating(cursor, username, logged_in_user, rating_type)

                # Insert the the new rating of the ratee,
                # as well as other information, such as
                # the user who rated the former, what time
                # the rating was made, etc.
                insert_rating(cursor, logged_in_user, username, rating_type, score)
                db.commit()
        
        # Retrieve the average rating of the ratee from the ratings assigned to them by
        # other users in the User_Rating_Labels table.        
        rating = average_rating(cursor, username)
        
        # Update ratee's current rating with the average rating in the Ratings table.
        statement = "UPDATE Ratings SET rating=%s WHERE username=%s"
        rating_list_parameters = [rating, username]
        cursor.execute(statement, rating_list_parameters)
        
        # Return the updated data in JSON format.
        return {"message": "Rating successfully updated!"}
    
    except Exception:
        raise HTTPException(500, {"message": "Unknown error. Try again!"})
    
    finally:
        await terminate_connection(db)
        
@protected_route.post("/match")
async def match(request: Request):
    try:
        # Stores payload information sent from the client as an object variable.
        ri_task = asyncio.create_task(request.json())
        db_task = asyncio.create_task(create_connection())
        request_info, db = await asyncio.gather(ri_task, db_task)

        t1 = asyncio.create_task(retrieve_user_profiles(db, request.cookies.get("username")))
        t2 = asyncio.create_task(get_logged_in_user_profile(db, request.cookies.get("username")))
        t3 = asyncio.create_task(retrieve_visited_profiles(db, request.cookies.get("username")))

        profiles, logged_in_user, visited_profiles = await asyncio.gather(t1, t2, t3)
        
        if request_info["algo_config"]:
            # Run matching algorithm using the list of profiles (excluding the current user) to compare with the
            # profile of the logged in user.
            matches = run_matching_algorithm(profiles, logged_in_user, use_so_filter=request_info["use_so_filter"])
            matches = await include_visits(matches, visited_profiles)
            
            # If the limit of the number of searches retrieved is less than the
            # actual number of matched users, then let the
            # client continue requesting for more searches by including True
            # in the return result below.
            if request_info["initial_limit"] <= len(matches):
                return [matches[0:request_info["initial_limit"]], True]
            
            # Otherwise, if the limit of the number of searches is equal to the
            # length of the number of matched users, then let the client know
            # that no more searches will be requested as there are no more
            # matching profiles to request.
            else:
                return [matches[0:request_info["initial_limit"]], False]
        else:
            users = await include_visits(profiles, visited_profiles)
            return [users[0:request_info["initial_limit"]], True]
        
    except KeyError as k:
        raise HTTPException(500, {"message": "Failed to retrieve information from dictionary."})
    
    except Exception as e:
        raise HTTPException(500, {"message": "An unknown error has occurred."})
    
# Integrate the protected API endpoints into the FastAPI server.
server.include_router(protected_route)