# SureAnchor - 8-10 Minute Video Script (One-Page)

## SETUP
- URL: https://zealous-tree-029394910.6.azurestaticapps.net/
- Clear cache, 100% zoom, close distractions
- Have credentials ready

---

## MINUTE 0-1: INTRO & PUBLIC PAGES
**SAY:** "SureAnchor is a safe house management system with ML-powered insights. I'll show authentication, database CRUD, three machine learning models, and security."

**DO:** Show landing page → `/impact` → `/privacy` (cookie consent banner)

---

## MINUTE 1-2: DONOR AUTHENTICATION & PORTAL
**LOGIN:** donor@sureanchor.org / SureAnchorDonor2025

**SAY:** "JWT authentication with role-based access control. Donors can view history and make donations."

**DO:**
- Show `/donor` portal → donation history
- Click "Make Donation" → fill form → submit
- Show "My Impact" allocations
- Try `/admin/staff-accounts` (denied) → **"RBAC prevents unauthorized access"**
- Log out

---

## MINUTE 2-4: STAFF ROLE & DATABASE CRUD
**LOGIN:** staff@sureanchor.org / SureAnchorStaff2025

**DO:**
1. `/admin` dashboard → **"Overview with Entity Framework Core + SQL Server"**
2. `/admin/caseload` → click resident → `/admin/resident/:id`
   - **SAY:** "Full CRUD: view resident profile, edit education progress, save"
   - **Edit something** (e.g., education percentage) → save
3. `/admin/donors` → **"Donor management with full CRUD operations"**
4. Try `/admin/staff-accounts` (denied) → **"Staff has limited access"**

---

## MINUTE 4-7: ADMIN ROLE & 3 ML MODELS (MOST IMPORTANT!)
**LOGIN:** admin@sureanchor.org / SureAnchorAdmin2025

**DO:** Navigate to `/admin` → scroll to "ML-Powered Insights"

### ML MODEL 1: Donor Churn (1 min)
**SAY:** "First ML model: Logistic regression predicts which donors will stop giving. Shows probability, risk tier, and recommended actions."
**SHOW:** Churn predictions panel with donors, percentages, risk levels

### ML MODEL 2: Campaign Performance (1 min)
**SAY:** "Second ML model: Random forest classifier scores fundraising campaigns. Ranks them by predicted performance."
**SHOW:** Campaign scorecard with names, scores, rankings

### ML MODEL 3: Education Progress (1 min)
**SAY:** "Third ML model: Linear regression predicts resident education outcomes by safehouse. Shows predicted vs current progress."
**SHOW:** Education predictions with safehouse names, deltas

### Admin-Only Pages (30 sec)
**DO:**
- `/admin/safety` → **"Admin-only access to incident reports"**
- `/admin/staff-accounts` → **"Hierarchical RBAC - staff management"**

---

## MINUTE 7-8: MORE DATABASE FEATURES
**DO:**
- `/admin/process-recording` → **"Social worker documentation"**
- `/admin/visitations` → **"Home visit scheduling"**
- `/admin/reports` → generate report → **"Database aggregation and reporting"**

---

## MINUTE 8-9: SECURITY FEATURES
**DO:**
- Open DevTools → Network tab → show JWT token in headers
  - **SAY:** "JWT authentication with HttpOnly cookies"
- `/privacy` → **"Privacy policy and GDPR compliance"**
- Donation form → enter negative amount → **"Input validation on frontend and backend"**
  - **SAY:** "HTTPS enforced by Azure. Parameterized queries prevent SQL injection."

---

## MINUTE 9-10: CLOSING
**SAY:** "In summary: Secure JWT authentication with RBAC, full-stack C# backend with Entity Framework Core and SQL Server, three ML models for donor churn, campaign scoring, and education prediction, OWASP security including HTTPS and input validation, and professional React UI. Thank you."

**DO:** Return to landing page → END

---

## BACKUP IF FEATURES BROKEN
- **ML not working?** Show UI panels, explain models, show backend MLController.cs
- **CRUD failing?** Show forms, explain intended functionality
- **Auth broken?** Show login page, explain JWT, show RequireAuth code

---

## CRITICAL CHECKLIST BEFORE RECORDING
- [ ] All 3 logins work
- [ ] ML predictions display on `/admin` dashboard
- [ ] Can edit and save a resident
- [ ] Can create a donation as donor
- [ ] RBAC works (donor can't access staff pages)
- [ ] All major pages load without errors

---

## TIME BREAKDOWN
- 0:00-1:00 - Intro + public pages (1 min)
- 1:00-2:00 - Donor auth + portal (1 min)
- 2:00-4:00 - Staff role + CRUD (2 min)
- 4:00-7:00 - Admin + 3 ML models (3 min) ← **MOST IMPORTANT**
- 7:00-8:00 - Other DB features (1 min)
- 8:00-9:00 - Security (1 min)
- 9:00-10:00 - Closing (1 min)

**Total: 10 minutes**

---

## CREDENTIALS (Keep Visible While Recording)
| Role  | Email                    | Password              |
|-------|--------------------------|-----------------------|
| Donor | donor@sureanchor.org     | SureAnchorDonor2025   |
| Staff | staff@sureanchor.org     | SureAnchorStaff2025   |
| Admin | admin@sureanchor.org     | SureAnchorAdmin2025   |
