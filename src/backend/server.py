from flask import Flask, request, redirect, make_response, jsonify, send_file, render_template
from functools import wraps
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from waitress import serve
import psycopg2 as p
import base64
from dotenv import load_dotenv
import os
import jwt
import json
import datetime as dt
from main import run_matching_algorithm
from rating_sys import (calculate_rating, 
                        average_rating, 
                        update_rating, 
                        delete_rating, 
                        insert_rating)

from key_pref.cache_key_prefixes import (user_profile_cache, search_results_cache, 
                                         match_algo_cache, user_profiles_cache_key,
                                         logged_in_user_profile_cache_key)

PATH = 'secret.env'

server = Flask(__name__)
server.config["MAX_CONTENT_LENGTH"] = 1 * 1000 * 1000
server.config["SECRET_KEY"] = os.urandom(100).hex()
server.config["CACHE_TYPE"] = 'redis'
CORS(server, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:5173"], max_age=dt.timedelta(hours=1).seconds)

# Load the .env file from the path specified above.
load_dotenv(PATH)

# Load environment variables from the .env file.
SK_KEY=os.getenv('SK_KEY') if os.getenv("SK_KEY") else os.environ["SK_KEY"]
DB_KEY=os.getenv('DB_KEY') if os.getenv("SK_KEY") else os.environ["SK_KEY"]

bcrypt = Bcrypt(server)

cache = Cache(server, config={'CACHE_TYPE': 'SimpleCache'})

def create_connection() -> p.extensions.connection:
    try:
        db = p.connect(DB_KEY)
        
        return db
    
    except p.DatabaseError as e:
        return "error"

def terminate_connection(db=p.extensions.connection):
    db.close()

# Custom wrapper to check the validation of a token.
#
# Documentation to create custom wrapper:
# https://docs.python.org/3/library/functools.html#functools.wraps
# https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
def check_token(f):
    @wraps(f)
    def check_token_func(*args, **kwargs):
        if request.cookies.get("user_session") != None:
            try:
                decode_token = jwt.decode(request.cookies.get("user_session"), str(SK_KEY), ["HS256"], verify=True)
                
                # When wanting to continue with making a request to a specific endpoint,
                # after validating the token, return f(*args, **kwargs) to do so.
                return f(*args, **kwargs)
            
            except jwt.InvalidTokenError:
                return jsonify({"message": "Invalid token!"}), 498
            
            except jwt.ExpiredSignatureError:
                return jsonify({"message": "Token expired."}), 401
            
            except jwt.InvalidKeyError:
                return jsonify({"message": "Invalid key used."}), 403
            
            except jwt.InvalidSignatureError:
                return jsonify({"message": "Invalid signature."}), 403
        else:
            return jsonify({"message": "Can't access API endpoint."}), 401
    
    return check_token_func
            

@server.before_request
async def configure():
    if request.endpoint == "match":
        server.config["MAX_CONTENT_LENGTH"] = 5 * 1000 * 1000
    elif request.endpoint == "report_user":
        server.config["MAX_CONTENT_LENGTH"] = 10 * 1000 * 1000
    else:
        server.config["MAX_CONTENT_LENGTH"] = 1 * 1000 * 1000
        

# Checks to see if either user1 or user2 has messaged the other
# recently by retrieving their most recent chat in the Recent
# table.        
def check_recent_message_records(cursor, user1, user2):
    # Retrieve recent message records between user1 and user2 from the Recent table.
    statement = 'SELECT * FROM Recent WHERE (user1=%s AND user2=%s) OR (user1=%s AND user2=%s)'
    params = [user1, user2, user2, user1]
    cursor.execute(statement, params)
    
    # Stores message records retrieved from database between user1 and user2.
    recent_message_records = [record for record in cursor]

    # If the list is not empty, then return True to indicate that either user1
    # or user2 have contacted each other recently.
    if recent_message_records:
        return True
    
    # Otherwise, return False to indicate that neither user1 or user2 have
    # not contacted each other.
    else:
        return False

# Verifies user age when they register for an account, or if they change their
# date of birth in their account settings.  
def verify_age(age, state_residence):
    # If the user's state residence is in Alabama or Nebraska, and they are 19 or above
    # return True to verify that they are of age to register for an account.
    if (state_residence == 'Alabama' or state_residence == 'Nebraska') and (age >= 19):
        return True
    
    # If the user's state residence is in Nebraska, and they 21 or above,
    # return True to verify that they are of age to register for an
    # account.
    elif (state_residence == 'Nebraska' and age >= 21):
        return True
    
    # Otherwise...
    else:
        # If the user is in another state other than the ones mentioned above,
        # and they are 18 years old or above, return True to verify that they
        # are of age to register for an account.
        if age >= 18:
            return True
        
        # Otherwise, they are under age, so return False to indicate that they
        # are not of age to register for an account.
        else:
            return False
        
# Determines the actual age of the user by using their account creation
# timestamp and their date of birth to determine how old they really
# were when they registered for an account.
#
# If they were under age when they registered for an account, then
# they are banned from using the web application.
#
# Otherwise, they can proceed to use the web application.
def determine_account_registration_age(cursor, username, new_birth_month, new_birth_date, new_birth_year):          
    statement = "SELECT account_creation_timestamp, birth_month, birth_date, birth_year, state FROM Users WHERE username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    month_index = {
        "January": 1,
        "February": 2,
        "March": 3,
        "April": 4,
        "May": 5,
        "June": 6,
        "July": 7,
        "August": 8,
        "September": 9,
        "October": 10,
        "November": 11,
        "December": 12
    }
    
    record = [record for record in cursor][0]
    
    # Timestamp containing account creation date and time.
    account_creation_timestamp = record[0]
    
    # Timestamp containing the user's expected birthday using their account registration timestamp year.
    expected_birthday_timestamp = dt.datetime(account_creation_timestamp.year, month_index[record[1]], int(record[2]))
    
    # User's date of birth.
    dob = dt.datetime(int(new_birth_year), month_index[new_birth_month], int(new_birth_date))
    
    # Calculate the age of the user when they registered for an account
    # using their new date of birth.
    age = int((account_creation_timestamp - dob).days * (1 / 365))
    
    # Stores state residence of user when they registered for an account.
    state_residence = record[4]
    
    # If the user created their account before their birthday,
    # take away 1 from their account registration age.
    if account_creation_timestamp < expected_birthday_timestamp:
        age = age - 1
    
    # If the user was of age when they registered for an account,
    # they can proceed to change their date of birth.
    if verify_age(age, state_residence):
        return True
    
    # However, if they were underage, their account is banned.
    else:
        return False
    
# Function that verifies the user's credentials.
def user_verified(username=str, password=str, cursor=p.extensions.cursor):
    # Retrieve the username and password of the current user from the database
    # to verify the credentials they entered in the login page.
    statement = "SELECT U.username, U.password FROM Users U WHERE U.username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    # Append the column names into the "keys" list.
    keys = [attr.name for attr in cursor.description]
    
    # Append the record values into the "values" list.
    values = [value for value in cursor.fetchall()]
    
    # If either of the two lists are empty, then return false
    # to indicate that the record of the user does not exist.
    if not keys or not values:
        return False
    
    # Otherwise...
    else:
        # Update the "values" variable by accessing the record of the user
        # from the same list stored in the "values" variable.
        values = values[0]

        # Store the user's information in a dictionary using dictionary comprehension
        # to easily access their username and password when verifying their
        # credentials.
        user = {user_key: user_column for user_key, user_column in zip(keys, values)}
        
        # Verify credentials.
        password_verified = bcrypt.check_password_hash(user["password"], password)
        username_verified = True if user["username"] == username else False
        
        # If both the username and password are verified, return True.
        if username_verified and password_verified:
            return True
        
        # Otherwise, return False.
        else:
            return False
    
    
# Function that retrieves user's profile picture.
def retrieve_profile_pic(username=str, cursor=p.extensions.cursor):
    statement = "SELECT uri FROM Photos WHERE username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    photo = [record[0] for record in cursor.fetchall()][0]
    photo = bytes(photo).decode('utf-8')
    
    return photo
    
# Function that checks whether a user decided to filter other users
# from their search results based on their sexual orientation.
def using_so_filter(username=str, cursor=p.extensions.cursor):
    statement = "SELECT use_so_filter FROM Recommendation_Settings WHERE username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    record = [f[0] for f in cursor.fetchall()][0]
    
    if record == "true":
        return True
    else:
        return False
    

@server.route("/", methods=["GET"])
async def index():
    return {"status": "Working!"}

    
@server.route("/login", methods=["POST"])
async def login():
    data = request.form
    
    # Create a payload storing the user's username, their role,
    # the date they submitted their request to generate a token,
    # and a duration of 2 hours until the user logs out of the 
    # session.
    payload = {
        "username": data["username"],
        "role": "User",
        "iss": request.origin,
        "iat": dt.datetime.now(),
        "exp": int((dt.datetime.now() + dt.timedelta(hours=2, minutes=0)).timestamp())
    }
    
    # Handle exceptions in case a malicious actor attempts to make
    # unauthorized requests to any of the endpoints below.
    try:
        db = create_connection()
        cursor = db.cursor()
        verified_user = user_verified(data["username"], data["password"], cursor)
        
        if verified_user:
            # Create a token so that it can be stored in a cookie and act
            # as an authenticator when logging in, persisting the session
            # or accessing API endpoints.
            generate_token = jwt.encode(payload, key=SK_KEY, algorithm='HS256')
            
            profile_pic = retrieve_profile_pic(data["username"], cursor)
            
            # Make the response if the cookie is successfully stored.
            store_token_cookie = make_response({"verified": True, "profile_pic": profile_pic, "token": generate_token})
            
            # Configure the cookie's settings (such as securing it and making it an HttpOnly cookie to prevent users from using JavaScript to manipulate it through unauthorized means).
            store_token_cookie.set_cookie(key="user_session", value=generate_token, max_age=dt.timedelta(hours=2, minutes=0).seconds, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
            store_token_cookie.set_cookie(key="username", value=data["username"], max_age=dt.timedelta(hours=2, minutes=0).seconds, path="/", domain="localhost", httponly=True, secure=True, samesite='strict')
            
            # Return response.
            return store_token_cookie
        
        else:
            raise jwt.InvalidKeyError
    
    # Handle exceptions with JWT token should they occur.   
    except jwt.InvalidKeyError:
        return {"error": "You provided an invalid key"}, 401

    except jwt.InvalidSignatureError:
        return {"error": "You provided an invalid signature"}, 403
    
    except jwt.InvalidTokenError:
        return {"error": "The token that was generated was invalid"}, 498
    
    except Exception as e:
        return {"error": "Exception thrown"}, 500
    
    finally:
        db.close()
    
    
@server.route("/logout", methods=["POST"])
async def logout():
    # Check to see if the cookie exists.
    if request.cookies.get("user_session") != None:
        # Set up a response to start manipulating the cookie.
        end_res = make_response({"message": "Cookie has been deleted!"}, 200)
        
        # Destroy both the user_session and username cookies to render the tokens unusable by any malicious actors.
        end_res.set_cookie(key="user_session", value=request.cookies.get("user_session"), max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        end_res.set_cookie(key="username", value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        
        # Return the response indicating that the cookies have been deleted.
        return end_res
    
    # If the cookie does not exist, return an error message.
    else:
        return {"message": "Cookie does not exist. It may have expired or not have existed. Logging out..."}, 500


@server.route("/signup", methods=["POST"])
async def signup():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    hash_password = bcrypt.generate_password_hash(data["password"], 10).decode('utf-8')
    
    height = str(int(data["height_feet"])) + "'" + str(int(data["height_inches"])) + "''"
    
    age_verified = verify_age(data["age"], data["state"])
    
    if age_verified:
        try:
            statement = '''
                CALL sign_up(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s)
            '''
            params = [data["first_name"], data["middle_name"], data["last_name"],
                    data["username"], hash_password, data["birth_month"],
                    data["birth_date"], data["birth_year"], data["state"],
                    data["city"], "now()", data["age"], data["interests"], height, data["gender"],
                    data["sexual_orientation"], data["interested_in"], data["state"],
                    data["city"], data["relationship_status"], 0.0, "true", data["so_filter_choice"], 
                    0, data["pic"]]
            
            cursor.execute(statement, params)
            db.commit()
            
        except db.DatabaseError:
            return jsonify({"message": "An error occurred with the database. Please try again later."}), 500
        
        except Exception:
            return jsonify({"message": "A server error has occurred. Please try again later."}), 500
        
        finally:
            db.close()
            
        return jsonify({"message": "Successfully registered for an account!"}), 200
    
    else:
        return jsonify({"message": "Failed to verify account. You are underage."}), 403
        
        
@server.route('/check_login', methods=["POST"])
@check_token
def check_login():
    session_tok = request.cookies.get("user_session")
    username_cookie = request.cookies.get("username")
    
    try:
        db = create_connection()
        cursor = db.cursor()
        
        statement = "SELECT username FROM Banned WHERE username=%s"
        params = [username_cookie]
        cursor.execute(statement, params)
        
        keys = [attr.name for attr in cursor.description]
        values = [value for value in cursor.fetchall()]
        
        user = {key: value[0] for key, value in zip(keys, values)}
        
        if "username" in user and user["username"] == username_cookie:
            return jsonify({"verified": False}), 403
        
        if session_tok != None and username_cookie != None:
            profile_pic = retrieve_profile_pic(username_cookie, cursor)
            return jsonify({"verified": True, "username": username_cookie, "profile_pic": profile_pic}), 200
        else:
            return jsonify({"verified": False}), 401
        
    except db.DatabaseError:
        return jsonify({"message": "There was an error retrieving information from the database. Please try again."}), 500
        
    except Exception as e:
        print(e)
        return jsonify({"message": "Server error. Please try again."}), 500
    
    finally:
        db.close()


@server.route("/profile", methods=["POST"])
@check_token
@cache.cached(timeout=300, key_prefix=user_profile_cache)
def profile():
    statement = '''
        SELECT P.username, P.first_name, P.middle_name, P.last_name, P.interests, P.height, P.gender, 
        P.sexual_orientation, P.relationship_status, U.birth_month, U.birth_date, 
        U.birth_year, P2.uri FROM Profiles P, Users U, Photos P2 
        WHERE P.username=%s AND P.username=U.username AND P.username=P2.username
    '''
    
    data: dict = request.get_json()
    username: str = ""
    
    # If the provided username in the JSON body request
    # from the client is not present, then use the
    # current user's username (if and only if the
    # request is associated with said current user).
    if "username" not in data:
        username = request.cookies.get("username")
        
    # However, if it does when retrieving the profile details of
    # another user, store their username from the JSON body
    # request into the username variable.
    else:
        username = data["username"]
        
    db: p.extensions.connection = create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    params: list = [username]
    
    try:
        cursor.execute(statement, params)
        
        profile_info: list[dict[str, any]] = [{}]
        
        try:
            profile_info = [
                {
                    "username": record[0],
                    "first_name": record[1],
                    "middle_name": record[2],
                    "last_name": record[3],
                    "interests": record[4],
                    "height": record[5],
                    "gender": record[6],
                    "sexual_orientation": record[7],
                    "relationship_status": record[8],
                    "birth_month": record[9],
                    "birth_date": record[10],
                    "birth_year": record[11],
                    "uri": bytes(record[12]).decode('utf-8')
                }
                for record in cursor
            ][0]
            
            if profile_info:
                return jsonify(profile_info), 200
            else:
                return jsonify(profile_info), 500
        
        except:
            return jsonify(profile_info), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": "Failed to retrieve profile information!"}), 500
    
    except Exception as e:
        return jsonify({"message": "A server error happened. Please try again."}), 500
    
    finally:
        terminate_connection(db)


@server.route("/retrieve_pic", methods=["POST"])
def retrieve_pic():
    pic = request.files['pic']
    secure_pic_filename = secure_filename(pic.filename)
    pic.save("../images/%s" % secure_pic_filename)
    
    with open("../images/%s" % secure_pic_filename, "rb") as f:
        pic_file = f.read()
        base64_pic_file = base64.b64encode(pic_file).decode('utf-8')
        f.close()
        
    os.remove("../images/%s" % secure_pic_filename)
    
    return jsonify({"pic": base64_pic_file}), 200


@server.route("/update_profile_pic", methods=["POST", "GET"])
@check_token
def update_profile_pic():
    db = create_connection()
    cursor = db.cursor()
    try:
        try:
            # The name within the bracket of the .files and .form functions
            # represent the name that was defined in the HTML input tag.
            req = request.files['new-profile-pic']
            username = request.cookies.get("username") if request.cookies.get("username") is not None else ""
            secure = secure_filename(req.filename)
            req.save('../images/%s' % secure)

            if os.path.isfile("../images/%s" % secure):
                with open('../images/%s' % secure, "rb") as f:
                    new_image = f.read()
                    base64_image_info = base64.b64encode(new_image).decode('utf-8')
                    update_information = [base64_image_info, username]
                    update_stmt = "UPDATE Photos SET uri=%s WHERE username=%s"
                    cursor.execute(update_stmt, update_information)
                    db.commit()

                os.remove('../images/%s' % secure)

            # Clear the cache.
            cache.clear()

            return redirect("http://localhost:5173/profile/options/update")

        except RequestEntityTooLarge:
            return redirect(location="http://localhost:5173/profile/options/update", Response={"status": "You can only upload an image that is 1 MB or less."})
    
    except Exception as e:
        return redirect(location="http://localhost:5173/profile/options/update")
    
    finally:
        terminate_connection(db)
        

@server.route("/update_profile/name", methods=["PUT"])
@check_token
def update_name():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
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
            
            # Clear the cache.
            cache.clear()
            
            return jsonify({"message": "Successfully updated name!"}), 200
            
        except db.DatabaseError:
            return jsonify({"message": "Failed to update name."}), 500
        
    except db.DatabaseError:
        return jsonify({"message": "Failed to update name!"}), 500
    
    finally:
        terminate_connection(db)
        
        
@server.route("/update_profile/DOB", methods=["PUT"])
@check_token
def update_DOB():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        # Check if the user was lying about their DOB when they originally registered for an account.
        they_told_the_truth = determine_account_registration_age(cursor, request.cookies.get("username"), data["birth_month"], data["birth_date"], data["birth_year"])
        
        # If they did tell the truth about their DOB when originally registering for their account, 
        # they can go ahead and change it.
        if they_told_the_truth:
            statement = "UPDATE Users SET birth_month=%s, birth_date=%s, birth_year=%s WHERE username=%s"
            params = [data["birth_month"], data["birth_date"], data["birth_year"], request.cookies.get("username")]
            cursor.execute(statement, params)
            db.commit()
        
            # Clear the cache.
            cache.clear()
        
            return jsonify({"message": "Successfully updated birthday!"}), 200
        
        # Otherwise, insert their username into the Banned table to ban them from using the service.
        else:
            statement = "INSERT INTO Banned (username, time_banned, reason, ban_lift_time) VALUES (%s, %s, %s, %s)"
            params = [request.cookies.get("username"), "now()", "Registered for an account while underage", "now()"]
            cursor.execute(statement, params)
            db.commit()
            
            return jsonify({"message": "Failed to update birthday. You were underage when you originally registered for an account."}), 403

    except db.DatabaseError as e:
        print(e)
        return jsonify({"message": "Error updating date of birth!"}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/update_profile/username", methods=["PUT"])
@check_token
def update_username():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "UPDATE Users SET username=%s WHERE username=%s"
        params = [data["new_username"], request.cookies.get("username")]
        
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        new_username_cookie = make_response({"cookie": "%s" % data["new_username"]})
        new_username_cookie.set_cookie("username", data["new_username"], max_age=dt.timedelta(hours=2).seconds, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        
        return new_username_cookie
    
    except db.DatabaseError:
        return {"message": "Error updating username!"}
    
    finally:
        terminate_connection(db)
    
    
@server.route("/update_profile/height", methods=["PUT"])
@check_token
def update_height():
    data: dict = request.get_json()
    db: p.extensions.connection = create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    new_height: str = data["new_height_feet"] + "'" + data["new_height_inches"] + "''"
    
    try:
        statement: str = "UPDATE Profiles SET height=%s WHERE username=%s"
        params: list = [new_height, request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        return jsonify({"message": "Successfully updated height!"}), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Error updating height."}), 500
        
    finally:
        terminate_connection(db)
    
    
@server.route("/update_profile/gender", methods=["PUT"])
@check_token
def update_gender():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET gender=%s WHERE username=%s"
        params = [data["new_gender"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        return jsonify({"message": "Successfully updated gender!"}), 200
        
    except db.DatabaseError:
        return jsonify({"message": "Error updating gender."}), 500
        
    finally:
        terminate_connection(db)
        

@server.route("/update_profile/sexual_orientation", methods=["PUT"])
@check_token
def update_sexual_orientation():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET sexual_orientation=%s WHERE username=%s"
        params = [data["new_sexual_orientation"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        return jsonify({"message": "Successfully updated sexual orientation!"}), 200
        
    except db.DatabaseError:
        return jsonify({"message": "Error updating sexual orientation."}), 500
        
    finally:
        terminate_connection(db)
        

@server.route("/update_profile/relationship_status", methods=["PUT"])
@check_token
def update_relationship_status():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET relationship_status=%s WHERE username=%s"
        params = [data["new_relationship_status"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        return jsonify({"message": "Successfully updated relationship status!"}), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Error updating relationship status."}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/update_profile/bio", methods=["PUT"])
@check_token
def update_bio():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "UPDATE Profiles SET interests=%s WHERE username=%s"
        params = [data["new_bio"], request.cookies.get("username")]
        cursor.execute(statement, params)
        db.commit()
        
        # Clear the cache.
        cache.clear()
        
        return jsonify({"message": "Successfully updated bio!"}), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Error updating bio."}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/privacy/check_recommendation_settings", methods=["POST"])
@check_token
def check_recommendation_settings():
    username = request.cookies.get("username")
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "SELECT used, use_so_filter FROM Recommendation_Settings WHERE username=%s"
        params = [username]
        cursor.execute(statement, params)
        
        used = [{"used": records[0], "use_so_filter": records[1] if using_so_filter(username, cursor) else "false"} for records in cursor][0]
        
        return jsonify(used), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Failed to retrieve recommendation settings for user."}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/privacy/change_recommendation_settings", methods=["PUT"])
@check_token
def change_recommendation_settings():
    data = request.get_json()
    username = request.cookies.get("username")
    query = request.args.get('rs')
    
    db = create_connection()
    cursor = db.cursor()
    
    try:
        if query == 'match':
            params = [data["check_value"], username]
            statement = "UPDATE Recommendation_Settings SET used=%s WHERE username=%s"
            cursor.execute(statement, params)
            db.commit()
        
        elif query == 'so_filter':
            params = [data["check_value"], username]
            statement = "UPDATE Recommendation_Settings SET use_so_filter=%s WHERE username=%s"
            cursor.execute(statement, params)
            db.commit()
            
        else:
            return jsonify({"message": "Invalid query or request."}), 400
        
        return jsonify({"message": data["check_value"]}), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Failed to update recommendation settings."}), 500
    
    except Exception:
        return jsonify({"message": "A server error has occurred. Please try again later."})
    
    finally:
        terminate_connection(db)
 
 
@server.route("/privacy/download_data", methods=["POST", "GET"])
@check_token
def download_data():
    if request.method == "POST":
        # Retrieve payload information.
        requested_info = request.get_json()
        
        # Boolean variable that will act as a status marker
        # if the user requested data to be downloaded.
        user_requested_data = False
        
        # Dictionary containing user's information, which will then
        # be saved to a file and automatically downloaded to a user's
        # computer in JSON format.
        json_user_info = {}

        try:
            # Create database connection and cursor.
            db = create_connection()
            cursor = db.cursor()

            # Compare the confirmed password entered by the user after they have clicked the button
            # to download their data with their password stored in the database.
            cursor.execute("SELECT password FROM Users WHERE username=%s", [request.cookies.get("username")])
            
            # Retrieve the password.
            password = [p[0] for p in cursor][0]
            
            # Verify the entered password with the hash of the retrieved password.
            password_verified = bcrypt.check_password_hash(password, requested_info["confirmed_password"])
            
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
                        
                    return jsonify({"message": "Successfully downloaded data!"}), 200
                
                # Otherwise, cancel their request if they did not select any of the
                # following options.
                else:
                    return jsonify({"message": "User did not request data. Cancelling request..."}), 400
                
            # If not, return an error message telling the user that they entered the wrong password.
            else:
                return jsonify({"message": "Failed to verify password. Please try again."}), 403
        
        except db.DatabaseError:
            return jsonify({"message": "Failed to connect to database."}), 500
        
        except Exception as e:
            print(e)
            return jsonify({"message": "Exception was thrown"}), 500
        
        finally:
            terminate_connection(db)
    
    elif request.method == "GET":
        if os.path.isfile("user_info.json"):
            return send_file("user_info.json", as_attachment=True)


@server.route("/report_user", methods=["POST"])
@check_token
def report_user():
    db = create_connection()
    cursor = db.cursor()
    try:
        reporting_user = request.form['reporting-user']
        reported_user = request.form['reported-user']
        reason = request.form['reason-description']
        
        # To store any files uploaded by user.
        files_list = []
        
        # Default report status when user is making their report.
        status = "Pending"  
        
        # To store information that will be used to insert into the database.
        db_info = [reporting_user, reported_user, reason, "", "", "", status]
        
        try:
            # Section that separately handles each of the three files
            # provided that at least one of them was uploaded.
            if secure_filename(request.files['file1'].filename) != "":
                file1 = request.files['file1']
                secure_file1 = secure_filename(file1.filename)
                file1.save("../documents/%s" % secure_file1)
                files_list.append(secure_file1)
        
            if secure_filename(request.files['file2'].filename) != "":
                file2 = request.files['file2']
                secure_file2 = secure_filename(file2.filename)
                file2.save("../documents/%s" % secure_file2)
                files_list.append(secure_file2)
            
            if secure_filename(request.files['file3'].filename) != "":
                file3 = request.files['file3']
                secure_file3 = secure_filename(file3.filename)
                file3.save('../documents/%s' % secure_file3)
                files_list.append(secure_file3)
            
            db_info_index_for_docs = 3
            
            # Go through each file and store the base64 version into the db_info
            # array for use when inserting it into the database.      
            for file_doc in files_list:
                if os.path.isfile('../documents/%s' % file_doc):
                    with open('../documents/%s' % file_doc, "rb") as f:
                        current_file = f.read()
                        base64_encoding_file = base64.b64encode(current_file).decode('utf-8')
                        db_info[db_info_index_for_docs] = base64_encoding_file
                        db_info_index_for_docs += 1
                    
                    # Close and remove the file temporarily stored in the documents folder.
                    f.close()
                    os.remove("../documents/%s" % file_doc)
            
             
            query = "INSERT INTO Reports (reporting_user, reported_user, date_and_time, reason, document1, document2, document3, report_status) VALUES (%s, %s, now(), %s, %s, %s, %s, %s)"
            cursor.execute(query, db_info)
            
            return redirect("http://localhost:3000/privacy/options/view_blocked_users")
        
        except RequestEntityTooLarge as l:
            return {"message": l}
        
        except db.DatabaseError as e:
            return {"message": e}
        
        except Exception as e:
            return {"message": e}
        
    except Exception as e:
        return {"message": e}
    
    finally:
        terminate_connection(db)
        # Configure memory size back to 1 MB.
        server.config["MAX_CONTENT_LENGTH"] = 1 * 1000 * 1000


@server.route("/search", methods=['POST'])
@check_token
@cache.cached(timeout=300, key_prefix=search_results_cache)
def search():
    statement = '''
        SELECT P.*, U.birth_month, U.birth_date, U.birth_year, P2.uri FROM Profiles P, Users U, Photos P2 
        WHERE P.username!=%s AND P.username=U.username AND P.username=P2.username
        AND (P.username NOT IN (SELECT B.blockee FROM Blocked B WHERE (B.blockee=P.username AND B.blocker=%s))
        AND P.username NOT IN (SELECT B.blocker FROM Blocked B WHERE (B.blocker=P.username AND B.blockee=%s))
        AND P.username NOT IN (SELECT B.username FROM Banned B WHERE B.username=P.username))
        ORDER BY P.last_name, P.first_name
    '''
    
    db = create_connection()
    cursor = db.cursor()
    data = request.get_json()
    
    params = [data["username"] for u in range(0, 3)]
    
    try:
        cursor.execute(statement, params)
        
        search_results = [{
                            "username": results[0],
                            "first_name": results[1],
                            "middle_name": results[2],
                            "last_name": results[3],
                            "interests": results[4],
                            "height": results[5],
                            "gender": results[6],
                            "sexual_orientation": results[7],
                            "interested_in": results[8],
                            "state_residence": results[9],
                            "city_residence": results[10],
                            "relationship_status": results[11],
                            "birth_month": results[12],
                            "birth_date": results[13],
                            "birth_year": results[14],
                            "uri": bytes(results[15]).decode('utf-8')  
                          }
                          for results in cursor]
        
        return jsonify(search_results), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": "Failed to retrieve search terms! %s" % e}), 500
    
    finally:
        terminate_connection(db)


@server.route("/retrieve_search_history", methods=["POST"])
@check_token
def retrieve_search_history():
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = '''
            SELECT search_term FROM Search_History WHERE username=%s ORDER BY date_and_time DESC LIMIT 10
        '''
        username = request.cookies.get("username")
        params = [username]
        cursor.execute(statement, params)
        
        search_terms = [{"search_term": record[0]} for record in cursor]
        
        return jsonify(search_terms), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": e}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/insert_search_history", methods=["POST"])
@check_token
def insert_search_history():
    db = create_connection()
    cursor = db.cursor()
    data = request.get_json()
    
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
            return jsonify({"message": "Search term has been inserted!"}), 200

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
            return jsonify({"message": "Search term time has been updated!"}), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Could not find search term!"}), 500
    
    except Exception as e:
        return jsonify({"message": "Failed to insert or update search term."}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/clear_search_history", methods=["POST"])
@check_token
def clear_search_history():
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "DELETE FROM Search_History WHERE username=%s"
        params = [request.cookies.get("username")]
        
        cursor.execute(statement, params)
        db.commit()
        
        return jsonify({"message": "Search history cleared!"}), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": e}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/clear_search_history_term", methods=["POST"])
@check_token
def clear_search_history_term():
    search_term = request.args.get("search_term")
    username = request.cookies.get("username")
    params = [username, search_term]
    
    db = create_connection()
    cursor = db.cursor()
    
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
            
            return jsonify(updated_search_history), 200
        
        except db.DatabaseError as e:
            return jsonify({"message": "Failed to retrieve updated search history!"}), 500
        
    except db.DatabaseError as e:
        return jsonify({"message": "Invalid username or search term!"}), 500
    
    finally:
        terminate_connection(db)
        
        
@server.route("/get_user_profiles", methods=["POST"])
@check_token
# @cache.cached(timeout=300, key_prefix=user_profiles_cache_key)
def get_user_profiles():
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = '''
            SELECT P.username, P.interests, P.height, P.gender, P.sexual_orientation, 
            P.interested_in, P.state_residence, P.city_residence, P.relationship_status, 
            P.first_name, P.middle_name, P.last_name, P2.uri,
            U.birth_month, U.birth_date, U.birth_year, R.rating FROM Profiles P, 
            Photos P2, Users U, Ratings R WHERE P.username!=%s AND P.interests!='N/A' 
            AND P.username=P2.username AND P.username=U.username
            AND R.username=P.username
            AND (P.username NOT IN (SELECT B.blockee FROM Blocked B WHERE (B.blockee=P.username AND B.blocker=%s))
            AND P.username NOT IN (SELECT B.blocker FROM Blocked B WHERE (B.blocker=P.username AND B.blockee=%s))
            AND P.username NOT IN (SELECT B.username FROM Banned B WHERE B.username=P.username))
            ORDER BY last_name, first_name
        '''
        params = [request.cookies.get("username") for u in range(0, 3)]
        
        cursor.execute(statement, params)
        
        profiles = [
            {
                "username": record[0],
                "interests": record[1],
                "height": record[2],
                "gender": record[3],
                "sexual_orientation": record[4],
                "interested_in": record[5],
                "state_residence": record[6],
                "city_residence": record[7],
                "relationship_status": record[8],
                "first_name": record[9],
                "middle_name": record[10],
                "last_name": record[11],
                "uri": bytes(record[12]).decode('utf-8'),
                "birth_month": record[13],
                "birth_date": record[14],
                "birth_year": record[15],
                "rating": record[16]
            }
            for record in cursor
        ]
        
        return jsonify(profiles), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": "Failed to get basic profile details!"}), 500
    
    finally:
        terminate_connection(db)


@server.route("/get_logged_in_user_profile", methods=["POST"])
@check_token
# @cache.cached(timeout=300, key_prefix=logged_in_user_profile_cache_key)
def get_logged_in_user_profile():
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = '''
            SELECT P.username, P.interests, P.height, P.gender, P.sexual_orientation, 
            P.interested_in, P.state_residence, P.city_residence, P.relationship_status, 
            P.first_name, P.middle_name, P.last_name, P2.uri,
            U.birth_month, U.birth_date, U.birth_year, R.rating FROM Profiles P, 
            Photos P2, Users U, Ratings R WHERE P.username=%s AND P.interests!='N/A' 
            AND P.username=P2.username AND P.username=U.username
            AND R.username=P.username
            ORDER BY last_name, first_name
        '''
        params = [request.cookies.get("username") for u in range(0, 1)]

        cursor.execute(statement, params)
        
        profiles = [
            {
                "username": record[0],
                "interests": record[1],
                "height": record[2],
                "gender": record[3],
                "sexual_orientation": record[4],
                "interested_in": record[5],
                "state_residence": record[6],
                "city_residence": record[7],
                "relationship_status": record[8],
                "first_name": record[9],
                "middle_name": record[10],
                "last_name": record[11],
                "uri": bytes(record[12]).decode('utf-8'),
                "birth_month": record[13],
                "birth_date": record[14],
                "birth_year": record[15],
                "rating": record[16]
            }
            for record in cursor
        ]
        
        return jsonify(profiles), 200
    
    except db.DatabaseError as e:
        return jsonify({"message": "Failed to get basic profile details!"}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/check_messaged_users", methods=["POST"])
@check_token
def check_messaged_users():
    db = create_connection()
    cursor = db.cursor()
    try:
        statement = '''
            SELECT R.user1, R.user2, R.message, R.date_and_time 
            AS sent_time, P.first_name, P2.uri, UR.rating_type FROM Recent R 
            INNER JOIN Profiles P ON R.user1=%s AND R.user2=P.username
            AND (P.username NOT IN (SELECT B.blockee FROM Blocked B WHERE (B.blockee=P.username AND B.blocker=%s))
            AND P.username NOT IN (SELECT B.blocker FROM Blocked B WHERE (B.blocker=P.username AND B.blockee=%s))
            AND P.username NOT IN (SELECT B.username FROM Banned B WHERE B.username=P.username))
            INNER JOIN Photos P2 ON P.username=P2.username
            LEFT JOIN User_Rating_Labels UR ON UR.rater=R.user1 AND UR.ratee=R.user2
            ORDER BY sent_time DESC
        '''
        params = [request.cookies.get("username") for u in range(0, 3)]
        
        cursor.execute(statement, params)
        
        messages = [
            {
                "user1": record[0],
                "user2": record[1],
                "message": record[2],
                "sent_time": record[3],
                "first_name": record[4],
                "uri": bytes(record[5]).decode('utf-8'),
                "rating_type": record[6]
            }
            for record in cursor
        ]
        
        return jsonify(messages), 200

    except db.DatabaseError as e:
        print(e)
        return jsonify({"message": "Failed to retrieve messaged users."}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/retrieve_messages", methods=["POST"])
@check_token
def retrieve_messages():
    db: p.extensions.connection = create_connection()
    cursor: p.extensions.cursor = db.cursor()
    data = request.get_json()
    sender = request.cookies.get("username")
    
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
        
        return jsonify(messages), 200
        
    except db.DatabaseError as e:
        return jsonify({"message": "Failed to retrieve messages."}), 500
    
    finally:
        terminate_connection(db)
        
        
@server.route("/post_message", methods=["POST"])
@check_token
def post_message():
    db = create_connection()
    cursor = db.cursor()
    data = request.get_json()
    sender = request.cookies.get("username")
    
    try:
        statement = '''
            INSERT INTO Messages (message_from, message_to, date_and_time, message) 
            VALUES (%s, %s, now(), %s)
        '''
        params = [sender, data["recipient_user"], data["message"]]
        
        cursor.execute(statement, params)
        db.commit()
        
        # Variable that checks whether either the sender or recipient has messaged
        # one or the other.
        messaged = check_recent_message_records(cursor, sender, data["recipient_user"])
        
        if not messaged:
            statement = '''
                INSERT INTO Recent (user1, user2, message, date_and_time) VALUES (%s, %s, %s, now())
            '''
            params = [sender, data["recipient_user"], data["message"]]
            
            cursor.execute(statement, params)
            db.commit()
            
            statement = '''
                INSERT INTO Recent (user1, user2, message, date_and_time) VALUES (%s, %s, %s, now())
            '''
            params = [data["recipient_user"], sender, data["message"]]
            
            cursor.execute(statement, params)
            db.commit()
        
        else:
            statement = '''
                UPDATE Recent SET message=%s, date_and_time=now()
                WHERE (user1=%s AND user2=%s) OR (user1=%s AND user2=%s)
            '''
            params = [data["message"], sender, data["recipient_user"], 
                      data["recipient_user"], sender]
            
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
                
                return jsonify(messages), 200
            
            except db.DatabaseError:
                return jsonify({"message": "Failed to retrieve new messages."}), 500
        
        except db.DatabaseError:
            return jsonify({"message": "Failed to update notification counter."}), 500
        
    except db.DatabaseError as e:
        return jsonify({"message": "Message failed to send."}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/retrieve_message_profile_pics", methods=["POST"])
@check_token
def retrieve_message_profile_pics():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
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
        
        return jsonify(receiver_profile_pic), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Message failed to send."}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/retrieve_notification_count", methods=["POST"])
@check_token
def retrieve_notification_count():
    username = request.args.get("username")
    db = create_connection()
    cursor = db.cursor()
    
    if username:
        try:
            statement = "SELECT notification_counter FROM Notifications WHERE username=%s"
            params = [username]
            cursor.execute(statement, params)
            
            notification_count = [{"notification_counter": record[0]} for record in cursor][0]
            
            return jsonify(notification_count), 200

        except db.DatabaseError:
            return jsonify({"message": "Failed to retrieve notification count for user!"}), 500
        
        finally:
            terminate_connection(db)
    
    else:
        return jsonify({"message": "Missing username for query parameter."}), 400
        
        
@server.route("/clear_notification_count", methods=["PUT"])
@check_token
def clear_notification_count():
    username = request.args.get("username")
    db = create_connection()
    cursor = db.cursor()
    
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
            
            return jsonify(notification_count), 200
        
        except db.DatabaseError:
            return jsonify({"message": "Failed to retrieve notification counter."}), 500
        
    except db.DatabaseError:
        return jsonify({"message": "Failed to clear notification counter."}), 500
    
    finally:
        terminate_connection(db)
        
        
@server.route("/update_password", methods=["PUT"])
@check_token
def update_password():
    data = request.get_json()
    username = request.cookies.get("username")
    new_password = bcrypt.generate_password_hash(data["new_password"], 10).decode('utf-8')
    
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = "SELECT password FROM Users WHERE username=%s"
        params = [username]
        cursor.execute(statement, params)
        
        selected_password = [{"password": record[0]} for record in cursor][0]
        
        password_verified = bcrypt.check_password_hash(selected_password["password"], data["old_password"])
        
        if password_verified:
            try:
                statement = "UPDATE Users SET password=%s WHERE username=%s"
                params = [new_password, username]
                cursor.execute(statement, params)
                db.commit()
                
                return jsonify({"message": "Password successfully updated!"}), 200
            
            except db.DatabaseError:
                return jsonify({"message": "Password failed to update!"}), 500
        else:
            return jsonify({"message": "You typed in your old password incorrectly."}), 403
    
    except db.DatabaseError:
        return jsonify({"message": "Failed to execute query!"}), 500
    
    finally:
        terminate_connection(db)
        

@server.route("/delete_account", methods=["POST"])
@check_token
def delete_account():
    # Retrieve username from cookie.
    username: str = request.cookies.get("username")

    # Stores inputted password from client.
    data: dict = request.get_json()
    
    # Initialize the database connection and cursor.
    db: p.extensions.connection = create_connection()
    cursor: p.extensions.cursor = db.cursor()
    
    try:
        # Verify password before proceeding with actual account deletion.
        statement: str = "SELECT password FROM Users WHERE username=%s"
        params: list = [username]
        cursor.execute(statement, params)
        
        retrieved_password = [db_pwd[0] for db_pwd in cursor.fetchall()][0]
        
        password_verified: bool = bcrypt.check_password_hash(retrieved_password, data["password"])
        
        if password_verified:
            statement: str = "DELETE FROM Users WHERE username=%s"
            params: list = [username]
            cursor.execute(statement, params)
            db.commit()
            
            session_cookie = make_response({"message": "Session terminated."})
            
            session_cookie.set_cookie('user_session', value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
            session_cookie.set_cookie('username', value="", max_age=0, path="/", domain="localhost", secure=True, httponly=True, samesite='strict')
        
            return session_cookie

        else:
            return jsonify({"message": "Incorrect password!"}), 401
    
    except db.DatabaseError:
        return jsonify({"message": "Failed to delete account!"}), 500
    
    finally:
        terminate_connection(db)
    
    
@server.route("/block", methods=["POST"])
@check_token
def block():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
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
                    
                    cache.clear()
                    
                    return jsonify({"message": "Blocked user."}), 200
                    
                except db.DatabaseError as e:
                    return jsonify({"message": "Failed to block user."}), 500
            
            
            # Redirects user to their profile page in the event where they attempt
            # to block another user, but the latter had already performed the operation
            # earlier.            
            else:
                return redirect("http://localhost:3000/")
        
        except db.DatabaseError:
            return jsonify({"message": "Failed to check edge case."}), 500
        
        finally:
            terminate_connection(db)
    
    # Otherwise, remove the block.
    else:
        # Execute query using the blocker's username to retrieve the blocked user's block status
        # in order to release said block.
        try:
            statement = "DELETE FROM Blocked WHERE blocker=%s AND blockee=%s"
            params = [username, data["profile_user"]]
            
            cursor.execute(statement, params)
            db.commit()
            cache.clear()
            
            return jsonify({"message": "You have unblocked %s." % data["profile_user"]}), 200
        
        except db.DatabaseError:
            return jsonify({"message": "Failed to unblock user."}), 500
        
        finally:
            terminate_connection(db)
            

@server.route("/retrieve_blocked_users", methods=["POST"])
@check_token
def retrieve_blocked_users():
    username = request.cookies.get("username")
    
    db = create_connection()
    cursor = db.cursor()
    
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
        
        return jsonify(blocked_users), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Failed to retrieve blocked users."}), 500
    
    finally:
        terminate_connection(db)
    

@server.route("/retrieve_block_status", methods=["POST"])
@check_token
def retrieve_block_status():
    data = request.get_json()
    db = create_connection()
    cursor = db.cursor()
    
    try:
        statement = '''
            SELECT B.blockee, P.uri from Blocked B, Photos P 
            WHERE (B.blocker=%s AND B.blockee=%s) OR (B.blocker=%s AND B.blockee=%s) 
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
        
        return jsonify(user_block_status), 200
    
    except db.DatabaseError:
        return jsonify({"message": "Could not retrieve information!"}), 500
    
    finally:
        terminate_connection(db)

    
# WILL BE DONE AT A LATER DATE.
# Feature will be postponed until further notice.
@server.route("/get_location", methods=["POST"])
@check_token
def get_location():
    try:
        location_info = request.get_json()
        
        return {"status": "Works!"}
    
    except Exception as e:
        return {"message": e}
    
    
@server.route("/rating", methods=["POST"])
@check_token
def rating():
    db = create_connection()
    cursor = db.cursor()
    try:
        rating_type = request.args.get('rt')
        username = request.args.get('user')
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
        
        # Retrieve message records containing the updated rating type and send them back to the client
        # to update the logged in user's recent messages feed.
        statement = '''
            SELECT R.user1, R.user2, R.message, R.date_and_time AS sent_time, P.first_name, P2.uri, UR.rating_type FROM Recent R 
            INNER JOIN Profiles P ON R.user1=%s AND R.user2=P.username
            AND (P.username NOT IN (SELECT B.blockee FROM Blocked B WHERE (B.blockee=P.username AND B.blocker=%s))
            AND P.username NOT IN (SELECT B.blocker FROM Blocked B WHERE (B.blocker=P.username AND B.blockee=%s))
            AND P.username NOT IN (SELECT B.username FROM Banned B WHERE B.username=P.username))
            INNER JOIN Photos P2 ON P.username=P2.username
            LEFT JOIN User_Rating_Labels UR ON UR.rater=R.user1 AND UR.ratee=R.user2
            ORDER BY sent_time DESC
        '''
        
        # Print the logged in user's name three times to fill in the necessary parameters in the statement above.
        rating_list_parameters = [logged_in_user for u in range(0, 3)]
        
        # Execute the statement using the parameters in the rating_list_parameters list.
        cursor.execute(statement, rating_list_parameters)
        
        # Include data in dictionary format to display on the website once it is sent to and retrieved by the client (the front end).
        records = [{
                    "user1": record[0], 
                    "user2": record[1], 
                    "message": record[2], 
                    "sent_time": record[3], 
                    "first_name": record[4], 
                    "uri": bytes(record[5]).decode('utf-8'), 
                    "rating_type": record[6]
                    } 
                    for record in cursor]
        
        # Return the updated data in JSON format.
        return jsonify(records), 200
        
    except Exception as e:
        print(e)
        return jsonify({"status": e}), 500
    
    finally:
        terminate_connection(db)


@server.route("/match", methods=["POST"])
@check_token
# @cache.cached(timeout=300, key_prefix=match_algo_cache)
def match():
    try:
        # Stores payload information sent from the client as an object variable.
        request_info = request.get_json()
        
        # Run matching algorithm using the list of profiles (excluding the current user) to compare with the
        # profile of the logged in user.
        matches = run_matching_algorithm(user_profiles=request_info["users"], logged_in_user_profile=request_info["logged_in_user"], use_so_filter=request_info["use_so_filter"])
        
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
        
    except KeyError as k:
        print(f"Key error: {k}")
        return jsonify({"message": "Failed to retrieve information from dictionary."}), 500
    
    except Exception as e:
        print(e)
        return jsonify({"message": "An unknown error has occurred."}), 500

if __name__ == "__main__":
    # serve(server, host='0.0.0.0', port=5000)
    server.run(port=5000, debug=True)