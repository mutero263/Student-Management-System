import sqlite3

try:
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    print("Users (login accounts):")
    for row in cursor.execute('SELECT username FROM users'):
        print(row)

    print("Students (records):")
    for row in cursor.execute('SELECT name, studentId FROM students'):
        print(row)

    print("Dorms:")
    for row in cursor.execute('SELECT name FROM subjects'):
        print(row)

    conn.close()
except Exception as e:
    print("Error:", str(e))