import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const FacultyManagement = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [viewingFaculty, setViewingFaculty] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    userData: {
      name: '',
      email: '',
      password: '',
      department: user?.department || ''
    },
    facultyData: {
      professionalInfo: {
        employeeId: '',
        designation: 'Assistant Professor',
        joiningDate: new Date().toISOString().split('T')[0]
      },
      teachingInfo: {
        specialization: [],
        weeklyLoadLimit: 20
      },
      departments: [],
      isActive: true
    }
  });

  // Check if user has admin/hod permissions
  const hasManagementAccess = user?.role === 'admin' || user?.role === 'hod';

  useEffect(() => {
    if (hasManagementAccess) {
      fetchFaculty();
    }
  }, [hasManagementAccess]);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/api/faculty');
      if (response.data.success) {
        setFaculty(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch faculty data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = editingFaculty ? `/api/faculty/${editingFaculty._id}` : '/api/faculty';
      const method = editingFaculty ? 'put' : 'post';
      
      // Ensure departments array includes the user's department
      const payload = {
        ...formData,
        facultyData: {
          ...formData.facultyData,
          departments: formData.facultyData.departments.length > 0 
            ? formData.facultyData.departments 
            : [formData.userData.department]
        }
      };
      
      const response = await axios[method](endpoint, payload);
      
      if (response.data.success) {
        toast.success(editingFaculty ? 'Faculty updated successfully' : 'Faculty added successfully');
        fetchFaculty();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (facultyId) => {
    try {
      const response = await axios.get(`/api/faculty/${facultyId}`);
      if (response.data.success) {
        setViewingFaculty(response.data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      toast.error('Failed to load faculty details: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (facultyMember) => {
    setEditingFaculty(facultyMember);
    setFormData({
      userData: {
        name: facultyMember.user?.name || '',
        email: facultyMember.user?.email || '',
        password: '', // Don't populate password for editing
        department: facultyMember.user?.department || ''
      },
      facultyData: {
        professionalInfo: {
          employeeId: facultyMember.professionalInfo?.employeeId || '',
          designation: facultyMember.professionalInfo?.designation || 'Assistant Professor',
          joiningDate: facultyMember.professionalInfo?.joiningDate 
            ? new Date(facultyMember.professionalInfo.joiningDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        },
        teachingInfo: {
          specialization: facultyMember.teachingInfo?.specialization || [],
          weeklyLoadLimit: facultyMember.teachingInfo?.weeklyLoadLimit || 20
        },
        departments: facultyMember.departments || [],
        isActive: facultyMember.isActive ?? true
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/faculty/${facultyId}`);
      if (response.data.success) {
        toast.success('Faculty deleted successfully');
        fetchFaculty();
      }
    } catch (error) {
      toast.error('Failed to delete faculty: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      userData: {
        name: '',
        email: '',
        password: '',
        department: user?.department || ''
      },
      facultyData: {
        professionalInfo: {
          employeeId: '',
          designation: 'Assistant Professor',
          joiningDate: new Date().toISOString().split('T')[0]
        },
        teachingInfo: {
          specialization: [],
          weeklyLoadLimit: 20
        },
        departments: [],
        isActive: true
      }
    });
    setEditingFaculty(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    // Handle nested structure updates
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: finalValue
        }
      }));
    } else if (name.includes('professionalInfo') || name.includes('teachingInfo')) {
      const [info, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        facultyData: {
          ...prev.facultyData,
          [info]: {
            ...prev.facultyData[info],
            [field]: finalValue
          }
        }
      }));
    } else {
      // Handle simple fields
      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
  };

  if (!hasManagementAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Admin and HOD users can manage faculty.</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Add Faculty
        </button>
      </div>

      {/* Faculty Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="userData.name"
                    required
                    value={formData.userData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="userData.email"
                    required
                    value={formData.userData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {!editingFaculty && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      name="userData.password"
                      required={!editingFaculty}
                      value={formData.userData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    name="professionalInfo.employeeId"
                    value={formData.facultyData.professionalInfo.employeeId}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="userData.department"
                    required
                    value={formData.userData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <select
                    name="professionalInfo.designation"
                    value={formData.facultyData.professionalInfo.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Lecturer">Lecturer</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Weekly Hours</label>
                  <input
                    type="number"
                    name="teachingInfo.weeklyLoadLimit"
                    min="1"
                    max="40"
                    value={formData.facultyData.teachingInfo.weeklyLoadLimit}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization (comma-separated)</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.facultyData.teachingInfo.specialization.join(', ')}
                  onChange={(e) => {
                    const specializations = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setFormData(prev => ({
                      ...prev,
                      facultyData: {
                        ...prev.facultyData,
                        teachingInfo: {
                          ...prev.facultyData.teachingInfo,
                          specialization: specializations
                        }
                      }
                    }));
                  }}
                  placeholder="e.g., Machine Learning, Data Structures, Algorithms"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.facultyData.isActive}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      facultyData: {
                        ...prev.facultyData,
                        isActive: e.target.checked
                      }
                    }));
                  }}
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
                  {loading ? 'Saving...' : editingFaculty ? 'Update' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Faculty Details Modal */}
      {showViewModal && viewingFaculty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Faculty Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">User Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {viewingFaculty.user?.name}</p>
                  <p><span className="font-medium">Email:</span> {viewingFaculty.user?.email}</p>
                  <p><span className="font-medium">Department:</span> {viewingFaculty.user?.department}</p>
                  <p><span className="font-medium">Role:</span> {viewingFaculty.user?.role}</p>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Employee ID:</span> {viewingFaculty.professionalInfo?.employeeId || 'Not assigned'}</p>
                  <p><span className="font-medium">Designation:</span> {viewingFaculty.professionalInfo?.designation}</p>
                  <p><span className="font-medium">Joining Date:</span> {viewingFaculty.professionalInfo?.joiningDate ? new Date(viewingFaculty.professionalInfo.joiningDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-medium">Salary:</span> {viewingFaculty.professionalInfo?.currentSalary ? `₹${viewingFaculty.professionalInfo.currentSalary.toLocaleString()}` : 'Not specified'}</p>
                </div>
              </div>

              {/* Teaching Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Teaching Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Specialization:</span> {viewingFaculty.teachingInfo?.specialization?.join(', ') || 'Not specified'}</p>
                  <p><span className="font-medium">Weekly Load Limit:</span> {viewingFaculty.teachingInfo?.weeklyLoadLimit || 0} hours</p>
                  <p><span className="font-medium">Max Classes/Day:</span> {viewingFaculty.teachingInfo?.maxClassesPerDay || 0}</p>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Total Experience:</span> {viewingFaculty.academicInfo?.experience?.totalExperience || 0} years</p>
                  <p><span className="font-medium">Teaching Experience:</span> {viewingFaculty.academicInfo?.experience?.teachingExperience || 0} years</p>
                  <p><span className="font-medium">Industry Experience:</span> {viewingFaculty.academicInfo?.experience?.industryExperience || 0} years</p>
                  <p><span className="font-medium">Research Areas:</span> {viewingFaculty.academicInfo?.researchAreas?.join(', ') || 'None specified'}</p>
                </div>
              </div>

              {/* Contact Information */}
              {viewingFaculty.contactInfo && (
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-medium">Personal Phone:</span> {viewingFaculty.contactInfo?.personalPhone || 'Not provided'}</p>
                      <p><span className="font-medium">Emergency Contact:</span> {viewingFaculty.contactInfo?.emergencyContact?.name || 'Not provided'}</p>
                      {viewingFaculty.contactInfo?.emergencyContact?.phone && (
                        <p className="text-sm text-gray-600">Phone: {viewingFaculty.contactInfo.emergencyContact.phone}</p>
                      )}
                    </div>
                    {viewingFaculty.contactInfo?.address?.current && (
                      <div>
                        <p className="font-medium">Current Address:</p>
                        <p className="text-sm text-gray-600">
                          {[viewingFaculty.contactInfo.address.current.street,
                            viewingFaculty.contactInfo.address.current.city,
                            viewingFaculty.contactInfo.address.current.state,
                            viewingFaculty.contactInfo.address.current.pincode
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status and Other Info */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status & Other Information</h3>
                <div className="flex flex-wrap gap-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    viewingFaculty.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingFaculty.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <p><span className="font-medium">Departments:</span> {viewingFaculty.departments?.join(', ') || 'Not assigned'}</p>
                  {viewingFaculty.tags?.length > 0 && (
                    <p><span className="font-medium">Tags:</span> {viewingFaculty.tags.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
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
              {faculty.map((facultyMember) => (
                <tr key={facultyMember._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facultyMember.user?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {facultyMember.user?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {facultyMember.professionalInfo?.employeeId || 'Not assigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.user?.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facultyMember.professionalInfo?.designation || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {facultyMember.teachingInfo?.specialization?.slice(0, 2).join(', ') || 'Not specified'}
                    {facultyMember.teachingInfo?.specialization?.length > 2 && '...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      facultyMember.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {facultyMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleView(facultyMember._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(facultyMember)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(facultyMember._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {faculty.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No faculty members found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
