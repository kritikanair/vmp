import React, { useState, useEffect } from 'react';
import { Users, Calendar, Award, MessageSquare, Settings, Home, Plus, Search, Edit, Trash2, Eye, CheckCircle, Clock, UserPlus, ClipboardCheck, X, AlertCircle, TrendingUp } from 'lucide-react';
import { volunteersAPI, eventsAPI, tasksAPI, attendanceAPI } from './services/api';

const VolunteerPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // State for data
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // Modal states
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states
  const [newVolunteer, setNewVolunteer] = useState({
    name: '', email: '', phone: '', address: '', skills: ''
  });
  const [newEvent, setNewEvent] = useState({
    name: '', date: '', location: '', description: '', requiredVolunteers: ''
  });
  const [newTask, setNewTask] = useState({
    eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: ''
  });
  const [attendanceForm, setAttendanceForm] = useState({
    eventId: '', date: '', records: []
  });

  // Fetch all data on component mount
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
      alert('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Add volunteer
  const handleAddVolunteer = async () => {
    if (!newVolunteer.name || !newVolunteer.email || !newVolunteer.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await volunteersAPI.create(newVolunteer);
      setVolunteers([...volunteers, response.data]);
      setNewVolunteer({ name: '', email: '', phone: '', address: '', skills: '' });
      setShowAddVolunteer(false);
      alert('Volunteer added successfully!');
    } catch (error) {
      console.error('Error adding volunteer:', error);
      alert('Error adding volunteer. Please try again.');
    }
  };

  // Add event
  const handleAddEvent = async () => {
    if (!newEvent.name || !newEvent.date || !newEvent.location) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const eventData = {
        ...newEvent,
        requiredVolunteers: parseInt(newEvent.requiredVolunteers) || 10
      };
      const response = await eventsAPI.create(eventData);
      setEvents([...events, response.data]);
      setNewEvent({ name: '', date: '', location: '', description: '', requiredVolunteers: '' });
      setShowAddEvent(false);
      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event. Please try again.');
    }
  };

  // Add task
  const handleAddTask = async () => {
    if (!newTask.eventId || !newTask.volunteerId || !newTask.title) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await tasksAPI.create(newTask);
      setTasks([...tasks, response.data]);
      setNewTask({ eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: '' });
      setShowAddTask(false);
      alert('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Error assigning task. Please try again.');
    }
  };

  // Mark attendance
  const handleMarkAttendance = async () => {
    if (!attendanceForm.eventId || !attendanceForm.date || attendanceForm.records.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await attendanceAPI.createBulk({ records: attendanceForm.records });
      setAttendance([...attendance, ...response.data]);
      
      // Refresh volunteers to get updated hours
      const volRes = await volunteersAPI.getAll();
      setVolunteers(volRes.data);
      
      setAttendanceForm({ eventId: '', date: '', records: [] });
      setShowAttendanceModal(false);
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance. Please try again.');
    }
  };

  // Prepare attendance form
  const prepareAttendanceForm = (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (event && event.assignedVolunteers && event.assignedVolunteers.length > 0) {
      const records = event.assignedVolunteers.map(vol => ({
        volunteerId: vol._id,
        eventId: eventId,
        status: 'present',
        hours: 4,
        date: new Date().toISOString().split('T')[0]
      }));
      setAttendanceForm({
        eventId: eventId,
        date: new Date().toISOString().split('T')[0],
        records: records
      });
      setSelectedEvent(event);
      setShowAttendanceModal(true);
    } else {
      alert('No volunteers assigned to this event yet.');
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
      alert('Error updating task status.');
    }
  };

  // Delete volunteer
  const deleteVolunteer = async (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await volunteersAPI.delete(id);
        setVolunteers(volunteers.filter(v => v._id !== id));
        alert('Volunteer deleted successfully!');
      } catch (error) {
        console.error('Error deleting volunteer:', error);
        alert('Error deleting volunteer.');
      }
    }
  };

  // Delete event
  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(id);
        setEvents(events.filter(e => e._id !== id));
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event.');
      }
    }
  };

  // Calculate stats
  const stats = {
    totalVolunteers: volunteers.length,
    activeVolunteers: volunteers.filter(v => v.status === 'active').length,
    totalHours: volunteers.reduce((sum, v) => sum + (v.hours || 0), 0),
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length
  };

  // Helper function to get volunteer name by ID
  const getVolunteerName = (volunteerId) => {
    if (typeof volunteerId === 'object' && volunteerId.name) return volunteerId.name;
    const volunteer = volunteers.find(v => v._id === volunteerId);
    return volunteer ? volunteer.name : 'Unknown';
  };

  // Helper function to get event name by ID
  const getEventName = (eventId) => {
    if (typeof eventId === 'object' && eventId.name) return eventId.name;
    const event = events.find(e => e._id === eventId);
    return event ? event.name : 'Unknown';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 hover:shadow-lg transition" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
        </div>
        <Icon className="w-12 h-12 opacity-20" style={{ color }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  const DashboardView = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Users} title="Total Volunteers" value={stats.totalVolunteers} color="#3b82f6" />
        <StatCard icon={CheckCircle} title="Active Volunteers" value={stats.activeVolunteers} color="#10b981" />
        <StatCard icon={Clock} title="Total Hours" value={stats.totalHours} color="#f59e0b" />
        <StatCard icon={Calendar} title="Upcoming Events" value={stats.upcomingEvents} color="#8b5cf6" />
        <StatCard icon={AlertCircle} title="Pending Tasks" value={stats.pendingTasks} color="#ef4444" />
        <StatCard icon={TrendingUp} title="Completed Tasks" value={stats.completedTasks} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Tasks</h3>
          <div className="space-y-3">
            {tasks.slice(0, 4).map(task => {
              const borderColor = task.status === 'completed' ? '#10b981' : task.status === 'in-progress' ? '#f59e0b' : '#6b7280';
              return (
                <div key={task._id} className="p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor }}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800">{task.title}</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{getVolunteerName(task.volunteerId)} • {getEventName(task.eventId)}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</span>
                    <span className={`text-xs font-semibold ${
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'in-progress' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Upcoming Events</h3>
          <div className="space-y-3">
            {events.filter(e => e.status === 'upcoming').slice(0, 4).map(e => (
              <div key={e._id} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">{e.name}</p>
                  <button 
                    onClick={() => prepareAttendanceForm(e._id)}
                    className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                  >
                    Mark Attendance
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-600">{formatDate(e.date)} | {e.location}</p>
                  <span className="text-sm font-semibold text-purple-600">
                    {e.assignedVolunteers?.length || 0}/{e.requiredVolunteers} volunteers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowAddVolunteer(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Add Volunteer</p>
          </button>
          <button 
            onClick={() => setShowAddEvent(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
          >
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Create Event</p>
          </button>
          <button 
            onClick={() => setShowAddTask(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
          >
            <ClipboardCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Assign Task</p>
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
          >
            <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">View Attendance</p>
          </button>
        </div>
      </div>
    </div>
  );

  // Continue with VolunteersView, EventsView, TasksView, AttendanceView components...
  // (Same structure as before but using _id instead of id and API calls)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header and rest of the component */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AP
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Akshar Paaul</h1>
              <p className="text-sm text-gray-600">Volunteer Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-lg shadow-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'volunteers' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'events' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Attendance
          </button>
        </div>

        {activeTab === 'dashboard' && <DashboardView />}
        {/* Add other views... */}
      </div>

      {/* Modals */}
      {showAddVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Volunteer</h3>
              <button onClick={() => setShowAddVolunteer(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={newVolunteer.name}
                onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="email" 
                placeholder="Email *" 
                value={newVolunteer.email}
                onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="tel" 
                placeholder="Phone Number *" 
                value={newVolunteer.phone}
                onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="text" 
                placeholder="Address" 
                value={newVolunteer.address}
                onChange={(e) => setNewVolunteer({...newVolunteer, address: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="text" 
                placeholder="Skills (comma separated)" 
                value={newVolunteer.skills}
                onChange={(e) => setNewVolunteer({...newVolunteer, skills: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddVolunteer(false)} 
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddVolunteer} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Volunteer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add other modals similarly... */}
    </div>
  );
};

export default VolunteerPortal;