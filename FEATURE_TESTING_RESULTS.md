# SureAnchor Feature Testing Results
**Deployment URL:** https://zealous-tree-029394910.6.azurestaticapps.net/
**Test Date:** April 9, 2026
**Tester:** Development Team

---

## Test Credentials

### Admin Account
- **Email:** admin@sureanchor.org
- **Password:** SureAnchorAdmin2025
- **Access:** Full system access

### Staff Account
- **Email:** staff@sureanchor.org
- **Password:** SureAnchorStaff2025
- **Access:** Staff-level features (no staff management or safety features)

### Donor Account
- **Email:** donor@sureanchor.org
- **Password:** SureAnchorDonor2025
- **Access:** Donor portal only

---

## IS 413 Required Features Checklist

### 1. AUTHENTICATION & AUTHORIZATION
**Role-Based Access Control (RBAC)**

| Feature | Expected Behavior | Test Status | Notes |
|---------|------------------|-------------|-------|
| Login system | Users can log in with email/password | NEEDS TEST | JWT token authentication |
| Registration | New donors can register | NEEDS TEST | Self-registration for donors only |
| Role enforcement | Admin/Staff/Donor roles properly restricted | NEEDS TEST | Check page access for each role |
| Session management | Token persists across refreshes | NEEDS TEST | Check localStorage/sessionStorage |
| Logout | Users can log out and token is cleared | NEEDS TEST | Verify redirect to login |

**Routes to Test:**
- `/login` - Login page (public)
- `/register` - Registration page (public)
- `/admin/*` - Admin/Staff only
- `/donor/*` - Donor only

---

### 2. DATABASE INTEGRATION (C# Backend)
**Entity Framework Core with SQL Server**

| Feature | Expected Behavior | Test Status | Notes |
|---------|------------------|-------------|-------|
| Resident CRUD | Create, read, update residents | NEEDS TEST | Admin Dashboard, Caseload page |
| Donations CRUD | Create, read, update donations | NEEDS TEST | Donors page, Donor portal |
| Safehouses CRUD | Create, read, update safehouses | NEEDS TEST | Admin Dashboard |
| Users CRUD | Manage staff accounts | NEEDS TEST | Staff Accounts page (admin only) |
| Process recordings CRUD | Upload, view recordings | NEEDS TEST | Process Recording page |
| Visitations CRUD | Schedule, view visits | NEEDS TEST | Visitations page |
| Reports | Generate reports from DB | NEEDS TEST | Reports page |

**Key Pages to Test:**
- `/admin` - Admin Dashboard (view residents, donations, safehouses)
- `/admin/caseload` - Resident management
- `/admin/donors` - Donor management
- `/admin/staff-accounts` - Staff management (Admin only)
- `/admin/process-recording` - Process recordings
- `/admin/visitations` - Visitation scheduling
- `/admin/reports` - Report generation
- `/admin/resident/:id` - Resident profile with full CRUD

---

### 3. MACHINE LEARNING INTEGRATION
**Three ML Models (Python/Flask service)**

| ML Feature | Expected Behavior | Test Status | Notes |
|-----------|------------------|-------------|-------|
| **Donor Churn Prediction** | Predict which donors are likely to stop giving | NEEDS TEST | Admin Dashboard - ML Insights section |
| **Campaign Performance** | Score and rank fundraising campaigns | NEEDS TEST | Admin Dashboard - ML Insights section |
| **Education Progress Prediction** | Predict resident education outcomes by safehouse | NEEDS TEST | Admin Dashboard - ML Insights section |

**Testing Steps:**
1. Log in as Admin
2. Navigate to Admin Dashboard (`/admin`)
3. Scroll to "ML-Powered Insights" section
4. Verify all three models show predictions:
   - Churn Risk: List of at-risk donors with probability scores
   - Campaign Scorecard: Ranked campaigns with performance predictions
   - Education Predictions: Safehouse predictions with delta values

**Expected API Endpoints:**
- `GET /api/ml/churn-predictions` - Donor churn analysis
- `GET /api/ml/campaign-performance` - Campaign scoring
- `GET /api/ml/education-predictions` - Education progress predictions

---

### 4. SECURITY FEATURES
**OWASP Best Practices**

| Security Feature | Implementation | Test Status | Notes |
|-----------------|----------------|-------------|-------|
| **Authentication** | JWT tokens with HttpOnly cookies | NEEDS TEST | Check Network tab for auth headers |
| **Authorization** | Role-based middleware (RequireAuth) | NEEDS TEST | Try accessing admin pages as donor |
| **Input validation** | Frontend + backend validation | NEEDS TEST | Test forms with invalid data |
| **SQL injection prevention** | Parameterized queries (EF Core) | REVIEW CODE | ORM handles this automatically |
| **XSS prevention** | React auto-escaping + CSP headers | REVIEW CODE | React handles by default |
| **CSRF protection** | SameSite cookies + token validation | NEEDS TEST | Check cookie settings |
| **Password security** | Hashed with BCrypt/PBKDF2 | REVIEW CODE | Backend password hashing |
| **HTTPS enforcement** | Azure Static Web Apps (TLS) | VERIFIED | Deployment uses HTTPS |
| **Data privacy** | Privacy policy + cookie consent | NEEDS TEST | Check `/privacy` and cookie banner |

**Security Testing:**
1. **Authorization bypass test**: Log in as Donor, try to access `/admin/staff-accounts` (should be denied)
2. **Input validation**: Submit donation form with negative amount (should reject)
3. **Session security**: Log out and try to access protected page (should redirect to login)
4. **Cookie consent**: Check that cookie banner appears and persists preference

---

### 5. USER INTERFACE & EXPERIENCE

| Feature | Expected Behavior | Test Status | Notes |
|---------|------------------|-------------|-------|
| **Responsive design** | Works on desktop, tablet, mobile | NEEDS TEST | Test at different screen sizes |
| **Navigation** | Intuitive menu structure | NEEDS TEST | Check all nav links work |
| **Forms** | Clear validation messages | NEEDS TEST | Test all forms |
| **Loading states** | Show spinners during API calls | NEEDS TEST | Check network throttling |
| **Error handling** | Friendly error messages | NEEDS TEST | Test with network offline |
| **Data visualization** | Charts/graphs render correctly | NEEDS TEST | Admin Dashboard has charts |
| **Accessibility** | Keyboard navigation, ARIA labels | NEEDS TEST | Tab through pages |

**UI Pages to Test:**
- `/` - Landing page (public)
- `/impact` - Impact page (public)
- `/privacy` - Privacy policy (public)
- `/contact` - Contact form (public)
- `/donor` - Donor portal dashboard
- `/donor/my-account` - Donor account management
- `/admin/my-account` - Staff/Admin account management

---

### 6. DONOR PORTAL FEATURES

| Feature | Expected Behavior | Test Status | Notes |
|---------|------------------|-------------|-------|
| Donation history | View all past donations | NEEDS TEST | `/donor` page |
| Make new donation | Create cash donations with amount/campaign | NEEDS TEST | Donation form on portal |
| Impact tracking | See how donations were allocated | NEEDS TEST | Impact allocations display |
| Account management | Update personal information | NEEDS TEST | `/donor/my-account` |
| Recurring donations | Support for recurring gifts | NEEDS TEST | Check donation type flag |

---

### 7. ADMIN/STAFF FEATURES

| Feature | Expected Behavior | Test Status | Notes |
|---------|------------------|-------------|-------|
| **Dashboard overview** | Summary stats, charts, quick actions | NEEDS TEST | `/admin` - main dashboard |
| **Resident management** | Full resident profiles with history | NEEDS TEST | `/admin/resident/:id` |
| **Caseload view** | List all residents with filtering | NEEDS TEST | `/admin/caseload` |
| **Donor management** | View, add, edit donors | NEEDS TEST | `/admin/donors` |
| **Visitation scheduling** | Schedule and track home visits | NEEDS TEST | `/admin/visitations` |
| **Process recordings** | Upload and view social work recordings | NEEDS TEST | `/admin/process-recording` |
| **Report generation** | Generate various reports | NEEDS TEST | `/admin/reports` |
| **Safety monitoring** | View incident reports (Admin only) | NEEDS TEST | `/admin/safety` |
| **Staff account management** | Add/edit staff users (Admin only) | NEEDS TEST | `/admin/staff-accounts` |

---

## Critical Issues to Fix Before Recording

### HIGH PRIORITY
- [ ] **API connectivity**: Verify backend is running and API calls succeed
- [ ] **ML service availability**: Ensure Python ML service is deployed and accessible
- [ ] **Authentication flow**: Confirm all 3 test accounts can log in successfully
- [ ] **Data seeded**: Ensure database has sample residents, donors, donations, etc.

### MEDIUM PRIORITY
- [ ] **Charts rendering**: Verify all Recharts components display data
- [ ] **Forms functioning**: All CRUD forms work without errors
- [ ] **Navigation**: All menu links go to correct pages
- [ ] **Role restrictions**: Verify RBAC prevents unauthorized access

### LOW PRIORITY
- [ ] **Styling consistency**: Check for visual bugs or misaligned elements
- [ ] **Loading states**: Verify spinners appear during async operations
- [ ] **Responsive design**: Test on different screen sizes

---

## Testing Procedure

### Pre-Test Setup
1. Open deployed site: https://zealous-tree-029394910.6.azurestaticapps.net/
2. Open browser DevTools (Network and Console tabs)
3. Clear cache and cookies
4. Prepare test credentials

### Test Sequence (by Role)

#### PUBLIC USER (No Login)
1. Visit landing page `/`
2. Check navigation links
3. Visit `/impact`, `/privacy`, `/contact`
4. Verify cookie consent banner appears

#### DONOR ROLE
1. Log in with donor credentials
2. Navigate to `/donor` portal
3. View donation history
4. Create new donation (test form validation)
5. View impact allocations
6. Navigate to `/donor/my-account`
7. Update account information
8. Log out

#### STAFF ROLE
1. Log in with staff credentials
2. Navigate to `/admin` dashboard
3. View all dashboard sections
4. Navigate to `/admin/caseload` - view residents
5. Navigate to `/admin/donors` - view donors
6. Navigate to `/admin/process-recording` - view recordings
7. Navigate to `/admin/visitations` - view visitations
8. Navigate to `/admin/reports` - generate report
9. Try to access `/admin/safety` (should be denied - Admin only)
10. Try to access `/admin/staff-accounts` (should be denied - Admin only)
11. Log out

#### ADMIN ROLE
1. Log in with admin credentials
2. Navigate to `/admin` dashboard
3. **Test ML features**: Verify all 3 ML models show predictions
4. Navigate to `/admin/caseload` - add/edit resident
5. Click on a resident to view `/admin/resident/:id` profile
6. Navigate to `/admin/donors` - add/edit donor
7. Navigate to `/admin/safety` (Admin only)
8. Navigate to `/admin/staff-accounts` (Admin only) - add/edit staff
9. Navigate to `/admin/my-account` - update admin profile
10. Log out

---

## Test Results Summary

**Date Tested:** _________________
**Tested By:** _________________

| Category | Features Working | Features Broken | Notes |
|----------|-----------------|-----------------|-------|
| Authentication | ___/5 | ___ | |
| Database CRUD | ___/7 | ___ | |
| ML Integration | ___/3 | ___ | |
| Security | ___/9 | ___ | |
| UI/UX | ___/7 | ___ | |
| Donor Portal | ___/5 | ___ | |
| Admin/Staff | ___/9 | ___ | |

**Total Features:** 45
**Working:** ___
**Broken:** ___
**Success Rate:** ___%

---

## Notes for Video Recording

### What to Emphasize
1. **Role-based security** - Show that different roles have different access
2. **ML integration** - Demonstrate all 3 ML models with live predictions
3. **Full CRUD operations** - Show creating, editing, and viewing data
4. **Professional UI** - Highlight clean design and user experience
5. **Database integration** - Show real data being fetched and updated

### Common Pitfalls to Avoid
- Don't waste time on features that aren't working
- Don't navigate to broken pages during recording
- Have test data ready beforehand
- Practice the flow before recording
- Keep video focused on required features only

---

## Recommendations

### Before Recording
1. **Run full test suite** using the testing procedure above
2. **Document all broken features** and decide whether to fix or skip
3. **Prepare test data** (create sample residents, donations, etc.)
4. **Practice the demo flow** to stay within time limit
5. **Ensure ML service is running** and returning predictions

### During Recording
1. **Start with login** to establish authentication
2. **Show role-based access** by switching between accounts
3. **Demonstrate ML features** prominently (this is a key differentiator)
4. **Show CRUD operations** for at least 2-3 entity types
5. **Keep it concise** - only show required features

### After Recording
1. **Review the video** to ensure all required features are demonstrated
2. **Verify audio quality** and screen clarity
3. **Check timing** - should be 8-10 minutes maximum
4. **Add captions or timestamps** if needed
