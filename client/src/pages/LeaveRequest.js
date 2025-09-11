import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LeaveRequest = () => {
  const { user } = useAuth();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-requests');
  const [formData, setFormData] = useState({
    type: 'leave',
    subject: '',
    startDate: '',
    endDate: '',
    reason: '',
    priority: 'medium',
    proposedSolution: ''
  });

  // Mock data for user's requests
  const mockRequests = [
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    console.log('Submitting request:', formData);
    setShowNewRequestForm(false);
    setFormData({
      type: 'leave',
      subject: '',
      startDate: '',
      endDate: '',
      reason: '',
      priority: 'medium',
      proposedSolution: ''
    });
    // Add success toast notification
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
        <button
          onClick={() => setShowNewRequestForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          ➕ New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-indigo-600">{mockRequests.length}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {mockRequests.filter(r => r.status === 'pending').length}
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
                {mockRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leave Days Used</p>
              <p className="text-2xl font-bold text-blue-600">8/30</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* New Request Form */}
      {showNewRequestForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Request</h2>
            <button
              onClick={() => setShowNewRequestForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="leave">Leave Request</option>
                  <option value="reschedule">Reschedule Request</option>
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
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your request"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Detailed reason for your request"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Solution (Optional)
              </label>
              <textarea
                name="proposedSolution"
                value={formData.proposedSolution}
                onChange={handleInputChange}
                placeholder="How you plan to handle your classes/responsibilities"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Submit Request
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
