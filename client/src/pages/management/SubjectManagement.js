import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const SubjectManagement = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: user?.department || '',
    credits: 3,
    type: 'theory',
    semester: 1,
    program: 'UG',
    sessionsPerWeek: 3,
    sessionDuration: 60,
    academicYear: new Date().getFullYear().toString(),
    classroomRequirements: {
      type: 'lecture_hall',
      minCapacity: 30,
      facilities: []
    },
    facultyRequirements: {
      specialization: [],
      minDesignation: 'Lecturer'
    },
    isElective: false,
    isActive: true,
    prerequisites: []
  });

  const subjectTypes = ['theory', 'lab', 'tutorial', 'seminar', 'project'];
  const programs = ['UG', 'PG', 'PhD'];
  const sessionDurations = [45, 60, 90, 120, 180];
  const classroomTypes = [
    'lecture_hall',
    'laboratory',
    'seminar_room',
    'auditorium',
    'computer_lab',
    'tutorial_room'
  ];
  const designations = [
    'Lecturer',
    'Assistant Professor',
    'Associate Professor',
    'Professor'
  ];

  // Check if user has admin/hod permissions
  const hasManagementAccess = user?.role === 'admin' || user?.role === 'hod';

  useEffect(() => {
    if (hasManagementAccess) {
      fetchSubjects();
    }
  }, [hasManagementAccess]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/subjects');
      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = editingSubject ? `/subjects/${editingSubject._id}` : '/subjects';
      const method = editingSubject ? 'put' : 'post';
      
      // Process form data
      const submitData = {
        ...formData,
        classroomRequirements: {
          ...formData.classroomRequirements,
          facilities: formData.classroomRequirements.facilities.filter(f => f.trim() !== '')
        },
        facultyRequirements: {
          ...formData.facultyRequirements,
          specialization: Array.isArray(formData.facultyRequirements.specialization) 
            ? formData.facultyRequirements.specialization
            : formData.facultyRequirements.specialization.split(',').map(s => s.trim()).filter(s => s !== '')
        }
      };
      
      const response = await axios[method](endpoint, submitData);
      
      if (response.data.success) {
        toast.success(editingSubject ? 'Subject updated successfully' : 'Subject added successfully');
        fetchSubjects();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code || '',
      name: subject.name || '',
      department: subject.department || '',
      credits: subject.credits || 3,
      type: subject.type || 'theory',
      semester: subject.semester || 1,
      program: subject.program || 'UG',
      sessionsPerWeek: subject.sessionsPerWeek || 3,
      sessionDuration: subject.sessionDuration || 60,
      academicYear: subject.academicYear || new Date().getFullYear().toString(),
      classroomRequirements: {
        type: subject.classroomRequirements?.type || 'lecture_hall',
        minCapacity: subject.classroomRequirements?.minCapacity || 30,
        facilities: subject.classroomRequirements?.facilities || []
      },
      facultyRequirements: {
        specialization: subject.facultyRequirements?.specialization || [],
        minDesignation: subject.facultyRequirements?.minDesignation || 'Lecturer'
      },
      isElective: subject.isElective || false,
      isActive: subject.isActive ?? true,
      prerequisites: subject.prerequisites || []
    });
    setShowForm(true);
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      const response = await axios.delete(`/subjects/${subjectId}`);
      if (response.data.success) {
        toast.success('Subject deleted successfully');
        fetchSubjects();
      }
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      department: user?.department || '',
      credits: 3,
      type: 'theory',
      semester: 1,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      academicYear: new Date().getFullYear().toString(),
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 30,
        facilities: []
      },
      facultyRequirements: {
        specialization: [],
        minDesignation: 'Lecturer'
      },
      isElective: false,
      isActive: true,
      prerequisites: []
    });
    setEditingSubject(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      facultyRequirements: {
        ...prev.facultyRequirements,
        specialization: value
      }
    }));
  };

  const getTypeDisplayName = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!hasManagementAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Admin and HOD users can manage subjects.</p>
      </div>
    );
  }

  if (loading && !showForm) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Add Subject
        </button>
      </div>

      {/* Subject Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., CSE101"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Programming Fundamentals"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Credits</label>
                  <input
                    type="number"
                    name="credits"
                    min="1"
                    max="10"
                    required
                    value={formData.credits}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {subjectTypes.map(type => (
                      <option key={type} value={type}>
                        {getTypeDisplayName(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Program</label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <input
                    type="text"
                    name="academicYear"
                    required
                    value={formData.academicYear}
                    onChange={handleChange}
                    placeholder="2024-2025"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Schedule Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sessions Per Week</label>
                  <input
                    type="number"
                    name="sessionsPerWeek"
                    min="1"
                    max="10"
                    required
                    value={formData.sessionsPerWeek}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Duration (minutes)</label>
                  <select
                    name="sessionDuration"
                    value={formData.sessionDuration}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {sessionDurations.map(duration => (
                      <option key={duration} value={duration}>{duration} minutes</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classroom Requirements */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Classroom Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Classroom Type</label>
                    <select
                      name="classroomRequirements.type"
                      value={formData.classroomRequirements.type}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {classroomTypes.map(type => (
                        <option key={type} value={type}>
                          {getTypeDisplayName(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Capacity</label>
                    <input
                      type="number"
                      name="classroomRequirements.minCapacity"
                      min="1"
                      value={formData.classroomRequirements.minCapacity}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Faculty Requirements */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Faculty Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Required Specialization</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.facultyRequirements.specialization) 
                        ? formData.facultyRequirements.specialization.join(', ')
                        : formData.facultyRequirements.specialization}
                      onChange={handleSpecializationChange}
                      placeholder="e.g., Machine Learning, Data Structures"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Designation</label>
                    <select
                      name="facultyRequirements.minDesignation"
                      value={formData.facultyRequirements.minDesignation}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {designations.map(designation => (
                        <option key={designation} value={designation}>{designation}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Checkboxes */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isElective"
                    checked={formData.isElective}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Elective Subject</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program/Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requirements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subject.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subject.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {subject.credits} Credits • {getTypeDisplayName(subject.type)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subject.program}</div>
                    <div className="text-sm text-gray-500">Semester {subject.semester}</div>
                    <div className="text-xs text-gray-400">{subject.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subject.sessionsPerWeek}/week</div>
                    <div className="text-sm text-gray-500">{subject.sessionDuration} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getTypeDisplayName(subject.classroomRequirements?.type || 'lecture_hall')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Min {subject.classroomRequirements?.minCapacity || 30} seats
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subject.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {subject.isElective && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Elective
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No subjects found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
