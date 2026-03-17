import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ioqdpdarlsbanxyjhseh.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Starting seed...\n");

  // --- REGIONS ---
  console.log("Creating regions...");
  const regions = [
    { region_code: "REG-W01", region_name: "West", business_states: "Maharashtra, Gujarat, Goa, MP" },
    { region_code: "REG-E01", region_name: "East", business_states: "West Bengal, Odisha, Bihar, Jharkhand" },
    { region_code: "REG-N01", region_name: "North", business_states: "Delhi NCR, UP, Rajasthan, Punjab, HP, J&K" },
    { region_code: "REG-S01", region_name: "South", business_states: "AP, Telangana, Tamil Nadu, Karnataka, Kerala" },
  ];

  const { data: regionData, error: regionError } = await supabase
    .from("regions")
    .upsert(regions, { onConflict: "region_code" })
    .select();

  if (regionError) {
    console.error("Region error:", regionError);
    return;
  }
  console.log(`  ✅ ${regionData.length} regions created\n`);

  const regionMap: Record<string, string> = {};
  for (const r of regionData) {
    regionMap[r.region_name] = r.id;
  }

  // --- EMPLOYEES + AUTH USERS ---
  console.log("Creating employees and auth users...");

  const employeeSeeds = [
    {
      employee_code: "EMP-NSO-001",
      full_name: "Priya Kapoor",
      email: "priya.kapoor@company.com",
      mobile: "+91 98100 00001",
      role: "NSO Head",
      region: "West",
      store_codes: [],
      password: "Nso@1234",
    },
    {
      employee_code: "EMP-NSO-002",
      full_name: "Arvind Mehta",
      email: "arvind.mehta@company.com",
      mobile: "+91 98100 00002",
      role: "NSO Head",
      region: "East",
      store_codes: [],
      password: "Nso@1234",
    },
    {
      employee_code: "EMP-SM-001",
      full_name: "Amit Sharma",
      email: "amit.sharma@company.com",
      mobile: "+91 98200 00001",
      role: "SM",
      region: "West",
      store_codes: ["MUM-042"],
      password: "Sm@1234",
    },
    {
      employee_code: "EMP-SM-002",
      full_name: "Rahul Sinha",
      email: "rahul.sinha@company.com",
      mobile: "+91 98200 00002",
      role: "SM",
      region: "West",
      store_codes: ["PUN-017"],
      password: "Sm@1234",
    },
    {
      employee_code: "EMP-SM-003",
      full_name: "Sneha Patil",
      email: "sneha.patil@company.com",
      mobile: "+91 98200 00003",
      role: "SM",
      region: "West",
      store_codes: ["NGP-005"],
      password: "Sm@1234",
    },
    {
      employee_code: "EMP-ADM-001",
      full_name: "System Admin",
      email: "admin@company.com",
      mobile: "+91 98000 00001",
      role: "Admin",
      region: "West",
      store_codes: [],
      password: "Admin@1234",
    },
  ];

  const employeeMap: Record<string, string> = {};

  for (const emp of employeeSeeds) {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: emp.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        console.log(`  ⚠️  Auth user ${emp.email} already exists, fetching...`);
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users.find((u) => u.email === emp.email);
        if (existing) {
          const { data: empData, error: empError } = await supabase
            .from("employees")
            .upsert(
              {
                employee_code: emp.employee_code,
                full_name: emp.full_name,
                email: emp.email,
                mobile: emp.mobile,
                role: emp.role,
                store_codes: emp.store_codes,
                region_id: regionMap[emp.region],
                auth_user_id: existing.id,
                first_login: true,
              },
              { onConflict: "employee_code" }
            )
            .select()
            .single();

          if (empError) console.error(`  ❌ Employee error for ${emp.employee_code}:`, empError);
          else employeeMap[emp.employee_code] = empData.id;
        }
        continue;
      }
      console.error(`  ❌ Auth error for ${emp.email}:`, authError);
      continue;
    }

    // Create employee record
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .upsert(
        {
          employee_code: emp.employee_code,
          full_name: emp.full_name,
          email: emp.email,
          mobile: emp.mobile,
          role: emp.role,
          store_codes: emp.store_codes,
          region_id: regionMap[emp.region],
          auth_user_id: authUser.user.id,
          first_login: true,
        },
        { onConflict: "employee_code" }
      )
      .select()
      .single();

    if (empError) {
      console.error(`  ❌ Employee error for ${emp.employee_code}:`, empError);
    } else {
      employeeMap[emp.employee_code] = empData.id;
      console.log(`  ✅ ${emp.employee_code} → ${emp.full_name}`);
    }
  }

  console.log();

  // --- STORES ---
  console.log("Creating stores...");

  const storeSeeds = [
    {
      store_code: "MUM-042",
      store_name: "Mumbai Bandra",
      address: "LBS Marg Bandra",
      city: "Mumbai",
      state: "Maharashtra",
      business_state_region: "West",
      store_type: "Standard",
      sm: "EMP-SM-001",
      nso: "EMP-NSO-001",
      target: "2026-03-31",
    },
    {
      store_code: "PUN-017",
      store_name: "Pune Camp Road",
      address: "Camp MG Road",
      city: "Pune",
      state: "Maharashtra",
      business_state_region: "West",
      store_type: "Standard",
      sm: "EMP-SM-002",
      nso: "EMP-NSO-001",
      target: "2026-03-28",
    },
    {
      store_code: "NGP-005",
      store_name: "Nagpur Sitabuldi",
      address: "Sitabuldi Main",
      city: "Nagpur",
      state: "Maharashtra",
      business_state_region: "West",
      store_type: "Large",
      sm: "EMP-SM-003",
      nso: "EMP-NSO-001",
      target: "2026-04-15",
    },
    {
      store_code: "MUM-089",
      store_name: "Mumbai Andheri",
      address: "Andheri West Link Rd",
      city: "Mumbai",
      state: "Maharashtra",
      business_state_region: "West",
      store_type: "Standard",
      sm: null,
      nso: "EMP-NSO-001",
      target: "2026-03-30",
    },
    {
      store_code: "PUN-008",
      store_name: "Pune FC Road",
      address: "FC Road Shivajinagar",
      city: "Pune",
      state: "Maharashtra",
      business_state_region: "West",
      store_type: "Flagship",
      sm: null,
      nso: "EMP-NSO-001",
      target: "2026-01-20",
    },
  ];

  for (const store of storeSeeds) {
    const { error: storeError } = await supabase.from("stores").upsert(
      {
        store_code: store.store_code,
        store_name: store.store_name,
        address: store.address,
        city: store.city,
        state: store.state,
        business_state_region: store.business_state_region,
        store_type: store.store_type,
        assigned_sm_id: store.sm ? employeeMap[store.sm] || null : null,
        assigned_nso_id: store.nso ? employeeMap[store.nso] || null : null,
        target_completion_date: store.target,
      },
      { onConflict: "store_code" }
    );

    if (storeError) console.error(`  ❌ Store error for ${store.store_code}:`, storeError);
    else console.log(`  ✅ ${store.store_code} → ${store.store_name}`);
  }

  console.log();

  // --- CHECKLIST ITEMS ---
  console.log("Creating checklist items...");

  const checklistItems = [
    { sr_no: 1, work_type: "HVAC", activity: "Repair", category: "MEP", in_scope_flag: true, what_to_check: "Inspect HVAC unit for faults, leaks, unusual noise. Check filters and cooling output.", ideal_state: "HVAC fully functional, clean filters, no leaks or noise.", threshold_good: "All components operational, last serviced within 6 months.", threshold_amber: "Minor issue present, service scheduled within 2 weeks." },
    { sr_no: 2, work_type: "HVAC", activity: "Replace", category: "MEP", in_scope_flag: true, what_to_check: "Verify old unit removed and new unit installed as per specification.", ideal_state: "New HVAC unit installed, commissioned, and operational.", threshold_good: "Unit running, temperature reaches set point within 15 min.", threshold_amber: "Unit installed but minor commissioning issue pending." },
    { sr_no: 3, work_type: "DG", activity: "Repair", category: "MEP", in_scope_flag: true, what_to_check: "Inspect DG for fuel leaks, worn parts, and operational status.", ideal_state: "DG fully operational, no leaks, serviced within 6 months.", threshold_good: "DG starts within 30 seconds, powers full store load.", threshold_amber: "DG functional but minor service item outstanding." },
    { sr_no: 4, work_type: "Damaged Tiles", activity: "Replace", category: "Interior", in_scope_flag: true, what_to_check: "Check all floor tiles for damage, missing pieces, or uneven surfaces.", ideal_state: "All tiles replaced, grouted evenly, no lippage > 2mm.", threshold_good: "Full tile count replaced, no cracked or missing tiles.", threshold_amber: "Majority replaced, 1–2 tiles pending vendor supply." },
    { sr_no: 5, work_type: "Washroom", activity: "Refurbish", category: "Wet areas", in_scope_flag: true, what_to_check: "Inspect all fixtures, tiles, plumbing, lighting, and ventilation in washroom.", ideal_state: "Washroom fully refurbished per brand standard.", threshold_good: "All fixtures working, clean finish, no leaks, ventilation functional.", threshold_amber: "Refurb complete with minor punch list item remaining." },
    { sr_no: 6, work_type: "Trial Room", activity: "Refurbish", category: "Wet areas", in_scope_flag: true, what_to_check: "Check trial room walls, flooring, lighting, hooks, mirror, and door lock.", ideal_state: "Trial room refurbished to brand standard.", threshold_good: "All elements replaced/repaired, lighting at 500 lux minimum.", threshold_amber: "Minor item pending installation." },
    { sr_no: 7, work_type: "BOH", activity: "Refurbish", category: "Wet areas", in_scope_flag: true, what_to_check: "Inspect back-of-house area for structural issues, shelving, and cleanliness.", ideal_state: "BOH clean, organised, shelving intact, no structural defects.", threshold_good: "Shelving load-bearing, flooring clean, no water ingress.", threshold_amber: "Minor structural touch-up or shelving item pending." },
    { sr_no: 8, work_type: "Pantry", activity: "Refurbish", category: "Wet areas", in_scope_flag: true, what_to_check: "Check pantry sink, tap, tiles, ventilation, and electrical points.", ideal_state: "Pantry fully functional with working utilities.", threshold_good: "All plumbing and electrical points tested and operational.", threshold_amber: "One minor utility item outstanding." },
    { sr_no: 9, work_type: "Faulty Light", activity: "Replace", category: "MEP", in_scope_flag: true, what_to_check: "Check all light fittings in the store. Replace faulty or flickering lights.", ideal_state: "All lights operational, consistent lux levels throughout store.", threshold_good: "Zero faulty lights. Lux level meets brand standard.", threshold_amber: "1–2 lights pending delivery from vendor." },
    { sr_no: 10, work_type: "Increase Lux Level – Add lights", activity: "Add", category: "MEP", in_scope_flag: true, what_to_check: "Verify additional light fittings installed per lighting plan.", ideal_state: "Additional lights installed, lux level meets revised standard.", threshold_good: "Lux reading at agreed points matches lighting plan.", threshold_amber: "Lights installed, minor wiring finish pending electrician sign-off." },
    { sr_no: 11, work_type: "Ceiling Paper Installation", activity: "Replace", category: "Interior", in_scope_flag: true, what_to_check: "Inspect ceiling paper installation for bubbles, tears, and alignment.", ideal_state: "Ceiling paper installed smoothly, no bubbles or tears.", threshold_good: "Full coverage, pattern aligned, no seams visible from 2m.", threshold_amber: "Minor bubble at edge, to be rectified within 3 days." },
    { sr_no: 12, work_type: "Wall Paper Installation", activity: "Replace", category: "Interior", in_scope_flag: true, what_to_check: "Inspect wallpaper installation across all designated walls.", ideal_state: "Wallpaper installed per brand spec, no bubbles or misalignment.", threshold_good: "Full wall coverage, pattern matched, edges sealed.", threshold_amber: "Minor section at lower wall pending adhesive dry time." },
    { sr_no: 13, work_type: "Damaged Grid Tile Ceiling", activity: "Replace", category: "Interior", in_scope_flag: true, what_to_check: "Check all grid ceiling tiles for damage, staining, or sagging.", ideal_state: "All damaged grid tiles replaced with matching specification.", threshold_good: "100% tile count replaced, grid alignment correct.", threshold_amber: "1–2 tiles pending from vendor, area contained." },
    { sr_no: 14, work_type: "Damaged Ceiling", activity: "Rectify", category: "Interior", in_scope_flag: true, what_to_check: "Inspect ceiling surface for cracks, water damage, and paint peeling.", ideal_state: "Ceiling surface smooth, painted, no visible damage.", threshold_good: "No cracks or staining visible from floor level.", threshold_amber: "Minor hairline crack rectified, paint touch-up remaining." },
    { sr_no: 15, work_type: "Façade ACP", activity: "Remove", category: "Façade", in_scope_flag: true, what_to_check: "Verify ACP panels removed from façade as per de-branding plan.", ideal_state: "All ACP panels removed, surface cleaned and made good.", threshold_good: "Full removal complete, no fixings or adhesive residue visible.", threshold_amber: "Panels removed, minor surface making-good in progress." },
    { sr_no: 16, work_type: "Façade Window Opening", activity: "Open", category: "Façade", in_scope_flag: true, what_to_check: "Confirm window opening work completed per architectural drawings.", ideal_state: "Window opened to specified dimensions, frame finished.", threshold_good: "Dimensions match drawing, structural integrity confirmed.", threshold_amber: "Opening complete, frame finishing pending." },
    { sr_no: 17, work_type: "Broken Fixture", activity: "Repair", category: "Fixtures", in_scope_flag: true, what_to_check: "Identify and repair all broken garment/display fixtures on floor.", ideal_state: "All broken fixtures repaired or replaced, floor-ready.", threshold_good: "Zero broken fixtures on shop floor.", threshold_amber: "1–2 fixtures awaiting spare part." },
    { sr_no: 18, work_type: "Backlit Signage Boxes", activity: "Rectify", category: "Façade", in_scope_flag: true, what_to_check: "Test all backlit signage boxes. Rectify faulty lighting or panel issues.", ideal_state: "All backlit signs illuminated evenly, no dark patches.", threshold_good: "Full illumination at correct colour temperature.", threshold_amber: "One panel with minor ballast issue, repair booked." },
    { sr_no: 19, work_type: "Remove Super Graphics", activity: "Remove", category: "Façade", in_scope_flag: true, what_to_check: "Verify all super graphics and vinyl removed from walls and façade.", ideal_state: "All super graphics fully removed, surface prepared for new finish.", threshold_good: "No graphics or adhesive residue visible.", threshold_amber: "Graphics removed, minor adhesive residue to be cleaned." },
    { sr_no: 20, work_type: "Cash Till", activity: "Replace", category: "Fixtures", in_scope_flag: false, what_to_check: "Confirm old cash till removed and new till installed and tested.", ideal_state: "New cash till installed, tested, and operational.", threshold_good: "Cash drawer opens, printer functional, system integrated.", threshold_amber: "Till installed, IT integration pending same day." },
    { sr_no: 21, work_type: "Power Point", activity: "New", category: "Fixtures", in_scope_flag: false, what_to_check: "Verify new power points installed at locations per layout plan.", ideal_state: "All new power points installed, earthed, and tested.", threshold_good: "Power points live, RCD tested, no exposed wiring.", threshold_amber: "Points installed, final RCD test pending electrician." },
    { sr_no: 22, work_type: "Baggage Counter, CSD, Alteration Desk", activity: "Remove", category: "Fixtures", in_scope_flag: false, what_to_check: "Confirm removal of baggage counter, CSD desk, and alteration desk.", ideal_state: "All three units fully removed, floor area cleared.", threshold_good: "Floor surface made good after removal, no bolt holes visible.", threshold_amber: "Units removed, floor making-good in progress." },
    { sr_no: 23, work_type: "Cash Till Back Wall Visual", activity: "New", category: "Fixtures", in_scope_flag: false, what_to_check: "Confirm new back wall visual installed at cash till area.", ideal_state: "Visual installed plumb, no bubbles, lit if backlit.", threshold_good: "Visual aligned to brand spec, full panel coverage.", threshold_amber: "Visual installed, minor edge trim pending." },
  ];

  const { error: checklistError } = await supabase
    .from("checklist_items")
    .upsert(checklistItems, { onConflict: "sr_no" });

  if (checklistError) console.error("  ❌ Checklist error:", checklistError);
  else console.log(`  ✅ ${checklistItems.length} checklist items created\n`);

  // --- STORAGE BUCKETS ---
  console.log("Creating storage buckets...");

  const buckets = [
    { id: "selfies", public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/*"] },
    { id: "evidence", public: false, fileSizeLimit: 100 * 1024 * 1024, allowedMimeTypes: ["image/*", "video/*"] },
    { id: "thumbnails", public: false, fileSizeLimit: 1 * 1024 * 1024, allowedMimeTypes: ["image/*"] },
    { id: "reports", public: false, fileSizeLimit: 20 * 1024 * 1024, allowedMimeTypes: ["application/pdf"] },
  ];

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });
    if (error && !error.message?.includes("already exists")) {
      console.error(`  ❌ Bucket ${bucket.id} error:`, error);
    } else {
      console.log(`  ✅ Bucket: ${bucket.id}`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("\nTest credentials:");
  console.log("┌─────────────────┬──────────────────────────────┬──────────────┐");
  console.log("│ Employee ID     │ Email                        │ Password     │");
  console.log("├─────────────────┼──────────────────────────────┼──────────────┤");
  console.log("│ EMP-NSO-001     │ priya.kapoor@company.com     │ Nso@1234     │");
  console.log("│ EMP-NSO-002     │ arvind.mehta@company.com      │ Nso@1234     │");
  console.log("│ EMP-SM-001      │ amit.sharma@company.com       │ Sm@1234      │");
  console.log("│ EMP-SM-002      │ rahul.sinha@company.com       │ Sm@1234      │");
  console.log("│ EMP-SM-003      │ sneha.patil@company.com       │ Sm@1234      │");
  console.log("│ EMP-ADM-001     │ admin@company.com             │ Admin@1234   │");
  console.log("└─────────────────┴──────────────────────────────┴──────────────┘");
}

seed().catch(console.error);
