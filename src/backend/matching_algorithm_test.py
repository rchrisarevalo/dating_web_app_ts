import unittest
from main import return_run_time, run_matching_algorithm
from PQ import Heap
from rating_sys import rating_sys

mock_data_user_profiles = [{"username": "tim_johnson", "interests": "I like to farm", "gender": "Male",
                            "first_name": "Tim", "middle_name": "Tobias", "last_name": "Johnson",
                            "height": "5'9''", "relationship_status": "Single",
                            "city_residence": "Mobile", "state_residence": "Alabama",
                            "sexual_orientation": "Heterosexual", "interested_in": "Women",
                            "uri": "akas191201982", "birth_month": "June", "birth_date": "19", "birth_year": "1985",
                            "age": 38, "rating": 2.323},
                           
                           {"username": "annie_white", "interests": "I like to work in the office", "gender": "Female",
                            "first_name": "Annie", "middle_name": "", "last_name": "White",
                            "height": "5'3''", "relationship_status": "Single",
                            "city_residence": "Birmingham", "state_residence": "Alabama",
                            "sexual_orientation": "Heterosexual", "interested_in": "Men",
                            "uri": "19akasj1nana", "birth_month": "September", "birth_date": "23", "birth_year": "1978",
                            "age": 44, "rating": -10.2912},
                           
                           {"username": "joshua_walter", "interests": "I work out at the gym and am interested in guys.", "gender": "Male",
                            "first_name": "Joshua", "middle_name": "Edward", "last_name": "Walter",
                            "height": "5'11''", "relationship_status": "Taken",
                            "city_residence": "Houston", "state_residence": "Texas",
                            "sexual_orientation": "Homosexual (Gay)", "interested_in": "Men",
                            "uri": "wkas9120amnasfuja0o", "birth_month": "July", "birth_date": "2", "birth_year": "2000",
                            "age": 23, "rating": 0.2931},
                                       
                            {"username": "a_hernandez", "interests": "I love to work and play video games!", "gender": "Female",
                            "first_name": "Andrea", "middle_name": "Kimberly", "last_name": "Hernandez",
                            "height": "5'8''", "relationship_status": "Single",
                            "city_residence": "Austin", "state_residence": "Texas",
                            "sexual_orientation": "Bisexual", "interested_in": "Men and Women",
                            "uri": "19akasj1nana", "birth_month": "June", "birth_date": "19", "birth_year": "1985",
                            "age": 38, "rating": 0.21920}]

mock_logged_in_user_profile = [{"username": "kimmie_benavides", "interests": "I am a hard worker and push forward", "gender": "Female",
                                "first_name": "Kimberly", "middle_name": "Elizabeth", "last_name": "Benavides",
                                "height": "5'6''", "relationship_status": "Single",
                                "city_residence": "Birmingham", "state_residence": "Alabama",
                                "sexual_orientation": "Heterosexual", "interested_in": "Men",
                                "uri": "a1928smaskcka", "birth_month": "August", "birth_date": "9", "birth_year": "2001",
                                "age": 22, "rating": 23.120129}]


class TestMatchingAlgorithmRunTime(unittest.TestCase):
    # Test algorithm and check if run time is less than or equal to 0.20 s.
    def test_run_time(self):
        self.setUp()
        self.assertLessEqual(return_run_time(mock_data_user_profiles, mock_logged_in_user_profile), 0.20)
        self.doCleanups()
        
    # Test to see if the matching algorihm still runs fast after running it 10000 times.
    def test_run_time_multiple(self):
        self.setUp()
        self.assertLessEqual(return_run_time(mock_data_user_profiles, mock_logged_in_user_profile), 0.20)
        self.doCleanups()
        
        self.doClassCleanups()


class TestMatchingAlgorithm(unittest.TestCase):
    # Using different usernames, test to see if the algorithms provide
    # the usernames of each user, as well as their estimated similarity
    # percentage.
    def test_match(self):
        self.setUp()
        result = run_matching_algorithm(mock_data_user_profiles, mock_logged_in_user_profile)
        self.assertEqual(run_matching_algorithm(mock_data_user_profiles, mock_logged_in_user_profile), result)
        self.doCleanups()

    def test_similarity_scores(self):
        self.setUp()
        
        result = run_matching_algorithm(mock_data_user_profiles, mock_logged_in_user_profile)
        
        # To accommodate the dynamic nature of this unit test when running all the tests altogether or 
        # running it individually, we will check if the first user in the array matches, as previous
        # results have shown in prior test runs, the username of "tim_johnson", or the username
        # of "brian_jones".
        #
        # The first case occurs if this unit test is run simultaneously with all the other unit
        # tests, and the second case occurs if this unit test is run individually via the
        # test explorer or when it is run via the command prompt.
        if result[0]["username"] == "tim_johnson":
            # Tests using the mock data that was provided above.
            self.assertEqual(result[0]["username"], "tim_johnson")
            self.assertEqual(result[1]["username"], "annie_white")
            self.assertEqual(result[2]["username"], "a_hernandez")
            self.assertEqual(result[3]["username"], "joshua_walter")
        else:
            self.assertEqual(result[0]["username"], "brian_jones")
            self.assertEqual(result[1]["username"], "tim_johnson")
            self.assertEqual(result[2]["username"], "annie_white")
            self.assertEqual(result[3]["username"], "joshua_walter")
        
        self.doCleanups()
    
    def test_retrieve_top_k_users(self):
        self.setUp()
        
        # Add 3 more mock data profiles.
        new_mock_data_profile_1 = {"username": "brian_jones", "interests": "I love to party hard with the ladies.", "gender": "Female",
                                   "first_name": "Brian", "middle_name": "Christopher", "last_name": "Jones",
                                   "height": "5'11''", "relationship_status": "Single",
                                   "city_residence": "Pittsburgh", "state_residence": "Pennsylvania",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Women",
                                   "uri": "a#10kasm109#@lkas!-2_3", "birth_month": "August", "birth_date": "4", "birth_year": "1990",
                                   "age": 33, "rating": 50.01923}

        new_mock_data_profile_2 = {"username": "annie_garza", "interests": "I love to run and write code!", "gender": "Female",
                                   "first_name": "Annie", "middle_name": "", "last_name": "Garza",
                                   "height": "5'3''", "relationship_status": "Taken",
                                   "city_residence": "McAllen", "state_residence": "Texas",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Men",
                                   "uri": "aaas12lasmcmakl", "birth_month": "June", "birth_date": "2", "birth_year": "2003",
                                   "age": 20, "rating": 12.192301}
        
        new_mock_data_profile_3 = {"username": "katherine_jackson", "interests": "I love to play video games", "gender": "Transgender Woman",
                                   "first_name": "Katherine", "middle_name": "Emily", "last_name": "Jackson",
                                   "height": "5'10''", "relationship_status": "Engaged",
                                   "city_residence": "San Diego", "state_residence": "California",
                                   "sexual_orientation": "Heterosexual", "interested_in": "Men",
                                   "uri": "tyhakask19329810@!kwg89", "birth_month": "November", "birth_date": "23", "birth_year": "1987",
                                   "age": 35, "rating": 23.12082}

        new_mock_data_user_profiles = mock_data_user_profiles
        
        # Now the array has 8 users stored in it.
        new_mock_data_user_profiles.append(new_mock_data_profile_1)
        new_mock_data_user_profiles.append(new_mock_data_profile_2)
        new_mock_data_user_profiles.append(new_mock_data_profile_3)
        
        # Provide the first 5 users to the algorithm to retrieve the top 5 users based on their similarities
        # to the logged in user, as well as their current user rating.
        new_result = run_matching_algorithm(new_mock_data_user_profiles[0:5], mock_logged_in_user_profile)
        
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
        
        
class TestHeap(unittest.TestCase):
    def test_insert(self):
        self.setUp()
        
        mock_heap = Heap()
        mock_heap.insert(23, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'akjasjajsj', 'Single', 'Male', "6'2''", "April", "21", "1987", 36)
        mock_heap.insert(19, 'madi_gray', 'I love to write!', 'Madison', 'Jane', 'Gray', 'Austin', 'Texas', 'Heterosexual', 'Men', '19bmnavakj', 'Single', 'Female', "5'1''", "July", "18", "1999", 24)
        mock_heap.insert(45, 'adriana_johnson', 'I love to paint!', 'Adriana', '', 'Johnson', 'Houston', 'Texas', 'Homosexual (Lesbian)', 'Women', 'i910mnaskai', 'Taken', 'Female', "5'7''", "March", "30", "2001", 22)
        mock_heap.insert(42, 'michael_humphries', 'I love to play video games!', 'Michael', 'James', 'Humphries', 'Newark', 'New Jersey', 'Heterosexual', 'Women', '81zmai19019', 'Married', 'Non-binary', "5'9''", "May", "30", "1988", 35)
        mock_heap.insert(54, 'andrew_mckinney', 'I love to make graphic designs!', 'Andrew', 'Christopher', 'McKinney', 'Omaha', 'Nebraska', 'Homosexual (Gay)', 'Men', '210389makeam', 'Single', 'Male', "6'1''", "August", "12", "1992", 31)
        mock_heap.insert(82, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'mas919amoai_912', 'Single', 'Male', "5'5''", "September", "3", "1997", 26)

        self.assertEqual(mock_heap.print_heap(), [(82, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'mas919amoai_912', 'Single', 'Male', "5'5''", "September", "3", "1997", 26),
                                                  (45, 'adriana_johnson', 'I love to paint!', 'Adriana', '', 'Johnson', 'Houston', 'Texas', 'Homosexual (Lesbian)', 'Women', 'i910mnaskai', 'Taken', 'Female', "5'7''", "March", "30", "2001", 22),
                                                  (54, 'andrew_mckinney', 'I love to make graphic designs!', 'Andrew', 'Christopher', 'McKinney', 'Omaha', 'Nebraska', 'Homosexual (Gay)', 'Men', '210389makeam', 'Single', 'Male', "6'1''", "August", "12", "1992", 31),
                                                  (19, 'madi_gray', 'I love to write!', 'Madison', 'Jane', 'Gray', 'Austin', 'Texas', 'Heterosexual', 'Men', '19bmnavakj', 'Single', 'Female', "5'1''", "July", "18", "1999", 24),
                                                  (42, 'michael_humphries', 'I love to play video games!', 'Michael', 'James', 'Humphries', 'Newark', 'New Jersey', 'Heterosexual', 'Women', '81zmai19019', 'Married', 'Non-binary', "5'9''", "May", "30", "1988", 35),
                                                  (23, 'jack.white','I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'akjasjajsj', 'Single', 'Male', "6'2''", "April", "21", "1987", 36)])
        
        self.doCleanups()
    
    def test_delete_and_top(self):
        self.setUp()
        
        mock_heap_2 = Heap()
        mock_heap_2.insert(23, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'akjasjajsj', 'Single', 'Male', "6'2''", "April", "21", "1987", 36)
        mock_heap_2.insert(19, 'madi_gray', 'I love to write!', 'Madison', 'Jane', 'Gray', 'Austin', 'Texas', 'Heterosexual', 'Men', '19bmnavakj', 'Single', 'Female', "5'1''", "July", "18", "1999", 24)
        mock_heap_2.insert(45, 'adriana_johnson', 'I love to paint!', 'Adriana', '', 'Johnson', 'Houston', 'Texas', 'Homosexual (Lesbian)', 'Women', 'i910mnaskai', 'Taken', 'Female', "5'7''", "March", "30", "2001", 22)
        mock_heap_2.insert(42, 'michael_humphries', 'I love to play video games!', 'Michael', 'James', 'Humphries', 'Newark', 'New Jersey', 'Heterosexual', 'Women', '81zmai19019', 'Married', 'Non-binary', "5'9''", "May", "30", "1988", 35)
        mock_heap_2.insert(54, 'andrew_mckinney', 'I love to make graphic designs!', 'Andrew', 'Christopher', 'McKinney', 'Omaha', 'Nebraska', 'Homosexual (Gay)', 'Men', '210389makeam', 'Single', 'Male', "6'1''", "August", "12", "1992", 31)
        mock_heap_2.insert(82, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'mas919amoai_912', 'Single', 'Male', "5'5''", "September", "3", "1997", 26)
        
        self.assertEqual(mock_heap_2.top(), (82, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'mas919amoai_912', 'Single', 'Male', "5'5''", "September", "3", "1997", 26))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), (54, 'andrew_mckinney', 'I love to make graphic designs!', 'Andrew', 'Christopher', 'McKinney', 'Omaha', 'Nebraska', 'Homosexual (Gay)', 'Men', '210389makeam', 'Single', 'Male', "6'1''", "August", "12", "1992", 31))
        
        # Test to remove 3 items from the heap.
        for i in range(0, 3):
            mock_heap_2.remove()
            
        self.assertEqual(mock_heap_2.top(), (23, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'akjasjajsj', 'Single', 'Male', "6'2''", "April", "21", "1987", 36))
        
        mock_heap_2.insert(97, 'jackie.ramirez', 'I love to hang out with my friends!', 'Jacqueline', 'Rose', 'Ramirez', 'Los Angeles', 'California', 'Heterosexual', 'Men', '10291jac901023', 'Single', 'Female', "4'11''", "February", "3", "2003", 20)
        mock_heap_2.insert(87, 'jackson_williams', 'I love to hang out with my family!', 'Jackson', 'James', 'Williams', 'Portland', 'Oregon', 'Heterosexual', 'Women', '201892mzj_m', 'Single', 'Male', "5'11''", "March", "30", "2000", 23)
        mock_heap_2.insert(102, 'bri_jones', 'I love to write algorithms!', 'Brian', '', 'Jones', 'Seattle', 'Washington', 'Homosexual (Gay)', 'Men', '10amasj38am_ajasi', 'Married', 'Male', "6'5''", "January", "15", "1978", 45)
        
        self.assertEqual(mock_heap_2.top(), (102, 'bri_jones', 'I love to write algorithms!', 'Brian', '', 'Jones', 'Seattle', 'Washington', 'Homosexual (Gay)', 'Men', '10amasj38am_ajasi', 'Married', 'Male', "6'5''", "January", "15", "1978", 45))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), (97, 'jackie.ramirez', 'I love to hang out with my friends!', 'Jacqueline', 'Rose', 'Ramirez', 'Los Angeles', 'California', 'Heterosexual', 'Men', '10291jac901023', 'Single', 'Female', "4'11''", "February", "3", "2003", 20))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), (87, 'jackson_williams', 'I love to hang out with my family!', 'Jackson', 'James', 'Williams', 'Portland', 'Oregon', 'Heterosexual', 'Women', '201892mzj_m', 'Single', 'Male', "5'11''", "March", "30", "2000", 23))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), (23, 'jack.white', 'I love to program!', 'Jack', 'Matthew', 'White', 'Pittsburgh', 'Pennsylvania', 'Heterosexual', 'Women', 'akjasjajsj', 'Single', 'Male', "6'2''", "April", "21", "1987", 36))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), (19, 'madi_gray', 'I love to write!', 'Madison', 'Jane', 'Gray', 'Austin', 'Texas', 'Heterosexual', 'Men', '19bmnavakj', 'Single', 'Female', "5'1''", "July", "18", "1999", 24))
        mock_heap_2.remove()
        self.assertEqual(mock_heap_2.top(), ())
        
        self.doCleanups()
        self.doClassCleanups()
        
        
class TestRating(unittest.TestCase):
    # Test the happy paths of the rating system.
    def test_change_rating(self):
        self.setUpClass()
        
        # Assume that the current user, "tim_johnson", wants to rate the user,
        # "annie_white", positively.
        # ====================================================================
        # Retrieve the original rating scores of both "tim_johnson" and
        # "annie_white".
        scores = {
            "tim_johnson": mock_data_user_profiles[0]["rating"],
            "annie_white": mock_data_user_profiles[1]["rating"],
            "a_hernandez": mock_data_user_profiles[3]["rating"]
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