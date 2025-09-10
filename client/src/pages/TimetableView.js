import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import TimetableGrid from '../components/timetable/TimetableGrid';

const TimetableView = () => {
  const { id } = useParams();

  const { data: timetableData, isLoading, error } = useQuery(
    ['timetable', id],
    () => axios.get(`/timetables/${id}`).then(res => res.data.timetable),
    {
      enabled: !!id
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading timetable
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.response?.data?.message || 'Failed to load timetable'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!timetableData) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No timetable found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested timetable could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{timetableData.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generated on {new Date(timetableData.generationDate).toLocaleDateString()} by{' '}
              {timetableData.generatedBy?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              timetableData.status === 'published' ? 'bg-green-100 text-green-800' :
              timetableData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              timetableData.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {timetableData.status.replace('_', ' ').toUpperCase()}
            </span>
            {timetableData.optimizationScore && (
              <span className="text-sm text-gray-500">
                Score: {timetableData.optimizationScore}/100
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Department</dt>
            <dd className="mt-1 text-sm text-gray-900">{timetableData.department}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Academic Year</dt>
            <dd className="mt-1 text-sm text-gray-900">{timetableData.academicYear}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Semester</dt>
            <dd className="mt-1 text-sm text-gray-900">{timetableData.semester}</dd>
          </div>
        </div>

        {/* Conflicts */}
        {timetableData.conflicts && timetableData.conflicts.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800">Conflicts Detected</h4>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              {timetableData.conflicts.map((conflict, index) => (
                <li key={index}>• {conflict.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <TimetableGrid timetable={timetableData} />

      {/* Statistics */}
      {timetableData.statistics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Total Classes</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {timetableData.statistics.totalClasses || 0}
              </dd>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Utilization Rate</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {timetableData.statistics.utilizationRate || 0}%
              </dd>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Algorithm Used</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 capitalize">
                {timetableData.algorithm?.replace('_', ' ') || 'N/A'}
              </dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
