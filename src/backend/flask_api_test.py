import pytest
from server import server
import os
import psycopg2
from dotenv import load_dotenv
import jwt
import json

load_dotenv('secret.env')
db = psycopg2.connect(os.getenv('DB_KEY'))
cursor = db.cursor()

# ==================================================================================================== #
# Code reference for creating client: https://flask.palletsprojects.com/en/2.0.x/testing/
def server_client():
    return server.test_client()
# ==================================================================================================== #

# ======================================= HELPER FUNCTION(S) ========================================= #
# Creates and signs up a dummy user whenever one of the tests requires it.
def create_dummy_user(dummy_user={}):    
    # Create and store the dummy user in the database.
    create_dummy_user = server_client().post('/signup', json=dummy_user)
    assert create_dummy_user.status_code == 200
    
    return create_dummy_user

# Deletes dummy user from the database.
def delete_dummy_user(dummy_user={}, db=psycopg2.extensions.connection, cursor=psycopg2.extensions.cursor):
    username = dummy_user["username"]
    statement = "DELETE FROM Users WHERE username=%s"
    params = [username]
    
    cursor.execute(statement, params)
    db.commit()

# Simple function that filters user search results based on the term the user enters into a search
# bar. Note that this function is not the same as the one defined in JavaScript, but has a similar
# implementation nonetheless.
def filter_search_results(results=[{}], search_term=""):
    filtered_results = list(filter(lambda r: r["first_name"][0:len(search_term)].lower() == search_term.lower(), results))
    return filtered_results
# ==================================================================================================== #

# Test to see if the REST API works. It does not do much,
# but is just a simple test to make sure that the server
# is active.
def test_simple_route():
    simple_response = server_client().get('/')
    assert bytes(simple_response.data).decode('utf-8').replace("\n", "") == '{"status":"Working!"}'
    assert simple_response.status_code == 200

# Given that I am a user, I want to be able to sign up for an account.
# When I enter my information into the sign up form,
# And I click the check button to verify I am old enough to sign up,
# And I click the sign up button,
# Then I should be able to sign up for an account.   
def test_signup():
    # Dummy user information.
    user_info = {
        "first_name": "Kathy",
        "middle_name": "Adriana",
        "last_name": "Wood",
        "username": "kathy.a.wood",
        "password": "password123",
        "birth_month": "January",
        "birth_date": "20",
        "birth_year": "1998",
        "state": "California",
        "city": "San Francisco",
        "height_feet": "5",
        "height_inches": "5",
        "gender": "Female",
        "sexual_orientation": "Heterosexual",
        "interested_in": "Men",
        "relationship_status": "Single",
        "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
        "age": 23,
        "pic": "test_user.jpg"
    }
    # Send the dummy user informaiton to the /signup route.
    signup_response = server_client().post('/signup', json=user_info)
    
    # Subsequently delete the dummy user from the database.
    delete_dummy_user(user_info, db, cursor)
    
    # Ensure that the request returns an HTTP status code of 200 to indicate that
    # the request was successful.
    assert signup_response.status_code == 200
    
def test_signup_if_underage():
    # Test the same user from the previous function testing the
    # signup function, but is 17 years old, 1 year younger than
    # the minimum age requirement of 18.
    user_info = {
        "first_name": "Kathy",
        "middle_name": "Adriana",
        "last_name": "Wood",
        "username": "kathy.a.wood",
        "password": "password123",
        "birth_month": "January",
        "birth_date": "20",
        "birth_year": "1998",
        "state": "California",
        "city": "San Francisco",
        "height_feet": "5",
        "height_inches": "5",
        "gender": "Female",
        "sexual_orientation": "Heterosexual",
        "interested_in": "Men",
        "relationship_status": "Single",
        "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
        "age": 17,
        "pic": "test_user.jpg"
    }
    
    # Attempt to enter dummy user in database.
    signup_response = server_client().post('/signup', json=user_info)
    
    # Ensure that the response returns an HTTP status code of 403
    # to indicate that the user is underage and therefore,
    # is unable to register for an account.
    assert signup_response.status_code == 403

# Test the login feature to see if the user session token is maintained
# after the user is done logging in.   
def test_login():
    # Dummy user information.
    user_info = {
        "first_name": "Kathy",
        "middle_name": "Adriana",
        "last_name": "Wood",
        "username": "kathy.a.wood",
        "password": "password123",
        "birth_month": "January",
        "birth_date": "20",
        "birth_year": "1998",
        "state": "California",
        "city": "San Francisco",
        "height_feet": "5",
        "height_inches": "5",
        "gender": "Female",
        "sexual_orientation": "Heterosexual",
        "interested_in": "Men",
        "relationship_status": "Single",
        "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
        "age": 23,
        "pic": "test_user.jpg"
    }
    
    # Sign up the user.
    signup_response = create_dummy_user(user_info)
    
    assert type(signup_response.json) == dict
    assert signup_response.status_code == 200
    
    # Run the POST request for the /login route to sign the user in.
    token_response = server_client().post('/login', data={"username": user_info["username"], "password": user_info["password"]})
    
    # Ensure that the request was successful with a valid generated
    # token.
    assert token_response.status_code == 200
    assert token_response.json["token"] != None
    assert jwt.decode(token_response.json["token"], os.getenv('SK_KEY'), algorithms=['HS256'], verify=True) != None
    
    # Set user_session and username cookies to test out /check_login route.
    check_login_response = server_client()
    check_login_response.set_cookie('user_session', token_response.json["token"])
    check_login_response.set_cookie('username', user_info["username"])
    final_response = check_login_response.post('/check_login')

    # Verify that the original response maintains and returns a status code of 200.
    assert final_response.status_code == 200
    
    # Verify that the login has been verified.
    assert final_response.json["verified"] == True
    
    # Delete the dummy user from the database.
    delete_dummy_user(user_info, db, cursor)

# Test the login feature if a user has an invalid token.    
def test_login_with_invalid_token():
    check_login_response = server_client()
    check_login_response.set_cookie('user_session', 'invalid_token')
    check_login_response.set_cookie('username', 'invalid_user')
    final_response = check_login_response.post('/check_login')
    
    # Ensure that the final response returns a status code of 498 (for invalid tokens)
    # and a final response message of "Invalid token!".
    assert final_response.status_code == 498
    assert final_response.json["message"] == "Invalid token!"
    
def test_retrieve_profile_information():
    # Dummy user information.
    dummy_user = {
        "first_name": "William",
        "middle_name": "James",
        "last_name": "Griffin",
        "username": "william.j.griff01",
        "password": "william123",
        "birth_month": "June",
        "birth_date": "13",
        "birth_year": "2001",
        "state": "Texas",
        "city": "Houston",
        "height_feet": "6",
        "height_inches": "2",
        "gender": "Male",
        "sexual_orientation": "Heterosexual",
        "interested_in": "Women",
        "relationship_status": "Married",
        "interests": "Gardening, Reading, Writing Code, and Playing Video Games",
        "age": 22,
        "pic": "william_user.jpg"
    }
    
    # Sign up the dummy user.
    signup_response = create_dummy_user(dummy_user)
    
    # Assert that the sign up was successful.
    assert signup_response.status_code == 200
    assert type(signup_response.json) == dict
    
    # Log the user in.
    login = server_client().post('/login', data={"username": dummy_user["username"], "password": dummy_user["password"]}) 
    
    # Retrieve the user's profile information.
    profile = server_client()
    profile.set_cookie('user_session', login.json["token"])
    profile.set_cookie('username', dummy_user["username"])
    profile_res = profile.post('/profile')

    # Store profile information in JSON dictionary.
    profile_information = profile_res.json
    
    # Cross-reference the values in the profile_information dictionary with those
    # in the dummy_user dictionary.
    assert dummy_user["first_name"] == profile_information["first_name"]
    assert dummy_user["middle_name"] == profile_information["middle_name"]
    assert dummy_user["last_name"] == profile_information["last_name"]
    assert dummy_user["username"] == profile_information["username"]
    assert dummy_user["interests"] == profile_information["interests"]
    assert dummy_user["height_feet"] + "'" + dummy_user["height_inches"] + "''" == profile_information["height"]
    assert dummy_user["gender"] == profile_information["gender"]
    assert dummy_user["sexual_orientation"] == profile_information["sexual_orientation"]
    assert dummy_user["relationship_status"] == profile_information["relationship_status"]
    assert dummy_user["birth_month"] == profile_information["birth_month"]
    assert dummy_user["birth_date"] == profile_information["birth_date"]
    assert dummy_user["birth_year"] == profile_information["birth_year"]
    
    # Clear the dummy user after performing all of the tests.
    delete_dummy_user(dummy_user, db, cursor)
   
# Test the /update_profile/DOB route to see if the user is able to update their DOB
# provided that they registered for an account if they were at least 18 years old or
# older--depending on their jurisdiction's age of majority--when they registered for
# an account.
def test_update_profile_DOB():
    # Dummy user information.
    dummy_user_1 = {
        "first_name": "Kimberly",
        "middle_name": "Elizabeth",
        "last_name": "Hernandez",
        "username": "kimmy_liz_hdz00",
        "password": "kimmypassword123",
        "birth_month": "August",
        "birth_date": "11",
        "birth_year": "2001",
        "state": "Texas",
        "city": "San Antonio",
        "height_feet": "5",
        "height_inches": "8",
        "gender": "Non-Binary",
        "sexual_orientation": "Pansexual",
        "interested_in": "Anyone",
        "relationship_status": "Single",
        "interests": "Writing poems, reading books, and watching movies",
        "age": 22,
        "pic": "kimmy_pic.jpg"
    }

    dummy_user_2 = {
        "first_name": "Eduardo",
        "middle_name": "Marcos",
        "last_name": "Hernandez",
        "username": "lalo_hernandez",
        "password": "thereallalo!",
        "birth_month": "January",
        "birth_date": "25",
        "birth_year": "1998",
        "state": "Texas",
        "city": "San Antonio",
        "height_feet": "6",
        "height_inches": "4",
        "gender": "Male",
        "sexual_orientation": "Heterosexual",
        "interested_in": "Women",
        "relationship_status": "Taken",
        "interests": "Driving sports cars, boxing, and hitting the gym",
        "age": 26,
        "pic": "lalo_hernandez_profile_pic.jpg"
    }
    
    # Create and store the dummy users in the database.
    signup_dummy_user_1 = create_dummy_user(dummy_user_1)
    signup_dummy_user_2 = create_dummy_user(dummy_user_2)
    
    # Assert that the signup was successful for both operations.
    assert signup_dummy_user_1.status_code == 200
    assert signup_dummy_user_2.status_code == 200
    
    # Generate a login session for each user.
    generate_dummy_user_1_token = server_client().post('/login', data={'username': dummy_user_1["username"], 'password': dummy_user_1["password"]})
    generate_dummy_user_2_token = server_client().post('/login', data={'username': dummy_user_2["username"], 'password': dummy_user_2["password"]})

    # Check that the login requests for each user have been successful.
    assert generate_dummy_user_1_token.status_code == 200
    assert generate_dummy_user_2_token.status_code == 200
    assert type(generate_dummy_user_1_token.json) == dict
    assert type(generate_dummy_user_2_token.json) == dict
    assert "token" in generate_dummy_user_1_token.json
    assert "token" in generate_dummy_user_2_token.json
    
    # Update dummy_user_2's account creation date from 5 years ago as part of the
    # "sad path" test case.
    update_dummy_user_2_acct_creation_date = "UPDATE Users SET account_creation_timestamp=%s WHERE username=%s"
    params = ["2016-01-23", dummy_user_2["username"]]
    cursor.execute(update_dummy_user_2_acct_creation_date, params)
    db.commit()

    # Now that the tokens are generated, let's update the birthdays of each user.
    # ===========================================================================
    # First, change the birthday of dummy_user_1.
    update_dummy_user_1_DOB = server_client()
    update_dummy_user_1_DOB.set_cookie('user_session', generate_dummy_user_1_token.json["token"])
    update_dummy_user_1_DOB.set_cookie('username', dummy_user_1["username"])
    new_dob_dummy_user_1_res = update_dummy_user_1_DOB.put('/update_profile/DOB', json={"birth_month": "August", "birth_date": "11", "birth_year": "2001"})
    
    # Ensure that the request was successful. Because the user was of age when they registered
    # for an account, they should not be banned from using the website.
    assert new_dob_dummy_user_1_res.status_code == 200
    
    # To verify this, check the Banned table in the database to see if the user is in
    # the table.
    cursor.execute("SELECT username FROM Banned WHERE username=%s", [dummy_user_1["username"]])
    banned_user = cursor.fetchone()
    
    # Assert that the banned_user variable is None for dummy_user_1.
    assert banned_user == None
    
    # Next, change the birthday of dummy_user_2, but this time, change their DOB
    # to one that could potentially make them underage when they registered for
    # their account. The user should subsequently be banned from using the website.
    update_dummy_user_2_DOB = server_client()
    update_dummy_user_2_DOB.set_cookie('user_session', generate_dummy_user_2_token.json["token"])
    update_dummy_user_2_DOB.set_cookie('username', dummy_user_2["username"])
    new_dob_dummy_user_2_res = update_dummy_user_2_DOB.put('/update_profile/DOB', json={"birth_month": "January", "birth_date": "25", "birth_year": "2006"})
    
    # Unlike dummy_user_1, dummy_user_2 should not be able to update their DOB.
    # Therefore, their request should return a status code of 403.
    assert new_dob_dummy_user_2_res.status_code == 403
    
    # Because dummy_user_2 is underage, they should be banned from using the website.
    # To check if they are banned, check the Banned table in the database to see if
    # their username is in the table.
    cursor.execute("SELECT username FROM Banned WHERE username=%s", [dummy_user_2["username"]])
    banned_user = cursor.fetchone()
    
    # Assert that the banned_user variable is not None for dummy_user_2.
    assert banned_user != None
    
    # Delete the users from the database after performing all of the tests.
    cursor.execute("DELETE FROM Users WHERE username=%s", [dummy_user_1["username"]])
    db.commit()
    cursor.execute("DELETE FROM Users WHERE username=%s", [dummy_user_2["username"]])
    db.commit()
 
# Given that I am a user, I want to be able to search for other users.
# When I type in a search query,
# And I enter the search query into the search bar,
# Then I should be able to see filtered search results based on the search query.
def test_search():
    # Dummy user information.
    dummy_user = {
        "first_name": "Kimberly",
        "middle_name": "Elizabeth",
        "last_name": "Hernandez",
        "username": "kimmy_liz_hdz00",
        "password": "kimmypassword123",
        "birth_month": "August",
        "birth_date": "11",
        "birth_year": "2001",
        "state": "Texas",
        "city": "San Antonio",
        "height_feet": "5",
        "height_inches": "8",
        "gender": "Non-Binary",
        "sexual_orientation": "Pansexual",
        "interested_in": "Anyone",
        "relationship_status": "Single",
        "interests": "Writing poems, reading books, and watching movies",
        "age": 22,
        "pic": "kimmy_pic.jpg"
    }
    
    # Sign up dummy user.
    signup_dummy_user = create_dummy_user(dummy_user)
    
    # Assert that the user was successfully signed up.
    assert type(signup_dummy_user.json) == dict
    assert signup_dummy_user.status_code == 200

    # Generate a token for the dummy user.
    login = server_client().post('/login', data={'username': dummy_user["username"], 'password': dummy_user["password"]})
    
    # Check that the user was successfully logged in.
    assert type(login.json) == dict
    assert login.status_code == 200
    assert "token" in login.json
    
    # Decode the byte object into a UTF-8 string and then strip down the string of its '\n'
    # characters and replace them with an empty string character.
    token = login.json["token"]
    
    # Configure the cookies needed for the request and send the information in a JSON format
    # to the /search route.
    get_search_results = server_client()
    get_search_results.set_cookie('user_session', token)
    get_search_results.set_cookie('username', dummy_user["username"])
    search_results_response = get_search_results.post('/search', json={"username": dummy_user["username"]})
    
    # Ensure that the response was successfully completed.
    assert search_results_response.status_code == 200
    assert len(search_results_response.data) != 0
    
    # Convert the byte object from the response of the /search route into a dictionary object.
    search_results = json.loads(search_results_response.data.decode('utf-8').replace("\n", ""))
    
    # Because the actual search filter function is defined in JavaScript, a similar implementation
    # will be done in Python to see if the results are successfully filtered based on a
    # user's first name.
    
    # There will be three test cases where a different search term is entered, which would then
    # produce different filtered results.
    #
    # Three test cases are written to perform the following: 
    # 1. Look for a user's first name 
    # 2. Their own name 
    # 3. And a partially complete search term of a user's first name.
    filtered_results_1, filtered_results_2, filtered_results_3 = filter_search_results(search_results, "test"), filter_search_results(search_results, "Kimberly"), filter_search_results(search_results, "tes")
    
    # Check if the search results are filtered or not based on the search term entered into the search bar.
    assert len(filtered_results_1) >= 1
    assert len(filtered_results_2) == 0
    assert len(filtered_results_3) >= 1
    
    # Clear the dummy user after performing all of the tests.
    delete_dummy_user(dummy_user, db, cursor)
    db.close()
    
if __name__ == "__main__":
    pytest.main()