import subprocess
import argparse as ap

def run_all_tests():
    subprocess.run("pytest -v", shell=True, cwd="./src/backend")

def run_api_tests():
    subprocess.run("pytest server_test.py -v", shell=True, cwd="./src/backend")

def run_api_test_unit(arg_test_func: str):
    subprocess.run(f"pytest server_test.py::{arg_test_func} -v", shell=True, cwd="./src/backend")

def run_unit_tests():
    subprocess.run("pytest matching_algorithm_test.py -v", shell=True, cwd="./src/backend")

def run_class_unit_tests(class_test_arg: str): 
    subprocess.run(f"pytest matching_algorithm_test.py::{class_test_arg} -v", shell=True, cwd="./src/backend")

def run_class_unit_test_function(class_test_arg: str, test_func_arg: str):
    subprocess.run(f"pytest matching_algorithm_test.py::{class_test_arg}::{test_func_arg} -v", shell=True, cwd="./src/backend")
    
if __name__ == "__main__":
    parser = ap.ArgumentParser(prog='Run test suite',
                               description='''
                                    This program allows developers to run pytest tests 
                                    without changing to the directory containing them.
                               ''',
                              )

    parser.add_argument('--t', '--test', 
                        required=True, 
                        choices=["all", "server_test", "matching_algorithm_test"], 
                        help="The default argument used to run a specific test file or all tests.")
    
    parser.add_argument("--c", '--class', 
                        help="Argument used to run a series of unit tests within a unittest class in the matching_algorithm_test.py file.",
                        choices=[
                            "TestMatchingAlgorithmRunTime",
                            "TestMatchingAlgorithm",
                            "TestHeap",
                            "TestRating"
                        ])
    
    parser.add_argument('--f', '--function', 
                        help='''
                                The argument used to test a specific function within the test suite. 
                                It can be combined with the --c argument when testing out the matching_algorithm_test.py file.
                             ''')

    args = parser.parse_args()
    
    if args.t == "all":
        run_all_tests()

    elif args.t == "server_test": 
        # Prevent class arguments from being taken in
        # as there are no classes in the server_test.py
        # file.
        if args.c:
            print("No class arguments will be accepted for this test suite.")
            exit(-1)

        if not args.f:
            run_api_tests()
        else:
            run_api_test_unit(args.f)

    elif args.t == "matching_algorithm_test":
        if not args.c:
            run_unit_tests()
        
        elif args.c and not args.f:
            run_class_unit_tests(args.c)

        else:
            run_class_unit_test_function(args.c, args.f)