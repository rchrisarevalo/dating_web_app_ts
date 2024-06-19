import unittest
from main import return_run_time
from rating_sys import rating_sys
from class_models import MockProfiles
from models.ml_match_algo_mock import run_mock_algorithm

class TestMatchingAlgorithmRunTime(unittest.TestCase):
    # Test algorithm and check if run time is less than or equal to 5 seconds.
    def test_run_time(self):
        self.setUp()
        profiles = MockProfiles()
        self.assertLessEqual(return_run_time(profiles.mock_user_profiles, profiles.mock_current_user_profile, False), 5.00)
        self.doCleanups()
        
    # Test to see if the matching algorihm still runs fast after running it 10000 times.
    def test_run_time_multiple(self):
        self.setUp()
        profiles = MockProfiles()
        self.assertLessEqual(return_run_time(profiles.mock_user_profiles, profiles.mock_current_user_profile, False), 5.00)
        self.doCleanups()
        
        self.doClassCleanups()

class TestMatchingAlgorithm(unittest.TestCase):
    # Using different usernames, test to see if the algorithms provide
    # the usernames of each user, as well as their estimated similarity
    # percentage.
    def test_match(self):
        self.setUp()
        profiles = MockProfiles()
        self.assertEqual(run_mock_algorithm(
                            profiles.mock_user_profiles, 
                            profiles.mock_current_user_profile, 
                            True), 
                            [
                                {
                                    'username': 'tim_johnson', 
                                    'interests': 'I like to farm', 
                                    'first_name': 'Tim', 
                                    'city_residence': 'Mobile', 
                                    'state_residence': 'Alabama', 
                                    'uri': 'akas191201982', 
                                    'age': 39
                                }
                            ]
                         )
        self.doCleanups()

    def test_similarity_scores(self):
        self.setUp()
        profiles = MockProfiles()
        result = run_mock_algorithm(profiles.mock_user_profiles, profiles.mock_current_user_profile, False)
        prev: int = 0

        # Because there are four users in the mock user data set,
        # assert that the number of recommendations generated
        # from the matching algorithm is less than 10.
        self.assertLess(len(result), 10)

        # Now assert that the users are printed in the order
        # they are stored in the 'result' variable.
        self.assertEqual(result[0].get("username"), "tim_johnson")
        self.assertEqual(result[1].get("username"), "annie_white")
        self.assertEqual(result[2].get("username"), "a_hernandez")
        self.assertEqual(result[3].get("username"), "joshua_walter")
        
        self.doCleanups()
    
    def test_retrieve_top_k_users(self):
        self.setUp()
        profiles = MockProfiles()

        # Add 3 more mock data profiles.
        new_mock_data_profile_1 = {"username": "brian_jones", "interests": "I love to party hard with the ladies.", "gender": "Female",
                                   "first_name": "Brian", "middle_name": "Christopher", "last_name": "Jones",
                                   "height": "5'11''", "relationship_status": "Single",
                                   "city_residence": "Pittsburgh", "state_residence": "Pennsylvania",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Females",
                                   "uri": "a#10kasm109#@lkas!-2_3", "birth_month": "August", "birth_date": "4", "birth_year": "1990",
                                   "age": 33, "rating": 50.01923, "visits": 15}

        new_mock_data_profile_2 = {"username": "annie_garza", "interests": "I love to run and write code!", "gender": "Female",
                                   "first_name": "Annie", "middle_name": "", "last_name": "Garza",
                                   "height": "5'3''", "relationship_status": "Taken",
                                   "city_residence": "McAllen", "state_residence": "Texas",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Males",
                                   "uri": "aaas12lasmcmakl", "birth_month": "June", "birth_date": "2", "birth_year": "2003",
                                   "age": 20, "rating": 12.192301, "visits": 0}
        
        new_mock_data_profile_3 = {"username": "katherine_jackson", "interests": "I love to play video games", "gender": "Transgender Woman",
                                   "first_name": "Katherine", "middle_name": "Emily", "last_name": "Jackson",
                                   "height": "5'10''", "relationship_status": "Engaged",
                                   "city_residence": "San Diego", "state_residence": "California",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Males",
                                   "uri": "tyhakask19329810@!kwg89", "birth_month": "November", "birth_date": "23", "birth_year": "1987",
                                   "age": 35, "rating": 23.12082, "visits": 1}

        new_mock_data_user_profiles = profiles.mock_user_profiles
        
        # Now the array has 8 users stored in it.
        new_mock_data_user_profiles.append(new_mock_data_profile_1)
        new_mock_data_user_profiles.append(new_mock_data_profile_2)
        new_mock_data_user_profiles.append(new_mock_data_profile_3)
        
        # Provide the first 5 users to the algorithm to retrieve the top 5 users based on their similarities
        # to the logged in user, as well as their current user rating.
        new_result = run_mock_algorithm(
            new_mock_data_user_profiles[0:5], 
            profiles.mock_current_user_profile, 
            False
        )
        
        # Test the results to see who are the top 5 users.
        self.assertEqual(new_result[0]["username"], 'brian_jones')
        self.assertEqual(new_result[1]["username"], 'tim_johnson')
        self.assertEqual(new_result[2]["username"], 'annie_white')
        self.assertEqual(new_result[3]["username"], 'a_hernandez')
        self.assertEqual(new_result[4]["username"], 'joshua_walter')
        
        # Now remove some users from the list.
        new_result.pop(1)
        new_result.pop(2)
        
        # Test the similarity percentages of the top 3 users after removing two of the original
        # top 5 users.
        self.assertEqual(new_result[0]["username"], 'brian_jones')
        self.assertEqual(new_result[1]["username"], 'annie_white')
        self.assertEqual(new_result[2]["username"], 'joshua_walter')
        
        # Now remove the top user.
        new_result.pop(0)
        
        # Test the similarity percentages of the top 2 users that are left.
        self.assertEqual(new_result[0]["username"], 'annie_white')
        self.assertEqual(new_result[1]["username"], 'joshua_walter')
        
        self.doCleanups()
        self.doClassCleanups()   
        
class TestRating(unittest.TestCase):
    # Test the happy paths of the rating system.
    def test_change_rating(self):
        self.setUpClass()
        
        profile = MockProfiles()
        
        # Assume that the current user, "tim_johnson", wants to rate the user,
        # "annie_white", positively.
        # ====================================================================
        # Retrieve the original rating scores of both "tim_johnson" and
        # "annie_white".
        scores = {
            "tim_johnson": profile.mock_user_profiles[0]["rating"],
            "annie_white": profile.mock_user_profiles[1]["rating"],
            "a_hernandez": profile.mock_user_profiles[3]["rating"]
        }
        
        # Calculate the new rating score for "annie_white" after she has been
        # rated "positive" by "tim_johnson".
        new_score = rating_sys("positive", scores, "annie_white", "tim_johnson")
        
        # Ensure that the new score is greater than the original score.
        self.assertGreater(new_score, scores["annie_white"])
        # ====================================================================
        
        # Now assume that "annie_white" also wants to rate "tim_johnson", but
        # neutrally.
        # ====================================================================
        # Calculate the new rating score for "tim_johnson" after he has been
        # rated "neutral" by "annie_white".
        new_score = rating_sys("neutral", scores, "tim_johnson", "annie_white")
        
        # Ensure that the new score is less than or equal to the original score.
        self.assertLessEqual(new_score, scores["tim_johnson"])
        
        # Lastly, assume that "annie_white" wants to rate another user, "a_hernandez",
        # negatively.
        # ====================================================================
        # Calculate the new rating score for "a_hernandez" after she has been
        # rated "negative" by "annie_white".
        new_score = rating_sys("negative", scores, "a_hernandez", "annie_white")
        
        # Unlike rating someone neutrally, where the ratee's score could either
        # stay the same or go down, depending on the rater's score, rating
        # someone negatively will always result in the ratee's score going down.
        #
        # Therefore, we have to ensure that the ratee's score will always be
        # less than their original score.
        self.assertLess(new_score, scores["a_hernandez"])
        
    # Test the sad paths of the rating system.
    def test_change_rating_sad(self):
        pass

if __name__ == "__main__":
    unittest.main()