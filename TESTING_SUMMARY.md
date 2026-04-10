# SureAnchor - Testing Summary & Critical Issues

**Deployment URL:** https://zealous-tree-029394910.6.azurestaticapps.net/
**Date:** April 9, 2026

---

## Testing Plan

Since I cannot directly test the deployed website through the WebFetch tool (it only returns minimal content), you need to manually test all features using the comprehensive guide I've created. Here's the priority order:

### PRIORITY 1: Critical Path Testing (DO THIS FIRST!)

These features MUST work for the video to be successful:

1. **Authentication**
   - [ ] Can log in with all 3 accounts (admin, staff, donor)
   - [ ] JWT token is stored and persists across page refreshes
   - [ ] Logout works and clears session

2. **Role-Based Access Control**
   - [ ] Donor cannot access `/admin/*` pages
   - [ ] Staff cannot access `/admin/staff-accounts` or `/admin/safety`
   - [ ] Admin can access all pages

3. **Machine Learning Models (HIGHEST PRIORITY!)**
   - [ ] Navigate to `/admin` as admin
   - [ ] Scroll to "ML-Powered Insights" section
   - [ ] Verify all 3 models display predictions:
     - **Donor Churn Prediction**: Shows at-risk donors with probabilities
     - **Campaign Performance Scorecard**: Shows ranked campaigns
     - **Education Progress Predictions**: Shows safehouse predictions
   - [ ] If ML models aren't working, this is your #1 issue to fix!

4. **Basic Database CRUD**
   - [ ] Can view resident list at `/admin/caseload`
   - [ ] Can click on a resident and view full profile
   - [ ] Can edit at least one field and save successfully
   - [ ] Changes persist after refresh

5. **Donor Portal**
   - [ ] Can view donation history
   - [ ] Can submit new donation through form
   - [ ] Form validation works (rejects invalid data)

---

### PRIORITY 2: Secondary Features

Test these if critical path works:

- [ ] Process recordings page loads and displays data
- [ ] Visitations page loads and displays data
- [ ] Reports page can generate at least one report
- [ ] Donor management page (add/edit donors)
- [ ] Staff accounts page (admin only)
- [ ] Safety page (admin only)
- [ ] My Account pages for all roles

---

### PRIORITY 3: Polish & UX

Test these if you have time:

- [ ] All charts and graphs render correctly
- [ ] Loading spinners appear during API calls
- [ ] Error messages are user-friendly
- [ ] Responsive design works on different screen sizes
- [ ] No console errors in browser DevTools
- [ ] Cookie consent banner appears and works

---

## Critical Issues to Check

### 1. Backend API Connectivity

**Test:**
- Open browser DevTools → Network tab
- Navigate to `/admin` dashboard
- Check for API calls to `/api/*` endpoints
- Verify responses return 200 status (not 404, 500, etc.)

**If API calls fail:**
- Backend may not be deployed or running
- CORS configuration may be incorrect
- Database connection may be broken
- Check Azure backend deployment status

**Critical endpoints to verify:**
- `GET /api/residents` - Resident list
- `GET /api/donations` - Donation list
- `GET /api/ml/churn-predictions` - ML churn model
- `GET /api/ml/campaign-performance` - ML campaign model
- `GET /api/ml/education-predictions` - ML education model
- `POST /api/auth/login` - Authentication

---

### 2. ML Service Availability

**Test:**
- Log in as admin
- Navigate to `/admin` dashboard
- Scroll to "ML-Powered Insights" section
- Check if all 3 panels show data or error messages

**Expected behavior:**
Each panel should show:
- List of predictions with data
- OR "ML service unavailable" message
- OR loading spinner

**If ML models show errors:**
- Python ML service may not be deployed
- ML service URL in backend configuration may be wrong
- ML models may not be trained or loaded
- Check Azure ML service deployment

**Quick fix if ML is broken:**
- You can still demonstrate the UI and explain what it would show
- Show the backend `MLController.cs` code
- Explain the three models and their purpose
- This is less ideal but still shows you built the integration

---

### 3. Database Seeding

**Test:**
- Navigate to `/admin/caseload` - should show residents
- Navigate to `/admin/donors` - should show donors
- Navigate to `/donor` portal - should show donation history

**If pages are empty:**
- Database may not have seed data
- Run database migrations and seeding script
- Manually add sample data through the UI

**Minimum data needed for good demo:**
- At least 5 residents (for caseload page)
- At least 5 donors (for ML churn predictions)
- At least 10 donations (for donor portal and ML models)
- At least 2 safehouses (for education predictions)
- At least 1 staff account (to demonstrate staff role)

---

### 4. Authentication Token Handling

**Test:**
- Log in and navigate to a protected page
- Refresh the browser
- Verify you're still logged in (not redirected to login page)

**If session doesn't persist:**
- JWT token may not be stored in localStorage
- Check `AuthContext.tsx` implementation
- Verify token is included in API request headers

**Also test:**
- Log out and try to access protected page (should redirect to login)
- Log in with wrong password (should show error)
- Try to access admin page as donor (should be denied)

---

### 5. Form Validation

**Test:**
- Donor portal: Try to submit donation with negative amount
- Donor portal: Try to submit donation with empty amount
- Resident edit: Try to save with invalid data

**Expected behavior:**
- Form should show validation error
- Submit button should be disabled or show error
- Backend should also reject invalid data

**If validation doesn't work:**
- Frontend validation may be missing
- Backend validation may not be implemented
- Users could submit bad data (security issue)

---

## Testing Checklist by Role

### As Public User (No Login)
- [ ] Landing page loads at `/`
- [ ] Can navigate to `/impact`
- [ ] Can navigate to `/privacy`
- [ ] Can navigate to `/contact`
- [ ] Cookie consent banner appears
- [ ] Can access `/login` and `/register` pages
- [ ] Cannot access `/admin/*` or `/donor/*` without login

### As Donor (donor@sureanchor.org)
- [ ] Can log in successfully
- [ ] Redirected to `/donor` portal
- [ ] Can view donation history table
- [ ] Can click "Make a Donation"
- [ ] Can fill out and submit donation form
- [ ] Can see "My Impact" allocations
- [ ] Can navigate to `/donor/my-account`
- [ ] Cannot access `/admin/*` pages (should redirect or error)
- [ ] Can log out

### As Staff (staff@sureanchor.org)
- [ ] Can log in successfully
- [ ] Can access `/admin` dashboard
- [ ] Can view dashboard stats and charts
- [ ] Can navigate to `/admin/caseload`
- [ ] Can view resident list
- [ ] Can click on resident and view full profile
- [ ] Can edit resident data and save
- [ ] Can navigate to `/admin/donors`
- [ ] Can navigate to `/admin/process-recording`
- [ ] Can navigate to `/admin/visitations`
- [ ] Can navigate to `/admin/reports`
- [ ] Cannot access `/admin/safety` (admin only)
- [ ] Cannot access `/admin/staff-accounts` (admin only)
- [ ] Can navigate to `/admin/my-account`
- [ ] Can log out

### As Admin (admin@sureanchor.org)
- [ ] Can log in successfully
- [ ] Can access `/admin` dashboard
- [ ] **ML Insights section displays all 3 models with data**
- [ ] Can access `/admin/caseload`
- [ ] Can perform full CRUD on residents
- [ ] Can access `/admin/donors`
- [ ] Can access `/admin/safety` (admin only)
- [ ] Can access `/admin/staff-accounts` (admin only)
- [ ] Can add/edit staff accounts
- [ ] Can access `/admin/process-recording`
- [ ] Can access `/admin/visitations`
- [ ] Can access `/admin/reports`
- [ ] Can navigate to `/admin/my-account`
- [ ] Can log out

---

## What to Do If Features Are Broken

### If ML Models Don't Work
**Option 1 (Preferred):** Fix the ML service
- Check Python ML service deployment
- Verify backend can reach ML service URL
- Check ML service logs for errors
- Test ML endpoints directly with Postman/curl

**Option 2 (Workaround):** Explain what it would show
- Show the UI panels (even if empty)
- Show the backend `MLController.cs` code
- Explain each model's purpose and algorithm
- Show sample predictions in a screenshot or mockup
- This proves you built the integration, even if service is down

### If Database CRUD Doesn't Work
**Option 1 (Preferred):** Fix the database connection
- Check connection string in backend
- Verify database is deployed and accessible
- Run migrations to ensure schema is correct
- Seed data if database is empty

**Option 2 (Workaround):** Show the code
- Show the forms and UI
- Show the backend controllers (ResidentsController.cs, etc.)
- Explain how Entity Framework handles CRUD
- Walk through the code instead of live demo

### If Authentication Doesn't Work
**Option 1 (Preferred):** Fix authentication
- Check JWT configuration in backend
- Verify CORS settings allow frontend
- Check AuthContext implementation
- Test login endpoint directly

**Option 2 (Workaround):** Not recommended
- Authentication is too critical to skip
- Must at least show login page and explain implementation
- Show AuthController.cs code
- Show RequireAuth component code

---

## Pre-Recording Verification Script

Run through this checklist 30 minutes before recording:

1. **Open deployed site in private/incognito window**
2. **Test login with all 3 accounts**
   - donor@sureanchor.org / SureAnchorDonor2025
   - staff@sureanchor.org / SureAnchorStaff2025
   - admin@sureanchor.org / SureAnchorAdmin2025
3. **As Admin, check ML models on dashboard**
   - If broken, decide: fix or explain in video?
4. **As Staff, test editing a resident**
   - If broken, decide: fix or skip?
5. **As Donor, test making a donation**
   - If broken, decide: fix or skip?
6. **Check browser console for errors**
   - Clear any red errors before recording
7. **Test all pages in video script load without errors**
8. **Clear browser cache and cookies**
9. **Practice the full demo once**
10. **Start recording!**

---

## Recommended Testing Order

1. **Start with authentication** (most critical)
2. **Test ML models** (highest value feature)
3. **Test basic CRUD** (required functionality)
4. **Test RBAC** (security requirement)
5. **Test other features** (nice to have)

---

## How to Test Features Manually

Since I cannot access the deployed site directly, here's how YOU should test:

### Testing Authentication:
1. Open https://zealous-tree-029394910.6.azurestaticapps.net/login
2. Enter: donor@sureanchor.org / SureAnchorDonor2025
3. Click "Login"
4. **Expected:** Redirect to `/donor` portal
5. **Check:** URL changed, user name appears in UI, no errors

### Testing ML Models:
1. Log in as admin@sureanchor.org / SureAnchorAdmin2025
2. Navigate to https://zealous-tree-029394910.6.azurestaticapps.net/admin
3. Scroll down to "ML-Powered Insights" section
4. **Expected:** Three panels showing:
   - Churn Risk Predictions (with donor names and percentages)
   - Campaign Performance Scorecard (with campaign names and scores)
   - Education Progress Predictions (with safehouse names and deltas)
5. **Check:** Data appears, no error messages, charts render

### Testing CRUD:
1. Log in as staff@sureanchor.org / SureAnchorStaff2025
2. Navigate to https://zealous-tree-029394910.6.azurestaticapps.net/admin/caseload
3. Click on any resident in the list
4. Should navigate to `/admin/resident/:id`
5. Edit a field (e.g., change education progress from 50 to 55)
6. Click "Save" button
7. **Expected:** Success message appears
8. Refresh the page
9. **Check:** Value is still 55 (change persisted)

### Testing RBAC:
1. Log in as donor@sureanchor.org / SureAnchorDonor2025
2. Try to navigate to https://zealous-tree-029394910.6.azurestaticapps.net/admin/staff-accounts
3. **Expected:** Redirected to login or shown "Access Denied"
4. **Check:** Cannot access admin-only page as donor

---

## Summary of Deliverables

I've created 4 documents for you:

1. **FEATURE_TESTING_RESULTS.md** (Comprehensive testing guide)
   - Complete feature checklist
   - Testing procedures for all roles
   - Security testing guidelines
   - Results tracking template

2. **VIDEO_CHECKLIST_CONCISE.md** (Detailed 8-10 min video guide)
   - Section-by-section breakdown
   - Timing for each part
   - Backup plans if features are broken
   - Recording setup instructions

3. **VIDEO_SCRIPT_ONE_PAGE.md** (Quick reference during recording)
   - Condensed script with exact timing
   - Credentials table
   - Critical checklist
   - Time breakdown

4. **TESTING_SUMMARY.md** (This file)
   - Testing priorities
   - Critical issues to check
   - Manual testing procedures
   - Pre-recording verification

---

## Next Steps

1. **Test the critical path** using the checklist above
2. **Identify any broken features** and decide whether to fix or work around
3. **Practice the video script** once before recording
4. **Record the video** using the one-page script
5. **Review the video** to ensure all features were demonstrated
6. **Submit** if everything looks good!

---

## Critical Success Factors

For this project to be successful in the video, you MUST demonstrate:

- [ ] **Authentication works** (can log in with multiple roles)
- [ ] **RBAC works** (different roles have different access)
- [ ] **At least 1 CRUD operation** (create, edit, or view data)
- [ ] **At least 1 ML model** (preferably all 3)
- [ ] **Security features** (JWT, HTTPS, validation)

If you can show all of the above, you'll get full credit. The ML models are the most impressive feature, so prioritize getting those working!

Good luck! 🎯
