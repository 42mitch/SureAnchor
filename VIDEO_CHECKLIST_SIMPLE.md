# IS 413 Video Checklist

## Credentials
- **Admin:** admin@sureanchor.org / SureAnchorAdmin2025
- **Staff:** staff@sureanchor.org / SureAnchorStaff2025
- **Donor:** donor@sureanchor.org / SureAnchorDonor2025
- **URL:** https://zealous-tree-029394910.6.azurestaticapps.net/

---

## What to Show (8-10 minutes)

### 1. Public Pages (1 min)
- [ ] Landing page
- [ ] Privacy Policy link
- [ ] Navigate to Login

### 2. Donor Role (1 min)
- [ ] Login as donor
- [ ] Show donor dashboard
- [ ] Make a donation
- [ ] Try to access /admin (get denied - proves RBAC)
- [ ] Logout

### 3. Staff Role (2 min)
- [ ] Login as staff
- [ ] Show staff dashboard
- [ ] Go to Residents page
- [ ] Edit a resident (change a field)
- [ ] Save it (proves CRUD works)
- [ ] Logout

### 4. Admin Role + ML Models (3-4 min) **MOST IMPORTANT**
- [ ] Login as admin
- [ ] Show admin dashboard
- [ ] Point out **3 ML predictions:**
  - [ ] Donor Churn Prediction (logistic regression)
  - [ ] Campaign Performance Score (random forest)
  - [ ] Education Progress Prediction (linear regression)
- [ ] Show Donors page
- [ ] Show Donation Allocations tab
- [ ] Show Reports page

### 5. Security (1 min)
- [ ] Show HTTPS in URL bar
- [ ] Mention "JWT authentication"
- [ ] Show form validation (submit empty form, see error)
- [ ] Mention "Entity Framework Core prevents SQL injection"

### 6. Technology Stack (1 min)
- [ ] Backend: .NET 10 with C#
- [ ] Frontend: React with TypeScript (Vite)
- [ ] Database: PostgreSQL + Entity Framework Core
- [ ] ML: Python Flask + scikit-learn
- [ ] Deployment: Azure Static Web Apps + Azure PostgreSQL

### 7. Wrap Up (30 sec)
- [ ] "Demonstrated: Authentication, RBAC, Database CRUD, 3 ML models, Security"
- [ ] Thank you

---

## Must Show
✅ Authentication (login works)
✅ RBAC (donor denied admin access)
✅ Database CRUD (edit and save resident)
✅ All 3 ML models
✅ HTTPS + security features

**Total Time: 8-10 minutes MAX**
