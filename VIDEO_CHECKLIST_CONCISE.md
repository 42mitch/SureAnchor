# SureAnchor - Concise Video Demo Checklist
**Target Duration:** 8-10 minutes
**Focus:** Required IS 413 features ONLY

---

## Pre-Recording Checklist

- [ ] Test all 3 login credentials work
- [ ] Verify ML service is running and returning predictions
- [ ] Ensure database has sample data (residents, donors, donations)
- [ ] Clear browser cache/cookies
- [ ] Close unnecessary tabs and notifications
- [ ] Set browser zoom to 100%
- [ ] Prepare script and practice once

---

## Video Structure & Timing

### INTRO (30 seconds)
**What to say:**
- "This is SureAnchor, a safe house management system with ML-powered insights"
- "I'll demonstrate authentication, database operations, machine learning, and security features"
- "URL: zealous-tree-029394910.6.azurestaticapps.net"

**What to show:**
- Landing page briefly
- Quick navigation through public pages (Impact, Privacy)

---

### SECTION 1: Authentication & Authorization (1.5 minutes)

#### 1.1 Login as Donor (20 seconds)
**Actions:**
- Navigate to `/login`
- Enter: donor@sureanchor.org / SureAnchorDonor2025
- Click Login

**What to say:**
- "JWT-based authentication with role-based access control"

#### 1.2 Donor Portal Features (40 seconds)
**Show:**
- `/donor` - Donation history table
- Click "Make a Donation" button
- Fill out form (amount, campaign, notes)
- Submit successfully
- Show "My Impact" section

**What to say:**
- "Donors can view their giving history and make new donations"
- "Impact tracking shows how funds are allocated"

#### 1.3 Demonstrate RBAC (30 seconds)
**Actions:**
- Try to access `/admin/staff-accounts` (should redirect or show error)
- Log out

**What to say:**
- "Role-based security prevents donors from accessing admin pages"

---

### SECTION 2: Staff Role & Database Operations (2 minutes)

#### 2.1 Login as Staff (15 seconds)
**Actions:**
- Login with staff@sureanchor.org / SureAnchorStaff2025
- Navigate to `/admin`

#### 2.2 Dashboard Overview (20 seconds)
**Show:**
- Summary statistics (residents, donations, safehouses)
- Quick scroll through dashboard sections

**What to say:**
- "Admin dashboard provides overview of all operations"

#### 2.3 Resident CRUD Operations (45 seconds)
**Actions:**
- Navigate to `/admin/caseload`
- Click on a resident to view profile (`/admin/resident/:id`)
- Show resident details (personal info, education, health, interventions)
- Edit a field (e.g., update education progress)
- Save changes

**What to say:**
- "Full CRUD operations for residents using Entity Framework Core"
- "Resident profiles track education, health, and intervention plans"

#### 2.4 Donor Management (30 seconds)
**Actions:**
- Navigate to `/admin/donors`
- View donor list
- Click "Add Donor" or edit existing
- Show form fields
- Cancel (don't actually create to save time)

**What to say:**
- "Staff can manage donor relationships and track contributions"

#### 2.5 Demonstrate Staff Restrictions (10 seconds)
**Actions:**
- Try to access `/admin/staff-accounts` (should be denied)

**What to say:**
- "Staff role has limited access - cannot manage other staff accounts"

---

### SECTION 3: Admin Role & Machine Learning (3.5 minutes)

#### 3.1 Login as Admin (15 seconds)
**Actions:**
- Log out and login as admin@sureanchor.org / SureAnchorAdmin2025
- Navigate to `/admin`

#### 3.2 ML Feature 1: Donor Churn Prediction (1 minute)
**Actions:**
- Scroll to "ML-Powered Insights" section
- Show "Churn Risk Predictions" panel
- Point out:
  - Donor names
  - Churn probability percentages
  - Risk tiers (Critical, High, Medium, Low)
  - Recommended actions

**What to say:**
- "First ML model: Donor churn prediction using logistic regression"
- "Identifies at-risk donors with probability scores and actionable recommendations"
- "This helps prioritize donor retention efforts"

#### 3.3 ML Feature 2: Campaign Performance Scoring (1 minute)
**Actions:**
- Show "Campaign Performance Scorecard" panel
- Point out:
  - Campaign names
  - Performance scores/probabilities
  - Total donations and value
  - Rankings

**What to say:**
- "Second ML model: Campaign performance prediction using random forest classifier"
- "Scores and ranks fundraising campaigns based on historical performance"
- "Helps optimize future fundraising strategies"

#### 3.4 ML Feature 3: Education Progress Prediction (1 minute)
**Actions:**
- Show "Education Progress Predictions" panel
- Point out:
  - Safehouse names
  - Predicted vs current education progress
  - Delta values (improvement/decline)

**What to say:**
- "Third ML model: Education outcome prediction using linear regression"
- "Predicts resident education progress by safehouse"
- "Identifies which safehouses need additional support"

#### 3.5 Admin-Only Features (30 seconds)
**Actions:**
- Navigate to `/admin/safety`
- Show incident reports briefly
- Navigate to `/admin/staff-accounts`
- Show staff management interface

**What to say:**
- "Admin-only access to safety monitoring and staff account management"
- "Demonstrates hierarchical role-based authorization"

---

### SECTION 4: Additional Database Features (1.5 minutes)

#### 4.1 Process Recordings (30 seconds)
**Actions:**
- Navigate to `/admin/process-recording`
- Show recording list
- Click on a recording to view details

**What to say:**
- "Process recordings allow social workers to document client interactions"

#### 4.2 Visitations (30 seconds)
**Actions:**
- Navigate to `/admin/visitations`
- Show visitation schedule
- Click "Schedule Visit" button
- Show form fields

**What to say:**
- "Visitation scheduling tracks home visits and family connections"

#### 4.3 Reports (30 seconds)
**Actions:**
- Navigate to `/admin/reports`
- Show report options
- Generate one report (e.g., donor summary)
- Display results

**What to say:**
- "Report generation provides insights from database aggregations"

---

### SECTION 5: Security Features (1 minute)

#### 5.1 Security Overview (30 seconds)
**Actions:**
- Open browser DevTools (Network tab)
- Show Authorization header with JWT token
- Navigate to `/privacy`
- Scroll through privacy policy

**What to say:**
- "Security features include:"
- "JWT authentication with HttpOnly cookies"
- "HTTPS enforcement via Azure Static Web Apps"
- "Input validation on frontend and backend"
- "Privacy policy and cookie consent (GDPR compliance)"

#### 5.2 Cookie Consent (15 seconds)
**Actions:**
- Show cookie consent banner (if visible)
- Or point out cookie icon in corner

**What to say:**
- "Cookie consent banner complies with privacy regulations"

#### 5.3 Input Validation (15 seconds)
**Actions:**
- Go to donation form
- Try to submit with invalid data (negative amount)
- Show validation error

**What to say:**
- "Form validation prevents invalid data submission"

---

### CLOSING (30 seconds)

**What to say:**
- "In summary, SureAnchor demonstrates:"
- "1. Secure authentication with role-based access control"
- "2. Full-stack C# backend with Entity Framework Core and SQL Server"
- "3. Three machine learning models for predictive insights"
- "4. OWASP security best practices including input validation, JWT auth, and HTTPS"
- "5. Professional React frontend with responsive design"
- "Thank you"

**Actions:**
- Navigate back to landing page
- End recording

---

## Backup Plan (If Features Are Broken)

### If ML Models Aren't Working:
- **Show the UI panels** and explain what they would display
- **Show the API endpoint** in Network tab (even if it errors)
- **Reference the backend code** (MLController.cs)
- **Explain the models**: churn prediction, campaign scoring, education prediction

### If Database Operations Fail:
- **Show the UI** and forms
- **Explain the intended functionality**
- **Show the backend controllers** (ResidentsController.cs, DonationsController.cs)

### If Authentication Fails:
- **Show the login page** and explain JWT implementation
- **Show the RequireAuth component** in code
- **Explain the role-based routing** in App.tsx

---

## Quick Reference: URLs to Visit

1. `/` - Landing page
2. `/login` - Login page
3. `/donor` - Donor portal (after donor login)
4. `/donor/my-account` - Donor account settings
5. `/admin` - Admin dashboard (ML insights here!)
6. `/admin/caseload` - Resident list
7. `/admin/resident/:id` - Resident profile (CRUD demo)
8. `/admin/donors` - Donor management
9. `/admin/process-recording` - Process recordings
10. `/admin/visitations` - Visitation scheduling
11. `/admin/reports` - Report generation
12. `/admin/safety` - Safety/incident reports (Admin only)
13. `/admin/staff-accounts` - Staff management (Admin only)
14. `/privacy` - Privacy policy

---

## Tips for a Great Demo

### DO:
- **Speak clearly and confidently**
- **Show features working in real-time**
- **Highlight the ML models prominently** (biggest differentiator)
- **Demonstrate role-based security** (switch between roles)
- **Keep a steady pace** (don't rush or drag)
- **Show actual data** being created/edited

### DON'T:
- **Don't apologize** for features that aren't working
- **Don't spend time on broken features** - skip them
- **Don't read from a script** - sound natural
- **Don't fumble with navigation** - practice first
- **Don't go over 10 minutes** - TAs will stop watching

---

## Recording Setup

### Screen Recording Settings:
- **Resolution:** 1920x1080 or 1280x720
- **Frame rate:** 30fps minimum
- **Audio:** Clear microphone, no background noise
- **Browser:** Full screen or maximized window (hide bookmarks bar)
- **Zoom:** 100% (not zoomed in or out)

### Tools:
- **macOS:** QuickTime, ScreenFlow, or OBS
- **Windows:** OBS, Camtasia, or built-in Game Bar
- **Online:** Loom, Screencast-O-Matic

### Before Hitting Record:
- [ ] Close all unnecessary tabs
- [ ] Turn off notifications
- [ ] Clear browser history/cache
- [ ] Have all login credentials ready
- [ ] Practice the flow once
- [ ] Take a deep breath

---

## Post-Recording Checklist

- [ ] Watch the full video
- [ ] Verify all required features were shown:
  - [ ] Authentication (login with multiple roles)
  - [ ] RBAC (role-based access demonstrated)
  - [ ] Database CRUD (at least 2 entity types)
  - [ ] All 3 ML models shown and explained
  - [ ] Security features mentioned (JWT, HTTPS, validation)
- [ ] Audio is clear throughout
- [ ] No awkward pauses longer than 3 seconds
- [ ] Total duration is 8-10 minutes
- [ ] Export in appropriate format (MP4 recommended)
- [ ] File size is under submission limit

---

## Final Pre-Submit Check

**Critical Features Demonstrated:**
- [ ] User login with JWT authentication
- [ ] Role-based authorization (3 different roles)
- [ ] Database operations (C# + Entity Framework Core)
- [ ] CREATE operation (add resident/donor/donation)
- [ ] READ operation (view lists and profiles)
- [ ] UPDATE operation (edit resident/profile)
- [ ] DELETE operation (optional - can skip if time constrained)
- [ ] ML Model 1: Donor churn prediction
- [ ] ML Model 2: Campaign performance scoring
- [ ] ML Model 3: Education progress prediction
- [ ] Security: HTTPS, input validation, JWT auth
- [ ] Professional UI with responsive design

**If you demonstrated all of the above in under 10 minutes, you're ready to submit!**

---

## Emergency Contact & Resources

**Deployment URL:** https://zealous-tree-029394910.6.azurestaticapps.net/

**Test Accounts:**
- Admin: admin@sureanchor.org / SureAnchorAdmin2025
- Staff: staff@sureanchor.org / SureAnchorStaff2025
- Donor: donor@sureanchor.org / SureAnchorDonor2025

**Repository Structure:**
- `/frontend` - React + TypeScript + Vite
- `/backend` - C# ASP.NET Core + Entity Framework
- `/ml-service` - Python Flask ML API

**Key Files to Reference:**
- `frontend/src/App.tsx` - Routing and RBAC
- `frontend/src/pages/AdminDashboard.tsx` - ML integration display
- `backend/Controllers/MLController.cs` - ML API endpoints
- `backend/Controllers/AuthController.cs` - Authentication logic
- `backend/Controllers/ResidentsController.cs` - CRUD example

Good luck with your recording!
