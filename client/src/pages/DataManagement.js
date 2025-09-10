import React from 'react';

const DataManagement = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Data Management</h1>
        <p className="text-gray-600">
          Manage your academic data including subjects, classrooms, faculty, and student batches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👥</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Faculty</h3>
              <p className="text-sm text-gray-600">Manage faculty members</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Manage Faculty
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏫</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Classrooms</h3>
              <p className="text-sm text-gray-600">Manage classroom resources</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Manage Classrooms
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📚</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Subjects</h3>
              <p className="text-sm text-gray-600">Manage course subjects</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Manage Subjects
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎓</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Batches</h3>
              <p className="text-sm text-gray-600">Manage student batches</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Manage Batches
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Under Development
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Data management features are currently under development. You can use the API endpoints directly for now.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
