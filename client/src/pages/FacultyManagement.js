import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FacultyManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    designation: '',
    isActive: 'true'
  });

  // Fetch faculty members
  const { 
    data: facultyData, 
    isLoading: facultyLoading, 
    error: facultyError 
  } = useQuery(
    ['faculty', filters],
    () => axios.get(`${API_BASE_URL}/faculty`, {
      params: filters,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
    {
      retry: 1,
      staleTime: 30000,
    }
  );

  const faculty = facultyData?.data?.data || [];

  // Create faculty mutation
  const createFacultyMutation = useMutation(
    (newFaculty) => axios.post(`${API_BASE_URL}/faculty`, newFaculty, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty');
        setShowAddModal(false);
      }
    }
  );

  const tabs = [
    { id: 'overview', label: 'Faculty Overview', icon: '👥' },
    { id: 'details', label: 'Personal Details', icon: '👤' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'leaves', label: 'Leave Schedule', icon: '🗓️' },
    { id: 'subjects', label: 'Subject Assignment', icon: '📚' }
  ];

  const renderFacultyOverview = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
          <p className="text-gray-600">Manage faculty members, their assignments, and performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search faculty..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electronics">Electronics</option>
            <option value="Management">Management</option>
          </select>
          <select
            value={filters.designation}
            onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Lecturer">Lecturer</option>
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facultyLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          faculty.map((facultyMember) => (
            <div key={facultyMember._id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {facultyMember.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{facultyMember.user?.name}</h3>
                  <p className="text-sm text-gray-600">{facultyMember.professionalInfo?.designation}</p>
                  <p className="text-xs text-gray-500">{facultyMember.user?.email}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${facultyMember.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Employee ID</p>
                  <p className="font-medium">{facultyMember.professionalInfo?.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium">{facultyMember.departments?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">{facultyMember.academicInfo?.experience?.totalExperience || 0} years</p>
                </div>
                <div>
                  <p className="text-gray-500">Subjects</p>
                  <p className="font-medium">{facultyMember.teachingInfo?.preferredSubjects?.length || 0}</p>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setSelectedFaculty(facultyMember)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium"
                >
                  View Details
                </button>
                <button className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                  📊 Performance
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-medium">Total Faculty</p>
              <p className="text-2xl font-bold text-blue-900">{faculty.length}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium">Active Faculty</p>
              <p className="text-2xl font-bold text-green-900">{faculty.filter(f => f.isActive).length}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 font-medium">Professors</p>
              <p className="text-2xl font-bold text-yellow-900">
                {faculty.filter(f => f.professionalInfo?.designation === 'Professor').length}
              </p>
            </div>
            <div className="text-3xl">🎓</div>
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-medium">Departments</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Set(faculty.flatMap(f => f.departments || [])).size}
              </p>
            </div>
            <div className="text-3xl">🏢</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFacultyDetails = () => {
    if (!selectedFaculty) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900">Select a Faculty Member</h3>
          <p className="text-gray-500">Choose a faculty member from the overview to view their details.</p>
        </div>
      );
    }

    return (
      <FacultyDetailsView faculty={selectedFaculty} />
    );
  };

  const renderAddFacultyModal = () => (
    <AddFacultyModal 
      show={showAddModal} 
      onClose={() => setShowAddModal(false)}
      onSubmit={createFacultyMutation.mutate}
      loading={createFacultyMutation.isLoading}
    />
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderFacultyOverview()}
          {activeTab === 'details' && renderFacultyDetails()}
          {activeTab === 'timetable' && <FacultyTimetable facultyId={selectedFaculty?._id} />}
          {activeTab === 'performance' && <FacultyPerformance facultyId={selectedFaculty?._id} />}
          {activeTab === 'leaves' && <FacultyLeaves facultyId={selectedFaculty?._id} />}
          {activeTab === 'subjects' && <SubjectAssignment />}
        </div>
      </div>

      {/* Modals */}
      {renderAddFacultyModal()}
    </div>
  );
};

// Faculty Details Component
const FacultyDetailsView = ({ faculty }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Faculty Details</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        Edit Profile
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Basic Info */}
      <div className="lg:col-span-1">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-semibold text-2xl">
                {faculty.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{faculty.user?.name}</h3>
            <p className="text-gray-600">{faculty.professionalInfo?.designation}</p>
            <p className="text-sm text-gray-500">{faculty.user?.email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-medium">{faculty.professionalInfo?.employeeId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-medium">{faculty.departments?.join(', ') || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joining Date</span>
              <span className="font-medium">
                {faculty.professionalInfo?.joiningDate ? 
                  new Date(faculty.professionalInfo.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                faculty.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {faculty.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Information */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Date of Birth</label>
              <p className="font-medium">{faculty.personalInfo?.dateOfBirth ? 
                new Date(faculty.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Gender</label>
              <p className="font-medium">{faculty.personalInfo?.gender || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Blood Group</label>
              <p className="font-medium">{faculty.personalInfo?.bloodGroup || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Marital Status</label>
              <p className="font-medium">{faculty.personalInfo?.maritalStatus || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Total Experience</label>
              <p className="font-medium">{faculty.academicInfo?.experience?.totalExperience || 0} years</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Teaching Experience</label>
              <p className="font-medium">{faculty.academicInfo?.experience?.teachingExperience || 0} years</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Research Areas</label>
              <p className="font-medium">{faculty.academicInfo?.researchAreas?.join(', ') || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Publications</label>
              <p className="font-medium">{faculty.academicInfo?.publications?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Personal Phone</label>
              <p className="font-medium">{faculty.contactInfo?.personalPhone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Emergency Contact</label>
              <p className="font-medium">
                {faculty.contactInfo?.emergencyContact?.name || 'N/A'}
                {faculty.contactInfo?.emergencyContact?.phone && 
                  ` (${faculty.contactInfo.emergencyContact.phone})`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Add Faculty Modal Component
const AddFacultyModal = ({ show, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userData: {
      name: '',
      email: '',
      password: '',
      department: ''
    },
    facultyData: {
      departments: [],
      professionalInfo: {
        designation: 'Assistant Professor',
        employeeId: ''
      },
      personalInfo: {},
      academicInfo: {
        experience: {
          totalExperience: 0,
          teachingExperience: 0
        }
      },
      teachingInfo: {
        specialization: [],
        maxClassesPerDay: 6,
        weeklyLoadLimit: 18
      }
    }
  });

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Faculty</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.userData.name}
                onChange={(e) => setFormData({
                  ...formData,
                  userData: { ...formData.userData, name: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.userData.email}
                onChange={(e) => setFormData({
                  ...formData,
                  userData: { ...formData.userData, email: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.userData.password}
                onChange={(e) => setFormData({
                  ...formData,
                  userData: { ...formData.userData, password: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                required
                value={formData.userData.department}
                onChange={(e) => setFormData({
                  ...formData,
                  userData: { ...formData.userData, department: e.target.value },
                  facultyData: { 
                    ...formData.facultyData, 
                    departments: [e.target.value] 
                  }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electronics">Electronics</option>
                <option value="Management">Management</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <select
                value={formData.facultyData.professionalInfo.designation}
                onChange={(e) => setFormData({
                  ...formData,
                  facultyData: {
                    ...formData.facultyData,
                    professionalInfo: {
                      ...formData.facultyData.professionalInfo,
                      designation: e.target.value
                    }
                  }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={formData.facultyData.professionalInfo.employeeId}
                onChange={(e) => setFormData({
                  ...formData,
                  facultyData: {
                    ...formData.facultyData,
                    professionalInfo: {
                      ...formData.facultyData.professionalInfo,
                      employeeId: e.target.value
                    }
                  }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const FacultyTimetable = ({ facultyId }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📅</div>
    <h3 className="text-lg font-medium text-gray-900">Faculty Timetable</h3>
    <p className="text-gray-500">Timetable view will be implemented here</p>
  </div>
);

const FacultyPerformance = ({ facultyId }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-lg font-medium text-gray-900">Faculty Performance</h3>
    <p className="text-gray-500">Performance analytics will be implemented here</p>
  </div>
);

const FacultyLeaves = ({ facultyId }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🗓️</div>
    <h3 className="text-lg font-medium text-gray-900">Leave Management</h3>
    <p className="text-gray-500">Leave management will be implemented here</p>
  </div>
);

const SubjectAssignment = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-lg font-medium text-gray-900">Subject Assignment</h3>
    <p className="text-gray-500">Subject assignment functionality will be implemented here</p>
  </div>
);

export default FacultyManagement;
