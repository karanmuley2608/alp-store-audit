# ALP Store Audit — QA Test Cases

## Test Credentials

| Employee ID | Mobile     | Password   | Role     |
|-------------|-----------|------------|----------|
| EMP-SM-001  | 9820000001 | Sm@1234    | SM       |
| EMP-SM-002  | 9820000002 | Sm@1234    | SM       |
| EMP-SM-003  | 9820000003 | Sm@1234    | SM       |
| EMP-NSO-001 | 9810000001 | Nso@1234   | NSO Head |
| EMP-NSO-002 | 9810000002 | Nso@1234   | NSO Head |
| EMP-ADM-001 | 9800000001 | Admin@1234 | Admin    |

---

## TC-AUTH: Authentication Flow

### TC-AUTH-001: Successful SM Login
- **Steps:** Enter EMP-SM-001 / 9820000001 / Sm@1234 → Click Sign In
- **Expected:** Redirected to /sm/home, greeting shows "Good [morning/afternoon/evening], Amit"
- **Severity:** Critical

### TC-AUTH-002: Successful NSO Login
- **Steps:** Enter EMP-NSO-001 / 9810000001 / Nso@1234 → Click Sign In
- **Expected:** Redirected to /nso/dashboard with KPI strip and store table
- **Severity:** Critical

### TC-AUTH-003: Successful Admin Login
- **Steps:** Enter EMP-ADM-001 / 9800000001 / Admin@1234 → Click Sign In
- **Expected:** Redirected to /admin/dashboard with 4 KPI cards
- **Severity:** Critical

### TC-AUTH-004: Invalid Employee ID
- **Steps:** Enter INVALID-001 / 9820000001 / Sm@1234 → Click Sign In
- **Expected:** Error badge "Employee not found"
- **Severity:** High

### TC-AUTH-005: Wrong Password
- **Steps:** Enter EMP-SM-001 / 9820000001 / WrongPass → Click Sign In
- **Expected:** Error badge "Invalid password"
- **Severity:** High

### TC-AUTH-006: Wrong Mobile Number
- **Steps:** Enter EMP-SM-001 / 9999999999 / Sm@1234 → Click Sign In
- **Expected:** Error badge "Employee not found"
- **Severity:** High

### TC-AUTH-007: Mobile Number Normalization
- **Steps:** Enter EMP-SM-001 / +91 98200 00001 / Sm@1234 → Click Sign In
- **Expected:** Login succeeds (number normalized to 9820000001)
- **Severity:** Medium

### TC-AUTH-008: Employee ID Case Insensitivity
- **Steps:** Enter emp-sm-001 / 9820000001 / Sm@1234 → Click Sign In
- **Expected:** Login succeeds (auto-uppercased)
- **Severity:** Medium

### TC-AUTH-009: Empty Fields Submission
- **Steps:** Leave all fields empty → Click Sign In
- **Expected:** Browser validation prevents submission (required fields)
- **Severity:** Medium

### TC-AUTH-010: Forgot Password Link
- **Steps:** Click "Forgot password?"
- **Expected:** Toast "Contact your administrator"
- **Severity:** Low

### TC-AUTH-011: Role-Based Route Protection (SM → Admin)
- **Steps:** Login as SM, navigate to /admin/dashboard manually
- **Expected:** Redirected back to /sm/home
- **Severity:** Critical

### TC-AUTH-012: Role-Based Route Protection (NSO → SM)
- **Steps:** Login as NSO, navigate to /sm/home manually
- **Expected:** Redirected back to /nso/dashboard
- **Severity:** Critical

### TC-AUTH-013: Unauthenticated Access
- **Steps:** Clear cookies, navigate to /sm/home
- **Expected:** Redirected to /login
- **Severity:** Critical

### TC-AUTH-014: Authenticated User on Login Page
- **Steps:** Login as SM, then navigate to /login
- **Expected:** Redirected to /sm/home (role home)
- **Severity:** High

---

## TC-SM: Store Manager Flow

### TC-SM-001: Home Page Shows Greeting and Store Info
- **Steps:** Login as EMP-SM-001
- **Expected:** Greeting with first name "Amit", store name "Mumbai Bandra", code "MUM-042"
- **Severity:** High

### TC-SM-002: Home Page Shows Stats Grid
- **Steps:** Login as EMP-SM-001
- **Expected:** 4 stat cards visible (In progress, Pending review, Rework required, Approved) with correct counts
- **Severity:** Medium

### TC-SM-003: Resume Banner for In-Progress Audit
- **Steps:** Login as EMP-SM-002 (has in-progress audit)
- **Expected:** Blue left-border card with store name, progress bar, percentage, "Continue audit →" button
- **Severity:** High

### TC-SM-004: Start New Audit Button Disabled When In-Progress Exists
- **Steps:** Login as EMP-SM-002
- **Expected:** "Start new audit" button disabled, tooltip "Complete the current audit first"
- **Severity:** High

### TC-SM-005: New Audit - Camera Opens Front-Facing
- **Steps:** Click "Start new audit" (as SM with no in-progress audit) → Click "Open camera"
- **Expected:** Front-facing camera stream visible in circle viewfinder, mirrored
- **Severity:** High

### TC-SM-006: New Audit - Capture and Confirm Photo
- **Steps:** Open camera → Click "Take photo" → Click "Confirm & continue"
- **Expected:** Photo captured, preview shown, navigates to consent page on confirm
- **Severity:** Critical

### TC-SM-007: New Audit - Upload Existing Photo
- **Steps:** Click "Upload existing photo" → Select an image file
- **Expected:** Preview shown in circle, "Confirm & continue" button appears
- **Severity:** Medium

### TC-SM-008: Consent Page - Pre-filled Employee Info
- **Steps:** Navigate to consent page
- **Expected:** Avatar, full name, employee code, mobile shown read-only
- **Severity:** Medium

### TC-SM-009: Consent Page - Checkbox Required
- **Steps:** Click "Start audit" without checking consent checkbox
- **Expected:** Error "Consent is required to proceed"
- **Severity:** Critical

### TC-SM-010: Consent Page - No Duplicate Items on Revisit
- **Steps:** Complete consent → navigate back to consent → click "Start audit" again
- **Expected:** Audit items NOT duplicated (checked before insert)
- **Severity:** Critical

### TC-SM-011: Checklist - All 23 Items Displayed
- **Steps:** Navigate to checklist page
- **Expected:** 23 items listed sorted by sr_no, with category badges and status badges
- **Severity:** High

### TC-SM-012: Checklist - Tab Filtering
- **Steps:** Click "Pending" tab → Click "Done" tab → Click "All" tab
- **Expected:** List filters correctly by status
- **Severity:** Medium

### TC-SM-013: Checklist - Category Filter Chips
- **Steps:** Click "MEP" chip → Click "Interior" chip → Click "All" chip
- **Expected:** List filters by category
- **Severity:** Medium

### TC-SM-014: Checklist - Resume Indicator
- **Steps:** View checklist with some items pending
- **Expected:** First pending/in-progress item highlighted with blue border + "↳ Resume here"
- **Severity:** Medium

### TC-SM-015: Item Detail - Scope Toggle (Out of Scope)
- **Steps:** Open item → Click "No" for scope
- **Expected:** All form sections hidden except save button, save enabled
- **Severity:** High

### TC-SM-016: Item Detail - Satisfaction Toggle
- **Steps:** Open item → Click "Satisfied" → Click "Not satisfied"
- **Expected:** Toggle between green/red states
- **Severity:** Medium

### TC-SM-017: Item Detail - Evidence Upload Required
- **Steps:** Open in-scope item with no evidence → try "Save & next"
- **Expected:** Button disabled, hint strip "Add evidence to unlock Save & next"
- **Severity:** Critical

### TC-SM-018: Item Detail - Evidence Upload Enables Save
- **Steps:** Upload a photo → check "Save & next" button
- **Expected:** Hint changes to "Evidence added — ready to save", button enabled
- **Severity:** Critical

### TC-SM-019: Item Detail - Auto-Save Indicator
- **Steps:** Change any field (remarks, satisfaction, etc.)
- **Expected:** "Saving..." appears, then "Saved ✓" after 1 second
- **Severity:** High

### TC-SM-020: Item Detail - Auto-Save Does NOT Revert Completed Status
- **Steps:** Return to a previously completed item → edit a field
- **Expected:** Auto-save updates data but does NOT change status back to "in_progress"
- **Severity:** Critical

### TC-SM-021: Item Detail - Dates Section Toggle
- **Steps:** Click "Add dates (optional)"
- **Expected:** 4 date pickers appear in 2x2 grid, collapse on re-click
- **Severity:** Low

### TC-SM-022: Item Detail - Save & Next Navigation
- **Steps:** Complete all fields + evidence → Click "Save & next"
- **Expected:** Navigates to next pending item, or submit page if all done
- **Severity:** High

### TC-SM-023: Submit Page - Summary Stats
- **Steps:** Complete all items → reach submit page
- **Expected:** "100%" circle, complete/satisfied/not-satisfied counts, store name
- **Severity:** High

### TC-SM-024: Submit Page - Unsatisfied Items Warning
- **Steps:** Some items marked "not_satisfied" → reach submit page
- **Expected:** Warning card listing count of unsatisfied items
- **Severity:** Medium

### TC-SM-025: Submit Page - Submit Creates Notification
- **Steps:** Click "Submit for NSO review"
- **Expected:** Audit status → submitted, NSO receives notification, SM redirected to /sm/home
- **Severity:** Critical

### TC-SM-026: Rework Page - Shows Flagged Items
- **Steps:** Login as SM with rework_required audit → navigate to rework
- **Expected:** Warning banner, NSO remarks, list of flagged items with per-item remarks
- **Severity:** High

### TC-SM-027: Rework Page - Resubmit Disabled Until All Updated
- **Steps:** View rework page without updating items
- **Expected:** "Resubmit for review" button disabled
- **Severity:** High

### TC-SM-028: History - Shows All Audits
- **Steps:** Navigate to History tab
- **Expected:** All audits listed with status badges, progress bars, RAG indicators
- **Severity:** Medium

### TC-SM-029: History - Tab Filtering
- **Steps:** Click each tab (All, In progress, Pending, Rework, Approved)
- **Expected:** List filters correctly
- **Severity:** Medium

### TC-SM-030: Notifications - Realtime Updates
- **Steps:** Have SM notifications page open → trigger a notification from NSO
- **Expected:** New notification appears without page refresh
- **Severity:** High

### TC-SM-031: Notifications - Mark All Read
- **Steps:** Click "Mark all read"
- **Expected:** All notifications change to read styling, unread count resets to 0
- **Severity:** Medium

### TC-SM-032: Notifications - Type-Specific Routing
- **Steps:** Click a "rework_required" notification
- **Expected:** Navigates to /sm/audit/[id]/rework (not checklist)
- **Severity:** Medium

---

## TC-NSO: NSO Head Flow

### TC-NSO-001: Dashboard KPI Strip
- **Steps:** Login as EMP-NSO-001
- **Expected:** 8 KPI values (stores, total items, completed, WIP, not started, satisfied, not satisfied, pending review)
- **Severity:** High

### TC-NSO-002: Dashboard Store Table
- **Steps:** View dashboard
- **Expected:** Table with store code, name/location, status badge, progress bar, deadline, action buttons
- **Severity:** High

### TC-NSO-003: Dashboard Store Table Search
- **Steps:** Type "Mumbai" in search
- **Expected:** Only Mumbai stores shown
- **Severity:** Medium

### TC-NSO-004: Dashboard Store Table Filter
- **Steps:** Click "Needs review" filter
- **Expected:** Only submitted/resubmitted stores shown
- **Severity:** Medium

### TC-NSO-005: Dashboard Action Panel
- **Steps:** View action panel
- **Expected:** Cards for submitted audits, deadline warnings, overdue stores
- **Severity:** High

### TC-NSO-006: Dashboard State Progress Groups by State
- **Steps:** View state progress widget
- **Expected:** Groups by state (Maharashtra), not by city (Mumbai, Pune, Nagpur)
- **Severity:** Medium

### TC-NSO-007: All Stores Page - Full Table
- **Steps:** Click "All Stores" in sidebar
- **Expected:** Full table with sorting, filtering, all stores visible
- **Severity:** High

### TC-NSO-008: All Stores - Sort by Deadline
- **Steps:** Select "Sort by deadline"
- **Expected:** Stores sorted by target date, null dates at end
- **Severity:** Medium

### TC-NSO-009: Store Drill-Down Page
- **Steps:** Click a store row in the table
- **Expected:** Store detail with header, 3 stat cards, items table with tabs
- **Severity:** High

### TC-NSO-010: Store Drill-Down - Item Click Navigation
- **Steps:** Click an item row in the store detail
- **Expected:** Navigates to /nso/store/[id]/item/[itemId]
- **Severity:** Medium

### TC-NSO-011: Item Evidence View - Shows Evidence Grid
- **Steps:** Open an item with evidence
- **Expected:** Evidence thumbnails displayed, dates card, SM remarks, delay detection
- **Severity:** High

### TC-NSO-012: Item Evidence View - Accept Item
- **Steps:** Click "Accept this item"
- **Expected:** Success toast, item status updated, navigates back
- **Severity:** High

### TC-NSO-013: Item Evidence View - Flag for Rework
- **Steps:** Enter rework remark → Click "Flag for rework"
- **Expected:** Warning toast, item flagged, navigates back
- **Severity:** High

### TC-NSO-014: Item Evidence View - Flag Without Remark
- **Steps:** Click "Flag for rework" with empty remark
- **Expected:** Error toast "Add a remark for rework"
- **Severity:** Medium

### TC-NSO-015: Item Evidence View - Error Handling on Mutations
- **Steps:** Actions show success/error toasts, buttons disabled during submission
- **Expected:** No silent failures, proper loading states
- **Severity:** High

### TC-NSO-016: Conversation Page - Message Display
- **Steps:** Open conversation for a store
- **Expected:** Messages sorted chronologically, SM left-aligned gray, NSO right-aligned blue
- **Severity:** High

### TC-NSO-017: Conversation Page - Send Message
- **Steps:** Type message → Click Send (or Enter)
- **Expected:** Message appears in chat, input cleared
- **Severity:** High

### TC-NSO-018: Conversation Page - Realtime Messages
- **Steps:** Open conversation in two tabs (SM + NSO) → send from one
- **Expected:** Message appears in both tabs with correct sender name
- **Severity:** High

### TC-NSO-019: Conversation Page - Channel Cleanup on Unmount
- **Steps:** Navigate away from conversation page
- **Expected:** No memory leaks, realtime subscription cleaned up
- **Severity:** Medium

### TC-NSO-020: Approval Page - Status Guard
- **Steps:** Navigate to approve page for an already-approved audit
- **Expected:** Error banner shown, all controls disabled
- **Severity:** Critical

### TC-NSO-021: Approval Page - Three Decision Cards
- **Steps:** Click each decision card (Approve, Rework, Reject)
- **Expected:** Card highlights with appropriate colors, only one selected at a time
- **Severity:** High

### TC-NSO-022: Approval Page - Remarks Required
- **Steps:** Select decision, type < 10 chars in remarks
- **Expected:** "Confirm decision" button disabled, character counter shown
- **Severity:** High

### TC-NSO-023: Approval Page - Confirm Approve
- **Steps:** Select "Approve" + remarks ≥ 10 chars → Click "Confirm decision"
- **Expected:** Audit status → approved, SM notified, redirect to /nso/stores
- **Severity:** Critical

### TC-NSO-024: Approval Page - Confirm Rework
- **Steps:** Select "Send for rework" + remarks → Confirm
- **Expected:** Audit status → rework_required, SM notified
- **Severity:** Critical

### TC-NSO-025: Approval Page - Error Handling
- **Steps:** Confirm decision → observe network
- **Expected:** Error toast on failure, button re-enabled via finally block
- **Severity:** High

### TC-NSO-026: Resubmission Page - All Items Must Be Reviewed
- **Steps:** Open resubmission page with unresolved items
- **Expected:** "Proceed to final decision" button disabled with remaining count
- **Severity:** High

### TC-NSO-027: Resubmission Page - Accept Item Updates State
- **Steps:** Click "Accept" on a rework item
- **Expected:** Item badge changes to "accepted", proceed button enables when all done
- **Severity:** High

### TC-NSO-028: State Progress - Table with Bars
- **Steps:** Navigate to State Progress
- **Expected:** Table with state, totals, progress bars colored by threshold (>60% green, 30-60% amber, <30% red)
- **Severity:** Medium

### TC-NSO-029: State Progress - CSV Export
- **Steps:** Click "Export to CSV"
- **Expected:** CSV downloads with correct headers and data
- **Severity:** Medium

### TC-NSO-030: Notifications - Realtime
- **Steps:** Open notifications page → SM submits an audit
- **Expected:** New notification appears without refresh
- **Severity:** High

---

## TC-ADMIN: Admin Flow

### TC-ADMIN-001: Dashboard KPI Cards
- **Steps:** Login as Admin
- **Expected:** 4 cards (Total stores, Total employees, Overall completion %, Stores approved)
- **Severity:** Medium

### TC-ADMIN-002: Dashboard Deadline Health Cards
- **Steps:** View dashboard
- **Expected:** 3 cards (On track green, At risk amber, Overdue red)
- **Severity:** Medium

### TC-ADMIN-003: Employees Table
- **Steps:** Navigate to Employees
- **Expected:** Full table with all 6 employees, search works
- **Severity:** High

### TC-ADMIN-004: Add Employee
- **Steps:** Click "Add employee" → fill form → Click "Create"
- **Expected:** Employee added, success toast, table refreshed
- **Severity:** High

### TC-ADMIN-005: Edit Employee
- **Steps:** Click "Edit" on a row → modify fields → Click "Update"
- **Expected:** Employee updated, success toast
- **Severity:** High

### TC-ADMIN-006: Deactivate Employee
- **Steps:** Click "Deactivate" on a row
- **Expected:** Status changes to inactive, badge updates
- **Severity:** High

### TC-ADMIN-007: Employee CRUD Error Handling
- **Steps:** Try to create employee with duplicate employee_code
- **Expected:** Error toast with message (not silent failure)
- **Severity:** High

### TC-ADMIN-008: Stores Table
- **Steps:** Navigate to Stores
- **Expected:** All 5 stores listed with correct data
- **Severity:** High

### TC-ADMIN-009: Edit Store Preserves Address
- **Steps:** Edit a store → check address field
- **Expected:** Address pre-populated from existing data
- **Severity:** High

### TC-ADMIN-010: Checklist Page - Expandable Rows
- **Steps:** Click a checklist item row
- **Expected:** Expands to show what_to_check, ideal_state, thresholds
- **Severity:** Medium

### TC-ADMIN-011: Checklist Page - Toggle Active/Inactive
- **Steps:** Click "Deactivate" on a checklist item
- **Expected:** Status badge changes, success toast
- **Severity:** Medium

### TC-ADMIN-012: Regions CRUD
- **Steps:** Add region → Edit → Deactivate
- **Expected:** All operations succeed with proper toasts, no double-click duplicates
- **Severity:** Medium

### TC-ADMIN-013: Audit Trail - Table with Pagination
- **Steps:** Navigate to Audit Trail
- **Expected:** Table loads, Previous/Next pagination works, page indicator shown
- **Severity:** Medium

### TC-ADMIN-014: Audit Trail - Filters
- **Steps:** Select action type filter → Select entity type filter
- **Expected:** Table filters, loading indicator shown during fetch
- **Severity:** Medium

### TC-ADMIN-015: Audit Trail - CSV Export
- **Steps:** Click "Export to CSV"
- **Expected:** CSV downloads with properly escaped values
- **Severity:** Medium

### TC-ADMIN-016: Import Page - File Upload
- **Steps:** Upload an .xlsx file
- **Expected:** Parsed rows shown with valid/error badges
- **Severity:** Medium

---

## TC-REPORT: Completion Report

### TC-REPORT-001: Report Page Loads for Approved Audit
- **Steps:** Navigate to /report/[auditId] for an approved audit
- **Expected:** Full report with header, store details, summary, items table, footer
- **Severity:** High

### TC-REPORT-002: Print/Download PDF
- **Steps:** Click "Download PDF"
- **Expected:** Browser print dialog opens with formatted report
- **Severity:** Medium

---

## TC-UI: Design System Compliance

### TC-UI-001: Font is Outfit
- **Steps:** Inspect any page
- **Expected:** font-family is "Outfit", loaded from Google Fonts
- **Severity:** Low

### TC-UI-002: Page Background Color
- **Steps:** Check body background
- **Expected:** #F9FAFB
- **Severity:** Low

### TC-UI-003: Card Styling
- **Steps:** Inspect any card
- **Expected:** bg white, 1px solid #E4E7EC border, 16px radius, NO box-shadow
- **Severity:** Low

### TC-UI-004: Button Variants
- **Steps:** Check Primary, Secondary, Danger, Ghost buttons across app
- **Expected:** Colors match design spec exactly
- **Severity:** Low

### TC-UI-005: Badge Variants
- **Steps:** Check Success, Error, Warning, Info, Neutral badges
- **Expected:** Colors match design spec
- **Severity:** Low

---

## Bug Summary (Fixed)

### Critical Fixes Applied
| # | Bug | Flow | Fix |
|---|-----|------|-----|
| 1 | Lookup API leaked role/store_codes/first_login to unauthenticated callers | Auth | Returns only email now; post-auth /api/auth/me endpoint added |
| 2 | first_login checked from pre-auth data | Auth | Moved to post-auth /api/auth/me call |
| 3 | change-password page RLS blocked employees update | Auth | Server-side /api/auth/complete-password-change route added |
| 4 | Consent page created duplicate audit_items on revisit | SM | Checks for existing items before insert |
| 5 | Conversation realtime subscription never cleaned up | NSO | Channel stored in ref, cleanup in useEffect return |
| 6 | Realtime messages arrived without sender names | NSO | Sender cache built from initial fetch, used for realtime |
| 7 | Approval page allowed re-approval of non-submitted audits | NSO | Status guard with disabled controls |

### High Fixes Applied
| # | Bug | Flow | Fix |
|---|-----|------|-----|
| 1 | Auto-save fired on initial load overwriting server data | SM | `initializedRef` gates auto-save |
| 2 | Auto-save reverted completed items to in_progress | SM | Status removed from auto-save payload |
| 3 | "Mark all read" didn't update local state | SM | markAllAsReadLocal() updates state |
| 4 | Camera stream not stopped on unmount | SM | useEffect cleanup added |
| 5 | No error handling on NSO mutations | NSO | try/catch/finally with error toasts |
| 6 | Sidebar Media Gallery link had no storeId | NSO | Changed to # |
| 7 | Checklist Fragment missing key prop | Admin | Fragment with key replaces bare <> |
| 8 | Stores page lost address field on edit | Admin | Address added to interface and form |
| 9 | No error handling on Admin CRUD | Admin | {error} destructuring + toasts |
| 10 | Middleware /api/ path too broad | Auth | Narrowed to /api/auth/ |

### Medium Fixes Applied
| # | Bug | Flow | Fix |
|---|-----|------|-----|
| 1 | status.replace only replaced first underscore | SM | Changed to /_/g |
| 2 | Notification routing not type-specific | SM | Routes by notification type |
| 3 | Hardcoded fallback of 23 items | SM | Changed to 0 |
| 4 | Stores sort crashed on null dates | NSO | Null dates sorted to end |
| 5 | State Progress grouped by city not state | NSO | Fixed to group by state |
| 6 | Resubmission allowed proceeding without review | NSO | Button disabled until all reviewed |
| 7 | Regions double-click created duplicates | Admin | saving state added |
| 8 | Audit trail CSV didn't escape special chars | Admin | escapeCSV helper added |
| 9 | Audit trail no loading on page/filter change | Admin | setLoading(true) at fetchData start |
| 10 | SM with empty store_codes not handled | Auth | Error shown "No stores assigned" |
