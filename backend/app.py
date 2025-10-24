from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
# import data  # import our fake DB lists

app = Flask(__name__)

# CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3001"}}, supports_credentials=True)

app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
mongo=PyMongo(app)


from bson.objectid import ObjectId
@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response

# ---------- VOLUNTEERS ----------
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
     volunteers = list(mongo.db.volunteers.find())
     for vol in volunteers:
        vol['_id'] = str(vol['_id'])  # Convert ObjectId to string for JSON serialization
     return jsonify(volunteers) 

@app.route('/api/volunteers', methods=['POST'])
def create_volunteer():
    new_vol = request.get_json()
    inserted = mongo.db.volunteers.insert_one(new_vol)
    new_vol['_id'] = str(inserted.inserted_id)  # Add the MongoDB generated id to response
    return jsonify(new_vol), 201

@app.route('/api/volunteers/<vol_id>', methods=['PUT'])
def update_volunteer(vol_id):
    update_data = request.get_json()
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

@app.route('/api/volunteers/<vol_id>', methods=['DELETE'])
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
@app.route('/test_mongo')
def test_mongo():
    try:
        mongo.db.command('ping')
        return "MongoDB Atlas connection successful!"
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    app.run(debug=True)
