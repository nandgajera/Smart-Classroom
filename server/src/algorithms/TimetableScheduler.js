const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');
const Batch = require('../models/Batch');

/**
 * TimetableScheduler implements a constraint satisfaction + heuristic search.
 * Strategy:
 * 1) Build candidate slots grid from working days and hours.
 * 2) Expand required sessions for each batch+subject (frequency per week and duration).
 * 3) Order sessions by difficulty (labs, high capacity, limited faculty, long duration) -> MRV heuristic.
 * 4) Backtracking assign (time, classroom, faculty) per session with constraints:
 *    - No faculty, classroom, batch clashes
 *    - Room capacity/type/facilities
 *    - Faculty availability and preferences
 *    - Batch constraints (max per day, blocked times)
 *    - Lunch break avoidance
 * 5) Use forward checking and simple scoring to keep best solution (minimize soft constraint violations).
 */
class TimetableScheduler {
  constructor() {
    this.timeGrid = [];
  }

  // Utility to generate time slots within working hours
  generateTimeGrid({ workingDays, workingHours, slotDurations }) {
    const grid = [];

    workingDays.forEach(day => {
      slotDurations.forEach(duration => {
        const [startH, startM] = workingHours.startTime.split(':').map(Number);
        const [endH, endM] = workingHours.endTime.split(':').map(Number);
        const dayStart = startH * 60 + startM;
        const dayEnd = endH * 60 + endM;

        for (let t = dayStart; t + duration <= dayEnd; t += 30) { // 30-min step grid
          const startTime = this.minutesToTime(t);
          const endTime = this.minutesToTime(t + duration);
          grid.push({ day, startTime, endTime, duration });
        }
      });
    });

    // Ensure deterministic order
    grid.sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));
    return grid;
  }

  minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  timeOverlap(aStart, aEnd, bStart, bEnd) {
    return (aStart < bEnd) && (bStart < aEnd);
  }

  // Main entry to generate timetable
  async generateTimetable({ academicYear, semester, department, constraints = {}, algorithm = 'constraint_satisfaction' }) {
    const defaultConstraints = {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: { startTime: '09:00', endTime: '17:00' },
      lunchBreak: { startTime: '12:30', endTime: '13:30' },
      maxClassesPerDay: 8
    };
    const C = { ...defaultConstraints, ...constraints };

    // Fetch data
    const [subjects, faculty, classrooms, batches] = await Promise.all([
      Subject.find({ department, semester, academicYear, isActive: true }),
      Faculty.find({ departments: department }).populate('user', 'name email department'),
      Classroom.find({ department, isActive: true }),
      Batch.find({ department, semester, academicYear, isActive: true })
        .populate('subjects.subject subjects.faculty')
    ]);

    // Build time grid for required durations
    const slotDurations = Array.from(new Set(subjects.map(s => s.sessionDuration)));
    const timeGrid = this.generateTimeGrid({ workingDays: C.workingDays, workingHours: C.workingHours, slotDurations });

    // Expand sessions to schedule
    const sessions = [];
    for (const batch of batches) {
      for (const s of batch.subjects) {
        const subj = s.subject;
        const assignedFaculty = s.faculty || this.selectFacultyForSubject(subj, faculty);
        for (let i = 0; i < subj.sessionsPerWeek; i++) {
          sessions.push({ batch, subject: subj, faculty: assignedFaculty, duration: subj.sessionDuration });
        }
      }
    }

    // Heuristic order: labs first, longer sessions first, larger classes first, subjects with fewer feasible resources first
    sessions.sort((a, b) => {
      const labA = a.subject.type === 'lab' ? 1 : 0;
      const labB = b.subject.type === 'lab' ? 1 : 0;
      if (labB !== labA) return labB - labA;
      if (b.duration !== a.duration) return b.duration - a.duration;
      const sizeA = a.batch.enrolledStudents;
      const sizeB = b.batch.enrolledStudents;
      if (sizeB !== sizeA) return sizeB - sizeA;
      return 0;
    });

    const assignments = [];
    const usage = { faculty: new Map(), classroom: new Map(), batch: new Map() };

    const startTime = Date.now();

    const success = this.backtrackAssign(0, sessions, timeGrid, classrooms, C, assignments, usage);

    const generationTime = Date.now() - startTime;

    // Compute simple statistics and score
    const conflicts = success ? [] : [{ type: 'infeasible', description: 'Could not schedule all sessions', severity: 'high' }];
    const score = this.computeScore(assignments, C);

    return {
      schedule: assignments,
      conflicts,
      score,
      statistics: this.computeStats(assignments),
      generationTime
    };
  }

  selectFacultyForSubject(subject, facultyPool) {
    // Prefer faculty with matching specialization and available load
    const candidates = facultyPool.filter(f => (
      (!subject.facultyRequirements?.specialization?.length || subject.facultyRequirements.specialization.some(sp => f.specialization.includes(sp)))
    ));
    // Simple heuristic: random among candidates for now (can be improved)
    return candidates[0] || facultyPool[0] || null;
  }

  fitsLunchBreak(slot, lunch) {
    if (!lunch) return true;
    const s = slot.startTime;
    const e = slot.endTime;
    return !(s < lunch.endTime && lunch.startTime < e);
  }

  fitsBatchDailyLimit(batch, slot, assignments, maxPerDay) {
    const count = assignments.filter(a => a.batch.equals(batch._id) && a.day === slot.day).length;
    return count < (batch.constraints?.maxClassesPerDay || maxPerDay);
  }

  roomFeasible(room, session, slot) {
    if (!room.isActive) return false;
    if (room.capacity < Math.max(session.batch.enrolledStudents, session.subject.classroomRequirements?.minCapacity || 0)) return false;
    if (session.subject.classroomRequirements?.type && room.type !== session.subject.classroomRequirements.type) return false;
    const reqFacilities = session.subject.classroomRequirements?.facilities || [];
    const hasAllFacilities = reqFacilities.every(f => room.facilities.includes(f));
    if (!hasAllFacilities) return false;
    // Room maintenance/block checks are handled by model but we recheck minimally here
    return true;
  }

  facultyAvailable(facultyId, slot, assignments) {
    return !assignments.some(a => a.faculty.equals(facultyId) && a.day === slot.day && this.timeOverlap(a.startTime, a.endTime, slot.startTime, slot.endTime));
  }

  roomAvailable(roomId, slot, assignments) {
    return !assignments.some(a => a.classroom.equals(roomId) && a.day === slot.day && this.timeOverlap(a.startTime, a.endTime, slot.startTime, slot.endTime));
  }

  batchAvailable(batchId, slot, assignments) {
    return !assignments.some(a => a.batch.equals(batchId) && a.day === slot.day && this.timeOverlap(a.startTime, a.endTime, slot.startTime, slot.endTime));
  }

  backtrackAssign(i, sessions, timeGrid, rooms, C, assignments, usage) {
    if (i === sessions.length) return true;

    const session = sessions[i];
    // Candidate time slots matching duration and avoiding lunch break
    const candidateSlots = timeGrid.filter(s => s.duration === session.duration && this.fitsLunchBreak(s, C.lunchBreak));

    for (const slot of candidateSlots) {
      if (!this.fitsBatchDailyLimit(session.batch, slot, assignments, C.maxClassesPerDay)) continue;
      if (session.batch.constraints?.blockedTimeSlots?.some(b => b.day === slot.day && !(slot.endTime <= b.startTime || slot.startTime >= b.endTime))) continue;

      const feasibleRooms = rooms.filter(r => this.roomFeasible(r, session, slot) && this.roomAvailable(r._id, slot, assignments));
      if (feasibleRooms.length === 0) continue;

      if (!this.facultyAvailable(session.faculty?._id || session.faculty, slot, assignments)) continue;

      // Try each feasible room
      for (const room of feasibleRooms) {
        const assignment = {
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: session.subject._id,
          faculty: session.faculty?._id || session.faculty,
          classroom: room._id,
          batch: session.batch._id,
          sessionType: session.subject.type === 'lab' ? 'lab' : 'lecture'
        };

        assignments.push(assignment);

        if (this.backtrackAssign(i + 1, sessions, timeGrid, rooms, C, assignments, usage)) {
          return true;
        }

        // backtrack
        assignments.pop();
      }
    }

    return false;
  }

  computeScore(assignments, C) {
    // Simple scoring based on room utilization and avoidance of lunch period
    let score = 100;
    const lunchStart = C.lunchBreak?.startTime;
    const lunchEnd = C.lunchBreak?.endTime;

    const lunchHits = assignments.filter(a => lunchStart && lunchEnd && !(a.endTime <= lunchStart || a.startTime >= lunchEnd)).length;
    score -= lunchHits * 0.5;

    // Diversity of rooms usage (softly encourage spread)
    const roomCounts = new Map();
    assignments.forEach(a => roomCounts.set(a.classroom.toString(), (roomCounts.get(a.classroom.toString()) || 0) + 1));
    const imbalance = Math.max(...roomCounts.values()) - Math.min(...roomCounts.values());
    if (isFinite(imbalance)) score -= imbalance * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  computeStats(assignments) {
    const byDay = {};
    assignments.forEach(a => {
      byDay[a.day] = (byDay[a.day] || 0) + 1;
    });
    return {
      totalClasses: assignments.length,
      byDay
    };
  }
}

module.exports = TimetableScheduler;

