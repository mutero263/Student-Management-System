from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os

app = Flask(__name__)
CORS(app)
DB_NAME = 'users.db'

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest().lower()

def init_db():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Students Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                studentId TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL,
                gender TEXT NOT NULL,
                enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Dorms Table 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dorms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                capacity INTEGER NOT NULL CHECK (capacity > 0),
                gender TEXT NOT NULL DEFAULT 'Mixed'
            )
        ''')

        # Dorm Assignments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dorm_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                studentId TEXT NOT NULL,
                dormName TEXT NOT NULL,
                assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (studentId) REFERENCES students(studentId),
                FOREIGN KEY (dormName) REFERENCES dorms(name)
            )
        ''')

        # Subjects Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE
            )
        ''')

        # Enrollments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                studentId TEXT NOT NULL,
                subjectCode TEXT NOT NULL,
                enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (studentId) REFERENCES students(studentId),
                FOREIGN KEY (subjectCode) REFERENCES subjects(code)
            )
        ''')

        # Add demo users
        demo_users = [
            ('admin', 'admin@merytech.com', 'admin1234'),
            ('staff', 'staff@nust.com', 'staff123')
        ]
        for username, email, password in demo_users:
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, email, hash_password(password)))

        # Add sample students
        sample_students = [
            ('Richard Mutero', 'N0236150M', 'richard@nust.com', 'Male'),
            ('Anthony Higgins', 'N025678G', 'higgins@nust.com', 'Male'),
            ('Tadiwa Tokwe', 'N025456J', 'tokwe@nust.com', 'Female'),
            ('Mncedisi Dube', 'N025786X', 'mncedisi@gmail.com', 'Male')
        ]
        for name, sid, email, gender in sample_students:
            cursor.execute('''
                INSERT OR IGNORE INTO students (name, studentId, email, gender)
                VALUES (?, ?, ?, ?)
            ''', (name, sid, email, gender))

        # Add dorms 
        sample_dorms = [
            ('Mukwati', 50, 'Male'),
            ('Kaguvi', 40, 'Female'),
            ('Tongogara', 20, 'Female'),
            ('Chaminuka', 10, 'Male'),
            ('Nehanda', 45, 'Female')
        ]
        for name, cap, gender in sample_dorms:
            cursor.execute('''
                INSERT OR IGNORE INTO dorms (name, capacity, gender)
                VALUES (?, ?, ?)
            ''', (name, cap, gender))

        # Add sample subjects
        sample_subjects = [
            ('Introduction to Python', 'CS101'),
            ('Web Development', 'CS102'),
            ('Database Systems', 'CS201'),
            ('JavaScript', 'SCS1101'),
            ('Advanced HTML', 'SCS2201'),
            ('CSS', 'SIA2203')
        ]
        for name, code in sample_subjects:
            cursor.execute('''
                INSERT OR IGNORE INTO subjects (name, code)
                VALUES (?, ?)
            ''', (name, code))

        conn.commit()
        print("Database initialized...")

    except Exception as e:
        print(" Error:", str(e))
    finally:
        if 'conn' in locals():
            conn.close()

# === AUTH ROUTES ===
@app.route('/registration', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields required'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password too short'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        ''', (username, email, hash_password(password)))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Account created!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username or email taken'}), 400
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Required'}), 400
    if username == 'admin' and password == 'admin1234':
        return jsonify({'success': True, 'role': 'admin', 'name': 'Admin'})
    if username == 'staff' and password == 'staff123':
        return jsonify({'success': True, 'role': 'staff', 'name': 'Staff'})
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        if row and row[0].lower() == hash_password(password).lower():
            return jsonify({'success': True, 'role': 'user', 'name': username})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        print("Login error:", str(e))
        return jsonify({'success': False, 'message': 'Server error'}), 500

# === STUDENT RECORDS ===
@app.route('/api/students', methods=['GET'])
def get_all_students():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT name, studentId, email, gender FROM students ORDER BY name')
        rows = cursor.fetchall()
        conn.close()
        return jsonify([
            {'name': r[0], 'studentId': r[1], 'email': r[2], 'gender': r[3]}
            for r in rows
        ])
    except Exception as e:
        print("Error:", str(e))
        return jsonify([]), 500
@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    name = data.get('name')
    studentId = data.get('studentId')
    email = data.get('email')
    gender = data.get('gender')
    if not all([name, studentId, email, gender]):
        return jsonify({'error': 'All fields required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO students (name, studentId, email, gender)
            VALUES (?, ?, ?, ?)
        ''', (name, studentId, email, gender))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Student added'}), 201
    except Exception as e:
        print("Save error:", str(e))
        return jsonify({'error': 'Save failed'}), 500

@app.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    data = request.json
    name = data.get('name')
    email = data.get('email')
    gender = data.get('gender')
    if not all([name, email, gender]):
        return jsonify({'error': 'All fields required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE students
            SET name = ?, email = ?, gender = ?
            WHERE studentId = ?
        ''', (name, email, gender, student_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Updated'}), 200
    except Exception as e:
        print("Update error:", str(e))
        return jsonify({'error': 'Update failed'}), 500

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM students WHERE studentId = ?', (student_id,))
        cursor.execute('DELETE FROM dorm_assignments WHERE studentId = ?', (student_id,))
        cursor.execute('DELETE FROM enrollments WHERE studentId = ?', (student_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        print("Delete error:", str(e))
        return jsonify({'error': 'Delete failed'}), 500
    
# ===  DORMITORY MANAGEMENT ===
@app.route('/api/dorms', methods=['GET'])
def get_dorms():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT name, capacity, gender FROM dorms ORDER BY name')
        dorms = [{'name': row[0], 'capacity': row[1], 'gender': row[2]} for row in cursor.fetchall()]
        conn.close()
        assignments = get_all_assignments()
        for dorm in dorms:
            occupied = len([a for a in assignments if a['dormName'] == dorm['name']])
            dorm['occupied'] = occupied
            dorm['available'] = dorm['capacity'] - occupied
        return jsonify(dorms)
    except Exception as e:
        print("Error:", str(e))
        return jsonify([]), 500

@app.route('/api/dorms', methods=['POST'])
def add_dorm():
    data = request.json
    name = data.get('name')
    capacity = data.get('capacity')
    gender = data.get('gender', 'Mixed')
    if not name or not capacity or gender not in ['Male', 'Female', 'Mixed']:
        return jsonify({'error': 'Valid name, capacity, and gender required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO dorms (name, capacity, gender)
            VALUES (?, ?, ?)
        ''', (name, capacity, gender))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Dorm saved'}), 201
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Save failed'}), 500

@app.route('/api/dorms/<name>', methods=['DELETE'])
def delete_dorm(name):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM dorms WHERE name = ?', (name,))
        cursor.execute('DELETE FROM dorm_assignments WHERE dormName = ?', (name,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Dorm deleted'}), 200
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Delete failed'}), 500

@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT studentId, dormName FROM dorm_assignments')
        rows = cursor.fetchall()
        conn.close()
        return jsonify([{'studentId': r[0], 'dormName': r[1]} for r in rows])
    except Exception as e:
        print("Error:", str(e))
        return jsonify([]), 200

@app.route('/api/assignments', methods=['POST'])
def assign_student():
    data = request.json
    student_id = data.get('studentId')
    dorm_name = data.get('dormName')
    if not student_id or not dorm_name:
        return jsonify({'error': 'Student and dorm required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT capacity, gender FROM dorms WHERE name = ?', (dorm_name,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Dorm not found'}), 404
        capacity, dorm_gender = row
        cursor.execute('SELECT COUNT(*) FROM dorm_assignments WHERE dormName = ?', (dorm_name,))
        occupied = cursor.fetchone()[0]
        if occupied >= capacity:
            return jsonify({'error': 'Dorm is full'}), 400
        cursor.execute('SELECT * FROM dorm_assignments WHERE studentId = ?', (student_id,))
        if cursor.fetchone():
            return jsonify({'error': 'Already assigned'}), 400
        cursor.execute('SELECT gender FROM students WHERE studentId = ?', (student_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Student not found'}), 404
        student_gender = row[0]
        if dorm_gender == 'Male' and student_gender != 'Male':
            return jsonify({'error': 'Male-only dorm'}), 400
        if dorm_gender == 'Female' and student_gender != 'Female':
            return jsonify({'error': 'Female-only dorm'}), 400
        cursor.execute('INSERT INTO dorm_assignments (studentId, dormName) VALUES (?, ?)',
                       (student_id, dorm_name))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Assigned successfully'}), 201
    except Exception as e:
        print("Assign error:", str(e))
        return jsonify({'error': 'Server error'}), 500

# === SUBJECT MANAGEMENT ===
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT name, code FROM subjects ORDER BY name')
        subjects = [{'name': row[0], 'code': row[1]} for row in cursor.fetchall()]
        conn.close()
        enrollments = get_all_enrollments()
        for subject in subjects:
            count = len([e for e in enrollments if e['subjectCode'] == subject['code']])
            subject['enrolled'] = count
        return jsonify(subjects)
    except Exception as e:
        print("Error:", str(e))
        return jsonify([]), 500

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    data = request.json
    name = data.get('name')
    code = data.get('code')
    if not name or not code:
        return jsonify({'error': 'Name and code required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO subjects (name, code)
            VALUES (?, ?)
        ''', (name, code))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Subject saved'}), 201
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Save failed'}), 500

@app.route('/api/subjects/<code>', methods=['DELETE'])
def delete_subject(code):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM subjects WHERE code = ?', (code,))
        cursor.execute('DELETE FROM enrollments WHERE subjectCode = ?', (code,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Subject deleted'}), 200
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Delete failed'}), 500

@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT studentId, subjectCode FROM enrollments')
        rows = cursor.fetchall()
        conn.close()
        return jsonify([{'studentId': r[0], 'subjectCode': r[1]} for r in rows])
    except Exception as e:
        print("Error:", str(e))
        return jsonify([]), 200

@app.route('/api/enrollments', methods=['POST'])
def enroll_student():
    data = request.json
    student_id = data.get('studentId')
    subject_code = data.get('subjectCode')
    if not student_id or not subject_code:
        return jsonify({'error': 'Student and subject required'}), 400
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM enrollments WHERE studentId = ? AND subjectCode = ?',
                       (student_id, subject_code))
        if cursor.fetchone():
            return jsonify({'error': 'Already enrolled'}), 400
        cursor.execute('INSERT INTO enrollments (studentId, subjectCode) VALUES (?, ?)',
                       (student_id, subject_code))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Enrolled successfully'}), 201
    except Exception as e:
        print("Enroll error:", str(e))
        return jsonify({'error': 'Server error'}), 500

# === UTILITY FUNCTIONS ===
def get_all_assignments():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT studentId, dormName FROM dorm_assignments')
        rows = cursor.fetchall()
        conn.close()
        return [{'studentId': r[0], 'dormName': r[1]} for r in rows]
    except:
        return []

def get_all_enrollments():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('SELECT studentId, subjectCode FROM enrollments')
        rows = cursor.fetchall()
        conn.close()
        return [{'studentId': r[0], 'subjectCode': r[1]} for r in rows]
    except:
        return []

# === ROOT ===
@app.route('/')
def home():
    return jsonify({'status': 'ok', 'message': 'Student Management API Running!'})

# === START SERVER ===
if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    init_db()
    print(" Starting server on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)