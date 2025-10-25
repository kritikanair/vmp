import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  LogOut, 
  Shield, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import './AdminDashboard.css';
import { useAuth } from '../contexts/AuthContext';
import { volunteersAPI, eventsAPI, tasksAPI } from '../services/api';

const AdminDashboard = () => {
  const { user: admin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showVolunteerDetails, setShowVolunteerDetails] = useState(false);
  const [showEditVolunteer, setShowEditVolunteer] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showVolunteerPassword, setShowVolunteerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // New volunteer form
  const [newVolunteer, setNewVolunteer] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: '',
    availability: 'weekends'
  });

  // New event form
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    maxVolunteers: '',
    status: 'upcoming'
  });

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    eventId: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [volunteersRes, eventsRes, tasksRes] = await Promise.all([
        volunteersAPI.getAll(),
        eventsAPI.getAll(),
        tasksAPI.getAll()
      ]);

      setVolunteers(volunteersRes.data || []);
      setEvents(eventsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please check your authentication.');
      // Set empty arrays as fallback
      setVolunteers([]);
      setEvents([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    // Validate form data
    const errors = validateVolunteerData(newVolunteer);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await volunteersAPI.create({
        ...newVolunteer,
        status: 'active',
        hours: 0,
        joinedDate: new Date().toISOString().split('T')[0]
      });

      if (response.data) {
        setVolunteers([...(volunteers || []), response.data]);
        setNewVolunteer({ name: '', email: '', phone: '', password: '', skills: '', availability: 'weekends' });
        setShowAddVolunteer(false);
        setValidationErrors({});
        alert('Volunteer added successfully!');
      } else {
        setError('Failed to add volunteer');
      }
    } catch (err) {
      console.error('Error adding volunteer:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        const addedEvent = await response.json();
        setEvents([...events, addedEvent]);
        setNewEvent({ name: '', description: '', date: '', location: '', maxVolunteers: '', status: 'upcoming' });
        setShowAddEvent(false);
        alert('Event added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add event');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        const addedTask = await response.json();
        setTasks([...tasks, addedTask]);
        setNewTask({ title: '', description: '', eventId: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'pending' });
        setShowAddTask(false);
        alert('Task added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add task');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 10 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 10);
    setNewVolunteer({...newVolunteer, phone: cleanValue});
    
    // Clear validation error if phone becomes valid
    if (validationErrors.phone && validatePhone(cleanValue)) {
      setValidationErrors({...validationErrors, phone: null});
    }
  };

  const validateVolunteerData = (data) => {
    const errors = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(data.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9';
    }
    
    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    return errors;
  };

  const handleViewVolunteer = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowVolunteerDetails(true);
  };

  const handleEditVolunteer = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setNewVolunteer({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      skills: volunteer.skills || '',
      availability: volunteer.availability || 'weekends'
    });
    setShowEditVolunteer(true);
  };

  const handleDeleteVolunteer = async (volunteer) => {
    if (window.confirm(`Are you sure you want to delete ${volunteer.name}?`)) {
      setLoading(true);
      try {
        await volunteersAPI.delete(volunteer._id);
        setVolunteers((volunteers || []).filter(v => v._id !== volunteer._id));
        alert('Volunteer deleted successfully!');
      } catch (err) {
        console.error('Error deleting volunteer:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Network error. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateVolunteer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    // Validate form data
    const errors = validateVolunteerData(newVolunteer);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await volunteersAPI.update(selectedVolunteer._id, newVolunteer);

      if (response.data) {
        setVolunteers((volunteers || []).map(v => v._id === selectedVolunteer._id ? response.data : v));
        setNewVolunteer({ name: '', email: '', phone: '', password: '', skills: '', availability: 'weekends' });
        setShowEditVolunteer(false);
        setSelectedVolunteer(null);
        setValidationErrors({});
        alert('Volunteer updated successfully!');
      } else {
        setError('Failed to update volunteer');
      }
    } catch (err) {
      console.error('Error updating volunteer:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo">AP</div>
              <div className="logo-text">
                <h1>Akshar Paaul</h1>
                <p>Admin Portal</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-details">
                <p className="user-name">{admin.name}</p>
                <p className="user-role">Admin</p>
              </div>
              <div className="user-avatar admin-avatar">
                <Shield size={20} />
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-main">
        {/* Navigation */}
        <nav className="admin-nav">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={20} />
            <span>Overview</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteers')}
          >
            <Users size={20} />
            <span>Volunteers</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckCircle size={20} />
            <span>Tasks</span>
          </button>
        </nav>

        {/* Content */}
        <div className="admin-content">
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">Admin Dashboard</h2>

              <div className="stats-row">
                <div className="stat-box blue">
                  <div className="stat-icon">
                    <Users size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Total Volunteers</p>
                    <p className="stat-value">{(volunteers || []).length}</p>
                  </div>
                </div>
                <div className="stat-box green">
                  <div className="stat-icon">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Active Events</p>
                    <p className="stat-value">{events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length}</p>
                  </div>
                </div>
                <div className="stat-box orange">
                  <div className="stat-icon">
                    <CheckCircle size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Pending Tasks</p>
                    <p className="stat-value">{tasks.filter(t => t.status === 'pending').length}</p>
                  </div>
                </div>
                <div className="stat-box purple">
                  <div className="stat-icon">
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Total Hours</p>
                    <p className="stat-value">{(volunteers || []).reduce((sum, v) => sum + (v.hours || 0), 0)}h</p>
                  </div>
                </div>
              </div>

              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-header">
                    <h3>Recent Volunteers</h3>
                    <button 
                      className="add-btn"
                      onClick={() => setShowAddVolunteer(true)}
                    >
                      <Plus size={16} />
                      Add Volunteer
                    </button>
                  </div>
                  <div className="volunteer-list-small">
                    {(volunteers || []).slice(0, 5).map(volunteer => (
                      <div key={volunteer._id} className="volunteer-item-small">
                        <div className="volunteer-avatar">{volunteer.name.charAt(0)}</div>
                        <div className="volunteer-info-small">
                          <p className="volunteer-name-small">{volunteer.name}</p>
                          <p className="volunteer-email-small">{volunteer.email}</p>
                        </div>
                        <span className={`status-badge ${volunteer.status}`}>{volunteer.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h3>Upcoming Events</h3>
                    <button 
                      className="add-btn"
                      onClick={() => setShowAddEvent(true)}
                    >
                      <Plus size={16} />
                      Add Event
                    </button>
                  </div>
                  <div className="event-list-small">
                    {events.filter(e => e.status === 'upcoming').slice(0, 3).map(event => (
                      <div key={event._id} className="event-item-small">
                        <div className="event-date-small">
                          <span className="date-num">{new Date(event.date).getDate()}</span>
                          <span className="date-month">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </div>
                        <div className="event-info-small">
                          <p className="event-name-small">{event.name}</p>
                          <p className="event-location-small">📍 {event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <div className="tab-content fade-in">
              <div className="page-header">
                <h2 className="page-title">Volunteer Management</h2>
                <button 
                  className="primary-btn"
                  onClick={() => setShowAddVolunteer(true)}
                >
                  <UserPlus size={20} />
                  <span>Add New Volunteer</span>
                </button>
              </div>

              <div className="volunteers-grid">
                {(volunteers || []).map(volunteer => (
                  <div key={volunteer._id} className="volunteer-card">
                    <div className="volunteer-header">
                      <div className="volunteer-avatar-large">{volunteer.name.charAt(0)}</div>
                      <div className="volunteer-actions">
                        <button 
                          className="action-btn view" 
                          title="View Details"
                          onClick={() => handleViewVolunteer(volunteer)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEditVolunteer(volunteer)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDeleteVolunteer(volunteer)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="volunteer-info">
                      <h3>{volunteer.name}</h3>
                      <p className="volunteer-email">{volunteer.email}</p>
                      <p className="volunteer-phone">{volunteer.phone}</p>
                      <div className="volunteer-stats">
                        <span className="stat-item">
                          <Clock size={14} />
                          {volunteer.hours || 0}h
                        </span>
                        <span className={`status-badge ${volunteer.status}`}>{volunteer.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="tab-content fade-in">
              <div className="page-header">
                <h2 className="page-title">Event Management</h2>
                <button 
                  className="primary-btn"
                  onClick={() => setShowAddEvent(true)}
                >
                  <Plus size={20} />
                  <span>Add New Event</span>
                </button>
              </div>

              <div className="events-grid">
                {events.map(event => (
                  <div key={event._id} className="event-card-admin">
                    <div className="event-header">
                      <span className={`event-badge ${event.status}`}>{event.status}</span>
                    </div>
                    <h3>{event.name}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="detail-item">
                        <Users size={16} />
                        <span>Max: {event.maxVolunteers} volunteers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="tab-content fade-in">
              <div className="page-header">
                <h2 className="page-title">Task Management</h2>
                <button 
                  className="primary-btn"
                  onClick={() => setShowAddTask(true)}
                >
                  <Plus size={20} />
                  <span>Add New Task</span>
                </button>
              </div>

              <div className="tasks-grid">
                {tasks.map(task => (
                  <div key={task._id} className={`task-card-admin priority-${task.priority}`}>
                    <div className="task-header">
                      <span className={`priority-label ${task.priority}`}>{task.priority}</span>
                      <span className={`status-label ${task.status}`}>{task.status}</span>
                    </div>
                    <h4>{task.title}</h4>
                    <p className="task-description">{task.description}</p>
                    <div className="task-footer">
                      <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Volunteer Modal */}
      {showAddVolunteer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Volunteer</h3>
              <button className="close-btn" onClick={() => setShowAddVolunteer(false)}>×</button>
            </div>
            <form onSubmit={handleAddVolunteer} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                  className={validationErrors.name ? 'error' : ''}
                  required
                />
                {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                  className={validationErrors.email ? 'error' : ''}
                  required
                />
                {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newVolunteer.phone}
                  onChange={handlePhoneChange}
                  className={validationErrors.phone ? 'error' : ''}
                  placeholder="e.g., 9876543210"
                  maxLength="10"
                  required
                />
                <div className="phone-counter">
                  {newVolunteer.phone.length}/10 digits
                </div>
                {validationErrors.phone && <span className="error-message">{validationErrors.phone}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-group">
                  <input
                    type={showVolunteerPassword ? 'text' : 'password'}
                    value={newVolunteer.password}
                    onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})}
                    placeholder="Create a password for the volunteer"
                    className={validationErrors.password ? 'error' : ''}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowVolunteerPassword(!showVolunteerPassword)}
                  >
                    {showVolunteerPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
              </div>
              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  value={newVolunteer.skills}
                  onChange={(e) => setNewVolunteer({...newVolunteer, skills: e.target.value})}
                  placeholder="e.g., Teaching, Photography, Event Management"
                />
              </div>
              <div className="form-group">
                <label>Availability</label>
                <select
                  value={newVolunteer.availability}
                  onChange={(e) => setNewVolunteer({...newVolunteer, availability: e.target.value})}
                >
                  <option value="weekends">Weekends</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddVolunteer(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Volunteer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Event</h3>
              <button className="close-btn" onClick={() => setShowAddEvent(false)}>×</button>
            </div>
            <form onSubmit={handleAddEvent} className="modal-form">
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Volunteers</label>
                <input
                  type="number"
                  value={newEvent.maxVolunteers}
                  onChange={(e) => setNewEvent({...newEvent, maxVolunteers: e.target.value})}
                  min="1"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddEvent(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button className="close-btn" onClick={() => setShowAddTask(false)}>×</button>
            </div>
            <form onSubmit={handleAddTask} className="modal-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Event</label>
                <select
                  value={newTask.eventId}
                  onChange={(e) => setNewTask({...newTask, eventId: e.target.value})}
                >
                  <option value="">Select Event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                >
                  <option value="">Select Volunteer</option>
                  {(volunteers || []).map(volunteer => (
                    <option key={volunteer._id} value={volunteer._id}>{volunteer.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddTask(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Volunteer Details Modal */}
      {showVolunteerDetails && selectedVolunteer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Volunteer Details</h3>
              <button className="close-btn" onClick={() => setShowVolunteerDetails(false)}>×</button>
            </div>
            <div className="volunteer-details-content">
              <div className="volunteer-detail-avatar">
                {selectedVolunteer.name.charAt(0)}
              </div>
              <div className="volunteer-detail-info">
                <h4>{selectedVolunteer.name}</h4>
                <p><strong>Email:</strong> {selectedVolunteer.email}</p>
                <p><strong>Phone:</strong> {selectedVolunteer.phone}</p>
                <p><strong>Skills:</strong> {selectedVolunteer.skills || 'Not specified'}</p>
                <p><strong>Availability:</strong> {selectedVolunteer.availability}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedVolunteer.status}`}>{selectedVolunteer.status}</span></p>
                <p><strong>Total Hours:</strong> {selectedVolunteer.hours || 0} hours</p>
                <p><strong>Joined Date:</strong> {formatDate(selectedVolunteer.joinedDate || selectedVolunteer.created_at)}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="secondary-btn" 
                onClick={() => setShowVolunteerDetails(false)}
              >
                Close
              </button>
              <button 
                className="primary-btn" 
                onClick={() => {
                  setShowVolunteerDetails(false);
                  handleEditVolunteer(selectedVolunteer);
                }}
              >
                Edit Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Volunteer Modal */}
      {showEditVolunteer && selectedVolunteer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Volunteer</h3>
              <button className="close-btn" onClick={() => setShowEditVolunteer(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateVolunteer} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                  className={validationErrors.name ? 'error' : ''}
                  required
                />
                {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                  className={validationErrors.email ? 'error' : ''}
                  required
                />
                {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newVolunteer.phone}
                  onChange={handlePhoneChange}
                  className={validationErrors.phone ? 'error' : ''}
                  placeholder="e.g., 9876543210"
                  maxLength="10"
                  required
                />
                <div className="phone-counter">
                  {newVolunteer.phone.length}/10 digits
                </div>
                {validationErrors.phone && <span className="error-message">{validationErrors.phone}</span>}
              </div>
              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  value={newVolunteer.skills}
                  onChange={(e) => setNewVolunteer({...newVolunteer, skills: e.target.value})}
                  placeholder="e.g., Teaching, Photography, Event Management"
                />
              </div>
              <div className="form-group">
                <label>Availability</label>
                <select
                  value={newVolunteer.availability}
                  onChange={(e) => setNewVolunteer({...newVolunteer, availability: e.target.value})}
                >
                  <option value="weekends">Weekends</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowEditVolunteer(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Volunteer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
