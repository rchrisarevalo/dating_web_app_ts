# This file is not to be confused with the actual implementation
# in the ml_match_algo.py file, which will be used in production.

# This file is used for the unit tests, and is not to be used
# in production.

import pandas as pd
import os

# Turn off oneDNN optimizations.
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import keras
import sys

sys.path.append("../helpers/")

from .ml_sim_calcs import *
from helpers.helper import retrieve_age

def change_to_model_dir_for_tests():
    directories = os.getcwd().split("\\")

    if "src" not in directories:
        os.chdir("./src/backend/models")
    elif "src" in directories and "backend" not in directories:
        os.chdir("./backend/models")
    else:
        os.chdir("./models")

def load_mock_data(mock_profiles: list[dict[str, any]],
                   current_mock_profile: list[dict[str, any]]):
    try:
        drop_these_cols = [
            "uri", "birth_month", "birth_date",
            "birth_year", "age", "rating"
        ]
        df = pd.DataFrame(mock_profiles)
        df = df.drop(columns=drop_these_cols)

        current_df = pd.DataFrame(current_mock_profile)
        current_df = current_df.drop(columns=drop_these_cols)

        user_profiles = {}

        for profile in mock_profiles:
            if "users" not in user_profiles:
                user_profiles["users"] = {profile.get("username"): {key: item for key, item in profile.items()}}
            else:
                user_profiles["users"][profile.get("username")] = {key: item for key, item in profile.items()}

        for user in user_profiles["users"].keys():
            user_profiles["users"][user]["age"] = retrieve_age(
                user_profiles["users"][user]["birth_month"],
                int(user_profiles["users"][user]["birth_date"]),
                int(user_profiles["users"][user]["birth_year"])
            )

        return df, current_df, user_profiles

    except Exception:
        raise AssertionError

def process_mock_data(df_users: pd.DataFrame,
                      df_current_user: pd.DataFrame,
                      user_index: dict[int, str]):
    
    user_index = {i: user for i, user in enumerate(df_users['username'].values)}
    
    try:
        if not df_users.empty or not df_current_user.empty:
            column_labels = ["interests", 
                             "height", 
                             "sexual_orientation", 
                             "residence", 
                             "relationship_status", 
                             "similarity_score"]
            
            users_dictionary = {}
            
            # For each attribute (excluding the username, first name, middle name, and last name columns)
            # insert and update the key value pairs with the corresponding attribute column and username
            # row by assigning a score of 0 for each user that is inserted.
            for attr in column_labels:
                for user in df_users['username'].values:
                    # If the attribute does not exist in the dictionary,
                    # create a key for said attribute and create a new
                    # sub-dictionary with a username key and a score of 0.
                    if attr not in users_dictionary:
                        users_dictionary[attr] = {user: 0}
                        
                    # Otherwise, add the new user to the current attribute.
                    else:
                        users_dictionary[attr].update({user: 0})
            
            # Drop the username, first name, middle name, and last name columns.
            df_users = df_users.drop(columns=['username', 'first_name', 'middle_name', 'last_name'])
            df_current_user = df_current_user.drop(columns=['username', 'first_name', 'middle_name', 'last_name'])

            interests_dot_prod(df_users['interests'], 
                               df_current_user['interests'], 
                               users_dictionary)
                
            height_dot_prod(df_users['height'], 
                            df_current_user['height'], 
                            users_dictionary)
            
            sexual_orientation_similarity(df_users[['gender', 'interested_in']], 
                                          df_current_user[['gender', 'interested_in']], 
                                          users_dictionary)
            
            residence_dot_prod(df_users[['city_residence', 'state_residence']], 
                               df_current_user[['state_residence', 'city_residence']], 
                               users_dictionary)
            
            relationship_status_dot_prod(df_users['relationship_status'], 
                                         df_current_user['relationship_status'], 
                                         users_dictionary)
            
            users_df = pd.DataFrame.from_dict(users_dictionary)
            users_df = scale_data(users_df)
            users_df = calculate_similarity_score(users_df, users_dictionary)
            
            return users_df, user_index
        
        else:
            print("User does not exist.")
            exit(0)
    
    except ValueError:
        print("User is not found!")
        exit(0)

def filter_matches(matches: list[dict[str, any]], current_user: dict[str, any]) -> list[dict[str, any]]:
    try:
        # If the user is pansexual and/or is interested in anyone, regardless of gender,
        # then return the list of matches.
        if current_user["sexual_orientation"] == "Pansexual" or current_user["interested_in"] == "Anyone":
            return matches
        
        # Otherwise...
        else:
            # Turn the gender interests of each match into sets to use for the filter
            # function logic below.
            for m in matches:
                m["interested_in"] = set(m["interested_in"].replace("s", "").split(", "))
            
            # Do the same as above, but with the current user's gender interests.
            current_user["interested_in"] = set(current_user["interested_in"].replace("s", "").split(", "))
            
            # List that will store user's filtered matches based on their gender interests.
            filter_matches = []
            
            # Iterate through each match.
            for match in matches:
                # If the match's gender is in the set of the current user's gender interests,
                # and the current user's gender is in the set of the match's gender interests,
                # then append the match's profile to the list.
                if match["gender"] in current_user["interested_in"] and current_user["gender"] in match["interested_in"]:
                    filter_matches.append(match)
                    
                # Otherwise, if the current user identifies as anything other than male
                # or female (e.g. non-binary, etc.)...
                elif current_user["gender"] != "Male" and current_user["gender"] != "Female":
                    # Check if the match's gender is included in the current user's
                    # gender interests set. If it is, then append the match's
                    # profile to the list.
                    if match["gender"] in current_user["interested_in"]:
                        filter_matches.append(match)
            
            return filter_matches
    
    except KeyError:
        raise KeyError

def generate_mock_recommendations(df: pd.DataFrame,
                                  num_recommendations: int,
                                  user_profiles: dict,
                                  logged_in_user_profile: dict[str, any],
                                  use_so_filter: bool,
                                  user_index: dict) -> list[dict[str, any]]:
    # Change directories in case the folder containing the matching
    # algorithm model is not found.
    directory_changed: bool = False
    prev_changed_dir = os.getcwd()

    print("Current working directory: %s" % prev_changed_dir)

    if not os.path.isfile("matching_model.h5"):
        change_to_model_dir_for_tests()
        directory_changed = True

    model: keras.Model = keras.models.load_model('matching_model.h5')
    df_current_user = df.drop(columns=['similarity_score'])

    # Dictionary which will the store the user as its key along with their predicted similarity score
    # as its value.
    recommended_users = {}

    # Predict the similarity score for each user based on the number of recommendations
    # provided.
    for i in range(0, num_recommendations):
        try:
            current_user = df_current_user.iloc[i]
            predicted_score = model.predict(np.array([current_user.values]), batch_size=20, verbose=0)[0][0]
            recommended_users[user_index[i]] = round((predicted_score * 100), 2)
        except IndexError:
            break

    # Sort the dictionary by first accessing the key value pairs in a tuple.
    # 
    # Using a lambda function to focus only on the values of the dictionary to sort (in this case,
    # x[1], which contain the similarity score for each user). 
    # 
    # Subsequently convert the sorted list--which still contain the key value pairs in tuple form--into 
    # a dictionary from the most recommended user to the least recommended user.
    recommended_users = dict(sorted(recommended_users.items(), key=lambda x: x[1], reverse=True))
    
    # Return only the top 10 users.
    recommended_users = dict(list(filter(lambda x: x, recommended_users.items()))[:10])

    # If the directory did change if the model file could
    # not be found, change back to the previous directory.
    if directory_changed:
        os.chdir(prev_changed_dir)

    print("Changed directory: %s" % os.getcwd())

    final_users: list[dict[str, any]] = [user_profiles["users"][user] for user in recommended_users.keys()]

    if use_so_filter:
        final_users = filter_matches(final_users, logged_in_user_profile)

    cols_to_drop = [
        'birth_date',
        'birth_month',
        'birth_year',
        'gender',
        'height',
        'interested_in',
        'middle_name',
        'last_name',
        'rating',
        'relationship_status',
        'sexual_orientation'
    ]
    final_users = pd.DataFrame(final_users).drop(columns=cols_to_drop).to_dict('records')

    return final_users

def run_mock_algorithm(mock_data: list[dict[str, any]],
                       mock_current_user: list[dict[str, any]],
                       use_so_filter: bool):
    
    user_index = {}
    data, current_user_data, user_profiles = load_mock_data(mock_data, mock_current_user)
    preprocessed_data, user_index = process_mock_data(data, current_user_data, user_index)
    recommendations = generate_mock_recommendations(
        preprocessed_data,
        10,
        user_profiles,
        mock_current_user[0],
        use_so_filter,
        user_index
    )

    return recommendations