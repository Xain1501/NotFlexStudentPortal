# database.py
import mysql.connector

def create_tables():
    connection = mysql.connector.connect(
        host='localhost',
        user='root', 
        password='',
        database='student_portal'
    )
    cursor = connection.cursor()
    
    # Execute SQL from file
    with open('schema.sql', 'r') as file:
        sql_script = file.read()
        cursor.execute(sql_script, multi=True)
    
    connection.commit()
    connection.close()

if __name__ == "__main__":
    create_tables()