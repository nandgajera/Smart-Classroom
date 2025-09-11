import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    ];

    // Role-specific navigation items
    if (user?.role === 'admin') {
      baseNavigation.push(
        { name: 'Generate Timetable', href: '/generator', icon: '🔄' },
        { name: 'Manage Student Data', href: '/data', icon: '📋' },
        { name: 'Analytics', href: '/analytics', icon: '📈' },
        // Admin management options
        { name: 'Manage Faculty', href: '/management/faculty', icon: '👥' },
        { name: 'Manage Classrooms', href: '/management/classrooms', icon: '🏫' },
        { name: 'Manage Subjects', href: '/management/subjects', icon: '📚' }
      );
    } else if (user?.role === 'hod') {
      baseNavigation.push(
        { name: 'Faculty Request', href: '/faculty-request', icon: '📝' },
        { name: 'Analytics', href: '/analytics', icon: '📈' },
        // HOD management options
        { name: 'Manage Faculty', href: '/management/faculty', icon: '👥' },
        { name: 'Manage Classrooms', href: '/management/classrooms', icon: '🏫' },
        { name: 'Manage Subjects', href: '/management/subjects', icon: '📚' }
      );
    } else if (user?.role === 'faculty') {
      baseNavigation.push(
        { name: 'Leave/Reschedule Request', href: '/leave-request', icon: '📅' },
        { name: 'Manage Student Data', href: '/data', icon: '📋' },
        { name: 'Analytics', href: '/analytics', icon: '📈' }
      );
    }
    
    return baseNavigation;
  };

  const navigation = getNavigation();

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-white">✕</span>
              </button>
            </div>
            <SidebarContent navigation={navigation} isActive={isActive} />
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <SidebarContent navigation={navigation} isActive={isActive} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {/* Mobile menu button */}
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span>☰</span>
          </button>

          {/* Title */}
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Smart Classroom Scheduler
              </h1>
            </div>

            {/* User info + Logout */}
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name} ({user?.role})
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, isActive }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-white">
    {/* Sidebar Header */}
    <div className="flex items-center justify-center h-20 flex-shrink-0 bg-indigo-700 px-4">
      <h2 className="text-white font-bold text-center text-sm leading-tight">
        📚 Rashtriya Raksha <br />
        University, Gandhinagar
      </h2>
    </div>

    {/* Navigation */}
    <div className="flex-1 flex flex-col overflow-y-auto">
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`${
              isActive(item.href)
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            } group flex items-center px-3 py-2 text-sm rounded-lg transition`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  </div>
);

export default Layout;
