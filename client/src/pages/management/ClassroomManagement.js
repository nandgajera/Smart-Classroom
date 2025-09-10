import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ClassroomManagement = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: '',
    floor: 1,
    capacity: 30,
    type: 'lecture_hall',
    facilities: [],
    department: user?.department || '',
    isActive: true,
    maintenanceSchedule: []
  });

  const classroomTypes = [
    'lecture_hall',
    'laboratory', 
    'seminar_room',
    'auditorium',
    'computer_lab',
    'tutorial_room'
  ];

  const availableFacilities = [
    'projector',
    'whiteboard',
    'computer',
    'audio_system',
    'video_conferencing',
    'air_conditioning',
    'internet',
    'smartboard',
    'microphone',
    'screen'
  ];

  // Check if user has admin/hod permissions
  const hasManagementAccess = user?.role === 'admin' || user?.role === 'hod';

  useEffect(() => {
    if (hasManagementAccess) {
      fetchClassrooms();
    }
  }, [hasManagementAccess]);

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get('/classrooms');
      if (response.data.success) {
        setClassrooms(response.data.classrooms);
      }
    } catch (error) {
      toast.error('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = editingClassroom ? `/classrooms/${editingClassroom._id}` : '/classrooms';
      const method = editingClassroom ? 'put' : 'post';
      
      const response = await axios[method](endpoint, formData);
      
      if (response.data.success) {
        toast.success(editingClassroom ? 'Classroom updated successfully' : 'Classroom added successfully');
        fetchClassrooms();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      roomNumber: classroom.roomNumber || '',
      building: classroom.building || '',
      floor: classroom.floor || 1,
      capacity: classroom.capacity || 30,
      type: classroom.type || 'lecture_hall',
      facilities: classroom.facilities || [],
      department: classroom.department || '',
      isActive: classroom.isActive ?? true,
      maintenanceSchedule: classroom.maintenanceSchedule || []
    });
    setShowForm(true);
  };

  const handleDelete = async (classroomId) => {
    if (!window.confirm('Are you sure you want to delete this classroom?')) {
      return;
    }

    try {
      const response = await axios.delete(`/classrooms/${classroomId}`);
      if (response.data.success) {
        toast.success('Classroom deleted successfully');
        fetchClassrooms();
      }
    } catch (error) {
      toast.error('Failed to delete classroom');
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      building: '',
      floor: 1,
      capacity: 30,
      type: 'lecture_hall',
      facilities: [],
      department: user?.department || '',
      isActive: true,
      maintenanceSchedule: []
    });
    setEditingClassroom(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFacilityChange = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const getTypeDisplayName = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!hasManagementAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Admin and HOD users can manage classrooms.</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Classroom Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Add Classroom
        </button>
      </div>

      {/* Classroom Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    required
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g., CS101, LAB-A1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Building</label>
                  <input
                    type="text"
                    name="building"
                    required
                    value={formData.building}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science Block"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Floor</label>
                  <input
                    type="number"
                    name="floor"
                    min="0"
                    max="20"
                    required
                    value={formData.floor}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="500"
                    required
                    value={formData.capacity}
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
                    {classroomTypes.map(type => (
                      <option key={type} value={type}>
                        {getTypeDisplayName(type)}
                      </option>
                    ))}
                  </select>
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
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableFacilities.map(facility => (
                    <label key={facility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={() => handleFacilityChange(facility)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {facility.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  {loading ? 'Saving...' : editingClassroom ? 'Update' : 'Add Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classrooms List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facilities
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
              {classrooms.map((classroom) => (
                <tr key={classroom._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {classroom.roomNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {classroom.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{classroom.building}</div>
                    <div className="text-sm text-gray-500">Floor {classroom.floor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classroom.capacity} seats
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeDisplayName(classroom.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {classroom.facilities?.slice(0, 3).map(facility => (
                        <span key={facility} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                          {facility.replace('_', ' ')}
                        </span>
                      ))}
                      {classroom.facilities?.length > 3 && (
                        <span className="text-xs text-gray-400">+{classroom.facilities.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      classroom.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {classroom.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classroom._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {classrooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No classrooms found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomManagement;
