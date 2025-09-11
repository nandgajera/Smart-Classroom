const TimeSlot = require('../models/TimeSlot');
const ScheduledSession = require('../models/ScheduledSession');

class TimetableSchedulerDebug {
  constructor() {
    this.debug = true; // Enable detailed debug logging
    this.statistics = {
      totalSessions: 0,
      scheduledSessions: 0,
      failedSessions: 0,
      conflicts: [],
      utilization: {
        faculty: {},
        classrooms: {}
      }
    };
  }

  log(message, level = 'info') {
    if (!this.debug) return;
    
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async generateTimetable(batches, subjects, faculty, classrooms, timeSlots) {
    this.log('🚀 Starting timetable generation');
    this.log(`Input data: ${batches.length} batches, ${subjects.length} subjects, ${faculty.length} faculty, ${classrooms.length} classrooms, ${timeSlots.length} time slots`);
    
    // Clear any existing scheduled sessions
    await ScheduledSession.deleteMany({});
    this.log('📅 Cleared existing scheduled sessions');
    
    const schedule = [];
    const facultySchedule = new Map(); // facultyId -> Set of time slots
    const classroomSchedule = new Map(); // classroomId -> Set of time slots
    const batchSchedule = new Map(); // batchId -> Set of time slots

    // Initialize schedules
    faculty.forEach(f => facultySchedule.set(f._id.toString(), new Set()));
    classrooms.forEach(c => classroomSchedule.set(c._id.toString(), new Set()));
    batches.forEach(b => batchSchedule.set(b._id.toString(), new Set()));

    this.log('📋 Initialized faculty, classroom, and batch schedules');

    // Calculate total sessions needed
    let totalSessionsNeeded = 0;
    for (const batch of batches) {
      for (const batchSubject of batch.subjects) {
        // Handle both populated and unpopulated subjects
        let subject;
        if (typeof batchSubject.subject === 'object' && batchSubject.subject._id) {
          subject = batchSubject.subject;
        } else {
          subject = subjects.find(s => s._id.toString() === batchSubject.subject.toString());
        }
        
        if (subject && batchSubject.faculty) {
          totalSessionsNeeded += subject.sessionsPerWeek;
        }
      }
    }
    
    this.statistics.totalSessions = totalSessionsNeeded;
    this.log(`📊 Total sessions needed: ${totalSessionsNeeded}`);

    // Process each batch
    for (const batch of batches) {
      this.log(`\n🎓 Processing batch: ${batch.name}`);
      
      for (const batchSubject of batch.subjects) {
        // Handle both populated and unpopulated subjects
        let subject;
        if (typeof batchSubject.subject === 'object' && batchSubject.subject._id) {
          // Subject is populated
          subject = batchSubject.subject;
        } else {
          // Subject is just an ObjectId, find it in the subjects array
          subject = subjects.find(s => s._id.toString() === batchSubject.subject.toString());
        }
        
        // Handle both populated and unpopulated faculty
        let assignedFaculty;
        if (typeof batchSubject.faculty === 'object' && batchSubject.faculty._id) {
          // Faculty is populated
          assignedFaculty = batchSubject.faculty;
        } else {
          // Faculty is just an ObjectId, find it in the faculty array
          assignedFaculty = faculty.find(f => f._id.toString() === batchSubject.faculty.toString());
        }
        
        if (!subject) {
          this.log(`❌ Subject not found for batch ${batch.name}`, 'error');
          continue;
        }
        
        if (!assignedFaculty) {
          this.log(`❌ Faculty not assigned for subject ${subject.name} in batch ${batch.name}`, 'error');
          this.statistics.failedSessions += subject.sessionsPerWeek;
          continue;
        }

        this.log(`📚 Scheduling ${subject.name} (${subject.sessionsPerWeek} sessions/week) with ${assignedFaculty.user?.name || 'Unknown Faculty'}`);

        // Schedule sessions for this subject
        const sessionResult = await this.scheduleSubjectSessions(
          batch, subject, assignedFaculty, classrooms, timeSlots,
          facultySchedule, classroomSchedule, batchSchedule
        );
        
        schedule.push(...sessionResult.sessions);
        this.statistics.scheduledSessions += sessionResult.scheduled;
        this.statistics.failedSessions += sessionResult.failed;
      }
    }

    this.log(`\n📈 SCHEDULING SUMMARY:`);
    this.log(`✅ Successfully scheduled: ${this.statistics.scheduledSessions}/${this.statistics.totalSessions} sessions`);
    this.log(`❌ Failed to schedule: ${this.statistics.failedSessions} sessions`);

    // Save scheduled sessions to database
    if (schedule.length > 0) {
      await ScheduledSession.insertMany(schedule);
      this.log(`💾 Saved ${schedule.length} scheduled sessions to database`);
    } else {
      this.log(`⚠️ No sessions were scheduled - check constraints and data!`, 'warn');
    }

    return {
      schedule,
      statistics: this.statistics,
      success: this.statistics.scheduledSessions > 0
    };
  }

  async scheduleSubjectSessions(batch, subject, faculty, classrooms, timeSlots, facultySchedule, classroomSchedule, batchSchedule) {
    const sessions = [];
    let scheduled = 0;
    let failed = 0;

    this.log(`  🎯 Attempting to schedule ${subject.sessionsPerWeek} sessions for ${subject.name}`);

    // Find suitable classrooms
    const suitableClassrooms = this.findSuitableClassrooms(subject, classrooms, batch.enrolledStudents);
    
    if (suitableClassrooms.length === 0) {
      this.log(`  ❌ No suitable classrooms found for ${subject.name}`, 'error');
      this.log(`     Requirements: type=${subject.type}, capacity>=${subject.classroomRequirements?.minCapacity || batch.enrolledStudents}, facilities=${subject.classroomRequirements?.requiredFacilities?.join(', ') || 'none'}`);
      return { sessions, scheduled, failed: subject.sessionsPerWeek };
    }

    this.log(`  ✅ Found ${suitableClassrooms.length} suitable classrooms: ${suitableClassrooms.map(c => c.roomNumber).join(', ')}`);

    for (let sessionIndex = 0; sessionIndex < subject.sessionsPerWeek; sessionIndex++) {
      this.log(`    📅 Scheduling session ${sessionIndex + 1}/${subject.sessionsPerWeek}`);
      
      let sessionScheduled = false;

      // Try to find a suitable time slot
      for (const timeSlot of timeSlots) {
        const timeSlotKey = `${timeSlot.day}-${timeSlot.startTime}-${timeSlot.endTime}`;
        
        // Check if faculty is available
        if (facultySchedule.get(faculty._id.toString()).has(timeSlotKey)) {
          this.log(`      ⏰ Faculty ${faculty.user?.name} not available at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime}`);
          continue;
        }

        // Check if batch is available
        if (batchSchedule.get(batch._id.toString()).has(timeSlotKey)) {
          this.log(`      👥 Batch ${batch.name} not available at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime}`);
          continue;
        }

        // Try each suitable classroom
        for (const classroom of suitableClassrooms) {
          if (classroomSchedule.get(classroom._id.toString()).has(timeSlotKey)) {
            this.log(`      🏫 Classroom ${classroom.roomNumber} not available at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime}`);
            continue;
          }

          // Check faculty availability constraints
          if (!this.checkFacultyAvailability(faculty, timeSlot)) {
            this.log(`      👨‍🏫 Faculty ${faculty.user?.name} has availability constraints for ${timeSlot.day} ${timeSlot.startTime}`);
            continue;
          }

          // All checks passed - schedule the session
          const session = {
            batch: batch._id,
            subject: subject._id,
            faculty: faculty._id,
            classroom: classroom._id,
            // Time information (denormalized from timeSlot)
            day: timeSlot.day.toLowerCase(),
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            duration: timeSlot.duration || subject.sessionDuration,
            // Map subject types to session types
            sessionType: this.mapSubjectTypeToSessionType(subject.type),
            // Academic context from batch
            academicYear: batch.academicYear || '2024-25',
            semester: batch.semester || 3,
            department: batch.department || 'CSE',
            // Status
            status: 'scheduled',
            isActive: true
          };

          sessions.push(session);
          
          // Mark time slot as occupied
          facultySchedule.get(faculty._id.toString()).add(timeSlotKey);
          classroomSchedule.get(classroom._id.toString()).add(timeSlotKey);
          batchSchedule.get(batch._id.toString()).add(timeSlotKey);

          this.log(`      ✅ Scheduled ${subject.name} for ${batch.name} at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime} in ${classroom.roomNumber}`);
          
          scheduled++;
          sessionScheduled = true;
          break;
        }

        if (sessionScheduled) break;
      }

      if (!sessionScheduled) {
        this.log(`    ❌ Failed to schedule session ${sessionIndex + 1} for ${subject.name}`, 'error');
        failed++;
      }
    }

    return { sessions, scheduled, failed };
  }

  findSuitableClassrooms(subject, classrooms, batchSize) {
    const requiredCapacity = subject.classroomRequirements?.minCapacity || batchSize;
    const requiredFacilities = subject.classroomRequirements?.requiredFacilities || [];
    const preferredType = this.mapSubjectTypeToClassroomType(subject.type);

    this.log(`    🔍 Looking for classrooms: capacity>=${requiredCapacity}, type=${preferredType}, facilities=[${requiredFacilities.join(', ')}]`);

    return classrooms.filter(classroom => {
      // Check capacity
      if (classroom.capacity < requiredCapacity) {
        this.log(`      ❌ ${classroom.roomNumber}: capacity ${classroom.capacity} < required ${requiredCapacity}`);
        return false;
      }

      // Check type compatibility
      if (preferredType && !this.isClassroomTypeCompatible(classroom.type, preferredType)) {
        this.log(`      ❌ ${classroom.roomNumber}: type ${classroom.type} not compatible with ${preferredType}`);
        return false;
      }

      // Check required facilities
      const roomFacilities = classroom.facilities || [];
      for (const facility of requiredFacilities) {
        if (!roomFacilities.includes(facility)) {
          this.log(`      ❌ ${classroom.roomNumber}: missing facility ${facility}`);
          return false;
        }
      }

      // Check if classroom is active
      if (!classroom.isActive) {
        this.log(`      ❌ ${classroom.roomNumber}: not active`);
        return false;
      }

      this.log(`      ✅ ${classroom.roomNumber}: suitable (capacity: ${classroom.capacity}, type: ${classroom.type})`);
      return true;
    });
  }

  mapSubjectTypeToClassroomType(subjectType) {
    const mapping = {
      'theory': 'lecture_hall',
      'lab': 'computer_lab',
      'seminar': 'tutorial_room',
      'workshop': 'computer_lab'
    };
    return mapping[subjectType];
  }

  mapSubjectTypeToSessionType(subjectType) {
    const mapping = {
      'theory': 'lecture',
      'lab': 'lab',
      'seminar': 'seminar',
      'workshop': 'lab'
    };
    return mapping[subjectType] || 'lecture';
  }

  isClassroomTypeCompatible(classroomType, preferredType) {
    // Simple compatibility check - if no preferred type, allow all
    if (!preferredType) return true;
    
    // Define compatibility matrix
    const compatibility = {
      'lecture_hall': ['lecture_hall', 'tutorial_room'],
      'computer_lab': ['computer_lab'],
      'tutorial_room': ['tutorial_room', 'lecture_hall'],
      'auditorium': ['auditorium', 'lecture_hall']
    };

    const compatibleTypes = compatibility[classroomType] || [classroomType];
    return compatibleTypes.includes(preferredType);
  }

  checkFacultyAvailability(faculty, timeSlot) {
    // Check if faculty has specific unavailable slots
    const unavailableSlots = faculty.availability?.unavailableSlots || [];
    
    for (const unavailable of unavailableSlots) {
      if (unavailable.day === timeSlot.day &&
          unavailable.startTime <= timeSlot.startTime &&
          unavailable.endTime >= timeSlot.endTime) {
        return false;
      }
    }

    // Check working hours
    const workingHours = faculty.availability?.workingHours || {};
    const dayHours = workingHours[timeSlot.day.toLowerCase()];
    
    if (dayHours && dayHours.start && dayHours.end) {
      const slotStart = this.timeToMinutes(timeSlot.startTime);
      const slotEnd = this.timeToMinutes(timeSlot.endTime);
      const workStart = this.timeToMinutes(dayHours.start);
      const workEnd = this.timeToMinutes(dayHours.end);
      
      if (slotStart < workStart || slotEnd > workEnd) {
        return false;
      }
    }

    return true;
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = TimetableSchedulerDebug;
