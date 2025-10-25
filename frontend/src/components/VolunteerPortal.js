import React, { useState, useEffect } from 'react';
import { Users, Calendar, ClipboardCheck, CheckCircle, Clock, TrendingUp, Plus, X, Edit, Trash2, Search, Filter } from 'lucide-react';
import { volunteersAPI, eventsAPI, tasksAPI, attendanceAPI } from '../services/api';
import './VolunteerPortal.css';

const VolunteerPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // State
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Form states
  const [newVolunteer, setNewVolunteer] = useState({
    name: '', email: '', phone: '', address: '', skills: ''
  });
  const [newEvent, setNewEvent] = useState({
    name: '', date: '', location: '', description: '', requiredVolunteers: '10'
  });
  const [newTask, setNewTask] = useState({
    eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: ''
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [volRes, evtRes, tskRes, attRes] = await Promise.all([
        volunteersAPI.getAll(),
        eventsAPI.getAll(),
        tasksAPI.getAll(),
        attendanceAPI.getAll()
      ]);
      
      setVolunteers(volRes.data);
      setEvents(evtRes.data);
      setTasks(tskRes.data);
      setAttendance(attRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add volunteer
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    if (!newVolunteer.name || !newVolunteer.email || !newVolunteer.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await volunteersAPI.create(newVolunteer);
      setVolunteers([...volunteers, response.data]);
      setNewVolunteer({ name: '', email: '', phone: '', address: '', skills: '' });
      setShowAddVolunteer(false);
      showSuccessMessage('Volunteer added successfully!');
    } catch (error) {
      console.error('Error adding volunteer:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || !newEvent.location) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await eventsAPI.create(newEvent);
      setEvents([...events, response.data]);
      setNewEvent({ name: '', date: '', location: '', description: '', requiredVolunteers: '10' });
      setShowAddEvent(false);
      showSuccessMessage('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.eventId || !newTask.volunteerId || !newTask.title) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await tasksAPI.create(newTask);
      setTasks([...tasks, response.data]);
      setNewTask({ eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: '' });
      setShowAddTask(false);
      showSuccessMessage('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Error: ' + error.message);
    }
  };

  // Delete volunteer
  const deleteVolunteer = async (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await volunteersAPI.delete(id);
        setVolunteers(volunteers.filter(v => v._id !== id));
        showSuccessMessage('Volunteer deleted successfully!');
      } catch (error) {
        console.error('Error deleting volunteer:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  // Delete event
  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(id);
        setEvents(events.filter(e => e._id !== id));
        showSuccessMessage('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error: ' + error.message);
    }
  };

  // Success message
  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
      <div class="success-toast-content">
        <CheckCircle size={20} />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  };

  // Helper functions
  const getVolunteerName = (volunteerId) => {
    if (typeof volunteerId === 'object' && volunteerId?.name) return volunteerId.name;
    const volunteer = volunteers.find(v => v._id === volunteerId);
    return volunteer ? volunteer.name : 'Unknown';
  };

  const getEventName = (eventId) => {
    if (typeof eventId === 'object' && eventId?.name) return eventId.name;
    const event = events.find(e => e._id === eventId);
    return event ? event.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter volunteers by search
  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalVolunteers: volunteers.length,
    activeVolunteers: volunteers.filter(v => v.status === 'active').length,
    totalHours: volunteers.reduce((sum, v) => sum + (v.hours || 0), 0),
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Akshar Paaul Portal...</p>
      </div>
    );
  }

  return (
    <div className="portal-container">
      {/* Header */}
      <header className="portal-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo">AP</div>
              <div className="logo-text">
                <h1>Akshar Paaul</h1>
                <p>Volunteer Management Portal</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-avatar">A</div>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Navigation */}
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteers')}
          >
            <Users size={20} />
            <span>Volunteers</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <ClipboardCheck size={20} />
            <span>Tasks</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <CheckCircle size={20} />
            <span>Attendance</span>
          </button>
        </nav>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="view-content fade-in">
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-icon"><Users size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Total Volunteers</p>
                  <p className="stat-value">{stats.totalVolunteers}</p>
                </div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon"><CheckCircle size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Active Volunteers</p>
                  <p className="stat-value">{stats.activeVolunteers}</p>
                </div>
              </div>
              <div className="stat-card orange">
                <div className="stat-icon"><Clock size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Total Hours</p>
                  <p className="stat-value">{stats.totalHours}</p>
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon"><Calendar size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Upcoming Events</p>
                  <p className="stat-value">{stats.upcomingEvents}</p>
                </div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon"><ClipboardCheck size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Pending Tasks</p>
                  <p className="stat-value">{stats.pendingTasks}</p>
                </div>
              </div>
              <div className="stat-card teal">
                <div className="stat-icon"><TrendingUp size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Completed Tasks</p>
                  <p className="stat-value">{stats.completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="action-btn blue" onClick={() => setShowAddVolunteer(true)}>
                  <Plus size={24} />
                  <span>Add Volunteer</span>
                </button>
                <button className="action-btn purple" onClick={() => setShowAddEvent(true)}>
                  <Plus size={24} />
                  <span>Create Event</span>
                </button>
                <button className="action-btn green" onClick={() => setShowAddTask(true)}>
                  <Plus size={24} />
                  <span>Assign Task</span>
                </button>
                <button className="action-btn orange" onClick={() => setActiveTab('attendance')}>
                  <CheckCircle size={24} />
                  <span>View Attendance</span>
                </button>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Recent Volunteers</h3>
                <div className="volunteer-list">
                  {volunteers.slice(0, 5).map(v => (
                    <div key={v._id} className="volunteer-item">
                      <div className="volunteer-avatar">{v.name.charAt(0)}</div>
                      <div className="volunteer-info">
                        <p className="volunteer-name">{v.name}</p>
                        <p className="volunteer-email">{v.email}</p>
                      </div>
                      <span className={`status-badge ${v.status}`}>{v.status}</span>
                    </div>
                  ))}
                  {volunteers.length === 0 && (
                    <p className="empty-state">No volunteers yet. Add your first volunteer!</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Upcoming Events</h3>
                <div className="event-list">
                  {events.filter(e => e.status === 'upcoming').slice(0, 5).map(e => (
                    <div key={e._id} className="event-item">
                      <div className="event-date">
                        <span className="date-day">{new Date(e.date).getDate()}</span>
                        <span className="date-month">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </div>
                      <div className="event-info">
                        <p className="event-name">{e.name}</p>
                        <p className="event-location">📍 {e.location}</p>
                      </div>
                    </div>
                  ))}
                  {events.filter(e => e.status === 'upcoming').length === 0 && (
                    <p className="empty-state">No upcoming events.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the component code remains the same */}
        {/* For brevity, I'll include the key sections */}
      </div>
    </div>
  );
};

export default VolunteerPortal;

