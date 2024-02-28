from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.preprocessing import Normalizer, StandardScaler, RobustScaler
import PQ as PQ
import numpy as np

#==============================================================================
# Helper functions.
def calc_height_inches(person_height):
    person_height_inches = (12 * int(person_height[0])) + int(person_height[1])
    return person_height_inches

def append_similarity(similarity_list, similarity_percentage):
    similarity_list.append(similarity_percentage)        
#==============================================================================
    
def bio_interest_similarity(user_profile_records, logged_in_user_record, index):
    # Determining bio/interest section similarity
    if user_profile_records[index]["interests"] != "N/A" and logged_in_user_record[0]["interests"] != "N/A":
        vect = TfidfVectorizer(stop_words='english')
        bio_scores_X = vect.fit_transform([user_profile_records[index]["interests"]]).toarray()
        bio_scores_Y = vect.transform([logged_in_user_record[0]["interests"]]).toarray()
        similarity = cosine_similarity(bio_scores_X, bio_scores_Y).flatten()[0]
        
        return similarity
    else:
        return 0.00

def height_similarity(user_profile_records, logged_in_user_record, index):
    # Convert user's height from feet and inches format to just solely inches.
    user_height = user_profile_records[index]["height"].split("'")
    user_height_inches = calc_height_inches(user_height)
    logged_in_user_height = logged_in_user_record[0]["height"].split("'")
    logged_in_user_height_inches = calc_height_inches(logged_in_user_height)
    height_similarity = (100 - euclidean_distances([[user_height_inches]], [[logged_in_user_height_inches]]).flatten()[0]) / 100.0

    return height_similarity

def sexual_orientation_similarity(user_profile_records, logged_in_user_record):
    so_index = {
        "Heterosexual": 1,
        "Homosexual (Gay)": 2,
        "Homosexual (Lesbian)": 3,
        "Bisexual": 4,
        "Pansexual": 5,
        "Asexual": 6,
        "Deciding": 7
    }
    
    interested_in_index = {
        "Men": 8,
        "Women": 9,
        "Men and Women": 10,
        "Deciding": 11,
        "Anyone": 12,
        "Nobody": 13
    }
    
    normalizer_vectorizer = Normalizer()
    standard = StandardScaler()

    # Retrive the users' sexual orientations and gender interests. The same applies for the logged in user.
    retrieve_profile_so = list(map(lambda p: [so_index[p["sexual_orientation"]], interested_in_index[p["interested_in"]]], user_profile_records))
    retrieve_logged_in_user_so = list(map(lambda s: [so_index[s["sexual_orientation"]], interested_in_index[s["interested_in"]]], logged_in_user_record))

    # Use StandardScaler() to make the scores more consistent when finding users that fit the logged in user's sexual orientation and gender interests.
    standardized_profile_so_scores = standard.fit_transform(retrieve_profile_so)
    standardized_logged_in_user_scores = standard.transform(retrieve_logged_in_user_so)
    
    # Normalize the scores to improve data accuracy when put through the cosine_similarity() function.
    normalized_profile_so_scores = normalizer_vectorizer.fit_transform(standardized_profile_so_scores)
    normalized_logged_in_user_so_scores = normalizer_vectorizer.transform(standardized_logged_in_user_scores)
    
    # Calculate the cosine similarity between the logged in user's profile and that of other users.
    so_similarity = cosine_similarity(normalized_logged_in_user_so_scores, normalized_profile_so_scores).flatten().round(0)
  
    return so_similarity

def city_residence_similarity(user_profile_records, logged_in_user_record):
    retrieve_profile_city_residence = list(map(lambda c: c["city_residence"], user_profile_records))
    retrieve_logged_in_user_city_residence = list(map(lambda c2: c2["city_residence"], logged_in_user_record))
    
    np_retrieve_profile_city_residence = np.concatenate([retrieve_profile_city_residence]).flatten()
    np_retrieve_logged_in_user_city_residence = np.concatenate([retrieve_logged_in_user_city_residence]).flatten()
    
    normalizer_vector = Normalizer()
    standard = StandardScaler(with_mean=False)
    tfidf_vectorizer = TfidfVectorizer()
    
    profile_city_residence_scores = tfidf_vectorizer.fit_transform(np_retrieve_profile_city_residence)
    logged_in_user_residence_scores = tfidf_vectorizer.transform(np_retrieve_logged_in_user_city_residence)
    
    standardized_profile_cr_scores = standard.fit_transform(profile_city_residence_scores)
    standardized_logged_in_user_cr_scores = standard.transform(logged_in_user_residence_scores)
    
    normalized_profile_cr_scores = normalizer_vector.fit_transform(standardized_profile_cr_scores)
    normalized_logged_in_user_cr_scores = normalizer_vector.transform(standardized_logged_in_user_cr_scores)
    
    cr_similarity = cosine_similarity(normalized_profile_cr_scores, normalized_logged_in_user_cr_scores).flatten()
    
    return cr_similarity

def state_residence_similarity(user_profile_records, logged_in_user_record):
    retrieve_profile_sr = list(map(lambda s: s["state_residence"], user_profile_records))
    retrieve_logged_in_user_sr = list(map(lambda s2: s2["state_residence"], logged_in_user_record))
    
    np_retrieve_profile_sr = np.concatenate([retrieve_profile_sr])
    np_retrieve_logged_in_user_sr = np.concatenate([retrieve_logged_in_user_sr])
    
    normalizer_vector = Normalizer()
    standard = StandardScaler(with_mean=False)
    tfidf_vectorizer = TfidfVectorizer()
    
    profile_sr_scores = tfidf_vectorizer.fit_transform(np_retrieve_profile_sr)
    logged_in_user_sr_scores = tfidf_vectorizer.transform(np_retrieve_logged_in_user_sr)
    
    standardized_profile_sr_scores = standard.fit_transform(profile_sr_scores)
    standardized_logged_in_user_sr_scores = standard.transform(logged_in_user_sr_scores)
    
    normalized_profile_sr_scores = normalizer_vector.fit_transform(standardized_profile_sr_scores)
    normalized_logged_in_user_sr_scores = normalizer_vector.transform(standardized_logged_in_user_sr_scores)
    
    sr_similarity = cosine_similarity(normalized_profile_sr_scores, normalized_logged_in_user_sr_scores).flatten()
    
    return sr_similarity

def residence_similarity(user_profile_records, logged_in_user_record):
    retrieve_profile_residence = list(map(lambda c: [c["city_residence"] + ", " + c["state_residence"]], user_profile_records))
    retrieve_logged_in_user_residence = list(map(lambda c2: [c2["city_residence"] + ", " + c2["state_residence"]], logged_in_user_record))
    
    np_retrieve_profile_residence = np.concatenate([retrieve_profile_residence]).flatten()
    np_retrieve_logged_in_user_residence = np.concatenate([retrieve_logged_in_user_residence]).flatten()
    
    normalizer_vectorizer = Normalizer()
    standard = StandardScaler(with_mean=False)
    tfidf_vectorizer = TfidfVectorizer()
    
    # First, transform the text into a vector of numbers for the StandardScaler() to use, which is then
    # followed by the Normalizer() function to normalize the data and provide better results.
    profile_residence_scores = tfidf_vectorizer.fit_transform(np_retrieve_profile_residence)
    logged_in_user_residence_scores = tfidf_vectorizer.transform(np_retrieve_logged_in_user_residence)
    
    # After converting the text into numbers, use them for the StandardScaler().
    standardized_profile_residence_scores = standard.fit_transform(profile_residence_scores)
    standardized_logged_in_user_residence_scores = standard.transform(logged_in_user_residence_scores)
    
    # Finally, normalize the data to provide for better results, which will play a role in determining the similarities
    # between a logged in user and other users.
    normalized_profile_residence_scores = normalizer_vectorizer.fit_transform(standardized_profile_residence_scores)
    normalized_logged_in_user_residence_scores = normalizer_vectorizer.transform(standardized_logged_in_user_residence_scores)
    
    # Stores the cosine similarities between the logged in user and that of other profiles.
    r_similarity = cosine_similarity(normalized_logged_in_user_residence_scores, normalized_profile_residence_scores).flatten()
    
    return r_similarity

def relationship_status_similarity(user_profile_records, logged_in_user_record):
    retrieve_profile_relationship_status = list(map(lambda r: r["relationship_status"], user_profile_records))
    retrieve_logged_in_user_relationship_status = list(map(lambda r2: r2["relationship_status"], logged_in_user_record))

    np_retrieve_profile_relationship_status = np.concatenate([retrieve_profile_relationship_status])
    np_retrieve_logged_in_user_relationship_status = np.concatenate([retrieve_logged_in_user_relationship_status])
    
    # Vectorizers and preprocessing functions.
    normalizer_vector = Normalizer()
    standard = StandardScaler(with_mean=False)
    tfidf_vectorizer = TfidfVectorizer()
    
    profile_relationship_status_scores = tfidf_vectorizer.fit_transform(np_retrieve_profile_relationship_status)
    logged_in_user_relationship_status_scores = tfidf_vectorizer.transform(np_retrieve_logged_in_user_relationship_status)
    
    standardized_profile_relationship_status_scores = standard.fit_transform(profile_relationship_status_scores)
    standardized_logged_in_user_relationship_status_scores = standard.transform(logged_in_user_relationship_status_scores)
    
    normalized_profile_rl_status_scores = normalizer_vector.fit_transform(standardized_profile_relationship_status_scores)
    normalized_logged_in_user_rl_status_scores = normalizer_vector.transform(standardized_logged_in_user_relationship_status_scores)
    
    # Variable that stores the cosine similarity percentages between the logged in user's profile and other profiles' relationship statuses.
    rs_similarity = cosine_similarity(normalized_logged_in_user_rl_status_scores, normalized_profile_rl_status_scores).flatten()
    
    return rs_similarity

def age_similarity(user_profile_records, logged_in_user_record, index):
    
    # Retrieve the ages of both the logged in user and profile user.
    retrieve_profile_user_age = user_profile_records[index]["age"]
    retrieve_logged_in_user_age = logged_in_user_record[0]["age"]
    
    # Calculate the euclidean distance between the two user's age.
    calculate_age_similarity = (100 - euclidean_distances([[retrieve_profile_user_age]], [[retrieve_logged_in_user_age]]).flatten()[0]) / 100.0
    
    return calculate_age_similarity

def elo_booster_factor(user_profile_records, index):
    profile_user_score = user_profile_records[index]["rating"]
    booster_factor = profile_user_score / 100
    
    return booster_factor

def map_gender_interest_with_gender(matches={}, gender_interest="", current_user_SO="", current_user_gender=""):
    if gender_interest == "Anyone" or gender_interest == "Deciding":
        return True
    
    match_set = {matches["sexual_orientation"], matches["gender"], matches["interested_in"]}
    current_user_set = {current_user_SO, current_user_gender, gender_interest}
    
    if current_user_SO == "Heterosexual" and not match_set.issubset(current_user_set):
        return True
    
    elif current_user_SO == "Homosexual (Gay)" and match_set.issubset(current_user_set):
        return True
    
    elif current_user_SO == "Homosexual (Lesbian)" and match_set.issubset(current_user_set):
        return True

    # if matches["gender"] in interested_genders and matches["sexual_orientation"] == current_user_sexual_orientation:
    #     return True

    # elif current_user_sexual_orientation == "Bisexual" and len(interested_genders) >= 2:
    #     # If the current user is a bisexual male, then filter heterosexual male users.
    #     if current_user_gender == "Male" and not (matches["gender"] == "Male" and matches["sexual_orientation"] == "Heterosexual"):
    #         return True
        
    #     # If the current user is a bisexual female, then filter heterosexual female users.
    #     elif current_user_gender == "Female" and not (matches["gender"] == "Female" and matches["sexual_orientation"] == "Heterosexual"):
    #         return True

    #     # Otherwise, if the user is another gender other than male or female...
    #     elif current_user_gender != "Male" and current_user_gender != "Female":
    #         # If the current user is bisexual and is of another gender, then filter heterosexual users 
    #         # users not matching their gender interests/sexual orientation.
    #         for interested_gender in interested_genders:
    #             if not (matches["gender"] == interested_gender and matches["sexual_orientation"] == "Heterosexual"):
    #                 return True
            

def filter_matches(matches=[{}], gender_interest="", sexual_orientation="", gender=""):
    filter_matches = list(filter(lambda m: map_gender_interest_with_gender(m, gender_interest, sexual_orientation, gender), matches))
    filter_matches = list(filter(lambda k: (k.pop("gender"), k.pop("sexual_orientation"), k.pop("interested_in")), filter_matches))
    return filter_matches

def heap_sort(heap_list, use_so_filter, logged_in_user_profile):
    heap = PQ.Heap()

    for record in heap_list:
        heap.insert(record[0], record[1], record[2], 
                    record[3], record[4], record[5],
                    record[6], record[7], record[8], 
                    record[9], record[10], record[11],
                    record[12], record[13], record[14],
                    record[15], record[16], record[17])
    
    # Now remove them to put into sorted list.
    # i.e. heap sort (runs in O(n log n) time).
    while len(heap.heap) != 0:
        heap.remove()
    
    # Put the sorted items into a list (runs in O(n) time).    
    similar_users = [{"username": record[1], "interests": record[2], 
                      "first_name": record[3], 
                      "city_residence": record[6], "state_residence": record[7],
                      "sexual_orientation": record[8],
                      "interested_in": record[9],
                      "uri": record[10],
                      "gender": record[12],
                      "age": record[17]} for record in heap.sorted_list]
    
    if use_so_filter:
        similar_users = filter_matches(similar_users, gender_interest=logged_in_user_profile["interested_in"], sexual_orientation=logged_in_user_profile["sexual_orientation"], gender=logged_in_user_profile["gender"])
    
    return similar_users

def run_algo(profile_records=[{}], logged_in_user_record=[{}], use_so_filter=bool):
    # This list will be used to calculate the average similarity between the logged in user
    # and another user that is using the dating app.
    similarity_values = []
    heap_list = []
    
    for i_profile in range(len(profile_records)):
        # Determining bio/interest section similarity using TfidfVectorizer() as it is analyzing
        # a large body of text. It plays a crucial role since a user's bio is one of the categories
        # that plays a role as to how similar two users (the logged in user, and the user the latter
        # is looking up) are.
        bio_similarity_percentage = bio_interest_similarity(profile_records, logged_in_user_record, i_profile)
        append_similarity(similarity_list=similarity_values, similarity_percentage=bio_similarity_percentage)
        
        # Calculating height similarity using Euclidean distance.
        height_similarity_percentage = height_similarity(profile_records, logged_in_user_record, i_profile)
        append_similarity(similarity_list=similarity_values, similarity_percentage=height_similarity_percentage)
        
        # Calculates the similarities based on a user's sexual orientation and gender interests.
        # Since the result is an array, the index of a user will be used to look up their score
        # which will then be used to calculate their similarity to the logged in user.
        so_similarity_percentages = sexual_orientation_similarity(profile_records, logged_in_user_record)
        
        if so_similarity_percentages[i_profile] <= 0:
            append_similarity(similarity_list=similarity_values, similarity_percentage=(1 + so_similarity_percentages[i_profile]))
        else:
            append_similarity(similarity_list=similarity_values, similarity_percentage=(1 - so_similarity_percentages[i_profile]))
        
        city_residence_similarity_percentage = city_residence_similarity(profile_records, logged_in_user_record)
        append_similarity(similarity_list=similarity_values, similarity_percentage=(city_residence_similarity_percentage[i_profile]))
        
        state_residence_similarity_percentage = state_residence_similarity(profile_records, logged_in_user_record)
        append_similarity(similarity_list=similarity_values, similarity_percentage=(state_residence_similarity_percentage[i_profile]))
        
        relationship_status_similarity_percentage = relationship_status_similarity(profile_records, logged_in_user_record)
        append_similarity(similarity_list=similarity_values, similarity_percentage=(relationship_status_similarity_percentage[i_profile]))
        
        age_similarity_percentage = age_similarity(profile_records, logged_in_user_record, i_profile)
        append_similarity(similarity_list=similarity_values, similarity_percentage=age_similarity_percentage)
        
        elo_booster_score = elo_booster_factor(profile_records, i_profile)
        append_similarity(similarity_list=similarity_values, similarity_percentage=elo_booster_score)
        
        current_avg_similarity = (sum(similarity_values) / len(similarity_values)) * 100.0
        similarity_values.clear()
        
        # Stores the average similarity between a logged in user and another user
        # in the heap list along with other attributes.
        heap_list.append((round(current_avg_similarity, 3), 
                          profile_records[i_profile]["username"], 
                          profile_records[i_profile]["interests"],
                          profile_records[i_profile]["first_name"], 
                          profile_records[i_profile]["middle_name"], 
                          profile_records[i_profile]["last_name"],
                          profile_records[i_profile]["city_residence"], 
                          profile_records[i_profile]["state_residence"], 
                          profile_records[i_profile]["sexual_orientation"],
                          profile_records[i_profile]["interested_in"], 
                          profile_records[i_profile]["uri"],
                          profile_records[i_profile]["relationship_status"],
                          profile_records[i_profile]["gender"],
                          profile_records[i_profile]["height"],
                          profile_records[i_profile]["birth_month"],
                          profile_records[i_profile]["birth_date"],
                          profile_records[i_profile]["birth_year"],
                          profile_records[i_profile]["age"]))

    items = heap_sort(heap_list, use_so_filter, logged_in_user_profile=logged_in_user_record[0])
     
    return items