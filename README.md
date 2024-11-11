# Dating Web App (TypeScript Version)

This project was made using React TypeScript, Express.js, and FastAPI. React Bootstrap was also incorporated into this project for the use of modals when logging in or configuring account settings.

## FOR DEVELOPERS
Hello, fellow developer! If you are joining the software development team for this web app, you have to make sure that you have the following programs installed on your computer before working on this project:

* **Node.js** (latest version highly recommended to avoid unexpected bugs and/or errors during development) (*https://nodejs.org/en/download*)
* **Python v3.10** (or later) (*https://www.python.org/downloads/*)
* **Git** (for committing changes and creating branches)
* And finally, **Vite**, which will allow you to speed up the development process of this application. Use the following command to install it:
    * **npm install vite@latest** (or without **@latest**, depending on your preference) (*from*: *https://www.npmjs.com/package/vite*)

When starting out on this project, make sure that you install the packages/libraries from the package.json file outside the /src directory on your IDE terminal.

Afterwards, move to the src/backend directory through your IDE terminal and install the packages/libraries listed on the package.json folder there. In addition, install the Python libraries from the 'requirements.txt' folder in the src/backend directory using the following command:
* **pip install -r requirements.txt** (*from*: *https://www.geeksforgeeks.org/how-to-install-python-packages-with-requirements-txt/*)

Lastly, since this web app now uses PostgreSQL, you will need the database key to access it. If you need it, please feel free to contact me via Discord or email--preferably the former.

* Before inserting the database key, you have to create a file called 'secret.env', which you use to store the necessary environment variables needed for this web app. 
* Keep in mind that you should **NEVER** push the secret.env file into the repo under any circumstances. Doing so **DELIBERATELY** will result in your immediate removal from the repository for security reasons and to maintain the integrity of this application. 
* The variables you will use to store your credentials are:
    * DB_KEY (the PostgreSQL database key to access its contents)
    * SK_KEY (a long, random key of your choosing that will be used to create a JWT token, which is used for persisting a user session when logging in)
    
* To access your .env file, you have to install two libraries:
    * **dotenv (for Express server)** (https://www.npmjs.com/package/dotenv)
    * **python-dotenv (for FastAPI server)** (https://pypi.org/project/python-dotenv/)

In order to keep track of the tasks when developing new features or making bug fixes, contact me so that I can send you an invite link to our Jira Dashboard, where we use Agile Development to ensure high-quality, and working software.

## CONTACT INFO

Email: *rubenplayer105@gmail.com*

Discord: *rchrisarevalo*