from similarity_calculations import run_algo
from models.ml_match_algo import run_algorithm
import time
import psycopg2 as p
import os

def run_matching_algorithm(username: str,
                           db: p.extensions.connection,
                           cursor: p.extensions.cursor,  
                           use_so_filter: bool):

    matched_users = run_algorithm(username, cursor, db, use_so_filter)
    return matched_users


def return_run_time(user_profiles: list[dict[str, any]], 
                    logged_in_user_profile: list[dict[str, any]], 
                    use_so_filter: bool):
    start = time.time()
    run_algo(profile_records=user_profiles, logged_in_user_record=logged_in_user_profile, use_so_filter=use_so_filter)
    end = time.time()
    overall = end - start
    return overall


def return_run_time_multiple(user_profiles: list[dict[str, any]], 
                             logged_in_user_profile: list[dict[str, any]], 
                             use_so_filter: bool):
    start = time.time()
    
    for i in range(0, 10000):
        run_algo(profile_records=user_profiles, logged_in_user_record=logged_in_user_profile, use_so_filter=use_so_filter)
    
    end = time.time()
    overall = end - start
    return overall