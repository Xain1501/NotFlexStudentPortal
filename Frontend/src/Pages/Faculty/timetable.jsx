import React, { useEffect, useMemo, useState } from 'react';
import { getTeacher } from '../Faculty/api';
import "../Faculty/styles.css";
import "./timetable.css";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_MINUTES = 30;

function toMinutes(t) {
  const [hh, mm] = (t || '').split(':').map(x => Number(x));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
function minutesToHHMM(m) {
  const hh = Math.floor(m / 60).toString().padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
function hashCode(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i) | 0;
  return h;
}

export default function TimeTable() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotMinutes] = useState(SLOT_MINUTES);
  const [selectedCourseId, setSelectedCourseId] = useState(null); // NEW: selected course filter

  useEffect(() => {
    setLoading(true);
    getTeacher()
      .then(t => setTeacher(t))
      .catch(err => { console.error('Failed to load teacher:', err); setTeacher(null); })
      .finally(() => setLoading(false));
  }, []);

  // collect schedule entries and attach courseId where possible
  const scheduleEntries = useMemo(() => {
    if (!teacher) return [];

    if (Array.isArray(teacher.timetable) && teacher.timetable.length > 0) {
      return teacher.timetable.map((s, i) => ({
        id: s.id ?? `tt-${i}`,
        day: s.day,
        start: s.start,
        end: s.end,
        title: s.title ?? s.course ?? s.code ?? s.name ?? '',
        room: s.room ?? s.location ?? '',
        section: s.section ?? '',
        // try to attach a courseId if present in the entry
        courseId: s.courseId ?? s.course_id ?? s.course ?? null,
        raw: s
      })).filter(e => e.day && e.start && e.end);
    }

    const fromCourses = [];
    if (Array.isArray(teacher.courses)) {
      teacher.courses.forEach(course => {
        const courseTitle = `${course.code ?? ''} ${course.name ?? ''}`.trim();
        (Array.isArray(course.schedule) ? course.schedule : []).forEach((s, i) => {
          if (!s || !s.day || !s.start || !s.end) return;
          fromCourses.push({
            id: s.id ?? `${course.id}-sch-${i}`,
            day: s.day,
            start: s.start,
            end: s.end,
            title: courseTitle,
            room: s.room ?? s.location ?? '',
            section: course.section ?? s.section ?? '',
            courseId: course.id // IMPORTANT: attach course id so we can highlight sessions
          });
        });
      });
    }

    if (fromCourses.length > 0) return fromCourses;

    if (Array.isArray(teacher.schedules)) {
      return teacher.schedules.map((s, i) => ({
        id: s.id ?? `s-${i}`,
        day: s.day,
        start: s.start,
        end: s.end,
        title: s.title ?? '',
        room: s.room ?? ''
      })).filter(e => e.day && e.start && e.end);
    }

    return [];
  }, [teacher]);

  const { minStart, maxEnd, timeSlots } = useMemo(() => {
    if (!scheduleEntries || scheduleEntries.length === 0) {
      const defaultStart = toMinutes('08:00');
      const defaultEnd = toMinutes('17:00');
      const slots = [];
      for (let m = defaultStart; m < defaultEnd; m += slotMinutes) slots.push(m);
      return { minStart: defaultStart, maxEnd: defaultEnd, timeSlots: slots };
    }
    let min = Infinity, max = -Infinity;
    scheduleEntries.forEach(s => {
      const a = toMinutes(s.start);
      const b = toMinutes(s.end);
      if (a != null && a < min) min = a;
      if (b != null && b > max) max = b;
    });
    const minRounded = Math.floor(min / slotMinutes) * slotMinutes;
    const maxRounded = Math.ceil(max / slotMinutes) * slotMinutes;
    const slots = [];
    for (let m = minRounded; m < maxRounded; m += slotMinutes) slots.push(m);
    return { minStart: minRounded, maxEnd: maxRounded, timeSlots: slots };
  }, [scheduleEntries, slotMinutes]);

  const tableData = useMemo(() => {
    const daysMap = {};
    DAYS.forEach(d => { daysMap[d] = Array(timeSlots.length).fill(null); });

    scheduleEntries.forEach(entry => {
      const day = entry.day;
      if (!daysMap[day]) return;
      const startMin = toMinutes(entry.start);
      const endMin = toMinutes(entry.end);
      if (startMin == null || endMin == null) return;
      const startIndex = Math.round((startMin - minStart) / slotMinutes);
      const durationSlots = Math.max(1, Math.round((endMin - startMin) / slotMinutes));
      if (startIndex < 0 || startIndex >= timeSlots.length) return;
      daysMap[day][startIndex] = { entry, rowspan: durationSlots };
      for (let k = 1; k < durationSlots; k++) {
        if (timeSlots[startIndex + k] !== undefined) daysMap[day][startIndex + k] = 'occupied';
      }
    });

    return daysMap;
  }, [scheduleEntries, timeSlots, minStart, slotMinutes]);

  function onClickSession(entry) {
    alert(`${entry.title}\n${entry.section ? `Section: ${entry.section}\n` : ''}${entry.room ? `Room: ${entry.room}\n` : ''}${entry.start} - ${entry.end}`);
  }

  function exportCSV() {
    const rows = [['Day','Start','End','Title','Section','Room']];
    scheduleEntries.forEach(s => rows.push([s.day, s.start, s.end, s.title || '', s.section || '', s.room || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teacher ? teacher.name || 'timetable' : 'timetable'}-timetable.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <header className="mt-4 text-center">
        <h2 className="page-title">My Timetable</h2>
        <div className="small text-muted">{teacher ? teacher.name : ''}</div>
      </header>

      <div className="card mt-3 timetable-card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="accent mb-0">Weekly Timetable</h5>
            <div>
              <button className="btn btn-outline-secondary btn-sm mr-2" onClick={() => window.print()}>Print</button>
              <button className="btn btn-primary btn-sm" onClick={exportCSV}>Export CSV</button>
            </div>
          </div>

          {/* NEW: Course filter / selector */}
          {Array.isArray(teacher?.courses) && teacher.courses.length > 0 && (
            <div className="mb-3 course-filter">
              <div className="btn-group" role="group" aria-label="Courses">
                <button
                  className={`btn btn-sm ${selectedCourseId ? 'btn-outline-secondary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCourseId(null)}
                >
                  All
                </button>
                {teacher.courses.map(c => (
                  <button
                    key={c.id}
                    className={`btn btn-sm ${selectedCourseId === c.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedCourseId(prev => (prev === c.id ? null : c.id))}
                    title={`${c.code} — ${c.name}`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
              <div className="small text-muted mt-1">Click a course to highlight its sessions</div>
            </div>
          )}

          {scheduleEntries.length === 0 ? (
            <div className="text-muted">No timetable data found for this teacher. Ensure teacher.timetable or course.schedule is present in the API response.</div>
          ) : (
            <div className="table-responsive timetable-wrapper">
              <table className="table timetable-table">
                <thead>
                  <tr>
                    <th className="time-col">Time</th>
                    {DAYS.map(d => <th key={d} className="day-col">{d}</th>)}
                  </tr>
                </thead>

                <tbody>
                  {timeSlots.map((slotMin, rowIdx) => (
                    <tr key={slotMin}>
                      <td className="time-col">{minutesToHHMM(slotMin)}</td>

                      {DAYS.map(day => {
                        const cell = tableData[day][rowIdx];
                        if (cell === null) return <td key={day + '-' + rowIdx} />;
                        if (cell === 'occupied') return null;
                        const { entry, rowspan } = cell;
                        const colorIndex = (Math.abs(hashCode(entry.title || entry.id || day)) % 6) + 1;

                        // determine whether this session matches the selected course
                        const isSelectedCourse = selectedCourseId && (entry.courseId && String(entry.courseId) === String(selectedCourseId));

                        return (
                          <td
                            key={day + '-' + rowIdx}
                            rowSpan={rowspan}
                            className={`session-cell session-color-${colorIndex} ${isSelectedCourse ? 'session-selected' : ''}`}
                            onClick={() => onClickSession(entry)}
                            title={`${entry.title} ${entry.start}-${entry.end}`}
                          >
                            <div className="session-title">{entry.title}</div>
                            <div className="session-meta">{entry.start} - {entry.end} {entry.room ? `• ${entry.room}` : ''}</div>
                            {entry.section ? <div className="session-section">Sec {entry.section}</div> : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 text-muted small">
            Click a session to view details. Use Export CSV to download timetable.
          </div>
        </div>
      </div>
    </>
  );
}