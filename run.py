# This file is for local development purposes
# only and is not to be used in production.
#
# (c) 2024 Dating Web App.

import threading as t
import subprocess
import sys

sys.path.append('./src/backend')

def run_environ(cmd: str):
    subprocess.run(cmd, shell=True, check=True)

def run_express_server(cmd: str):
    subprocess.run(cmd, shell=True, check=True, cwd="./src/backend")

def run_python_server(cmd: str):
    subprocess.run(cmd, shell=True, check=True, cwd="./src/backend")

if __name__ == "__main__":
    dev_t = t.Thread(target=run_environ, args=("npm run dev",))
    js_t = t.Thread(target=run_express_server, args=("nodemon server.js",))
    f_api_t = t.Thread(target=run_python_server, args=("uvicorn server:server --reload --port 5000",))

    # Run the threads.
    dev_t.start()
    js_t.start()
    f_api_t.start()

    # Join the threads so that they continue to run until
    # the user terminates the script.
    dev_t.join()
    js_t.join()
    f_api_t.join()