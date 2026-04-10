# SureAnchor - Recording Quick Start Guide
**Print this or keep on second monitor during recording!**

---

## BEFORE YOU START RECORDING

### 5-Minute Pre-Flight Check
- [ ] Test all 3 logins work
- [ ] Verify ML models display on admin dashboard
- [ ] Verify you can edit and save a resident
- [ ] Clear browser cache/cookies
- [ ] Close all other tabs and apps
- [ ] Turn off notifications
- [ ] Set browser to 100% zoom
- [ ] Open DevTools (for showing JWT token)
- [ ] Practice once (7-8 min run-through)

---

## CREDENTIALS (Keep Visible!)

```
DONOR:  donor@sureanchor.org  / SureAnchorDonor2025
STAFF:  staff@sureanchor.org  / SureAnchorStaff2025
ADMIN:  admin@sureanchor.org  / SureAnchorAdmin2025
```

---

## 10-MINUTE SCRIPT

### 0:00-1:00 | INTRO (1 min)
- Landing page → "SureAnchor: safe house mgmt with ML"
- Quick: `/impact` → `/privacy` (show cookie banner)

### 1:00-2:00 | DONOR (1 min)
- Login as DONOR
- Show donation history
- Make donation (fill form, submit)
- Show My Impact
- Try `/admin/staff-accounts` → DENIED (RBAC!)
- Logout

### 2:00-4:00 | STAFF (2 min)
- Login as STAFF
- Dashboard overview
- `/admin/caseload` → click resident → **EDIT & SAVE**
- `/admin/donors` (show form)
- Try `/admin/staff-accounts` → DENIED
- Logout

### 4:00-7:00 | ADMIN + ML (3 min) ← MOST IMPORTANT!
- Login as ADMIN
- `/admin` dashboard → scroll to ML section

**ML Model 1: Churn (1 min)**
- "Logistic regression predicts donor churn"
- Show: names, probabilities, risk tiers

**ML Model 2: Campaigns (1 min)**
- "Random forest scores campaigns"
- Show: rankings, performance scores

**ML Model 3: Education (1 min)**
- "Linear regression predicts education progress"
- Show: safehouse predictions, deltas

### 7:00-8:00 | MORE FEATURES (1 min)
- `/admin/safety` (admin-only)
- `/admin/staff-accounts` (admin-only)
- `/admin/process-recording` (quick)
- `/admin/reports` (generate one)

### 8:00-9:00 | SECURITY (1 min)
- DevTools → Network → show JWT header
- `/privacy` policy
- Try donation form with negative $ → validation error
- "HTTPS, JWT auth, input validation, EF Core prevents SQL injection"

### 9:00-10:00 | CLOSING (1 min)
- "Summary: JWT auth + RBAC, C# backend + EF Core + SQL Server, 3 ML models (churn/campaign/education), OWASP security, React UI"
- Return to landing page
- END

---

## URL CHECKLIST

Copy/paste these during recording (faster than typing):

```
https://zealous-tree-029394910.6.azurestaticapps.net/
https://zealous-tree-029394910.6.azurestaticapps.net/login
https://zealous-tree-029394910.6.azurestaticapps.net/donor
https://zealous-tree-029394910.6.azurestaticapps.net/admin
https://zealous-tree-029394910.6.azurestaticapps.net/admin/caseload
https://zealous-tree-029394910.6.azurestaticapps.net/admin/donors
https://zealous-tree-029394910.6.azurestaticapps.net/admin/safety
https://zealous-tree-029394910.6.azurestaticapps.net/admin/staff-accounts
https://zealous-tree-029394910.6.azurestaticapps.net/admin/process-recording
https://zealous-tree-029394910.6.azurestaticapps.net/admin/reports
https://zealous-tree-029394910.6.azurestaticapps.net/privacy
```

---

## KEY TALKING POINTS

### When showing ML models:
- "Three distinct models: logistic regression for churn, random forest for campaigns, linear regression for education"
- "Provides actionable insights for donor retention and program optimization"
- "Integrated Python Flask ML service with C# backend"

### When showing CRUD:
- "Full-stack C# ASP.NET Core backend"
- "Entity Framework Core with SQL Server database"
- "Complete CRUD operations on all entities"

### When showing security:
- "JWT authentication with role-based authorization"
- "HTTPS enforced by Azure Static Web Apps"
- "Input validation on frontend and backend"
- "Parameterized queries prevent SQL injection"

### When showing roles:
- "Three-tier RBAC: Donor, Staff, Admin"
- "Hierarchical permissions with granular access control"
- "RequireAuth middleware enforces authorization"

---

## IF SOMETHING IS BROKEN

### ML models not showing?
- Show the UI panels anyway
- "These panels would display predictions from our 3 ML models"
- Show backend `MLController.cs` in IDE
- Explain: churn prediction, campaign scoring, education forecasting

### Can't edit resident?
- Show the form and fields
- Explain the CRUD operations
- Show `ResidentsController.cs` code
- "Entity Framework handles database operations"

### Login not working?
- STOP! Authentication is critical - must fix before recording
- Check backend is running
- Check credentials are correct
- This cannot be worked around

---

## TIMING CHECKPOINTS

- **2:00 mark:** Should be logging in as STAFF
- **4:00 mark:** Should be logging in as ADMIN
- **5:00 mark:** Should be showing first ML model
- **7:00 mark:** Should be done with ML, moving to other features
- **8:00 mark:** Should be showing security features
- **9:00 mark:** Should be starting closing remarks

**If behind schedule:** Skip process recordings and reports
**If ahead of schedule:** Add more detail to ML explanations

---

## POST-RECORDING CHECKLIST

- [ ] Showed login with multiple roles
- [ ] Demonstrated RBAC (denied access)
- [ ] Showed at least 1 CRUD operation
- [ ] Showed all 3 ML models (or explained them)
- [ ] Mentioned security features (JWT, HTTPS, validation)
- [ ] Video is 8-10 minutes
- [ ] Audio is clear
- [ ] No awkward pauses > 3 seconds
- [ ] Screen is readable (not too zoomed)

---

## EMERGENCY PHRASES

**If something doesn't load:**
- "While this is loading, let me explain the feature..."
- [Continue to next section]

**If you get an error:**
- "This demonstrates our error handling"
- [Navigate away, continue]

**If you forget what to say:**
- [Show the feature silently for 2 seconds]
- "As you can see here, [describe what's on screen]"

**If you go blank:**
- "Let me show you another feature..."
- [Navigate to something you remember]

---

## CONFIDENCE BOOSTERS

You've built:
- A full-stack enterprise application
- Three working ML models
- Secure authentication with RBAC
- Professional UI with modern tech stack
- Complete CRUD operations
- Real-world business logic

**This is impressive work. You got this!**

---

## FINAL REMINDERS

1. **Speak clearly** - Don't rush
2. **Show, don't just tell** - Let them see features working
3. **Emphasize ML** - This is your differentiator
4. **Demonstrate RBAC** - Show actual denial of access
5. **Stay calm** - If something breaks, move on
6. **End strong** - Confident closing statement
7. **Keep it under 10 minutes** - TAs will stop watching

**NOW GO RECORD A GREAT VIDEO!**
