import psycopg2
import pandas as pd
import os

# Turn off oneDNN optimizations.
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import sys

sys.path.append("../helpers/")
sys.path.append("..")

from .ml_sim_calcs import *
from helpers.helper import retrieve_age
from class_models import ColabFilteringModel

# Dictionary to store the index of users
# based on dataframe.
user_index = {}

# Load users from database.
def load_data(username: str, 
              db: psycopg2.extensions.connection, 
              cursor: psycopg2.extensions.cursor):
    try:
        statement = '''
            SELECT username,
            first_name,
            middle_name,
            last_name,
            interests,
            height,
            gender,
            sexual_orientation,
            interested_in,
            state_residence,
            city_residence,
            relationship_status 
            FROM retrieve_possible_matches(%s)
        '''
        params = [username]
        cursor.execute(statement, params)
        
        df = pd.DataFrame(cursor.fetchall())

        cursor.execute('SELECT * FROM get_user_profiles(%s)', params)
        user_profiles = {}

        for record in cursor:
            if "users" not in user_profiles:
                user_profiles["users"] = {record[0]: {key[0]: value for key, value in zip(cursor.description, record)}}
            else:
                user_profiles["users"][record[0]] = {key[0]: value for key, value in zip(cursor.description, record)}

            user_profiles["users"][record[0]]["uri"] = bytes(user_profiles["users"][record[0]]["uri"]).decode('utf-8')

        for user in user_profiles["users"].keys():
            user_profiles["users"][user]["age"] = retrieve_age(
                user_profiles["users"][user]["birth_month"],
                int(user_profiles["users"][user]["birth_date"]),
                int(user_profiles["users"][user]["birth_year"])
            )
        
        new_column_names = [
                            "username", 
                            "first_name", 
                            "middle_name", 
                            "last_name", 
                            "interests", 
                            "height", 
                            "gender", 
                            "sexual_orientation", 
                            "interested_in", 
                            "state_residence", 
                            "city_residence", 
                            "relationship_status"
                          ]
        
        for column in df.columns.values:
            df.rename(columns={column: new_column_names[column]}, inplace=True)

        # Now exclude the current user from the main dataframe,
        # randomize it, and return the first 10 users from
        # the shuffled dataframe.
        df = df[df["username"] != username]
        # df = df.sample(frac=1).reset_index(drop=True).head(n=10)

        cursor.execute("SELECT * FROM get_logged_in_user(%s)", [username])
        
        logged_in_user_profile: dict[str, any] = [
            {key[0]: value for key, value in zip(cursor.description, record)} 
            for record in cursor
        ][0]

        cursor.execute('''
            SELECT username, first_name, middle_name, last_name, 
            interests, height, gender, sexual_orientation,
            interested_in, state_residence, city_residence,
            relationship_status FROM get_logged_in_user(%s)
        ''', [username])

        # Make a separate dataframe, but for the current user.
        current_user_df = pd.DataFrame(cursor.fetchall())

        for column in current_user_df.columns.values:
            current_user_df.rename(columns={column: new_column_names[column]}, inplace=True)

        cursor.close()
        db.close()
        
        return df, current_user_df, user_profiles, logged_in_user_profile
    
    except psycopg2.DatabaseError:
        print("There was an error connecting to the database.")

def process_data(df: pd.DataFrame, df_current_user: pd.DataFrame, current_user: str):
    df_users = df[df["username"] != current_user]
    
    for i, user in enumerate(df_users['username'].values):
        user_index[i] = user
    
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
            
            return users_df
        
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

def generate_recommendations(df: pd.DataFrame, 
                             num_recommendations: int, 
                             user_profiles: dict,
                             logged_in_user_profile: dict[str, any],
                             use_so_filter: bool) -> list[dict[str, any]]:
    
    # Drop the similarity score column for the current user.
    df_current_user = df.drop(columns=['similarity_score'])

    # Retrieve the model from the ColabFilteringModel class.
    model = ColabFilteringModel().model
    
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

    # Store the profiles of users in a list of dictionaries using
    # the recommended_users list which lists them from most to
    # least similar.
    final_users: list[dict[str, any]] = [user_profiles["users"][user] for user in recommended_users.keys()]

    # If the current user decided to use a sexual orientation filter,
    # filter the list of users that do not align with their interests.
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

def run_algorithm(username: str,
                  cursor: psycopg2.extensions.cursor,
                  db: psycopg2.extensions.connection,
                  use_so_filter: bool):
    
    data, current_user_data, user_profiles, logged_in_user_profile = load_data(username, db, cursor)

    preprocessed_data = process_data(data, current_user_data, username)

    recommendations = generate_recommendations(
        preprocessed_data,
        len(preprocessed_data),
        user_profiles,
        logged_in_user_profile,
        use_so_filter
    )

    return recommendations