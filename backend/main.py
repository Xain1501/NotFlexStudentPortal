from website import create_app
from database .connection import create_tables
import mysql.connector

#this is a package 
app = create_app()

if __name__ == '__main__': 
    #only if we run this file not when we input it only then
    #it should be exceuted      
    app.run(debug=True)
    #start the webserver in debug mode if we change the code sometimes
    #it gonna rerun the server automatically
