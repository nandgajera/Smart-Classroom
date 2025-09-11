import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { schoolsAPI, coursesAPI, studentsAPI } from '../services/api';

const DataManagement = () => {
  const { user } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  
  // Fetch schools
  const { 
    data: schoolsResponse, 
    isLoading: schoolsLoading, 
    error: schoolsError 
  } = useQuery(
    'schools',
    () => schoolsAPI.getAll(),
    {
      retry: 1,
      onError: (error) => {
        console.warn('Failed to fetch schools from API, using mock data:', error.message);
      }
    }
  );

  // Fetch courses for selected school
  const { 
    data: coursesResponse, 
    isLoading: coursesLoading 
  } = useQuery(
    ['courses', selectedSchool?._id],
    () => coursesAPI.getAll({ school: selectedSchool._id }),
    {
      enabled: !!selectedSchool,
      retry: 1,
      onError: (error) => {
        console.warn('Failed to fetch courses from API:', error.message);
      }
    }
  );

  // Fetch students for selected school, course, and semester
  const { 
    data: studentsResponse, 
    isLoading: studentsLoading 
  } = useQuery(
    ['students', selectedSchool?._id, selectedCourse?._id, selectedSemester],
    () => studentsAPI.getByAcademicInfo(selectedSchool._id, selectedCourse._id, selectedSemester),
    {
      enabled: !!(selectedSchool && selectedCourse && selectedSemester),
      retry: 1,
      onError: (error) => {
        console.warn('Failed to fetch students from API:', error.message);
      }
    }
  );

  // Mock data fallback (same as before but more organized)
  const mockSchools = [
    {
      _id: 'mock_school_1',
      name: 'School of Engineering & Technology',
      code: 'SOE',
      description: 'Leading school for engineering and technology education',
      establishedYear: 2010,
      isActive: true
    },
    {
      _id: 'mock_school_2', 
      name: 'School of Management & Business Studies',
      code: 'SOM',
      description: 'Premier institution for management and business education',
      establishedYear: 2012,
      isActive: true
    },
    {
      _id: 'mock_school_3',
      name: 'School of Science & Mathematics',
      code: 'SSM',
      description: 'Excellence in pure and applied sciences',
      establishedYear: 2008,
      isActive: true
    }
  ];

  const mockCoursesBySchool = {
    'mock_school_1': [
      {
        _id: 'mock_course_1',
        name: 'Bachelor of Technology in Computer Science Engineering',
        code: 'B.TECH-CSE',
        duration: { years: 4, semesters: 8 },
        level: 'UG',
        department: 'Computer Science & Engineering'
      },
      {
        _id: 'mock_course_2',
        name: 'Bachelor of Technology in Mechanical Engineering',
        code: 'B.TECH-ME',
        duration: { years: 4, semesters: 8 },
        level: 'UG',
        department: 'Mechanical Engineering'
      }
    ],
    'mock_school_2': [
      {
        _id: 'mock_course_3',
        name: 'Master of Business Administration',
        code: 'MBA',
        duration: { years: 2, semesters: 4 },
        level: 'PG',
        department: 'Business Administration'
      }
    ],
    'mock_school_3': [
      {
        _id: 'mock_course_4',
        name: 'Bachelor of Science in Physics',
        code: 'B.SC-PHY',
        duration: { years: 3, semesters: 6 },
        level: 'UG',
        department: 'Physics'
      }
    ]
  };

  const generateMockStudents = (courseCode, semester) => {
    const studentCount = courseCode === 'MBA' ? 20 : 25;
    const prefix = courseCode === 'MBA' ? 'MBA2024' : courseCode === 'B.TECH-CSE' ? 'CSE2024' : 'PHY2024';
    
    return Array.from({ length: studentCount }, (_, i) => {
      const rollNo = `${prefix}${String(i + 1).padStart(3, '0')}`;
      return {
        _id: `mock_student_${i + 1}`,
        rollNo,
        name: `${courseCode} Student ${i + 1}`,
        email: `${rollNo.toLowerCase()}@university.edu`,
        phone: `+91 98765${String(43000 + i).slice(-5)}`,
        dateOfBirth: new Date(2003, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.6 ? 'Female' : 'Male',
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        category: ['General', 'OBC', 'SC', 'ST', 'EWS'][Math.floor(Math.random() * 5)],
        
        father: {
          name: `Father of Student ${i + 1}`,
          occupation: ['Engineer', 'Teacher', 'Business', 'Doctor'][Math.floor(Math.random() * 4)]
        },
        mother: {
          name: `Mother of Student ${i + 1}`,
          occupation: ['Homemaker', 'Teacher', 'Nurse', 'Engineer'][Math.floor(Math.random() * 4)]
        },
        
        currentSemester: semester,
        admissionDate: new Date('2024-07-15'),
        academicYear: '2024-25',
        
        academicRecord: {
          cgpa: 6.0 + (Math.random() * 3.5)
        },
        
        attendance: {
          overall: Math.floor(75 + (Math.random() * 25))
        },
        
        fees: {
          totalFee: courseCode === 'MBA' ? 315000 : courseCode === 'B.TECH-CSE' ? 200000 : 110000,
          paidAmount: Math.random() > 0.3 ? (courseCode === 'MBA' ? 315000 : courseCode === 'B.TECH-CSE' ? 200000 : 110000) : 0,
          status: Math.random() > 0.3 ? 'Paid' : Math.random() > 0.5 ? 'Pending' : 'Overdue'
        },
        
        documents: {
          status: Math.random() > 0.2 ? 'Complete' : 'Incomplete'
        }
      };
    });
  };

  // Get data with fallback to mock data
  const schools = schoolsError ? mockSchools : (schoolsResponse?.data?.data || mockSchools);
  const courses = coursesResponse?.data?.data || (selectedSchool ? mockCoursesBySchool[selectedSchool._id] || [] : []);
  const studentsData = studentsResponse?.data || null;
  const students = studentsData?.data || (selectedCourse && selectedSemester ? generateMockStudents(selectedCourse.code, selectedSemester) : []);
  const statistics = studentsData?.statistics || {
    totalStudents: students.length,
    avgAttendance: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendance.overall, 0) / students.length * 10) / 10 : 0,
    pendingFees: students.filter(s => s.fees.status === 'Pending' || s.fees.status === 'Overdue').length,
    incompleteDocuments: students.filter(s => s.documents.status === 'Incomplete').length
  };

  const resetSelection = () => {
    setSelectedSchool(null);
    setSelectedCourse(null);
    setSelectedSemester(null);
  };

  const renderBreadcrumb = () => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <button
            onClick={resetSelection}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            🏫 Schools
          </button>
        </li>
        {selectedSchool && (
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <button
                onClick={() => { setSelectedCourse(null); setSelectedSemester(null); }}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {selectedSchool.name}
              </button>
            </div>
          </li>
        )}
        {selectedCourse && (
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <button
                onClick={() => setSelectedSemester(null)}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {selectedCourse.code}
              </button>
            </div>
          </li>
        )}
        {selectedSemester && (
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500">
                Semester {selectedSemester}
              </span>
            </div>
          </li>
        )}
      </ol>
    </nav>
  );

  const renderSchoolSelection = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select School</h2>
            <p className="text-gray-600">
              Choose a school to manage student data hierarchically by courses and semesters.
            </p>
          </div>
          {schoolsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">
                ⚠️ Using demo data (API unavailable)
              </p>
            </div>
          )}
        </div>
        
        {schoolsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading schools...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <div
                key={school._id}
                onClick={() => setSelectedSchool(school)}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 p-6 rounded-lg cursor-pointer transition-all"
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">🏫</span>
                  <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">({school.code})</p>
                  <p className="text-xs text-gray-400 mt-2">Est. {school.establishedYear}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCourseSelection = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Courses in {selectedSchool.name}
        </h2>
        
        {coursesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading courses...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                onClick={() => setSelectedCourse(course)}
                className="border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 p-6 rounded-lg cursor-pointer transition-all"
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">📚</span>
                  <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">({course.code})</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Duration: {course.duration.years} years ({course.duration.semesters} semesters)
                  </p>
                  <p className="text-xs text-gray-400">Level: {course.level}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSemesterSelection = () => {
    const semesters = Array.from({ length: selectedCourse.duration.semesters }, (_, i) => i + 1);
    
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Semesters for {selectedCourse.name}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {semesters.map((semester) => (
              <div
                key={semester}
                onClick={() => setSelectedSemester(semester)}
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 p-4 rounded-lg cursor-pointer transition-all text-center"
              >
                <span className="text-2xl block mb-2">📅</span>
                <h3 className="text-sm font-semibold text-gray-900">Semester {semester}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentManagement = () => (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedSchool.name} - {selectedCourse.name} - Semester {selectedSemester}
          </h2>
          {studentsLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.totalStudents}</p>
              </div>
              <div className="text-3xl">👨‍🎓</div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Avg Attendance</p>
                <p className="text-2xl font-bold text-green-900">{statistics.avgAttendance}%</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Fees</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.pendingFees}</p>
              </div>
              <div className="text-3xl">💳</div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Incomplete Docs</p>
                <p className="text-2xl font-bold text-red-900">{statistics.incompleteDocuments}</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Students - {selectedCourse.code} Semester {selectedSemester}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{student.attendance.overall}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          student.attendance.overall >= 85 ? 'bg-green-500' :
                          student.attendance.overall >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{width: `${student.attendance.overall}%`}}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.academicRecord.cgpa ? student.academicRecord.cgpa.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.fees.status === 'Paid' ? 'text-green-600 bg-green-100' :
                      student.fees.status === 'Pending' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {student.fees.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.documents.status === 'Complete' ? 'text-green-600 bg-green-100' :
                      'text-yellow-600 bg-yellow-100'
                    }`}>
                      {student.documents.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {students.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-medium text-gray-900">No students found</h3>
            <p className="text-gray-500">There are no students enrolled in this semester.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {user?.role === 'admin' ? 'Student Data Management (Admin)' : 
           user?.role === 'faculty' ? 'Student Data Management (Faculty)' :
           'Student Data Management'}
        </h1>
        <p className="text-gray-600">
          Manage comprehensive student data organized by schools, courses, and semesters.
        </p>
      </div>

      {renderBreadcrumb()}

      {!selectedSchool && renderSchoolSelection()}
      {selectedSchool && !selectedCourse && renderCourseSelection()}
      {selectedSchool && selectedCourse && !selectedSemester && renderSemesterSelection()}
      {selectedSchool && selectedCourse && selectedSemester && renderStudentManagement()}
    </div>
  );
};

export default DataManagement;
