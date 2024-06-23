from passlib.context import CryptContext
from fastapi import HTTPException, Request
import psycopg2 as p
import datetime as dt
import jwt

context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Verifies user age when they register for an account, or if they change their
# date of birth in their account settings.  
async def verify_age(age: int, state_residence: str) -> bool:
    # If the user resides in Alabama or Nebraska, and are 19 or older,
    # then allow them to register for an account.
    if (state_residence == 'Alabama' or state_residence == 'Nebraska') and (age >= 19):
        return True

    # Otherwise, don't let them.
    elif ((state_residence == 'Alabama' or state_residence == 'Nebraska') and (age < 19)):
        return False
    
    # If the user's state residence is in Mississippi, and they 21 or above,
    # they can register for an account.
    elif (state_residence == 'Mississippi' and age >= 21):
        return True
    
    # Otherwise, don't let them.
    elif (state_residence == 'Mississippi' and age < 21):
        return False

    # If the user resides in another state other than Alabama, Nebraska, or Mississippi,
    # and they are 18 or older, they can register for an account.
    #
    # Otherwise, they are not allowed to do so.  
    elif (state_residence != 'Alabama' or state_residence != 'Nebraska' or state_residence != 'Mississippi'):
        if age >= 18:
            return True
        else:
            return False

    # In the very rare case where none of the statements above are true,
    # return False to indicate that the user is not allowed to register
    # for an account.
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
async def determine_account_registration_age(cursor: p.extensions.cursor, 
                                             username: str, 
                                             new_birth_month: str, 
                                             new_birth_date: str, 
                                             new_birth_year: str) -> bool:
              
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
    if await verify_age(age, state_residence):
        return True
    
    # However, if they were underage, their account is banned.
    else:
        return False
    
# Function that verifies the user's credentials.
async def user_verified(username: str, password: str, cursor: p.extensions.cursor) -> bool:
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
        password_verified = context.verify(password, user["password"])
        username_verified = True if user["username"] == username else False
        
        # If both the username and password are verified, return True.
        if username_verified and password_verified:
            return True
        
        # Otherwise, return False.
        else:
            return False
        
async def session_count(username: str, cursor: p.extensions.cursor) -> int:
    statement = "SELECT * FROM view_session_count(%s)"
    params = [username]
    cursor.execute(statement, params)

    session_count: int = cursor.fetchall()[0][0]

    return session_count

async def insert_session(username: str, token: str, db: p.extensions.connection, cursor: p.extensions.cursor) -> bool:
    statement = "CALL insert_session(%s, %s)"
    params = [username, token]
    cursor.execute(statement, params)

    s_count: int = await session_count(username, cursor)

    if s_count < 3:
        db.commit()
        return True
 
    return False
    
async def delete_session(username: str, token: str, db: p.extensions.connection, cursor: p.extensions.cursor) -> None:
    statement = "CALL delete_session(%s, %s)"
    params = [username, token]
    cursor.execute(statement, params)
    db.commit()

async def verify_session(username: str, token: str, db_key: str, sk_key: str, request: Request) -> bool:
    # Connect to the database.
    db = p.connect(db_key)
    cursor = db.cursor()

    # Retrieved the stored token from the database.
    statement = "SELECT * FROM retrieve_session(%s, %s)"
    params = [username, token]
    cursor.execute(statement, params)

    # Store the retrieved token in the list.
    retrieved_token: list = [token for token in cursor]

    # Edge case to ensure that the list is not empty and to prevent
    # an IndexError exception from being raised.
    if retrieved_token:
        # Retrieve the token from the tuple in the list
        # in its string form.
        db_token: str = retrieved_token[0][0]

        decode_db_token: dict = jwt.decode(db_token, sk_key, algorithms=['HS256'], verify=True)

        # Decode the token. If successful, return True to indicate that the
        # session has been verified.
        if decode_db_token and decode_db_token["iss"] == request.headers.get('referer'):
            return True
        
        # Otherwise, return False.
        else:
            return False
    
    # If there is nothing in the list, then return False,
    # thus invalidating the session.
    else:
        return False
        
# Function that retrieves user's profile picture.
async def retrieve_profile_pic(username: str, db: p.extensions.connection) -> str:
    cursor = db.cursor()
    
    statement = "SELECT uri FROM Photos WHERE username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    photo = [record[0] for record in cursor.fetchall()]
    
    if not photo:
        return ""
    
    photo = photo[0]
    photo = bytes(photo).decode('utf-8')
    
    return photo
    
# Function that updates the visit count of the current user to a specific profile,
# regardless of whether they have visited it or not.
async def log_visit(username: str, 
                    visiting_user_username: str, 
                    db: p.extensions.connection, 
                    cursor: p.extensions.cursor) -> None:  
    
    # Create a log to keep track of the times that a user has
    # visited a specific profile.
    statement = "CALL create_visitor_log(%s, %s, %s)"
    params = [username, visiting_user_username, "now()"]
    cursor.execute(statement, params)
    db.commit()

# Function that calculates the age of the user.
def retrieve_age(month: str, date: int, year: int) -> int:
    month_index: dict = {
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

    birth_date = dt.datetime(year, month_index[month], date)
    next_birth_date = dt.datetime(dt.datetime.now().year, month_index[month], date)
    today_date = dt.datetime.now()

    age = today_date.year - birth_date.year

    if today_date < next_birth_date:
        age = age - 1

    return age

# Function that checks whether a user is banned or not.
async def retrieve_banned_user(db: p.extensions.connection, username: str) -> dict[any, any]:
    cursor: p.extensions.cursor = db.cursor()
        
    statement = "SELECT username FROM Banned WHERE username=%s"
    params = [username]
    cursor.execute(statement, params)
    
    keys = [attr.name for attr in cursor.description]
    values = [value for value in cursor.fetchall()]
    
    user = {key: value[0] for key, value in zip(keys, values) if keys and values}
    
    return user