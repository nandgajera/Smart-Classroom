import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const FacultyRequest = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Mock data for faculty requests
  const mockRequests = {
    pending: [
      {
        id: 1,
        facultyName: 'Dr. Sarah Johnson',
        department: 'Computer Science',
        requestType: 'Schedule Change',
        subject: 'Request to reschedule Database Systems lecture',
        date: '2024-01-15',
        priority: 'High',
        reason: 'Medical appointment conflict on Tuesday 10 AM slot',
        proposedSolution: 'Move to Wednesday 2 PM or Thursday 11 AM',
        submittedDate: '2024-01-12',
        status: 'pending'
      },
      {
        id: 2,
        facultyName: 'Prof. Michael Chen',
        department: 'Mathematics',
        requestType: 'Leave Request',
        subject: 'Academic conference attendance',
        date: '2024-01-20',
        priority: 'Medium',
        reason: 'Presenting research paper at International Math Conference',
        proposedSolution: 'Arrange substitute lecturer for 3 days',
        submittedDate: '2024-01-10',
        status: 'pending'
      },
      {
        id: 3,
        facultyName: 'Dr. Emily Rodriguez',
        department: 'Physics',
        requestType: 'Resource Request',
        subject: 'Additional laboratory equipment',
        date: '2024-01-18',
        priority: 'Low',
        reason: 'Need microscopes for advanced physics lab sessions',
        proposedSolution: 'Budget allocation for 5 new microscopes',
        submittedDate: '2024-01-11',
        status: 'pending'
      }
    ],
    approved: [
      {
        id: 4,
        facultyName: 'Dr. James Wilson',
        department: 'Chemistry',
        requestType: 'Schedule Change',
        subject: 'Organic Chemistry lab timing adjustment',
        date: '2024-01-08',
        priority: 'Medium',
        reason: 'Equipment maintenance schedule conflict',
        approvedDate: '2024-01-09',
        status: 'approved'
      }
    ],
    rejected: [
      {
        id: 5,
        facultyName: 'Prof. Lisa Brown',
        department: 'English',
        requestType: 'Leave Request',
        subject: 'Extended leave request',
        date: '2024-01-05',
        priority: 'Low',
        reason: 'Personal vacation during exam period',
        rejectedDate: '2024-01-06',
        rejectionReason: 'Cannot approve leave during examination period',
        status: 'rejected'
      }
    ]
  };

  const handleApprove = (requestId) => {
    // In a real app, this would make an API call
    console.log(`Approving request ${requestId}`);
    // Add success toast notification
  };

  const handleReject = (requestId, reason) => {
    // In a real app, this would make an API call
    console.log(`Rejecting request ${requestId} with reason: ${reason}`);
    // Add success toast notification
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

      {/* Stats Cards */}
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
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">2</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">1</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-blue-600">1.5d</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

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
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {request.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority} Priority
                      </span>
                      <span>📝 {request.requestType}</span>
                    </div>
                    <p className="mt-2 text-gray-700">{request.reason}</p>
                    {request.proposedSolution && (
                      <p className="mt-1 text-sm text-blue-700">
                        <strong>Proposed Solution:</strong> {request.proposedSolution}
                      </p>
                    )}
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
                      ✅ Approved on {request.approvedDate}
                    </span>
                  )}
                  
                  {activeTab === 'rejected' && (
                    <span className="text-red-600 text-sm font-medium">
                      ❌ Rejected on {request.rejectedDate}
                    </span>
                  )}
                </div>
                
                {activeTab === 'rejected' && request.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded border-l-4 border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {request.rejectionReason}
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
