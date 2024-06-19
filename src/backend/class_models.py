import keras

class ColabFilteringModel:
    def __init__(self):
        self.model: keras.Model = keras.models.load_model('./models/matching_model.h5', compile=True)

class MockProfiles:
    def __init__(self):
        self.mock_user_profiles = [
            {
                "username": "tim_johnson", 
                "interests": "I like to farm", 
                "gender": "Male",
                "first_name": "Tim", 
                "middle_name": "Tobias", 
                "last_name": "Johnson",
                "height": "5'9''", 
                "relationship_status": "Single",
                "city_residence": "Mobile", 
                "state_residence": "Alabama",
                "sexual_orientation": "Heterosexual", 
                "interested_in": "Females",
                "uri": "akas191201982", 
                "birth_month": "June", 
                "birth_date": "19", 
                "birth_year": "1985",
                "age": 39,
                "rating": 2.323,
                "visits": 7
            },                    
            {
                "username": "annie_white", 
                "interests": "I like to work in the office", 
                "gender": "Female",
                "first_name": "Annie", 
                "middle_name": "", 
                "last_name": "White",
                "height": "5'3''", 
                "relationship_status": "Single",
                "city_residence": "Birmingham", 
                "state_residence": "Alabama",
                "sexual_orientation": "Heterosexual", 
                "interested_in": "Males",
                "uri": "19akasj1nana", 
                "birth_month": "September", 
                "birth_date": "23", 
                "birth_year": "1978",
                "age": 44,
                "rating": -10.2912,
                "visits": 1
            },     
            {
                "username": "joshua_walter", 
                "interests": "I work out at the gym and am interested in guys.", 
                "gender": "Male",
                "first_name": "Joshua", 
                "middle_name": "Edward", 
                "last_name": "Walter",
                "height": "5'11''", 
                "relationship_status": "Taken",
                "city_residence": "Houston", 
                "state_residence": "Texas",
                "sexual_orientation": "Homosexual (Gay)", 
                "interested_in": "Males",
                "uri": "wkas9120amnasfuja0o", 
                "birth_month": "July", 
                "birth_date": "2", 
                "birth_year": "2000",
                "age": 23,
                "rating": 0.2931,
                "visits": 2
            },                                   
            {
                "username": "a_hernandez", 
                "interests": "I love to work and play video games!", 
                "gender": "Female",
                "first_name": "Andrea", 
                "middle_name": "Kimberly", 
                "last_name": "Hernandez",
                "height": "5'8''", 
                "relationship_status": "Single",
                "city_residence": "Austin", 
                "state_residence": "Texas",
                "sexual_orientation": "Bisexual", 
                "interested_in": "Males, Females",
                "uri": "19akasj1nana", 
                "birth_month": "June", 
                "birth_date": "19", 
                "birth_year": "1985",
                "age": 39,
                "rating": 0.21920,
                "visits": 4
            }
        ]

        self.mock_current_user_profile = [
            {
                "username": "kimmie_benavides", 
                "interests": "I am a hard worker and push forward", 
                "gender": "Female",
                "first_name": "Kimberly", 
                "middle_name": "Elizabeth", 
                "last_name": "Benavides",
                "height": "5'6''", 
                "relationship_status": "Single",
                "city_residence": "Birmingham", 
                "state_residence": "Alabama",
                "sexual_orientation": "Heterosexual", 
                "interested_in": "Males",
                "uri": "a1928smaskcka", 
                "birth_month": "August", 
                "birth_date": "9", 
                "birth_year": "2001",
                "age": 22,
                "rating": 23.120129
            }
        ]

        self.mock_another_cur_user_profile = [
            {
                "username": "naomi_lewis_01", 
                "interests": "I am an influencer", 
                "gender": "Female",
                "first_name": "Naomi", 
                "middle_name": "Ann", 
                "last_name": "Lewis",
                "height": "5'3''", 
                "relationship_status": "Single",
                "city_residence": "Seattle", 
                "state_residence": "Washington",
                "sexual_orientation": "Queer", 
                "interested_in": "Females",
                "uri": "a1928smaskcka", 
                "birth_month": "June", 
                "birth_date": "9", 
                "birth_year": "2001",
                "age": 23,
                "rating": 1.71820
            }
        ]