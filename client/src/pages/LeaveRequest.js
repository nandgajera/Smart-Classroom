import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const LeaveRequest = () => {
  const { user } = useAuth();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    totalLeaveDays: 0
  });
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
    priority: 'medium',
    isFullDay: true
  });
  const [rescheduleFormData, setRescheduleFormData] = useState({
    originalSessionId: '',
    requestedDate: '',
    requestedStartTime: '',
    requestedEndTime: '',
    rescheduleType: 'planned',
    reason: '',
    priority: 'medium'
  });

  // API base URL
  const API_BASE_URL = 'http://localhost:4000/api';

  // Configure axios defaults
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, [user]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [leaveRes, rescheduleRes, statsRes, sessionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/leave-requests`),
        axios.get(`${API_BASE_URL}/reschedule-requests`),
        axios.get(`${API_BASE_URL}/leave-requests/statistics`),
        axios.get(`${API_BASE_URL}/reschedule-requests/sessions`)
      ]);

      setLeaveRequests(leaveRes.data.data || []);
      setRescheduleRequests(rescheduleRes.data.data || []);
      setStatistics(statsRes.data.data || {});
      setSessions(sessionsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Convert API data to display format for backward compatibility
  const allRequests = [
    ...leaveRequests.map(req => ({
      id: req._id,
      type: 'leave',
      subject: `${req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1)} Leave`,
      startDate: new Date(req.startDate).toISOString().split('T')[0],
      endDate: new Date(req.endDate).toISOString().split('T')[0],
      reason: req.reason,
      priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
      status: req.status,
      submittedDate: new Date(req.submissionDate).toISOString().split('T')[0],
      hodResponse: req.approvalComments,
      responseDate: req.approvalDate ? new Date(req.approvalDate).toISOString().split('T')[0] : null,
      duration: req.duration || Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
    })),
    ...rescheduleRequests.map(req => ({
      id: req._id,
      type: 'reschedule',
      subject: `Reschedule ${req.originalSession?.subject?.name || 'Session'}`,
      startDate: new Date(req.requestedDate).toISOString().split('T')[0],
      endDate: new Date(req.requestedDate).toISOString().split('T')[0],
      reason: req.reason,
      priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
      status: req.status,
      submittedDate: new Date(req.submissionDate).toISOString().split('T')[0],
      hodResponse: req.approvalComments,
      responseDate: req.approvalDate ? new Date(req.approvalDate).toISOString().split('T')[0] : null,
      originalTime: `${req.originalStartTime} - ${req.originalEndTime}`,
      requestedTime: `${req.requestedStartTime} - ${req.requestedEndTime}`
    }))
  ];

  // Fallback to mock data structure for display
  const mockRequests = allRequests.length > 0 ? allRequests : [
    {
      id: 1,
      type: 'leave',
      subject: 'Medical Leave Request',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      reason: 'Medical procedure and recovery',
      priority: 'High',
      status: 'pending',
      submittedDate: '2024-01-15',
      hodResponse: null
    },
    {
      id: 2,
      type: 'reschedule',
      subject: 'Reschedule Physics Lab Session',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
      reason: 'Equipment maintenance conflict',
      priority: 'Medium',
      status: 'approved',
      submittedDate: '2024-01-12',
      hodResponse: 'Approved. Rescheduled to Thursday 2 PM',
      responseDate: '2024-01-13'
    },
    {
      id: 3,
      type: 'leave',
      subject: 'Conference Attendance',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      reason: 'International Physics Conference presentation',
      priority: 'Medium',
      status: 'rejected',
      submittedDate: '2024-01-05',
      hodResponse: 'Cannot approve during mid-term exam period',
      responseDate: '2024-01-06'
    }
  ];

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/leave-requests`, formData);
      
      if (response.data.success) {
        // Reset form
        setFormData({
          leaveType: 'sick',
          startDate: '',
          endDate: '',
          reason: '',
          priority: 'medium',
          isFullDay: true
        });
        setShowNewRequestForm(false);
        
        // Refresh data
        await fetchAllData();
        
        // Show success message
        alert('Leave request submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting leave request:', err);
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/reschedule-requests`, rescheduleFormData);
      
      if (response.data.success) {
        // Reset form
        setRescheduleFormData({
          originalSessionId: '',
          requestedDate: '',
          requestedStartTime: '',
          requestedEndTime: '',
          rescheduleType: 'planned',
          reason: '',
          priority: 'medium'
        });
        setShowRescheduleForm(false);
        
        // Refresh data
        await fetchAllData();
        
        // Show success message
        alert('Reschedule request submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting reschedule request:', err);
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeIcon = (type) => {
    return type === 'leave' ? '🏖️' : '📅';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave & Reschedule Requests</h1>
          <p className="text-gray-600 mt-1">Manage your leave applications and schedule changes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewRequestForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            🏖️ New Leave Request
          </button>
          <button
            onClick={() => setShowRescheduleForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            📅 New Reschedule Request
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">❌</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Data</h3>
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={fetchAllData}
                className="mt-2 text-red-700 hover:text-red-800 underline text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-indigo-600">{allRequests.length}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.pending || allRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.approved || allRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leave Days Used</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.totalLeaveDays || 0}/30
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* New Leave Request Form */}
      {showNewRequestForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Leave Request</h2>
            <button
              onClick={() => setShowNewRequestForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleLeaveSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="bereavement">Bereavement Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFullDay"
                name="isFullDay"
                checked={formData.isFullDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isFullDay: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isFullDay" className="text-sm font-medium text-gray-700">
                Full day leave (uncheck for partial day)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Detailed reason for your leave request"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewRequestForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Reschedule Request Form */}
      {showRescheduleForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Reschedule Request</h2>
            <button
              onClick={() => setShowRescheduleForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleRescheduleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session to Reschedule
                </label>
                <select
                  name="originalSessionId"
                  value={rescheduleFormData.originalSessionId}
                  onChange={(e) => setRescheduleFormData(prev => ({ ...prev, originalSessionId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a session</option>
                  {sessions.map(session => (
                    <option key={session._id} value={session._id}>
                      {session.subject?.name} - {session.batch?.name} ({session.day} {session.startTime})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reschedule Type
                </label>
                <select
                  name="rescheduleType"
                  value={rescheduleFormData.rescheduleType}
                  onChange={(e) => setRescheduleFormData(prev => ({ ...prev, rescheduleType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="planned">Planned</option>
                  <option value="emergency">Emergency</option>
                  <option value="conflict">Schedule Conflict</option>
                  <option value="personal">Personal</option>
                  <option value="administrative">Administrative</option>
                  <option value="technical">Technical Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Date
                </label>
                <input
                  type="date"
                  name="requestedDate"
                  value={rescheduleFormData.requestedDate}
                  onChange={(e) => setRescheduleFormData(prev => ({ ...prev, requestedDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  name="requestedStartTime"
                  value={rescheduleFormData.requestedStartTime}
                  onChange={(e) => setRescheduleFormData(prev => ({ ...prev, requestedStartTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="requestedEndTime"
                  value={rescheduleFormData.requestedEndTime}
                  onChange={(e) => setRescheduleFormData(prev => ({ ...prev, requestedEndTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={rescheduleFormData.priority}
                onChange={(e) => setRescheduleFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Reschedule
              </label>
              <textarea
                name="reason"
                value={rescheduleFormData.reason}
                onChange={(e) => setRescheduleFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Detailed reason for rescheduling this session"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Reschedule Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRescheduleForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Request History</h2>
          
          <div className="space-y-4">
            {mockRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getRequestTypeIcon(request.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>📅 Submitted: {request.submittedDate}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority} Priority
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{request.reason}</p>
                    
                    {request.hodResponse && (
                      <div className={`mt-3 p-3 rounded border-l-4 ${
                        request.status === 'approved' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          request.status === 'approved' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          HOD Response ({request.responseDate}):
                        </p>
                        <p className={`text-sm ${
                          request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {request.hodResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {mockRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
                <p className="text-gray-500">You haven't submitted any requests yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Balance & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Leave:</span>
              <span className="font-medium">22/30 days remaining</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sick Leave:</span>
              <span className="font-medium">12/15 days remaining</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Personal Leave:</span>
              <span className="font-medium">5/5 days remaining</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Submit requests at least 7 days in advance</li>
            <li>• Emergency requests may be submitted with shorter notice</li>
            <li>• Include substitute arrangements when possible</li>
            <li>• HOD approval required for all requests</li>
            <li>• Medical certificates required for sick leave > 3 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
