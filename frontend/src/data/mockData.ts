// ─── Residents ────────────────────────────────────────────────────────────────
export const residents = [
  { id: 'C0042', caseNo: 'SA-2024-042', safehouse: 'SH-01', age: 17, category: 'Sexual Abuse', risk: 'High', status: 'Active', worker: 'Maria Santos', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'High School', dateAdmitted: '2024-03-12' }, recentNote: 'Client showed significant progress in group sessions. Engaging more with peers and expressing emotions constructively. Nightmares frequency decreased from nightly to 2x/week.' },
  { id: 'C0051', caseNo: 'SA-2024-051', safehouse: 'SH-01', age: 14, category: 'Sex Trafficking', risk: 'Critical', status: 'Active', worker: 'Ana Reyes', demographics: { civilStatus: 'Single', religion: 'Christian', educationLevel: 'Elementary', dateAdmitted: '2024-05-02' }, recentNote: 'Client remains highly guarded. Trauma response triggered by male staff presence. Recommend continued one-on-one sessions with female counselors only.' },
  { id: 'C0039', caseNo: 'SA-2024-039', safehouse: 'SH-02', age: 19, category: 'Sexual Abuse', risk: 'Medium', status: 'Active', worker: 'Rosa Cruz', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'College', dateAdmitted: '2024-02-20' }, recentNote: 'Making excellent progress. Enrolled in online college classes. Showing strong resilience and motivation for reintegration.' },
  { id: 'C0058', caseNo: 'SA-2024-058', safehouse: 'SH-02', age: 16, category: 'Sex Trafficking', risk: 'High', status: 'Active', worker: 'Maria Santos', demographics: { civilStatus: 'Single', religion: 'None stated', educationLevel: 'High School', dateAdmitted: '2024-06-15' }, recentNote: 'Client disclosed additional perpetrators in session. Legal team notified. Showing bravery in cooperating with investigation.' },
  { id: 'C0033', caseNo: 'SA-2024-033', safehouse: 'SH-03', age: 21, category: 'Sexual Abuse', risk: 'Low', status: 'Reintegrating', worker: 'Joy Mendoza', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'Vocational', dateAdmitted: '2023-11-08' }, recentNote: 'Ready for supervised family reintegration. Weekly check-in calls scheduled. Found part-time employment at a local bakery.' },
  { id: 'C0061', caseNo: 'SA-2024-061', safehouse: 'SH-03', age: 15, category: 'Sexual Abuse', risk: 'Critical', status: 'Active', worker: 'Ana Reyes', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'High School', dateAdmitted: '2024-07-01' }, recentNote: 'New admission. Initial trauma assessment completed. High dissociation episodes noted. Art therapy initiated as primary intervention.' },
  { id: 'C0047', caseNo: 'SA-2024-047', safehouse: 'SH-03', age: 18, category: 'Sex Trafficking', risk: 'Medium', status: 'Active', worker: 'Rosa Cruz', demographics: { civilStatus: 'Single', religion: 'Muslim', educationLevel: 'High School', dateAdmitted: '2024-04-10' }, recentNote: 'Cultural liaison arranged for spiritual support. Communication with distant family reestablished. Appetite and sleep improving.' },
  { id: 'C0029', caseNo: 'SA-2023-029', safehouse: 'SH-04', age: 22, category: 'Sexual Abuse', risk: 'Low', status: 'Aftercare', worker: 'Joy Mendoza', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'College', dateAdmitted: '2023-06-14' }, recentNote: 'Transitioned to aftercare program. Living independently. Attending college full-time. Monthly check-ins ongoing.' },
  { id: 'C0054', caseNo: 'SA-2024-054', safehouse: 'SH-04', age: 17, category: 'Sex Trafficking', risk: 'High', status: 'Active', worker: 'Maria Santos', demographics: { civilStatus: 'Single', religion: 'Christian', educationLevel: 'High School', dateAdmitted: '2024-05-28' }, recentNote: 'Expressed interest in vocational training in beauty services. Coordinator exploring scholarship options.' },
  { id: 'C0066', caseNo: 'SA-2024-066', safehouse: 'SH-01', age: 13, category: 'Sexual Abuse', risk: 'Critical', status: 'Active', worker: 'Ana Reyes', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'Elementary', dateAdmitted: '2024-07-15' }, recentNote: 'Recent admission following rescue operation. Medical clearance completed. Stabilization phase ongoing. No family contact authorized per court order.' },
  { id: 'C0044', caseNo: 'SA-2024-044', safehouse: 'SH-02', age: 20, category: 'Sexual Abuse', risk: 'Medium', status: 'Active', worker: 'Rosa Cruz', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'College', dateAdmitted: '2024-03-25' }, recentNote: 'Pursuing college degree online. Peer mentoring role in group sessions showing positive impact on self-efficacy.' },
  { id: 'C0037', caseNo: 'SA-2024-037', safehouse: 'SH-04', age: 16, category: 'Sex Trafficking', risk: 'Medium', status: 'Reintegrating', worker: 'Joy Mendoza', demographics: { civilStatus: 'Single', religion: 'Catholic', educationLevel: 'High School', dateAdmitted: '2024-01-30' }, recentNote: 'Family assessment completed. Parents completed parenting seminar. Trial home visits commenced.' },
];

// ─── Session Notes ─────────────────────────────────────────────────────────────
export const sessionNotes = [
  { id: 'SN-001', date: '2024-07-18', resident: 'C0042', worker: 'Maria Santos', type: 'Individual', emotionalState: 'Hopeful', narrative: 'Client arrived on time, appeared more composed than previous sessions. Discussed progress in managing intrusive thoughts using grounding techniques. Opened up about aspirations to study nursing.', interventions: 'CBT grounding exercises, narrative therapy', followUp: 'Coordinate with education coordinator for enrollment options' },
  { id: 'SN-002', date: '2024-07-17', resident: 'C0051', worker: 'Ana Reyes', type: 'Individual', emotionalState: 'Anxious', narrative: 'Session held in comfort room per client request. Client disclosed a flashback triggered by a news program. Safety plan reviewed and updated. Trust-building exercises continued.', interventions: 'EMDR introduction, safety planning', followUp: 'Brief staff on updated triggers list' },
  { id: 'SN-003', date: '2024-07-16', resident: 'C0039', worker: 'Rosa Cruz', type: 'Group', emotionalState: 'Calm', narrative: 'Client participated actively in group discussion on healthy relationships. Shared her experience in a way that encouraged two quieter members to speak. Leadership qualities emerging.', interventions: 'Psychoeducation on healthy relationships, peer support facilitation', followUp: 'Consider peer mentor role in next quarter' },
  { id: 'SN-004', date: '2024-07-15', resident: 'C0058', worker: 'Maria Santos', type: 'Individual', emotionalState: 'Distressed', narrative: 'Client visibly distressed at session start. De-escalation techniques applied for first 15 minutes. Once settled, client expressed fear about upcoming court testimony. Emotional support provided.', interventions: 'Crisis de-escalation, court preparation psychoeducation', followUp: 'Coordinate with legal advocate before testimony date' },
  { id: 'SN-005', date: '2024-07-14', resident: 'C0033', worker: 'Joy Mendoza', type: 'Individual', emotionalState: 'Hopeful', narrative: 'Pre-reintegration session. Client articulated a clear 6-month plan including work, savings goals, and continuing therapy. Demonstrated strong insight into her triggers and coping strategies.', interventions: 'Reintegration planning, strengths-based approach', followUp: 'Schedule family meeting for Week 2 of August' },
  { id: 'SN-006', date: '2024-07-13', resident: 'C0047', worker: 'Rosa Cruz', type: 'Group', emotionalState: 'Calm', narrative: 'Multi-faith group session facilitated with cultural sensitivity. Client engaged meaningfully in reflection exercises. Expressed that her faith is a source of strength, not shame.', interventions: 'Faith-integrated therapy, cultural affirmation', followUp: 'Arrange visit from community imam if client agrees' },
  { id: 'SN-007', date: '2024-07-12', resident: 'C0044', worker: 'Rosa Cruz', type: 'Individual', emotionalState: 'Reflective', narrative: 'Client shared a poem she wrote as part of her journaling homework. Poem demonstrated processing of grief and emerging hope. Significant therapeutic breakthrough noted.', interventions: 'Expressive arts therapy, journaling review', followUp: 'Explore creative writing as ongoing therapeutic tool' },
  { id: 'SN-008', date: '2024-07-11', resident: 'C0066', worker: 'Ana Reyes', type: 'Individual', emotionalState: 'Withdrawn', narrative: 'First formal session since admission. Client communicated primarily through drawing. Art therapy materials left accessible throughout. No pressure applied — presence and safety emphasized.', interventions: 'Art therapy, silent supportive presence, trauma-informed observation', followUp: 'Daily 15-min check-ins, no formal sessions until client initiates' },
];

// ─── Donors ────────────────────────────────────────────────────────────────────
export const donors = [
  { id: 1, name: 'Marisol Foundation', type: 'Monetary Donor', status: 'Active', total: 485000, lastDonation: '2024-07-10', trend: [12000, 15000, 18000, 14000, 20000, 22000, 19000, 25000, 21000, 28000, 24000, 30000] },
  { id: 2, name: 'Emmanuel & Grace Villanueva', type: 'Monetary Donor', status: 'Active', total: 210000, lastDonation: '2024-07-01', trend: [8000, 8000, 10000, 9000, 11000, 10000, 12000, 11000, 13000, 14000, 12000, 15000] },
  { id: 3, name: 'BPI Foundation', type: 'Monetary Donor', status: 'Active', total: 150000, lastDonation: '2024-06-30', trend: [0, 0, 50000, 0, 0, 50000, 0, 0, 50000, 0, 0, 0] },
  { id: 4, name: 'Volunteers for Hope PH', type: 'Volunteer', status: 'Active', total: 0, lastDonation: '2024-07-18', trend: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 5, name: 'Liwayway Grocery Co.', type: 'In-Kind', status: 'Active', total: 85000, lastDonation: '2024-07-05', trend: [5000, 6000, 7000, 5000, 8000, 7000, 9000, 8000, 10000, 9000, 8000, 11000] },
  { id: 6, name: 'Dr. Corazon Manalo', type: 'Monetary Donor', status: 'Active', total: 120000, lastDonation: '2024-06-15', trend: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000] },
  { id: 7, name: 'SM Cares', type: 'In-Kind', status: 'Inactive', total: 45000, lastDonation: '2024-02-28', trend: [5000, 5000, 5000, 10000, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 8, name: 'Renewed Hope Church', type: 'Monetary Donor', status: 'Active', total: 95000, lastDonation: '2024-07-14', trend: [7000, 7000, 7500, 8000, 7500, 8000, 8500, 8000, 9000, 8500, 9000, 9000] },
  { id: 9, name: 'Luz dela Cruz', type: 'Monetary Donor', status: 'Inactive', total: 25000, lastDonation: '2024-03-01', trend: [5000, 5000, 5000, 5000, 5000, 0, 0, 0, 0, 0, 0, 0] },
  { id: 10, name: 'Tech4Good Philippines', type: 'Volunteer', status: 'Active', total: 0, lastDonation: '2024-07-17', trend: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1] },
];

// ─── Home Visitations ──────────────────────────────────────────────────────────
export const visitations = [
  { id: 'HV-001', date: '2024-07-17', resident: 'C0033', worker: 'Joy Mendoza', visitType: 'Pre-Reintegration', familyCooperation: 'High', safetyConcern: false, outcome: 'Positive' },
  { id: 'HV-002', date: '2024-07-15', resident: 'C0037', worker: 'Joy Mendoza', visitType: 'Trial Home Visit', familyCooperation: 'Moderate', safetyConcern: false, outcome: 'Positive' },
  { id: 'HV-003', date: '2024-07-14', resident: 'C0058', worker: 'Maria Santos', visitType: 'Safety Assessment', familyCooperation: 'Low', safetyConcern: true, outcome: 'Concerns Raised' },
  { id: 'HV-004', date: '2024-07-12', resident: 'C0047', worker: 'Rosa Cruz', visitType: 'Family Counseling', familyCooperation: 'Moderate', safetyConcern: false, outcome: 'Ongoing' },
  { id: 'HV-005', date: '2024-07-10', resident: 'C0029', worker: 'Joy Mendoza', visitType: 'Aftercare Check-in', familyCooperation: 'High', safetyConcern: false, outcome: 'Positive' },
  { id: 'HV-006', date: '2024-07-08', resident: 'C0039', worker: 'Rosa Cruz', visitType: 'Pre-Reintegration', familyCooperation: 'High', safetyConcern: false, outcome: 'Positive' },
  { id: 'HV-007', date: '2024-07-05', resident: 'C0054', worker: 'Maria Santos', visitType: 'Safety Assessment', familyCooperation: 'Low', safetyConcern: true, outcome: 'Hold Recommended' },
  { id: 'HV-008', date: '2024-07-03', resident: 'C0044', worker: 'Rosa Cruz', visitType: 'Family Counseling', familyCooperation: 'Moderate', safetyConcern: false, outcome: 'Ongoing' },
];

// ─── Activity Feed ─────────────────────────────────────────────────────────────
export const activityFeed = [
  { id: 1, time: '2 hours ago', icon: 'user-plus', text: 'New resident admitted to SH-03', sub: 'Case C0066 — Initial assessment scheduled' },
  { id: 2, time: '5 hours ago', icon: 'heart', text: 'Donation received from anonymous donor', sub: '₱25,000 — General fund' },
  { id: 3, time: '1 day ago', icon: 'file-text', text: 'Session note submitted for C0042', sub: 'Worker: Maria Santos — Individual session' },
  { id: 4, time: '1 day ago', icon: 'calendar', text: 'Case conference scheduled', sub: 'SH-01 residents — July 22, 2024 at 9:00 AM' },
  { id: 5, time: '2 days ago', icon: 'home', text: 'Home visitation completed', sub: 'C0033 — Pre-reintegration visit: Positive outcome' },
];

// ─── Charts: Monthly Girls Served ─────────────────────────────────────────────
export const monthlyServed = [
  { month: 'Aug', served: 38 }, { month: 'Sep', served: 41 }, { month: 'Oct', served: 43 },
  { month: 'Nov', served: 40 }, { month: 'Dec', served: 39 }, { month: 'Jan', served: 42 },
  { month: 'Feb', served: 44 }, { month: 'Mar', served: 45 }, { month: 'Apr', served: 43 },
  { month: 'May', served: 46 }, { month: 'Jun', served: 47 }, { month: 'Jul', served: 47 },
];

// ─── Charts: Donation Trends ───────────────────────────────────────────────────
export const donationTrend = [
  { month: 'Aug', amount: 185000 }, { month: 'Sep', amount: 210000 }, { month: 'Oct', amount: 198000 },
  { month: 'Nov', amount: 225000 }, { month: 'Dec', amount: 310000 }, { month: 'Jan', amount: 195000 },
  { month: 'Feb', amount: 220000 }, { month: 'Mar', amount: 245000 }, { month: 'Apr', amount: 230000 },
  { month: 'May', amount: 258000 }, { month: 'Jun', amount: 272000 }, { month: 'Jul', amount: 284500 },
];

// ─── Charts: Program Breakdown ─────────────────────────────────────────────────
export const programBreakdown = [
  { name: 'Wellbeing', value: 40, color: '#2D8F8A' },
  { name: 'Education', value: 35, color: '#1B3A5C' },
  { name: 'Operations', value: 25, color: '#D4A843' },
];

// ─── Safehouse Performance ─────────────────────────────────────────────────────
export const safehousePerformance = [
  { name: 'SH-01 — Bethany House', residents: 14, healthScore: 72, educationProgress: 68, incidents: 1 },
  { name: 'SH-02 — Miriam House', residents: 12, healthScore: 78, educationProgress: 74, incidents: 0 },
  { name: 'SH-03 — Ruth House', residents: 11, healthScore: 70, educationProgress: 65, incidents: 2 },
  { name: 'SH-04 — Esther House', residents: 10, healthScore: 82, educationProgress: 80, incidents: 0 },
];

// ─── Charts: Resident Outcomes ────────────────────────────────────────────────
export const residentOutcomes = [
  { safehouse: 'SH-01', health: 72, education: 68 },
  { safehouse: 'SH-02', health: 78, education: 74 },
  { safehouse: 'SH-03', health: 70, education: 65 },
  { safehouse: 'SH-04', health: 82, education: 80 },
];

// ─── Risk distribution ────────────────────────────────────────────────────────
export const riskDistribution = [
  { name: 'Low', value: 8, color: '#16a34a' },
  { name: 'Medium', value: 15, color: '#ca8a04' },
  { name: 'High', value: 16, color: '#ea580c' },
  { name: 'Critical', value: 8, color: '#dc2626' },
];
