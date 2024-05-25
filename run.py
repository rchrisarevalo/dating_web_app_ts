# This file is for local development purposes
# only and is not to be used in production.
#
# (c) 2024 Dating Web App.

import threading as t
import subprocess
import sys
import time

sys.path.append('./src/backend')

def run_express_server(cmd: str):
    subprocess.run(cmd, shell=True, check=True, cwd="./src/backend")

def run_python_server(cmd: str):
    subprocess.run(cmd, shell=True, check=True, cwd="./src/backend")

if __name__ == "__main__":
    js_t = t.Thread(target=run_express_server, args=("nodemon server.js",))
    f_api_t = t.Thread(target=run_python_server, args=("uvicorn server:server --reload --port 5000",))

    # Run the threads.
    js_t.start()
    f_api_t.start()

    # Join the threads so that they continue to run until
    # the user terminates the script.
    time.sleep(1.0)
    js_t.join()
    time.sleep(1.0)
    f_api_t.join()