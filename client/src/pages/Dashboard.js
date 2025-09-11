import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: timetables, isLoading } = useQuery(
    'timetables',
    () => axios.get('/timetables?limit=5').then(res => res.data.timetables)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {user?.department} Department • {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
        </p>
      </div>

      {/* Quick Actions - Role Specific */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admin Quick Actions */}
          {user?.role === 'admin' && (
            <>
              <Link
                to="/generator"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔄</span>
                  <div>
                    <h3 className="text-base font-semibold">Generate Timetable</h3>
                    <p className="text-sm opacity-90">Create optimized schedules</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/data"
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <h3 className="text-base font-semibold">Manage Student Data</h3>
                    <p className="text-sm opacity-90">Handle student information</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  <div>
                    <h3 className="text-base font-semibold">Analytics</h3>
                    <p className="text-sm opacity-90">System insights & reports</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {/* HOD Quick Actions */}
          {user?.role === 'hod' && (
            <>
              <Link
                to="/faculty-request"
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📝</span>
                  <div>
                    <h3 className="text-base font-semibold">Faculty Requests</h3>
                    <p className="text-sm opacity-90">Review & approve requests</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  <div>
                    <h3 className="text-base font-semibold">Analytics</h3>
                    <p className="text-sm opacity-90">Department insights</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {/* Faculty Quick Actions */}
          {user?.role === 'faculty' && (
            <>
              <Link
                to="/leave-request"
                className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📅</span>
                  <div>
                    <h3 className="text-base font-semibold">Leave/Reschedule</h3>
                    <p className="text-sm opacity-90">Submit leave requests</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/data"
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <h3 className="text-base font-semibold">Manage Student Data</h3>
                    <p className="text-sm opacity-90">Handle student information</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  <div>
                    <h3 className="text-base font-semibold">Analytics</h3>
                    <p className="text-sm opacity-90">Personal insights</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Management Quick Access - Admin/HOD Only */}
      {(user?.role === 'admin' || user?.role === 'hod') && (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Management Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/management/faculty"
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 p-4 rounded-lg transition-all"
              >
                <div className="text-center">
                  <span className="text-3xl block mb-2">👥</span>
                  <h3 className="text-sm font-medium text-gray-900">Manage Faculty</h3>
                  <p className="text-xs text-gray-500 mt-1">Add, edit faculty members</p>
                </div>
              </Link>

              <Link
                to="/management/classrooms"
                className="border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 p-4 rounded-lg transition-all"
              >
                <div className="text-center">
                  <span className="text-3xl block mb-2">🏫</span>
                  <h3 className="text-sm font-medium text-gray-900">Manage Classrooms</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure rooms & resources</p>
                </div>
              </Link>

              <Link
                to="/management/subjects"
                className="border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 p-4 rounded-lg transition-all"
              >
                <div className="text-center">
                  <span className="text-3xl block mb-2">📚</span>
                  <h3 className="text-sm font-medium text-gray-900">Manage Subjects</h3>
                  <p className="text-xs text-gray-500 mt-1">Add courses & requirements</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Recent Timetables */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Timetables</h2>
        </div>
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : timetables?.length > 0 ? (
            <div className="space-y-4">
              {timetables.map((timetable) => (
                <div key={timetable._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{timetable.name}</h3>
                      <p className="text-sm text-gray-500">
                        {timetable.department} • Semester {timetable.semester} • {timetable.academicYear}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Generated {new Date(timetable.generationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        timetable.status === 'published' ? 'bg-green-100 text-green-800' :
                        timetable.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        timetable.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {timetable.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <Link
                        to={`/timetables/${timetable._id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl">📅</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No timetables yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by generating your first timetable.</p>
              <Link
                to="/generator"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Timetable
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
