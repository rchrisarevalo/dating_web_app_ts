def rating_sys(rank_type: str, user_scores_dict: dict, ratee: str, rater: str):
    S_dict = {
        "positive": 1,
        "neutral": 0.5,
        "negative": 0
    }
    
    # Implement elo rating system logic here.
    S = S_dict[rank_type]
    
    # Expected score of user that is about to be rated 
    # using the logged in user's previous score with 
    # that of the former.
    E_exp = pow(10, (user_scores_dict[rater] - user_scores_dict[ratee]) / 400)
    E = 1 / (1 + E_exp)
    
    # Calculate the new score of the user that is being rated.
    R_user_score = user_scores_dict[ratee] + (20 * (S - E))
    
    return R_user_score

def calculate_rating(cursor, ratee, rater, rating_type):
    rating_list_parameters = [ratee, rater]
        
    # Select the ratings of the user being rated and that of the logged
    # in user in order to use them to rate the former.
    statement = "SELECT rating, username FROM Ratings WHERE username=%s OR username=%s"
    
    cursor.execute(statement, rating_list_parameters)
    
    # Store user's scores in dictionary to allow for easier retrieval
    # using their username as the key value to identifying their
    # rating score.
    user_scores = {}
    
    # Map the scores retrieved from the database to the username keys 
    # in the user_scores dictionary.
    for record in cursor:
        user_scores["%s" % record[1]] = record[0]

    # Determine the ratee's new score.
    score = rating_sys(rating_type, user_scores, ratee, rater)
    
    # Update the score of the rated user in the Ratings table.
    statement = "UPDATE Ratings SET rating=%s WHERE username=%s"
    rating_list_parameters = [score, ratee]
    
    # Execute the statement.
    cursor.execute(statement, rating_list_parameters)
    
    return score

def insert_rating(cursor, rater, ratee, rating_type, rating):
    statement = "INSERT INTO User_Rating_Labels (rater, ratee, rating_type, rating, rating_made) VALUES (%s, %s, %s, %s, now())"
    rating_list_parameters = [rater, ratee, rating_type, rating]
    cursor.execute(statement, rating_list_parameters)

def update_rating(cursor, ratee):
    statement = "UPDATE Ratings SET rating=%s WHERE username=%s"
    rating_list_parameters = [0.0, ratee]
    cursor.execute(statement, rating_list_parameters)
   
def delete_rating(cursor, rater, ratee):
    statement = "DELETE FROM User_Rating_Labels WHERE rater=%s AND ratee=%s"
    rating_list_parameters = [rater, ratee]
    cursor.execute(statement, rating_list_parameters)
        
def average_rating(cursor, username):
    # Initialize the parameter values for the statement below.
    rating_list_parameters = [username]
    statement = "SELECT avg(rating) FROM User_Rating_Labels WHERE ratee=%s"
    
    # Execute the statement.
    cursor.execute(statement, rating_list_parameters)
    
    # Retrieve the average elo rating of the user from the cursor.
    average_elo_rating = [record[0] for record in cursor]
    
    # If there is a record in the average_elo_rating list, and there is no instance
    # of None in the list, then return the average elo rating of the user.
    if average_elo_rating and None not in average_elo_rating:
        average_elo_rating = average_elo_rating[0] 
        return average_elo_rating
    
    # Otherwise, return 0.0.
    else:
        return 0.0