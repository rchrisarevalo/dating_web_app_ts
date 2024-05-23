import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import Normalizer, MinMaxScaler
from sklearn.metrics.pairwise import euclidean_distances, cosine_similarity

def initialize_vectorizer():
    return TfidfVectorizer(stop_words='english')

def initialize_normalizer():
    return Normalizer()

def initialize_min_max_scaler():
    return MinMaxScaler()

def update_user_numbers(dot_prod: np.array, user_dict: dict, attr_index: str):
    for percentage, user in zip(dot_prod, user_dict[attr_index].keys()):
        user_dict[attr_index][user] = round(percentage.item(), 2)

def interests_dot_prod(df1: pd.DataFrame, df2: pd.DataFrame, user_dict: dict):
    # TODO: Calculate the dot product of interests between df1 and df2
    vectorizer = initialize_vectorizer()
    normalizer = initialize_normalizer()

    users_vect = vectorizer.fit_transform(df1).toarray()
    current_users_vect = vectorizer.transform(df2).toarray()
    
    users_vect = normalizer.fit_transform(users_vect)
    current_users_vect = normalizer.transform(current_users_vect)
    
    interests_dot_prod = np.dot(users_vect, current_users_vect.T)
    update_user_numbers(interests_dot_prod, user_dict, "interests")

def height_dot_prod(df1: pd.DataFrame, df2: pd.DataFrame, user_dict: dict):
    # TODO: Calculate the dot product of height between df1 and df2
    df1 = df1.apply(func=lambda x: ((int(x.split("'")[0]) * 12) + int(x.split("'")[1])))
    df2 = df2.apply(func=lambda y: ((int(y.split("'")[0]) * 12) + int(y.split("'")[1])))
    np_df1 = np.array([df1]).T
    np_df2 = np.array([df2])
    height_similarity = (100 - euclidean_distances(np_df1, np_df2)) / 100
    
    update_user_numbers(height_similarity, user_dict, "height")

def sexual_orientation_similarity(df1: pd.DataFrame, df2: pd.DataFrame, user_dict: dict):
    # TODO: Calculate the dot product of sexual orientation between df1 and df2
    df1 = df1.apply(lambda x: ', '.join(x), axis=1)
    df2 = df2.apply(lambda y: ', '.join(y), axis=1) 
    
    vectorizer = initialize_vectorizer()
    normalizer = initialize_normalizer()
    
    users_vect = vectorizer.fit_transform(df1).toarray()
    current_users_vect = vectorizer.transform(df2).toarray()
    
    users_vect = normalizer.fit_transform(users_vect)
    current_users_vect = normalizer.transform(current_users_vect).T
    
    # Added variable y to retrieve the number of rows in the current_users_vect
    # array.
    y = current_users_vect.shape[0]
    np_df1 = np.array(users_vect)
    np_df2 = np.array(current_users_vect).reshape(1, y)

    sexual_orientation_sim = cosine_similarity(np_df1, np_df2)
    
    for sim in sexual_orientation_sim:
        if sim > 0.45 and sim <= 1.:
            sim[0] = -1
        elif sim <= 0.45:
            sim[0] = 1
    
    update_user_numbers(sexual_orientation_sim, user_dict, "sexual_orientation")

def residence_dot_prod(df1: pd.DataFrame, df2: pd.DataFrame, user_dict: dict):
    # TODO: Calculate the dot product of residence between df1 and df2
    df1 = df1.apply(lambda x: ', '.join(x), axis=1)
    df2 = df2.apply(lambda y: ', '.join(y), axis=1)
    
    vectorizer = initialize_vectorizer()
    normalizer = initialize_normalizer()
    
    users_vect = vectorizer.fit_transform(df1).toarray()
    current_users_vect = vectorizer.transform(df2).toarray()
    
    users_vect = normalizer.fit_transform(users_vect)
    current_users_vect = normalizer.transform(current_users_vect).T
    
    np_df1 = np.array(users_vect)
    np_df2 = np.array(current_users_vect)
    np_dot = np.dot(np_df1, np_df2)
    
    update_user_numbers(np_dot, user_dict, "residence")

def relationship_status_dot_prod(df1: pd.DataFrame, df2: pd.DataFrame, user_dict: dict):
    # TODO: Calculate the dot product of relationship status between df1 and df2
    vectorizer = initialize_vectorizer()
    normalizer = initialize_normalizer()
    
    users_vect = vectorizer.fit_transform(df1).toarray()
    current_users_vect = vectorizer.transform(df2).toarray()
    
    users_vect = normalizer.fit_transform(users_vect)
    current_users_vect = normalizer.transform(current_users_vect)
    
    np_df1, np_df2 = np.array(users_vect), np.array(current_users_vect).T
    
    relationship_status_dot_prod = np.dot(np_df1, np_df2)

    update_user_numbers(relationship_status_dot_prod, user_dict, "relationship_status")
    
def calculate_similarity_score(df: pd.DataFrame, user_dict: dict):
    df = df.drop(columns=['similarity_score'])
    sum_all_attr_scores = np.array([round(df.sum(axis=1) / len(df.columns), 3)]).reshape(len(df), 1)
    update_user_numbers(sum_all_attr_scores, user_dict, "similarity_score")
    
    final_df = pd.DataFrame.from_dict(user_dict)
    
    return final_df

def scale_data(users_df: pd.DataFrame):
    min_max_scaler = initialize_min_max_scaler()
    
    scaled_users_df = min_max_scaler.fit_transform(users_df)
    scaled_users_df = pd.DataFrame(scaled_users_df, columns=users_df.columns)
    
    return scaled_users_df