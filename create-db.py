import sqlite3

# Connect to the database (it creates the file if it doesn't exist)
conn = sqlite3.connect('db/frc-inventory.db')

# Create a cursor to execute commands
cursor = conn.cursor()
cursor.execute("CREATE TABLE IF NOT EXISTS tools (id INTEGER, name TEXT, status TEXT, PRIMARY KEY(id))")

conn.commit()
conn.close()