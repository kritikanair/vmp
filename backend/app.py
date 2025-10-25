import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import secrets
import string
# import data  # import our fake DB lists

load_dotenv()

app = Flask(__name__)

# CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key-here")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-here")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)  # Access token expires in 1 hour
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)  # Refresh token expires in 7 days

# Initialize MongoDB
try:
    mongo = PyMongo(app)
    print("MongoDB connection initialized successfully")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    mongo = None


from bson.objectid import ObjectId

# JWT Utility Functions
def generate_tokens(user_id, user_type, email):
    """Generate access and refresh tokens"""
    # Generate access token
    access_token_payload = {
        'user_id': str(user_id),
        'email': email,
        'role': user_type,
        'exp': datetime.utcnow() + app.config["JWT_ACCESS_TOKEN_EXPIRES"],
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    
    # Generate refresh token
    refresh_token_payload = {
        'user_id': str(user_id),
        'email': email,
        'role': user_type,
        'exp': datetime.utcnow() + app.config["JWT_REFRESH_TOKEN_EXPIRES"],
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    
    access_token = jwt.encode(access_token_payload, app.config["JWT_SECRET_KEY"], algorithm='HS256')
    refresh_token = jwt.encode(refresh_token_payload, app.config["JWT_SECRET_KEY"], algorithm='HS256')
    
    return access_token, refresh_token

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid JWT token"""
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({"error": "Invalid token format"}), 401
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Token is invalid or expired"}), 401
        
        # Add user info to request context
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response

# ---------- ADMIN AUTHENTICATION ----------
@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    if mongo is None:
        return jsonify({"error": "Database connection not available"}), 500
        
    data = request.get_json()
    print(f"Admin signup request received: {data}")
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Name, email, and password are required"}), 400
    
    try:
        # Check if admin already exists
        existing_admin = mongo.db.admins.find_one({"email": data['email']})
        if existing_admin:
            return jsonify({"error": "Admin with this email already exists"}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Create admin document
        admin_data = {
            "name": data['name'],
            "email": data['email'],
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "role": "admin"
        }
        
        # Insert admin into database
        result = mongo.db.admins.insert_one(admin_data)
        admin_data['_id'] = str(result.inserted_id)
        
        # Generate JWT tokens
        access_token, refresh_token = generate_tokens(
            admin_data['_id'], 
            'admin', 
            admin_data['email']
        )

        # Remove password from response
        del admin_data['password']
        
        print(f"Admin created successfully: {admin_data['email']}")
        return jsonify({
            "message": "Admin created successfully",
            "admin": admin_data,
            "token": access_token,
            "refresh_token": refresh_token
        }), 201
    except Exception as e:
        print(f"Error creating admin: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Find admin by email
    admin = mongo.db.admins.find_one({"email": data['email']})
    if not admin:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check password
    if not check_password_hash(admin['password'], data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Generate JWT tokens
    access_token, refresh_token = generate_tokens(
        admin['_id'], 
        'admin', 
        admin['email']
    )

    # Remove password from response
    admin['_id'] = str(admin['_id'])
    del admin['password']

    return jsonify({
        "message": "Login successful",
        "admin": admin,
        "token": access_token,
        "refresh_token": refresh_token
    }), 200

@app.route('/api/volunteer/login', methods=['POST'])
def volunteer_login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Find volunteer by email
    volunteer = mongo.db.volunteers.find_one({"email": data['email']})
    if not volunteer:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check password (assuming volunteers have hashed passwords too)
    if not check_password_hash(volunteer.get('password', ''), data['password']):
        return jsonify({"error": "Invalid credentials"}), 401

    # Generate JWT tokens
    access_token, refresh_token = generate_tokens(
        volunteer['_id'], 
        'volunteer', 
        volunteer['email']
    )

    # Remove password from response
    volunteer['_id'] = str(volunteer['_id'])
    if 'password' in volunteer:
        del volunteer['password']

    return jsonify({
        "message": "Login successful",
        "volunteer": volunteer,
        "token": access_token,
        "refresh_token": refresh_token
    }), 200

# ---------- TOKEN MANAGEMENT ----------
@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    data = request.get_json()
    
    if not data.get('refresh_token'):
        return jsonify({"error": "Refresh token is required"}), 400
    
    refresh_token = data['refresh_token']
    payload = verify_token(refresh_token)
    
    if not payload or payload.get('type') != 'refresh':
        return jsonify({"error": "Invalid refresh token"}), 401
    
    # Generate new access token
    access_token, new_refresh_token = generate_tokens(
        payload['user_id'],
        payload['role'],
        payload['email']
    )
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": new_refresh_token
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout():
    """Logout user (client should clear tokens)"""
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token_endpoint():
    """Verify if token is valid"""
    return jsonify({
        "valid": True,
        "user": request.current_user
    }), 200

# ---------- VOLUNTEERS ----------
@app.route('/api/volunteers', methods=['GET'])
@token_required
def get_volunteers():
    if mongo is None:
        return jsonify({"error": "Database connection not available"}), 500
    try:
        volunteers = list(mongo.db.volunteers.find())
        for vol in volunteers:
            vol['_id'] = str(vol['_id'])  # Convert ObjectId to string for JSON serialization
        return jsonify(volunteers)
    except Exception as e:
        print(f"Error fetching volunteers: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/volunteers', methods=['POST'])
@token_required
def create_volunteer():
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name') or not data.get('email') or not data.get('phone'):
        return jsonify({"error": "Name, email, and phone are required"}), 400
    
    # Validate phone number format (10 digits starting with 6-9)
    import re
    phone = re.sub(r'\D', '', data.get('phone', ''))  # Remove non-digits
    if not re.match(r'^[6-9]\d{9}$', phone):
        return jsonify({"error": "Phone number must be 10 digits starting with 6, 7, 8, or 9"}), 400
    
    # Validate email format
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_pattern, data.get('email', '')):
        return jsonify({"error": "Please enter a valid email address"}), 400
    
    # Check if volunteer already exists
    existing_volunteer = mongo.db.volunteers.find_one({"email": data['email']})
    if existing_volunteer:
        return jsonify({"error": "Volunteer with this email already exists"}), 400
    
    # Use provided password or generate a default one
    password = data.get('password', 'volunteer123')  # Use provided password or default
    hashed_password = generate_password_hash(password)
    
    # Create volunteer document
    volunteer_data = {
        "name": data['name'],
        "email": data['email'],
        "phone": data['phone'],
        "skills": data.get('skills', ''),
        "availability": data.get('availability', 'weekends'),
        "status": data.get('status', 'active'),
        "hours": data.get('hours', 0),
        "password": hashed_password,
        "joinedDate": data.get('joinedDate', datetime.utcnow().isoformat()),
        "created_at": datetime.utcnow()
    }
    
    # Insert volunteer into database
    result = mongo.db.volunteers.insert_one(volunteer_data)
    volunteer_data['_id'] = str(result.inserted_id)
    
    # Remove password from response
    del volunteer_data['password']
    
    return jsonify(volunteer_data), 201

@app.route('/api/volunteers/<vol_id>', methods=['PUT'])
@token_required
def update_volunteer(vol_id):
    if mongo is None:
        return jsonify({"error": "Database connection not available"}), 500
    update_data = request.get_json()
    
    # Validate phone number if provided
    if 'phone' in update_data:
        import re
        phone = re.sub(r'\D', '', update_data['phone'])
        if not re.match(r'^[6-9]\d{9}$', phone):
            return jsonify({"error": "Phone number must be 10 digits starting with 6, 7, 8, or 9"}), 400
    
    # Validate email if provided
    if 'email' in update_data:
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, update_data['email']):
            return jsonify({"error": "Please enter a valid email address"}), 400
    
    try:
        result = mongo.db.volunteers.update_one(
            {"_id": ObjectId(vol_id)},  # Match document by ObjectId
            {"$set": update_data}       # Set the new fields
        )

        if result.matched_count == 0:
            return jsonify({"error": "Volunteer not found"}), 404

        # Fetch the updated volunteer
        updated_vol = mongo.db.volunteers.find_one({"_id": ObjectId(vol_id)})
        updated_vol['_id'] = str(updated_vol['_id'])
        return jsonify(updated_vol)
    except Exception as e:
        print(f"Error updating volunteer {vol_id}: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/volunteers/<vol_id>', methods=['DELETE'])
@token_required
def delete_volunteer(vol_id):
    result = mongo.db.volunteers.delete_one({"_id": ObjectId(vol_id)})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Volunteer not found"}), 404
    
    return jsonify({"message": f"Volunteer {vol_id} deleted"})


# ---------- EVENTS ----------
@app.route('/api/events', methods=['GET'])
def get_events():
    events=list(mongo.db.events.find())
    for eve in events:
         eve['_id'] = str(eve['_id']) 
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def create_event():
    new_event = request.get_json()
    inserted=mongo.db.events.insert_one(new_event)
    new_event['_id'] = str(inserted.inserted_id)
    return jsonify(new_event), 201


# ---------- TASKS ----------
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks=list(mongo.db.tasks.find())
    for tas in tasks:
         tas['_id'] = str(tas['_id']) 
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    new_task = request.get_json()
    inserted=mongo.db.tasks.insert_one(new_task)
    new_task['id']=str(inserted.inserted_id)
    return jsonify(new_task), 201


# ---------- ATTENDANCE ----------
@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    attendance=list(mongo.db.attendance.find())
    for attend in attendance:
        attend['_id'] = str(attend['_id'])
    return jsonify(attendance)

@app.route('/api/attendance/bulk', methods=['POST'])
def create_bulk_attendance():
    new_attendance = request.get_json()
    
    if not isinstance(new_attendance, list):
        return jsonify({"error": "Expected a list of attendance records"}), 400
    
    # Insert multiple documents into MongoDB
    result = mongo.db.attendance.insert_many(new_attendance)
    
    # Convert inserted IDs to string
    inserted_ids = [str(_id) for _id in result.inserted_ids]
    
    return jsonify({
        "message": "Attendance added",
        "inserted_ids": inserted_ids
    }), 201
@app.route('/')
def home():
    return "Volunteer Management Portal API is running!"

@app.route('/test_mongo')
def test_mongo():
    if mongo is None:
        return "MongoDB connection not initialized. Check your MONGO_URI in .env file."
    try:
        mongo.db.command('ping')
        return "MongoDB Atlas connection successful!"
    except Exception as e:
        return f"MongoDB connection error: {str(e)}"

@app.route('/api/test')
def api_test():
    return jsonify({"message": "API is working!", "status": "success"})

if __name__ == '__main__':
    app.run(debug=True)
