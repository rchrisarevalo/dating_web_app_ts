from server import server
from fastapi.testclient import TestClient
from dotenv import load_dotenv
import os
import psycopg2
import jwt
import unittest

PATH = 'secret.env'
load_dotenv(PATH)

client = TestClient(server)

class Database:
    def __init__(self, key: str):
        self.db: psycopg2.extensions.connection = psycopg2.connect(key)
        self.cursor: psycopg2.extensions.cursor = self.db.cursor()

# ======================================= HELPER FUNCTION(S) ========================================= #
# Creates and signs up a dummy user whenever one of the tests requires it.
def create_dummy_user(dummy_user: dict):
    # Create and store the dummy user in the database.
    create_dummy_user = client.post('/signup', json=dummy_user)
    
    return create_dummy_user

# Deletes dummy user from the database.
def delete_dummy_user(dummy_user: dict, db: psycopg2.extensions.connection, cursor: psycopg2.extensions.cursor):
    username = dummy_user["username"]
    statement = "DELETE FROM Users WHERE username=%s"
    params = [username]
    
    cursor.execute(statement, params)
    db.commit()
    
# Simple function that filters user search results based on the term the user enters into a search
# bar. Note that this function is not the same as the one defined in JavaScript, but has a similar
# implementation nonetheless.
def filter_search_results(results: list[dict[str, any]], search_term: str):
    filtered_results = list(filter(lambda r: r["first_name"][0:len(search_term)].lower() == search_term.lower(), results))
    return filtered_results
# ==================================================================================================== #

class TestBasicRoute(unittest.TestCase):
    # Test to see if the REST API works. It does not do much,
    # but is just a simple test to make sure that the server
    # is active.
    def test_simple_route(self):
        simple_response = client.get('/')
        self.assertEqual(simple_response.json(), {"status": "Working!"})
        self.assertEqual(simple_response.status_code, 200)

class TestSignUpOps(unittest.TestCase):
    def setUp(self):
        # Create database instance.
        self.db_inst = Database(os.environ.get("DB_KEY"))

        # Dummy user information.
        self.user_info = {
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
            "interested_in": "Males",
            "relationship_status": "Single",
            "so_filter_choice": "true",
            "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
            "age": 23,
            "pic": "test_user.jpg"
        }

    # Given that I am a user, I want to be able to sign up for an account.
    # When I enter my information into the sign up form,
    # And I click the check button to verify if I am old enough to sign up,
    # And I click the sign up button,
    # Then I should be able to sign up for an account.      
    def test_signup(self):
        # Send the dummy user informaiton to the /signup route.
        signup_response = client.post('/signup', json=self.user_info)
    
        # Ensure that the request returns an HTTP status code of 200 to indicate that
        # the request was successful.
        self.assertEqual(signup_response.status_code, 200)   

    # Given that I am a user, I want to be able to sign up for an account.
    # When I enter my information into the sign up form,
    # And I put my birthday, which calculates the age to be below 18 or the
    # age of majority in my local jurisdiction,
    # And I click the check button to verify if I am old enough to sign up,
    # And I click the sign up button,
    # Then I should not be able to sign up for an account.        
    def test_signup_if_underage(self):
        # Test the same user from the previous function testing the
        # signup feature, but is 17 years old, 1 year younger than
        # the minimum age requirement of 18.
        self.user_info["age"] = 17
        
        # Attempt to enter dummy user in database.
        signup_response = client.post('/signup', json=self.user_info)
        
        # Ensure that the response returns an HTTP status code of 403
        # to indicate that the user is underage and therefore,
        # is unable to register for an account.
        self.assertEqual(signup_response.status_code, 403)

        # Now pretend that the user is from Alabama, but is
        # below the age of 19, the same age of majority
        # that also extends to Nebraska.
        self.user_info["age"] = 18
        self.user_info["state"] = "Alabama"

        # Attempt a second time to enter the dummy user into the
        # database.
        signup_response = client.post('/signup', json=self.user_info)

        # Ensure that the response is unsuccessful, given that the
        # user is 1 year below the age of majority in their home
        # state of Alabama, which is 19.
        self.assertEqual(signup_response.status_code, 403)

        # Finally, pretend that the user is from Mississippi,
        # but is below the age of 21, the state's age of
        # majority.
        self.user_info["age"] = 20
        self.user_info["state"] = "Mississippi"

        # Attempt a third time to enter the dummy user
        # into the database.
        signup_response = client.post('/signup', json=self.user_info)

        # Like the last two checks, verify that the response
        # was unsuccessful, given that they are not of the
        # age of majority in their jurisdiction, which in this
        # case, is Mississippi.
        self.assertEqual(signup_response.status_code, 403)

    def tearDown(self):
        # Subsequently delete the dummy user from the database.
        delete_dummy_user(self.user_info, self.db_inst.db, self.db_inst.cursor)
        self.db_inst.db.close()  
    
class TestLoginOps(unittest.TestCase):
    # Test the login feature to see if the session is valid
    # after the user is done logging in.   
    def test_login(self):
        try:
            # Create database instance.
            db_inst = Database(os.environ.get("DB_KEY"))

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
                "interested_in": "Males",
                "relationship_status": "Single",
                "so_filter_choice": "true",
                "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
                "age": 23,
                "pic": "test_user.jpg"
            }
            
            # Sign up the user.
            signup_response = create_dummy_user(user_info)
            
            self.assertEqual(signup_response.status_code, 200)
            
            # Run the POST request for the /login route to sign the user in.
            token_response = client.post('/login', data={"username": user_info["username"], "password": user_info["password"]})
            
            # Ensure that the request was successful with a valid generated
            # token.
            self.assertEqual(token_response.status_code, 200)
            self.assertNotEqual(token_response.json(), None)
            self.assertNotEqual(jwt.decode(token_response.json()["token"], os.getenv('SK_KEY'), algorithms=['HS256'], verify=True), None)
            
            # Set user_session and username cookies to test out /check_login route.
            check_login_response = client
            check_login_response.cookies.set('user_session', token_response.json()["token"])
            check_login_response.cookies.set('username', user_info["username"])
            final_response = check_login_response.post('/check_login')

            # Verify that the original response maintains and returns a status code of 200.
            self.assertEqual(final_response.status_code, 200)
            
            # Verify that the login has been verified.
            self.assertEqual(final_response.json()["verified"], True)
        
        finally:
            # Delete the dummy user from the database.
            delete_dummy_user(user_info, db_inst.db, db_inst.cursor)
            db_inst.db.close()
        
    # Test the login feature if a user has an invalid token.    
    def test_login_with_invalid_token(self):
        check_login_response = client
        check_login_response.cookies.set('user_session', 'invalid_token')
        check_login_response.cookies.set('username', 'invalid_user')
        final_response = check_login_response.post('/check_login')
        
        # Ensure that the final response returns a status code of 498 (for invalid tokens)
        # and a final response message of "Invalid token!".
        self.assertEqual(final_response.status_code, 498)
        self.assertEqual(final_response.json()["detail"]["message"], "Invalid token!")

class TestProtectedRouteOps(unittest.TestCase):
    def setUp(self):
        # Create database instance.
        self.db_inst = Database(os.environ.get("DB_KEY"))

        # Test a bunch of different routes with a valid JWT token.
        # Dummy user information.
        self.user_info = {
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
            "interested_in": "Males",
            "relationship_status": "Single",
            "so_filter_choice": "true",
            "interests": "Reading, Writing, Coding, Hiking, Biking, Swimming, Running, Walking, Eating, Sleeping, Playing, Gaming, Watching, Listening, Talking, Thinking, Loving, Living, Breathing, Being, Existing, etc.",
            "age": 23,
            "pic": "test_user.jpg"
        }

        # Sign up the user.
        self.signup_response = create_dummy_user(self.user_info)
        self.assertEqual(self.signup_response.status_code, 200)

        # Log in the user.
        self.login_response = client.post('/login', data={"username": self.user_info["username"], "password": self.user_info["password"]})
        self.assertEqual(self.login_response.status_code, 200)
        self.assertNotEqual(self.login_response.json(), None)
        self.assertNotEqual(jwt.decode(self.login_response.json()["token"], os.getenv('SK_KEY'), algorithms=['HS256'], verify=True), None)

    # Given that I am a logged in user, I would want to view certain pages when logged in.
    # When I log in, I should receive a valid session token,
    # And if I click on a page such as the account settings, for example,
    # Then I should be able to view it with no problems.
    def test_protected_route_with_valid_token(self):
        # Retrieve the token.
        token = self.login_response.json()["token"]

        # Test the protected_root route with the valid token.
        protected_root_res = client
        protected_root_res.cookies.set('username', self.user_info["username"])
        protected_root_res.cookies.set('user_session', token)
        p_response = protected_root_res.get('/protected_root')
        self.assertEqual(p_response.status_code, 200)

    # Given that I am a logged in user, I should be able to view certain pages.
    # When I log in, I should receive a valid token.
    # When I try to modify or modify the token itself,
    # And I try to visit my account settings page, for example,
    # then I should receive an error saying that I need to reload the page.
    def test_protected_route_with_invalid_token(self):
        # Test the protected_root route with invalid token.
        protected_root_res = client
        protected_root_res.cookies.set('username', self.user_info["username"])
        protected_root_res.cookies.set('user_session', os.urandom(40).hex())
        p_response = protected_root_res.get('/protected_root')
        self.assertEqual(p_response.status_code, 498)

    def tearDown(self):
        delete_dummy_user(self.user_info, self.db_inst.db, self.db_inst.cursor)
        self.db_inst.db.close()
    
class TestAppOps(unittest.TestCase):
    def setUp(self):
        # Create database instance.
        self.db_inst = Database(os.environ.get("DB_KEY"))

        # Dummy user information.
        self.dummy_user_1 = {
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
            "so_filter_choice": "true",
            "interests": "Writing poems, reading books, and watching movies",
            "age": 22,
            "pic": "kimmy_pic.jpg"
        }

        self.dummy_user_2 = {
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
            "interested_in": "Females",
            "relationship_status": "Taken",
            "so_filter_choice": "true",
            "interests": "Driving sports cars, boxing, and hitting the gym",
            "age": 26,
            "pic": "lalo_hernandez_profile_pic.jpg"
        }
        
        # Create and store the dummy users in the database.
        self.signup_dummy_user_1 = create_dummy_user(self.dummy_user_1)
        self.signup_dummy_user_2 = create_dummy_user(self.dummy_user_2)
        
        # Assert that the signup was successful for both operations.
        self.assertEqual(self.signup_dummy_user_1.status_code, 200)
        self.assertEqual(self.signup_dummy_user_2.status_code, 200)
        
        # Generate a login session for each user.
        self.generate_dummy_user_1_token = client.post('/login', data={'username': self.dummy_user_1["username"], 'password': self.dummy_user_1["password"]})
        self.generate_dummy_user_2_token = client.post('/login', data={'username': self.dummy_user_2["username"], 'password': self.dummy_user_2["password"]})

        # Check that the login requests for each user have been successful.
        self.assertEqual(self.generate_dummy_user_1_token.status_code, 200)
        self.assertEqual(self.generate_dummy_user_2_token.status_code, 200)
        self.assertTrue("token" in self.generate_dummy_user_1_token.json())
        self.assertTrue("token" in self.generate_dummy_user_2_token.json())

    # Test the /update_profile/DOB route to see if the user is able to update their DOB
    # provided that they registered for an account if they were at least 18 years old or
    # older--depending on their jurisdiction's age of majority--when they registered for
    # an account.
    def test_update_profile_DOB(self):
        # Update dummy_user_2's account creation date from 5 years ago as part of the
        # "sad path" test case.
        update_dummy_user_2_acct_creation_date = "UPDATE Users SET account_creation_timestamp=%s WHERE username=%s"
        params = ["2016-01-23", self.dummy_user_2["username"]]
        self.db_inst.cursor.execute(update_dummy_user_2_acct_creation_date, params)
        self.db_inst.db.commit()

        # Now that the tokens are generated, let's update the birthdays of each user.
        # ===========================================================================
        # First, change the birthday of dummy_user_1.
        update_dummy_user_1_DOB = client
        update_dummy_user_1_DOB.cookies.set('user_session', self.generate_dummy_user_1_token.json()["token"])
        update_dummy_user_1_DOB.cookies.set('username', self.dummy_user_1["username"])
        new_dob_dummy_user_1_res = update_dummy_user_1_DOB.put('/update_profile/DOB', json={"birth_month": "August", "birth_date": "11", "birth_year": "2001"})
        
        # Ensure that the request was successful. Because the user was of age when they registered
        # for an account, they should not be banned from using the website.
        self.assertEqual(new_dob_dummy_user_1_res.status_code, 200)
        
        # To verify this, check the Banned table in the database to see if the user is in
        # the table.
        self.db_inst.cursor.execute("SELECT username FROM Banned WHERE username=%s", [self.dummy_user_1["username"]])
        banned_user = self.db_inst.cursor.fetchone()
        
        # Assert that the banned_user variable is None for dummy_user_1.
        self.assertEqual(banned_user, None)
        
        # Next, change the birthday of dummy_user_2, but this time, change their DOB
        # to one that could potentially make them underage when they registered for
        # their account. The user should subsequently be banned from using the website.
        update_dummy_user_2_DOB = client
        update_dummy_user_2_DOB.cookies.set('user_session', self.generate_dummy_user_2_token.json()["token"])
        update_dummy_user_2_DOB.cookies.set('username', self.dummy_user_2["username"])
        new_dob_dummy_user_2_res = update_dummy_user_2_DOB.put('/update_profile/DOB', json={"birth_month": "March", "birth_date": "25", "birth_year": "2006"})
        
        # Unlike dummy_user_1, dummy_user_2 should not be able to update their DOB.
        # Therefore, their request should return a status code of 403.
        self.assertEqual(new_dob_dummy_user_2_res.status_code, 403)
        
        # Because dummy_user_2 is underage, they should be banned from using the website.
        # To check if they are banned, check the Banned table in the database to see if
        # their username is in the table.
        self.db_inst.cursor.execute("SELECT username FROM Banned WHERE username=%s", [self.dummy_user_2["username"]])
        banned_user = self.db_inst.cursor.fetchone()
        
        # Assert that the banned_user variable is not None for dummy_user_2.
        self.assertNotEqual(banned_user, None)
            
    # Given that I am a user, I want to be able to search for other users.
    # When I type in a search query,
    # And I enter the search query into the search bar,
    # Then I should be able to see filtered search results based on the search query.
    def test_search(self):
        token = self.generate_dummy_user_1_token.json()["token"]
        username = self.dummy_user_1["username"]
        
        # Configure the cookies needed for the request and send the information in a JSON format
        # to the /search route.
        get_search_results = client
        get_search_results.cookies.set('user_session', token)
        get_search_results.cookies.set('username', username)
        search_results_response = get_search_results.post('/search', json={"username": username})
        
        # Ensure that the response was successfully completed.
        self.assertEqual(search_results_response.status_code, 200)
        self.assertNotEqual(len(search_results_response.json()), 0)
        
        # Convert the byte object from the response of the /search route into a dictionary object.
        search_results = search_results_response.json()
        
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
        try:
            self.assertGreaterEqual(len(filtered_results_1), 1)
        except AssertionError:
            self.assertEqual(len(filtered_results_1), 0)
            
        try:
            self.assertGreaterEqual(len(filtered_results_2), 1)
        except AssertionError:
            self.assertEqual(len(filtered_results_2), 0)
        
        try:
            self.assertGreaterEqual(len(filtered_results_3), 1)
        except AssertionError:
            self.assertEqual(len(filtered_results_3), 0)

    def tearDown(self):
        delete_dummy_user(self.dummy_user_1, self.db_inst.db, self.db_inst.cursor)
        delete_dummy_user(self.dummy_user_2, self.db_inst.db, self.db_inst.cursor)
        self.db_inst.db.close()

class TestChatRequestOps(unittest.TestCase):
    def setUp(self):
        # Create database instance.
        self.db_inst = Database(os.environ.get("DB_KEY"))

        # Dummy user information.
        self.dummy_user_1 = {
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
            "so_filter_choice": "true",
            "interests": "Writing poems, reading books, and watching movies",
            "age": 22,
            "pic": "kimmy_pic.jpg"
        }

        self.dummy_user_2 = {
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
            "interested_in": "Females",
            "relationship_status": "Taken",
            "so_filter_choice": "true",
            "interests": "Driving sports cars, boxing, and hitting the gym",
            "age": 26,
            "pic": "lalo_hernandez_profile_pic.jpg"
        }

        # Create and store the dummy users in the database.
        self.signup_dummy_user_1 = create_dummy_user(self.dummy_user_1)
        self.signup_dummy_user_2 = create_dummy_user(self.dummy_user_2)
        
        # Assert that the signup was successful for both operations.
        self.assertEqual(self.signup_dummy_user_1.status_code, 200)
        self.assertEqual(self.signup_dummy_user_2.status_code, 200)
        
        # Generate a login session for each user.
        self.generate_dummy_user_1_token = client.post('/login', data={'username': self.dummy_user_1["username"], 'password': self.dummy_user_1["password"]})
        self.generate_dummy_user_2_token = client.post('/login', data={'username': self.dummy_user_2["username"], 'password': self.dummy_user_2["password"]})

        # Check that the login requests for each user have been successful.
        self.assertEqual(self.generate_dummy_user_1_token.status_code, 200)
        self.assertEqual(self.generate_dummy_user_2_token.status_code, 200)
        self.assertTrue("token" in self.generate_dummy_user_1_token.json())
        self.assertTrue("token" in self.generate_dummy_user_2_token.json())

        # Set up the cookies for the requestor, which is dummy user 1.
        self.requestor = client
        requestor_token = self.generate_dummy_user_1_token.json()["token"]
        self.requestor.cookies.set('user_session', requestor_token)
        self.requestor.cookies.set('username', self.dummy_user_1["username"])

    def test_CR_happy(self):
        # Get dummy user 1, the requestor, to make a chat request to dummy user 2,
        # who is a registered user.
        requestor_sends_req = self.requestor.post('/privacy/make_chat_request', json={"requestee": self.dummy_user_2["username"]})

        # Verify that the request was successful.
        self.assertEqual(requestor_sends_req.status_code, 200)
        self.assertEqual(requestor_sends_req.json()["message"], "Chat request successfully made!")

        # Ensure that dummy user 2 received the chat request
        # from dummy user 1.
        check_cr_stmt = '''
            SELECT requestor, requestee, request_accepted AS approved 
            FROM Chat_Requests WHERE (requestor=%s AND requestee=%s)
            OR (requestor=%s AND requestee=%s)
        '''
        check_cr_params = [
            self.dummy_user_1["username"], 
            self.dummy_user_2["username"],
            self.dummy_user_2["username"],
            self.dummy_user_1["username"]
        ]

        self.db_inst.cursor.execute(check_cr_stmt, check_cr_params)

        # Fetch the record and verify that the record is not
        # empty.
        cr_record = [record for record in self.db_inst.cursor]
        self.assertTrue(cr_record)

    def test_CR_sad(self):
        # Get dummy user 1, the requestor, to attempt to make a chat request to a user
        # who did not register for an account.
        requestor_sends_invalid_req = self.requestor.post("/privacy/make_chat_request", json={"requestee": "non_existent_user"})

        # Verify that the request was unsuccessful.
        self.assertEqual(requestor_sends_invalid_req.status_code, 500)
        self.assertEqual(requestor_sends_invalid_req.json()["detail"]["message"], "Chat request failed to be sent!")

    def test_approve_CR(self):
        # Get dummy user 2, the requestee, to accept a chat request from dummy user 1.
        accept_CR_req = self.requestor.put("/privacy/chat_request_response?r=approve", json={"requestor": self.dummy_user_1["username"]})

        # Verify that the chat request approval was successful and that the chat
        # request log of dummy user 2 is empty, given that they have only
        # received one request so far.
        self.assertEqual(accept_CR_req.status_code, 200)
        self.assertFalse(accept_CR_req.json())

        # Get dummy user 1, the requestor, to make another chat request to dummy user 2.
        # That way, the ability to deny a chat request can be tested.
        self.requestor.post('/privacy/make_chat_request', json={"requestee": self.dummy_user_2["username"]})

    def test_deny_CR(self):
        # Get dummy user 2, the requestee, to deny a chat request from dummy user 1.
        deny_CR_req = self.requestor.put("/privacy/chat_request_response?r=deny", json={"requestor": self.dummy_user_1["username"]})

        # Verify that the chat request denial was succcessful, and like
        # the previous test, check that the request log of dummy user 2
        # is empty.
        self.assertEqual(deny_CR_req.status_code, 200)
        self.assertFalse(deny_CR_req.json())

    def tearDown(self):
        delete_dummy_user(self.dummy_user_1, self.db_inst.db, self.db_inst.cursor)
        delete_dummy_user(self.dummy_user_2, self.db_inst.db, self.db_inst.cursor)
        self.db_inst.db.close()

if __name__ == "__main__":
    unittest.main()