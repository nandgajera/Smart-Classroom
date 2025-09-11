import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const FacultyRequest = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [leaveStatistics, setLeaveStatistics] = useState({});
  const [rescheduleStatistics, setRescheduleStatistics] = useState({});

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
      
      const [pendingLeaveRes, pendingRescheduleRes, leaveStatsRes, rescheduleStatsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/leave-requests/admin/pending`),
        axios.get(`${API_BASE_URL}/reschedule-requests/admin/pending`),
        axios.get(`${API_BASE_URL}/leave-requests/statistics`),
        axios.get(`${API_BASE_URL}/reschedule-requests/statistics`)
      ]);

      setLeaveRequests(pendingLeaveRes.data.data || []);
      setRescheduleRequests(pendingRescheduleRes.data.data || []);
      setLeaveStatistics(leaveStatsRes.data.data || {});
      setRescheduleStatistics(rescheduleStatsRes.data.data || {});
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Convert API data to display format
  const allRequests = [
    ...leaveRequests.map(req => ({
      id: req._id,
      requestType: 'Leave Request',
      subject: `${req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1)} Leave`,
      facultyName: req.faculty?.name || 'Unknown Faculty',
      department: req.faculty?.department || 'Unknown Department',
      date: new Date(req.startDate).toISOString().split('T')[0],
      endDate: new Date(req.endDate).toISOString().split('T')[0],
      priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
      reason: req.reason,
      submittedDate: new Date(req.submissionDate).toISOString().split('T')[0],
      status: req.status,
      duration: req.duration,
      isFullDay: req.isFullDay,
      approvalComments: req.approvalComments,
      approvalDate: req.approvalDate ? new Date(req.approvalDate).toISOString().split('T')[0] : null
    })),
    ...rescheduleRequests.map(req => ({
      id: req._id,
      requestType: 'Schedule Change',
      subject: `Reschedule ${req.originalSession?.subject?.name || 'Session'}`,
      facultyName: req.faculty?.name || 'Unknown Faculty', 
      department: req.faculty?.department || 'Unknown Department',
      date: new Date(req.requestedDate).toISOString().split('T')[0],
      priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
      reason: req.reason,
      submittedDate: new Date(req.submissionDate).toISOString().split('T')[0],
      status: req.status,
      originalTime: `${req.originalStartTime} - ${req.originalEndTime}`,
      requestedTime: `${req.requestedStartTime} - ${req.requestedEndTime}`,
      rescheduleType: req.rescheduleType,
      approvalComments: req.approvalComments,
      approvalDate: req.approvalDate ? new Date(req.approvalDate).toISOString().split('T')[0] : null
    }))
  ];

  const mockRequests = {
    pending: allRequests.filter(req => req.status === 'pending'),
    approved: allRequests.filter(req => req.status === 'approved'),
    rejected: allRequests.filter(req => req.status === 'rejected')
  };

  const handleApprove = async (requestId, comments = '') => {
    try {
      setLoading(true);
      // Determine if it's a leave or reschedule request
      const isLeaveRequest = leaveRequests.some(req => req._id === requestId);
      
      const endpoint = isLeaveRequest 
        ? `${API_BASE_URL}/leave-requests/admin/${requestId}/approve`
        : `${API_BASE_URL}/reschedule-requests/admin/${requestId}/approve`;
        
      await axios.patch(endpoint, { comments });
      
      // Refresh data
      await fetchAllData();
      
      alert('Request approved successfully!');
    } catch (err) {
      console.error('Error approving request:', err);
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      setLoading(true);
      // Determine if it's a leave or reschedule request
      const isLeaveRequest = leaveRequests.some(req => req._id === requestId);
      
      const endpoint = isLeaveRequest 
        ? `${API_BASE_URL}/leave-requests/admin/${requestId}/reject`
        : `${API_BASE_URL}/reschedule-requests/admin/${requestId}/reject`;
        
      await axios.patch(endpoint, { comments: reason });
      
      // Refresh data
      await fetchAllData();
      
      alert('Request rejected successfully!');
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
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
    switch (type) {
      case 'Schedule Change':
        return '📅';
      case 'Leave Request':
        return '🏖️';
      case 'Resource Request':
        return '🛠️';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage faculty requests and approvals</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-6 rounded-lg shadow border text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading faculty requests...</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{mockRequests.pending.length}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{mockRequests.approved.length}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {allRequests.filter(r => r.priority?.toLowerCase() === 'high').length}
                </p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{allRequests.length}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'pending', label: 'Pending', count: mockRequests.pending.length },
              { key: 'approved', label: 'Approved', count: mockRequests.approved.length },
              { key: 'rejected', label: 'Rejected', count: mockRequests.rejected.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.label}</span>
                <span className={`${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                } rounded-full px-2 py-1 text-xs`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Request List */}
        <div className="p-6">
          <div className="space-y-4">
            {mockRequests[activeTab].map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getRequestTypeIcon(request.requestType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {request.facultyName} • {request.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span>📅 {request.date}{request.endDate && request.endDate !== request.date ? ` - ${request.endDate}` : ''}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority} Priority
                      </span>
                      <span>📝 {request.requestType}</span>
                      <span>📤 Submitted: {request.submittedDate}</span>
                    </div>
                    
                    {/* Additional details for different request types */}
                    {request.requestType === 'Schedule Change' && request.originalTime && (
                      <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Original Time:</span> {request.originalTime} → 
                        <span className="font-medium">Requested Time:</span> {request.requestedTime}
                      </div>
                    )}
                    
                    {request.requestType === 'Leave Request' && request.duration && (
                      <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {request.duration} day{request.duration !== 1 ? 's' : ''}
                        {request.isFullDay !== undefined && (
                          <span className="ml-2">({request.isFullDay ? 'Full day' : 'Partial day'})</span>
                        )}
                      </div>
                    )}
                    
                    <p className="mt-2 text-gray-700">{request.reason}</p>
                  </div>
                  
                  {activeTab === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        👁️ Details
                      </button>
                    </div>
                  )}
                  
                  {activeTab === 'approved' && (
                    <span className="text-green-600 text-sm font-medium">
                      ✅ Approved{request.approvalDate && ` on ${request.approvalDate}`}
                    </span>
                  )}
                  
                  {activeTab === 'rejected' && (
                    <span className="text-red-600 text-sm font-medium">
                      ❌ Rejected{request.approvalDate && ` on ${request.approvalDate}`}
                    </span>
                  )}
                </div>
                
                {(activeTab === 'rejected' || activeTab === 'approved') && request.approvalComments && (
                  <div className={`mt-3 p-3 rounded border-l-4 ${
                    activeTab === 'approved' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      activeTab === 'approved' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <strong>{activeTab === 'approved' ? 'Approval' : 'Rejection'} Comments:</strong> {request.approvalComments}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {mockRequests[activeTab].length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900">No {activeTab} requests</h3>
                <p className="text-gray-500">There are no {activeTab} requests at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📧</div>
            <h4 className="font-medium">Send Reminder</h4>
            <p className="text-sm text-gray-600">Send reminder for pending responses</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium">Export Data</h4>
            <p className="text-sm text-gray-600">Download request reports</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-medium">Settings</h4>
            <p className="text-sm text-gray-600">Configure request workflows</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyRequest;
