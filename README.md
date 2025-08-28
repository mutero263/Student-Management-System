# Student Management System

A full-stack Student Management System built with Flask (Python) and HTML/CSS/JS. This system allows users to manage student records, dormitory assignments, subject enrollments, and view real-time analytics.

---

## Features

-  Login 
-  Student Management (Add, Update, Delete)
-  Gender-Separated Dormitories (Male, Female)
-  Dorm Assignment with Capacity & Gender Rules
-  Subject Management & Enrollment
-  Dashboard with Live Analytics
-  Data Persistence via SQLite
-  RESTful API Backend
-  Responsive Frontend


## Tech Stack

Layer                  Technology 

Backend                Python, Flask 
Database               SQLite 
Frontend               HTML, CSS, JavaScript 
API                    RESTful JSON endpoints 
Styling                CSS + Font Awesome 
CORS                   flask-cors 

---

## Project Structure
muter0/
├── app.py                   # Flask backend
├── users.db                 # SQLite database (auto-generated)
├── dashboard.html           # Dashboard overview
├── dashboard.css            # Dashboard styling
├── dashboard.js             # Dashboard logic
├── students.html            # Student management
├── students.js              # Student API calls
├── subjects.html            # Subject management
├── subjects.js              # Subject logic
├── dormitories.html         # Dorm management
├── dormitories.js           # Dorm assignment logic
├── style.css                # dormitory, students, subjects pages styling
├── index.html               # Login page
├── cstyle.css               # Login page styling
├── registration.html        # User registration
├── auth.js                  # Login logic
├── sstyling.css             # registration styling
├── mut.py                   # Check database
├── registration.js          # Registration logic
└── README.md                # This file


---
## How to set up and run
#Install Dependencies
pip install flask flask-cors

# Run the Backend (Flask Server)
python app.py

# Run the Frontend Server
python -m http.server 8000

Open in Browser
Login: http://localhost:8000/index.html

## Database Setup
#Automatic Initialization
The database users.db is auto-created when you run app.py
All tables and sample data are inserted on first run

## Tables Created
users                              #Login accounts 
students                           #Student records
dorms                              #Dormitory details
dorm_assignments                   #Student-to-dorm mapping
subjects                           #Subject catalog
enrollments                        #Student-to-subject mapping


## API Documentation (Brief)

#ENDPOINT                #METHOD                              #DESCRIPTION
/login                  POST                                Admin login
/registration           POST                                Register new user
/api/students           GET/POST                            Get or add students
/api/students/<id>      PUT/DELETE                          Update or delete student
/api/dorms              GET/POST                            Get or add dorms
/api/dorms/<name>       DELETE                              Delete dorm
/api/assignments        GET/POST                            Get or assign dorms
/api/subjects           GET/POST                            Get or add subjects
/api/subjects/<code>    DELETE                              Delete subject
/api/enrollments        GET/POST                            Get or add enrollments

All endpoints return JSON. CORS is enabled.

## Sample Login Credentials

USERNAME               PASSWORD

admin                  admin1234
staff                  staff123

## Environment Variables
This project uses no environment variables — all configuration is built-in.

#No .env file needed
#No API keys required
