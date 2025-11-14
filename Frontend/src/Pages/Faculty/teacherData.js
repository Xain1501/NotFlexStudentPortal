// demo teacher data (same shape used in previous static demo)
const teacherData = {
  id: 'T2025-09',
  name: 'Dr. Aisha Khan',
  department: 'Computer Science',
  contact: '03001234567',
  email: 'aisha.khan@uni.edu',
  education: {
    bachelor: 'BS Computer Science (ABC University)',
    master: 'MS Software Engineering (XYZ University)',
    phd: 'PhD Computer Science (In progress)'
  },
  
  courses: [
    {
      id: 'CS301-A',
      code: 'CS301',
      name: 'Data Structures',
      section: 'A',
      students: [
        { roll: '23k-001', name: 'Madiha Aslam' },
        { roll: '23k-002', name: 'Ali Raza' },
        { roll: '23k-003', name: 'Sara Khan' }
      ]
    },
    {
      id: 'CS302-B',
      code: 'CS302',
      name: 'Operating Systems',
      section: 'B',
      students: [
        { roll: '23k-010', name: 'Omar Farooq' },
        { roll: '23k-011', name: 'Hira Imran' }
      ]
    }
  ],
  
  leaves: [],
  attendanceRecords: [],
  marksRecords: []
};

export default teacherData;