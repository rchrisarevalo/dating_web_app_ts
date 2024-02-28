from similarity_calculations import run_algo
import time

def run_matching_algorithm(user_profiles, logged_in_user_profile, use_so_filter):
    matched_users = run_algo(profile_records=user_profiles, logged_in_user_record=logged_in_user_profile, use_so_filter=use_so_filter)
    return matched_users


def return_run_time(user_profiles, logged_in_user_profile):
    start = time.time()
    run_algo(profile_records=user_profiles, logged_in_user_record=logged_in_user_profile)
    end = time.time()
    overall = end - start
    return overall


def return_run_time_multiple(user_profiles, logged_in_user_profile):
    start = time.time()
    
    for i in range(0, 10000):
        run_algo(profile_records=user_profiles, logged_in_user_record=logged_in_user_profile)
    
    end = time.time()
    overall = end - start
    return overall