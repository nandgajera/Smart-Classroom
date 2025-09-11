import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Analytics = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState('monthly');

  // Mock data for demonstration
  const getAnalyticsData = () => {
    if (user?.role === 'admin') {
      return {
        title: 'System Analytics Dashboard',
        metrics: [
          { label: 'Total Timetables Generated', value: 156, icon: '📊', change: '+12%' },
          { label: 'Active Faculty', value: 48, icon: '👥', change: '+5%' },
          { label: 'Total Classrooms', value: 25, icon: '🏫', change: '0%' },
          { label: 'System Uptime', value: '99.8%', icon: '⚡', change: '+0.2%' }
        ],
        charts: [
          'Timetable Generation Trends',
          'Resource Utilization',
          'Faculty Workload Distribution',
          'Classroom Occupancy Rate'
        ]
      };
    } else if (user?.role === 'hod') {
      return {
        title: 'Department Analytics Dashboard',
        metrics: [
          { label: 'Faculty Requests', value: 23, icon: '📝', change: '+8%' },
          { label: 'Department Classes', value: 142, icon: '📚', change: '+15%' },
          { label: 'Faculty Utilization', value: '87%', icon: '👥', change: '+3%' },
          { label: 'Pending Approvals', value: 5, icon: '⏳', change: '-2%' }
        ],
        charts: [
          'Faculty Request Trends',
          'Department Resource Usage',
          'Class Schedule Efficiency',
          'Faculty Performance Metrics'
        ]
      };
    } else if (user?.role === 'faculty') {
      return {
        title: 'Personal Analytics Dashboard',
        metrics: [
          { label: 'Classes This Month', value: 32, icon: '📚', change: '+6%' },
          { label: 'Leave Requests', value: 3, icon: '📅', change: '0%' },
          { label: 'Student Attendance', value: '94%', icon: '👨‍🎓', change: '+2%' },
          { label: 'Teaching Hours', value: 45, icon: '⏰', change: '+10%' }
        ],
        charts: [
          'Teaching Schedule Overview',
          'Student Performance Trends',
          'Leave Pattern Analysis',
          'Workload Distribution'
        ]
      };
    }
    return { title: 'Analytics', metrics: [], charts: [] };
  };

  const analyticsData = getAnalyticsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{analyticsData.title}</h1>
          <p className="text-gray-600 mt-1">Monitor key performance indicators and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                metric.change.startsWith('+') 
                  ? 'text-green-600' 
                  : metric.change.startsWith('-') 
                    ? 'text-red-600' 
                    : 'text-gray-600'
              }`}>
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last {timeFrame.slice(0, -2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyticsData.charts.map((chartTitle, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{chartTitle}</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-500">Chart visualization will be implemented here</p>
                <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="flex space-x-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
            📊 Export PDF Report
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
            📈 Export Excel Data
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            📧 Schedule Email Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
