# Volunteer Management Portal - Setup Instructions

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd vmp/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/volunteer_management?retryWrites=true&w=majority
   SECRET_KEY=your-secret-key-here
   ```

4. Run the backend server:
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd vmp/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Features Implemented

### Admin Features
- **Admin Signup**: New admins can register with email and password (password is hashed)
- **Admin Login**: Admins can log in with their credentials
- **Admin Dashboard**: Complete dashboard with overview, volunteer management, event management, and task management
- **Volunteer Registration**: Admins can register new volunteers (volunteers get a default password: "volunteer123")

### Volunteer Features
- **Volunteer Login**: Volunteers can log in with their credentials
- **Volunteer Dashboard**: Existing volunteer dashboard with all features

### Security Features
- Password hashing using Werkzeug
- JWT token authentication
- CORS protection
- Input validation

## Database Collections

The application uses the following MongoDB collections:
- `admins`: Stores admin user data with hashed passwords
- `volunteers`: Stores volunteer data with hashed passwords
- `events`: Stores event information
- `tasks`: Stores task assignments
- `attendance`: Stores attendance records

## Default Credentials

For testing purposes, you can use these demo credentials:
- **Admin**: admin@akshar.com / admin123
- **Volunteer**: volunteer@akshar.com / volunteer123

Note: These are demo credentials. In production, use the signup feature to create real accounts.
