from flask import request

def user_profile_cache():
    # If the current user views another person's profile, then
    # set the cache to allow for the latter's profile to load
    # faster the next time they visit.
    data: dict = request.get_json()
    
    if "username" in data:
        other_user_username = data["username"]
        return f"{request.cookies.get('user_session')}-{other_user_username}-vwd-profile"
    
    # Otherwise, if they are visiting their own profile,
    # set the cache to allow for it to load faster.
    else:
        return f"{request.cookies.get('user_session')}-{request.cookies.get('username')}-vwd-profile"
    
def search_results_cache():
    # Ensure that a user_session and username cookies have a value to allow for the creation
    # of a cache key to load search results quicker the next time a user visits the page.
    if request.cookies.get("user_session") and request.cookies.get("username"):
        return f"{request.cookies.get('user_session')}-search-session-{request.cookies.get('username')}"

def match_algo_cache():
    # On top of the search results page, set the cache only if the user has configured their
    # account settings to allow for potential matches to be displayed on their search results
    # using the matching algorithm.
    if request.cookies.get("user_session") and request.cookies.get("username"):
        return f"{request.cookies.get('user_session')}-matching-algo-{request.cookies.get('username')}"
    
def user_profiles_cache_key():
    # Set the cache key to retrieve all user profiles (save for the logged in user's) quicker without
    # the need of a database query. The cache will only last for 10 minutes.
    if request.cookies.get("user_session") and request.cookies.get("username"):
        return f"{request.cookies.get('user_session')}-all-profiles-{request.cookies.get('username')}"
    
def logged_in_user_profile_cache_key():
    # Similar to the cache key function for the user profiles, set the cache key to retrieve
    # a logged in user's profile quicker. Once more, the cache will only last for 10 minutes.
    #
    # This function is not to be confused with the user_profile_cache function, which is used only when
    # the user is viewing their profile, not when they are in the search page.
    if request.cookies.get("user_session") and request.cookies.get("username"):
        return f"{request.cookies.get('user_session')}-logged-in-profile-{request.cookies.get('username')}"