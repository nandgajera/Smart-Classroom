import React from 'react';
import moment from 'moment';

const TimetableGrid = ({ timetable, viewType = 'weekly' }) => {
  if (!timetable || !timetable.schedule) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No timetable data available</p>
      </div>
    );
  }

  const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const timeSlots = generateTimeSlots('09:00', '17:00', 30); // 30-minute intervals

  // Group schedule by day and time
  const scheduleGrid = groupScheduleByTime(timetable.schedule);

  function generateTimeSlots(startTime, endTime, intervalMinutes) {
    const slots = [];
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    
    while (start.isBefore(end)) {
      slots.push(start.format('HH:mm'));
      start.add(intervalMinutes, 'minutes');
    }
    
    return slots;
  }

  function groupScheduleByTime(schedule) {
    const grid = {};
    
    schedule.forEach(slot => {
      const key = `${slot.day}-${slot.startTime}`;
      if (!grid[key]) {
        grid[key] = [];
      }
      grid[key].push(slot);
    });
    
    return grid;
  }

  function getSlotDuration(startTime, endTime) {
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    return end.diff(start, 'minutes') / 30; // Number of 30-minute blocks
  }

  function isSlotOccupied(day, time, scheduleGrid) {
    const key = `${day}-${time}`;
    return scheduleGrid[key] && scheduleGrid[key].length > 0;
  }

  function getSlotInfo(day, time, scheduleGrid) {
    const key = `${day}-${time}`;
    return scheduleGrid[key] ? scheduleGrid[key][0] : null;
  }

  function shouldSkipSlot(day, time, scheduleGrid, renderedSlots) {
    // Check if this slot is already rendered as part of a longer session
    return renderedSlots.has(`${day}-${time}`);
  }

  const renderedSlots = new Set();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-indigo-600 text-white">
        <h3 className="text-lg font-semibold">{timetable.name}</h3>
        <p className="text-sm opacity-90">
          {timetable.department} - Semester {timetable.semester} - {timetable.academicYear}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Time
              </th>
              {workingDays.map(day => (
                <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeSlots.map((time, timeIndex) => (
              <tr key={time} className={timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r">
                  {time}
                </td>
                {workingDays.map(day => {
                  const slotKey = `${day}-${time}`;
                  
                  if (shouldSkipSlot(day, time, scheduleGrid, renderedSlots)) {
                    return null;
                  }

                  if (isSlotOccupied(day, time, scheduleGrid)) {
                    const slotInfo = getSlotInfo(day, time, scheduleGrid);
                    const duration = getSlotDuration(slotInfo.startTime, slotInfo.endTime);
                    
                    // Mark subsequent slots as rendered
                    for (let i = 0; i < duration; i++) {
                      const nextTimeIndex = timeIndex + i;
                      if (nextTimeIndex < timeSlots.length) {
                        renderedSlots.add(`${day}-${timeSlots[nextTimeIndex]}`);
                      }
                    }

                    return (
                      <td
                        key={day}
                        className="px-2 py-1 border-l border-gray-200 relative"
                        rowSpan={duration}
                      >
                        <div className={`p-2 rounded-md text-xs ${getSlotTypeColor(slotInfo.sessionType)}`}>
                          <div className="font-semibold truncate">
                            {slotInfo.subject?.code || slotInfo.subject?.name || 'Unknown Subject'}
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {slotInfo.classroom?.roomNumber && slotInfo.classroom?.building && 
                              `${slotInfo.classroom.building}-${slotInfo.classroom.roomNumber}`
                            }
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {slotInfo.faculty?.user?.name || 'TBA'}
                          </div>
                          <div className="text-xs mt-1 opacity-70">
                            {slotInfo.batch?.code || slotInfo.batch?.name || 'Unknown Batch'}
                          </div>
                          <div className="text-xs mt-1 font-medium">
                            {slotInfo.startTime} - {slotInfo.endTime}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="px-2 py-1 border-l border-gray-200">
                      <div className="h-16"></div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span>Lecture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span>Tutorial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-200 rounded"></div>
            <span>Seminar</span>
          </div>
        </div>
      </div>
    </div>
  );

  function getSlotTypeColor(sessionType) {
    const colors = {
      lecture: 'bg-blue-100 text-blue-800 border border-blue-200',
      lab: 'bg-green-100 text-green-800 border border-green-200',
      tutorial: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      seminar: 'bg-purple-100 text-purple-800 border border-purple-200',
      exam: 'bg-red-100 text-red-800 border border-red-200'
    };
    return colors[sessionType] || 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export default TimetableGrid;
