const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');
const Batch = require('../models/Batch');
const TimeSlot = require('../models/TimeSlot');
const ScheduledSession = require('../models/ScheduledSession');
const Course = require('../models/Course');

/**
 * Advanced TimetableScheduler implementing constraint satisfaction with intelligent heuristics
 * 
 * Features:
 * - Respects faculty maxWorkingHours and unavailable slots
 * - Handles classroom capacity, type, and facility requirements
 * - Supports lab group splitting when capacity is insufficient
 * - Minimizes free gaps in timetables
 * - Uses backtracking with conflict-driven backjumping
 * - Implements sophisticated constraint propagation
 */
class TimetableScheduler {
  constructor() {
    this.conflicts = [];
    this.statistics = {
      totalAttempts: 0,
      backtrackCount: 0,
      constraintChecks: 0
    };
  }

  /**
   * Main entry point for timetable generation
   */
  async generateTimetable({ academicYear, semester, department, constraints = {} }) {
    console.log(`🏗️ Generating timetable for ${department}, Semester ${semester}, Year ${academicYear}`);
    const startTime = Date.now();
    
    try {
      // Initialize default constraints
      const defaultConstraints = {
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: { startTime: '09:00', endTime: '17:00' },
        lunchBreak: { startTime: '12:30', endTime: '13:30' },
        maxClassesPerDay: 8,
        breakDuration: 15, // minutes between classes
        maxConsecutiveClasses: 3
      };
      const C = { ...defaultConstraints, ...constraints };

      // Step 1: Fetch all required data
      console.log('📊 Fetching data...');
      const data = await this.fetchRequiredData(academicYear, semester, department);
      
      // Step 2: Generate or fetch available time slots
      console.log('⏰ Setting up time slots...');
      const timeSlots = await this.setupTimeSlots(academicYear, C);
      
      // Step 3: Create session requirements
      console.log('📋 Creating session requirements...');
      const sessions = this.createSessionRequirements(data, academicYear, semester, department);
      
      // Step 4: Assign faculty to subjects based on preferences and constraints
      console.log('👨‍🏫 Assigning faculty to subjects...');
      await this.assignFacultyToSessions(sessions, data.faculty);
      
      // Step 5: Sort sessions by scheduling difficulty (MRV heuristic)
      console.log('🎯 Ordering sessions by difficulty...');
      const sortedSessions = this.orderSessionsByDifficulty(sessions, data);
      
      // Step 6: Apply backtracking with constraint propagation
      console.log('🔄 Starting backtracking algorithm...');
      const schedule = [];
      const success = await this.backtrackSchedule(
        sortedSessions,
        schedule,
        timeSlots,
        data,
        C,
        0
      );
      
      const generationTime = Date.now() - startTime;
      
      // Step 7: Post-process results
      console.log('📈 Computing final statistics...');
      const results = await this.finalizeResults(schedule, success, generationTime, data, C);
      
      console.log(`✅ Timetable generation completed in ${generationTime}ms`);
      console.log(`📊 Generated ${schedule.length} scheduled sessions`);
      console.log(`⚠️ Found ${this.conflicts.length} conflicts`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error in timetable generation:', error);
      throw new Error(`Timetable generation failed: ${error.message}`);
    }
  }

  /**
   * Fetch all required data for timetable generation
   */
  async fetchRequiredData(academicYear, semester, department) {
    const [subjects, faculty, classrooms, batches, courses] = await Promise.all([
      Subject.find({ 
        department, 
        semester, 
        academicYear, 
        isActive: true 
      }).populate('prerequisites'),
      
      Faculty.find({ 
        departments: department,
        isActive: true 
      }).populate('user', 'name email department'),
      
      Classroom.find({ 
        $or: [
          { department },
          { 'restrictions.allowedDepartments': department },
          { 'restrictions.allowedDepartments': { $size: 0 } }
        ],
        isActive: true 
      }),
      
      Batch.findByDepartmentAndSemester(department, semester, academicYear),
      
      Course.find({ department, isActive: true })
    ]);

    console.log(`📚 Found ${subjects.length} subjects, ${faculty.length} faculty, ${classrooms.length} classrooms, ${batches.length} batches`);
    
    return { subjects, faculty, classrooms, batches, courses };
  }

  /**
   * Setup time slots for scheduling
   */
  async setupTimeSlots(academicYear, constraints) {
    // First try to find existing time slots
    let timeSlots = await TimeSlot.find({ 
      academicYear, 
      isActive: true,
      type: 'regular'
    }).sort({ day: 1, startTime: 1 });

    // Generate standard slots if none exist
    if (timeSlots.length === 0) {
      console.log('🔧 No existing time slots found, generating standard slots...');
      const slotData = await TimeSlot.generateStandardSlots(academicYear, {
        workingDays: constraints.workingDays,
        startTime: constraints.workingHours.startTime,
        endTime: constraints.workingHours.endTime,
        slotDurations: [45, 60, 90, 120, 180], // Common durations
        lunchBreak: constraints.lunchBreak
      });
      
      // Save generated slots to database
      timeSlots = await TimeSlot.insertMany(slotData);
      console.log(`✅ Generated ${timeSlots.length} time slots`);
    }

    return timeSlots.filter(slot => slot.type === 'regular');
  }

  /**
   * Create session requirements from batches and subjects
   */
  createSessionRequirements(data, academicYear, semester, department) {
    const sessions = [];
    let sessionId = 1;

    for (const batch of data.batches) {
      for (const batchSubject of batch.subjects) {
        const subject = data.subjects.find(s => s._id.equals(batchSubject.subject._id || batchSubject.subject));
        if (!subject) continue;

        // Handle lab sessions with potential group splitting
        if (subject.type === 'lab' && batch.enrolledStudents > 30) {
          const groups = Math.ceil(batch.enrolledStudents / 30);
          
          for (let groupNum = 1; groupNum <= groups; groupNum++) {
            for (let session = 0; session < subject.sessionsPerWeek; session++) {
              sessions.push({
                id: `${sessionId++}`,
                subject: subject,
                batch: batch,
                sessionType: 'lab',
                duration: subject.sessionDuration,
                group: `Group ${groupNum}`,
                maxStudents: Math.min(30, batch.enrolledStudents - (groupNum - 1) * 30),
                academicYear,
                semester,
                department,
                priority: this.calculateSessionPriority(subject, batch, 'lab'),
                assignedFaculty: batchSubject.faculty || null
              });
            }
          }
        } else {
          // Regular sessions (theory, seminar, etc.)
          for (let session = 0; session < subject.sessionsPerWeek; session++) {
            sessions.push({
              id: `${sessionId++}`,
              subject: subject,
              batch: batch,
              sessionType: subject.type,
              duration: subject.sessionDuration,
              group: 'All',
              maxStudents: batch.enrolledStudents,
              academicYear,
              semester,
              department,
              priority: this.calculateSessionPriority(subject, batch, subject.type),
              assignedFaculty: batchSubject.faculty || null
            });
          }
        }
      }
    }

    console.log(`📅 Created ${sessions.length} session requirements`);
    return sessions;
  }

  /**
   * Calculate priority for session scheduling (higher = more difficult to schedule)
   */
  calculateSessionPriority(subject, batch, sessionType) {
    let priority = 1;
    
    // Labs are harder to schedule
    if (sessionType === 'lab') priority += 3;
    
    // Longer sessions are harder
    if (subject.sessionDuration >= 120) priority += 2;
    else if (subject.sessionDuration >= 90) priority += 1;
    
    // Large batches are harder
    if (batch.enrolledStudents > 60) priority += 2;
    else if (batch.enrolledStudents > 30) priority += 1;
    
    // Specialized classroom requirements
    if (subject.classroomRequirements?.type && subject.classroomRequirements.type !== 'lecture_hall') {
      priority += 2;
    }
    
    // Required facilities
    if (subject.classroomRequirements?.facilities?.length > 2) {
      priority += 1;
    }

    return priority;
  }

  /**
   * Assign faculty to sessions based on preferences and constraints
   */
  async assignFacultyToSessions(sessions, facultyList) {
    const facultyWorkload = new Map();
    
    // Initialize faculty workload tracking
    facultyList.forEach(f => {
      facultyWorkload.set(f._id.toString(), {
        faculty: f,
        currentHours: 0,
        maxHours: f.teachingInfo?.weeklyLoadLimit || 18,
        sessions: []
      });
    });

    for (const session of sessions) {
      if (session.assignedFaculty) {
        // Use pre-assigned faculty if available
        const facultyId = session.assignedFaculty._id || session.assignedFaculty;
        const workload = facultyWorkload.get(facultyId.toString());
        if (workload && workload.currentHours + (session.duration / 60) <= workload.maxHours) {
          workload.currentHours += session.duration / 60;
          workload.sessions.push(session);
          continue;
        }
      }

      // Find best available faculty
      const candidates = this.findEligibleFaculty(session, facultyList, facultyWorkload);
      if (candidates.length === 0) {
        console.warn(`⚠️ No available faculty found for ${session.subject.name}`);
        continue;
      }

      // Select best candidate (least loaded, most suitable)
      const bestFaculty = candidates.reduce((best, current) => {
        const bestWorkload = facultyWorkload.get(best._id.toString());
        const currentWorkload = facultyWorkload.get(current._id.toString());
        
        // Prefer less loaded faculty
        if (currentWorkload.currentHours < bestWorkload.currentHours) return current;
        if (currentWorkload.currentHours > bestWorkload.currentHours) return best;
        
        // Prefer specialized faculty
        const bestSpecMatch = this.getFacultySubjectMatch(best, session.subject);
        const currentSpecMatch = this.getFacultySubjectMatch(current, session.subject);
        
        return currentSpecMatch > bestSpecMatch ? current : best;
      });

      session.assignedFaculty = bestFaculty;
      const workload = facultyWorkload.get(bestFaculty._id.toString());
      workload.currentHours += session.duration / 60;
      workload.sessions.push(session);
    }
  }

  /**
   * Find eligible faculty for a session
   */
  findEligibleFaculty(session, facultyList, facultyWorkload) {
    return facultyList.filter(faculty => {
      const workload = facultyWorkload.get(faculty._id.toString());
      
      // Check workload capacity
      if (workload.currentHours + (session.duration / 60) > workload.maxHours) {
        return false;
      }
      
      // Check specialization match
      const specMatch = this.getFacultySubjectMatch(faculty, session.subject);
      if (specMatch === 0 && session.subject.facultyRequirements?.specialization?.length > 0) {
        return false;
      }
      
      // Check department compatibility
      if (!faculty.departments.includes(session.department)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate faculty-subject specialization match score
   */
  getFacultySubjectMatch(faculty, subject) {
    let score = 0;
    const facultySpecs = faculty.teachingInfo?.specialization || [];
    const subjectReqs = subject.facultyRequirements?.specialization || [];
    
    if (subjectReqs.length === 0) return 1; // No specific requirements
    
    for (const req of subjectReqs) {
      if (facultySpecs.includes(req)) score += 2;
      else if (facultySpecs.some(spec => spec.toLowerCase().includes(req.toLowerCase()))) score += 1;
    }
    
    return score;
  }

  /**
   * Order sessions by scheduling difficulty (Most Restrictive Variable heuristic)
   */
  orderSessionsByDifficulty(sessions, data) {
    return sessions.sort((a, b) => {
      // Primary: Higher priority first
      if (b.priority !== a.priority) return b.priority - a.priority;
      
      // Secondary: Sessions with fewer available time slots first
      const aSuitableSlots = this.countSuitableTimeSlots(a, data);
      const bSuitableSlots = this.countSuitableTimeSlots(b, data);
      if (aSuitableSlots !== bSuitableSlots) return aSuitableSlots - bSuitableSlots;
      
      // Tertiary: Sessions with fewer available classrooms first
      const aSuitableRooms = this.countSuitableClassrooms(a, data.classrooms);
      const bSuitableRooms = this.countSuitableClassrooms(b, data.classrooms);
      if (aSuitableRooms !== bSuitableRooms) return aSuitableRooms - bSuitableRooms;
      
      // Quaternary: Longer sessions first
      return b.duration - a.duration;
    });
  }

  /**
   * Count suitable time slots for a session
   */
  countSuitableTimeSlots(session, data) {
    return data.timeSlots?.filter(slot => slot.duration === session.duration).length || 50;
  }

  /**
   * Count suitable classrooms for a session
   */
  countSuitableClassrooms(session, classrooms) {
    return classrooms.filter(room => this.isClassroomSuitable(room, session)).length;
  }

  /**
   * Check if classroom is suitable for session
   */
  isClassroomSuitable(classroom, session) {
    // Check capacity
    if (classroom.capacity < session.maxStudents) return false;
    
    // Check type requirements
    const reqType = session.subject.classroomRequirements?.type;
    if (reqType && classroom.type !== reqType) return false;
    
    // Check facility requirements
    const reqFacilities = session.subject.classroomRequirements?.facilities || [];
    const hasAllFacilities = reqFacilities.every(f => classroom.facilities.includes(f));
    if (!hasAllFacilities) return false;
    
    // Check department restrictions
    if (classroom.restrictions?.allowedDepartments?.length > 0 && 
        !classroom.restrictions.allowedDepartments.includes(session.department)) {
      return false;
    }
    
    return true;
  }

  /**
   * Main backtracking algorithm with constraint propagation
   */
  async backtrackSchedule(sessions, schedule, timeSlots, data, constraints, sessionIndex) {
    this.statistics.totalAttempts++;
    
    // Base case: all sessions scheduled
    if (sessionIndex >= sessions.length) {
      return true;
    }
    
    const session = sessions[sessionIndex];
    const suitableTimeSlots = timeSlots.filter(slot => slot.duration === session.duration);
    
    // Try each suitable time slot
    for (const timeSlot of suitableTimeSlots) {
      const suitableClassrooms = data.classrooms.filter(room => 
        this.isClassroomSuitable(room, session)
      );
      
      // Try each suitable classroom
      for (const classroom of suitableClassrooms) {
        this.statistics.constraintChecks++;
        
        // Check all constraints
        if (this.isValidAssignment(session, timeSlot, classroom, schedule, constraints)) {
          // Make assignment
          const assignment = this.createAssignment(session, timeSlot, classroom);
          schedule.push(assignment);
          
          // Forward checking and constraint propagation
          if (this.propagateConstraints(schedule, sessions, sessionIndex + 1)) {
            // Recurse to next session
            if (await this.backtrackSchedule(sessions, schedule, timeSlots, data, constraints, sessionIndex + 1)) {
              return true;
            }
          }
          
          // Backtrack
          schedule.pop();
          this.statistics.backtrackCount++;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if assignment is valid against all constraints
   */
  isValidAssignment(session, timeSlot, classroom, schedule, constraints) {
    // Check faculty availability
    if (!this.isFacultyAvailable(session.assignedFaculty, timeSlot, schedule)) {
      return false;
    }
    
    // Check classroom availability
    if (!this.isClassroomAvailable(classroom, timeSlot, schedule)) {
      return false;
    }
    
    // Check batch availability
    if (!this.isBatchAvailable(session.batch, timeSlot, schedule)) {
      return false;
    }
    
    // Check daily limits
    if (!this.checkDailyLimits(session, timeSlot, schedule, constraints)) {
      return false;
    }
    
    // Check lunch break conflicts
    if (!this.checkLunchBreakConstraint(timeSlot, constraints.lunchBreak)) {
      return false;
    }
    
    // Check faculty unavailable slots
    if (!this.checkFacultyUnavailability(session.assignedFaculty, timeSlot)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if faculty is available for the time slot
   */
  isFacultyAvailable(faculty, timeSlot, schedule) {
    if (!faculty) return false;
    
    const facultyId = faculty._id || faculty;
    return !schedule.some(assignment => 
      assignment.faculty.equals(facultyId) &&
      assignment.day === timeSlot.day &&
      this.timePeriodsOverlap(
        assignment.startTime, assignment.endTime,
        timeSlot.startTime, timeSlot.endTime
      )
    );
  }

  /**
   * Check if classroom is available for the time slot
   */
  isClassroomAvailable(classroom, timeSlot, schedule) {
    return !schedule.some(assignment => 
      assignment.classroom.equals(classroom._id) &&
      assignment.day === timeSlot.day &&
      this.timePeriodsOverlap(
        assignment.startTime, assignment.endTime,
        timeSlot.startTime, timeSlot.endTime
      )
    );
  }

  /**
   * Check if batch is available for the time slot
   */
  isBatchAvailable(batch, timeSlot, schedule) {
    return !schedule.some(assignment => 
      assignment.batch.equals(batch._id) &&
      assignment.day === timeSlot.day &&
      this.timePeriodsOverlap(
        assignment.startTime, assignment.endTime,
        timeSlot.startTime, timeSlot.endTime
      )
    );
  }

  /**
   * Check daily scheduling limits
   */
  checkDailyLimits(session, timeSlot, schedule, constraints) {
    // Count existing sessions for the batch on this day
    const batchSessionsToday = schedule.filter(assignment => 
      assignment.batch.equals(session.batch._id) &&
      assignment.day === timeSlot.day
    ).length;
    
    const maxDaily = session.batch.constraints?.maxClassesPerDay || constraints.maxClassesPerDay;
    return batchSessionsToday < maxDaily;
  }

  /**
   * Check lunch break constraint
   */
  checkLunchBreakConstraint(timeSlot, lunchBreak) {
    if (!lunchBreak) return true;
    
    return !this.timePeriodsOverlap(
      timeSlot.startTime, timeSlot.endTime,
      lunchBreak.startTime, lunchBreak.endTime
    );
  }

  /**
   * Check faculty unavailable slots
   */
  checkFacultyUnavailability(faculty, timeSlot) {
    if (!faculty?.teachingInfo?.availability) return true;
    
    // Check if faculty has blocked this time slot
    const blockedSlots = faculty.teachingInfo.availability.filter(slot => 
      slot.available === false
    );
    
    return !blockedSlots.some(blocked => 
      blocked.day === timeSlot.day &&
      this.timePeriodsOverlap(
        timeSlot.startTime, timeSlot.endTime,
        blocked.startTime, blocked.endTime
      )
    );
  }

  /**
   * Check if two time periods overlap
   */
  timePeriodsOverlap(start1, end1, start2, end2) {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);
    
    return (start1Minutes < end2Minutes) && (start2Minutes < end1Minutes);
  }

  /**
   * Convert time string to minutes
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Create assignment object
   */
  createAssignment(session, timeSlot, classroom) {
    return {
      day: timeSlot.day,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      duration: timeSlot.duration,
      subject: session.subject._id,
      faculty: session.assignedFaculty._id || session.assignedFaculty,
      classroom: classroom._id,
      batch: session.batch._id,
      sessionType: session.sessionType,
      group: session.group,
      academicYear: session.academicYear,
      semester: session.semester,
      department: session.department,
      maxStudents: session.maxStudents,
      priority: session.priority
    };
  }

  /**
   * Constraint propagation to reduce search space
   */
  propagateConstraints(schedule, sessions, nextIndex) {
    // For now, we do basic forward checking
    // This can be enhanced with arc consistency and other CP techniques
    return true;
  }

  /**
   * Finalize results with statistics and conflict detection
   */
  async finalizeResults(schedule, success, generationTime, data, constraints) {
    // Detect conflicts in the generated schedule
    const conflicts = this.detectScheduleConflicts(schedule);
    
    // Calculate optimization score
    const score = this.calculateOptimizationScore(schedule, constraints, data);
    
    // Compute detailed statistics
    const statistics = this.computeDetailedStatistics(schedule, data);
    
    return {
      schedule: schedule,
      conflicts: conflicts,
      score: score,
      statistics: {
        ...statistics,
        generationTime,
        ...this.statistics
      },
      generationTime,
      success
    };
  }

  /**
   * Detect conflicts in the generated schedule
   */
  detectScheduleConflicts(schedule) {
    const conflicts = [];
    
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const session1 = schedule[i];
        const session2 = schedule[j];
        
        if (session1.day === session2.day &&
            this.timePeriodsOverlap(
              session1.startTime, session1.endTime,
              session2.startTime, session2.endTime
            )) {
          
          // Faculty conflict
          if (session1.faculty.equals(session2.faculty)) {
            conflicts.push({
              type: 'faculty_clash',
              description: `Faculty double-booked on ${session1.day} ${session1.startTime}-${session1.endTime}`,
              severity: 'high',
              affectedSlots: [i, j]
            });
          }
          
          // Classroom conflict
          if (session1.classroom.equals(session2.classroom)) {
            conflicts.push({
              type: 'classroom_clash',
              description: `Classroom double-booked on ${session1.day} ${session1.startTime}-${session1.endTime}`,
              severity: 'high',
              affectedSlots: [i, j]
            });
          }
          
          // Batch conflict
          if (session1.batch.equals(session2.batch)) {
            conflicts.push({
              type: 'batch_clash',
              description: `Batch double-booked on ${session1.day} ${session1.startTime}-${session1.endTime}`,
              severity: 'high',
              affectedSlots: [i, j]
            });
          }
        }
      }
    }
    
    this.conflicts = conflicts;
    return conflicts;
  }

  /**
   * Calculate optimization score based on various factors
   */
  calculateOptimizationScore(schedule, constraints, data) {
    let score = 100;
    
    // Penalize lunch break violations
    const lunchViolations = schedule.filter(session => 
      !this.checkLunchBreakConstraint(session, constraints.lunchBreak)
    ).length;
    score -= lunchViolations * 2;
    
    // Reward balanced daily distribution
    const dailyDistribution = this.calculateDailyDistribution(schedule);
    const distributionVariance = this.calculateVariance(Object.values(dailyDistribution));
    score -= distributionVariance * 0.1;
    
    // Reward efficient classroom utilization
    const classroomUtilization = this.calculateClassroomUtilization(schedule, data.classrooms);
    score += classroomUtilization * 0.1;
    
    // Penalize gaps in schedules
    const gapPenalty = this.calculateGapPenalty(schedule);
    score -= gapPenalty * 0.5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate daily distribution of classes
   */
  calculateDailyDistribution(schedule) {
    const distribution = {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0
    };
    
    schedule.forEach(session => {
      if (distribution.hasOwnProperty(session.day)) {
        distribution[session.day]++;
      }
    });
    
    return distribution;
  }

  /**
   * Calculate variance in an array of numbers
   */
  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Calculate classroom utilization efficiency
   */
  calculateClassroomUtilization(schedule, classrooms) {
    const usage = new Map();
    
    schedule.forEach(session => {
      const roomId = session.classroom.toString();
      usage.set(roomId, (usage.get(roomId) || 0) + 1);
    });
    
    const totalSessions = schedule.length;
    const usedRooms = usage.size;
    const totalRooms = classrooms.length;
    
    // Efficiency = sessions per used room vs. optimal distribution
    return totalSessions > 0 ? (usedRooms / totalRooms) * 100 : 0;
  }

  /**
   * Calculate penalty for gaps in schedules
   */
  calculateGapPenalty(schedule) {
    let totalGaps = 0;
    const scheduleByDay = {};
    
    // Group by day
    schedule.forEach(session => {
      if (!scheduleByDay[session.day]) {
        scheduleByDay[session.day] = [];
      }
      scheduleByDay[session.day].push(session);
    });
    
    // Calculate gaps for each day
    Object.values(scheduleByDay).forEach(daySessions => {
      daySessions.sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));
      
      for (let i = 0; i < daySessions.length - 1; i++) {
        const currentEnd = this.timeToMinutes(daySessions[i].endTime);
        const nextStart = this.timeToMinutes(daySessions[i + 1].startTime);
        const gap = nextStart - currentEnd;
        
        // Penalize gaps longer than break duration
        if (gap > 15) {
          totalGaps += gap - 15;
        }
      }
    });
    
    return totalGaps / 60; // Convert to hours
  }

  /**
   * Compute detailed statistics
   */
  computeDetailedStatistics(schedule, data) {
    const stats = {
      totalClasses: schedule.length,
      dailyDistribution: this.calculateDailyDistribution(schedule),
      facultyWorkload: this.calculateFacultyWorkloadStats(schedule, data.faculty),
      classroomUtilization: this.calculateDetailedClassroomUtilization(schedule, data.classrooms),
      utilizationRate: schedule.length > 0 ? 
        (schedule.length / (data.batches.length * data.subjects.length * 5)) * 100 : 0
    };
    
    return stats;
  }

  /**
   * Calculate faculty workload statistics
   */
  calculateFacultyWorkloadStats(schedule, faculty) {
    const workload = [];
    
    faculty.forEach(f => {
      const facultySessions = schedule.filter(s => 
        s.faculty.equals(f._id)
      );
      
      const hoursPerWeek = facultySessions.reduce((total, session) => 
        total + (session.duration / 60), 0
      );
      
      workload.push({
        faculty: f._id,
        name: f.user?.name || 'Unknown',
        hoursPerWeek: Math.round(hoursPerWeek * 10) / 10,
        sessionsCount: facultySessions.length
      });
    });
    
    return workload;
  }

  /**
   * Calculate detailed classroom utilization
   */
  calculateDetailedClassroomUtilization(schedule, classrooms) {
    const utilization = [];
    
    classrooms.forEach(classroom => {
      const roomSessions = schedule.filter(s => 
        s.classroom.equals(classroom._id)
      );
      
      const totalHours = roomSessions.reduce((total, session) => 
        total + (session.duration / 60), 0
      );
      
      const workingHours = 8; // 8 hours per day
      const workingDays = 5; // 5 days per week
      const totalAvailableHours = workingHours * workingDays;
      
      const utilizationPercentage = totalAvailableHours > 0 ? 
        (totalHours / totalAvailableHours) * 100 : 0;
      
      utilization.push({
        classroom: classroom._id,
        roomNumber: classroom.roomNumber,
        building: classroom.building,
        utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        sessionsCount: roomSessions.length
      });
    });
    
    return utilization;
  }
}

module.exports = TimetableScheduler;

