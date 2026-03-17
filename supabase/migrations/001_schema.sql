create extension if not exists "uuid-ossp";

create table regions (
  id uuid primary key default uuid_generate_v4(),
  region_code text unique not null,
  region_name text not null,
  business_states text,
  status text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  employee_code text unique not null,
  full_name text not null,
  email text unique not null,
  mobile text not null,
  role text not null check (role in ('NSO Head','SM','DM','CM','EPC','FM','Admin')),
  sub_role text,
  store_codes text[] default '{}',
  region_id uuid references regions(id),
  status text default 'active' check (status in ('active','inactive')),
  notes text,
  auth_user_id uuid references auth.users(id),
  first_login boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table stores (
  id uuid primary key default uuid_generate_v4(),
  store_code text unique not null,
  store_name text not null,
  address text,
  city text not null,
  state text not null,
  business_state_region text,
  store_type text default 'Standard' check (store_type in ('Standard','Large','Flagship')),
  assigned_sm_id uuid references employees(id),
  assigned_nso_id uuid references employees(id),
  target_completion_date date,
  status text default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  sr_no integer unique not null,
  work_type text not null,
  activity text not null,
  category text not null check (category in ('MEP','Interior','Wet areas','Façade','Fixtures')),
  in_scope_flag boolean default true,
  what_to_check text,
  ideal_state text,
  threshold_good text,
  threshold_amber text,
  status text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table audits (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references stores(id),
  sm_id uuid not null references employees(id),
  status text default 'in_progress' check (status in ('in_progress','submitted','pending_review','rework_required','resubmitted','approved','rejected')),
  selfie_url text,
  consent_given boolean default false,
  consent_timestamp timestamptz,
  last_item_index integer default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references employees(id),
  nso_decision text check (nso_decision in ('approve','rework','reject')),
  nso_remarks text,
  rework_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table audit_items (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references audits(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id),
  in_scope boolean default true,
  damage_count integer,
  satisfaction_status text check (satisfaction_status in ('satisfied','not_satisfied')),
  sm_remarks text,
  planned_start_date date,
  actual_start_date date,
  task_start_date date,
  task_end_date date,
  status text default 'pending' check (status in ('pending','in_progress','completed','flagged','out_of_scope')),
  nso_item_remarks text,
  nso_item_status text default 'pending_review' check (nso_item_status in ('accepted','rework_required','pending_review')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table audit_evidence (
  id uuid primary key default uuid_generate_v4(),
  audit_item_id uuid not null references audit_items(id) on delete cascade,
  audit_id uuid not null references audits(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('photo','video')),
  file_size_bytes integer,
  duration_seconds integer,
  thumbnail_url text,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references employees(id)
);

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references audits(id) on delete cascade,
  audit_item_id uuid references audit_items(id),
  sender_id uuid not null references employees(id),
  message text not null,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references employees(id),
  type text not null check (type in ('audit_submitted','audit_approved','audit_rejected','rework_required','item_comment','deadline_warning','overdue','inactivity_reminder','resubmission')),
  title text not null,
  body text not null,
  reference_id uuid,
  reference_type text check (reference_type in ('audit','audit_item')),
  read boolean default false,
  created_at timestamptz default now()
);

create table audit_trail (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  action_type text not null check (action_type in ('create','update','submit','approve','rework','reject','login','upload','import')),
  entity_type text not null check (entity_type in ('audit','audit_item','evidence','store','employee','checklist_item')),
  entity_id uuid,
  field_changed text,
  old_value text,
  new_value text,
  ip_address text,
  created_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_regions_updated before update on regions for each row execute function update_updated_at();
create trigger trg_employees_updated before update on employees for each row execute function update_updated_at();
create trigger trg_stores_updated before update on stores for each row execute function update_updated_at();
create trigger trg_checklist_updated before update on checklist_items for each row execute function update_updated_at();
create trigger trg_audits_updated before update on audits for each row execute function update_updated_at();
create trigger trg_audit_items_updated before update on audit_items for each row execute function update_updated_at();

alter table regions enable row level security;
alter table employees enable row level security;
alter table stores enable row level security;
alter table checklist_items enable row level security;
alter table audits enable row level security;
alter table audit_items enable row level security;
alter table audit_evidence enable row level security;
alter table conversations enable row level security;
alter table notifications enable row level security;
alter table audit_trail enable row level security;

create or replace function get_my_role() returns text as $$ select role from employees where auth_user_id = auth.uid() limit 1; $$ language sql security definer;
create or replace function get_my_employee_id() returns uuid as $$ select id from employees where auth_user_id = auth.uid() limit 1; $$ language sql security definer;
create or replace function get_my_store_codes() returns text[] as $$ select store_codes from employees where auth_user_id = auth.uid() limit 1; $$ language sql security definer;

create policy "employees_read" on employees for select using (auth.uid() is not null);
create policy "employees_write" on employees for all using (get_my_role() = 'Admin');
create policy "regions_read" on regions for select using (auth.uid() is not null);
create policy "regions_write" on regions for all using (get_my_role() = 'Admin');
create policy "checklist_read" on checklist_items for select using (auth.uid() is not null);
create policy "checklist_write" on checklist_items for all using (get_my_role() = 'Admin');
create policy "stores_read" on stores for select using (auth.uid() is not null);
create policy "stores_write" on stores for all using (get_my_role() = 'Admin');
create policy "audits_sm" on audits for all using (get_my_role() = 'SM' and sm_id = get_my_employee_id());
create policy "audits_nso" on audits for select using (get_my_role() = 'NSO Head' and store_id in (select id from stores where assigned_nso_id = get_my_employee_id()));
create policy "audits_nso_update" on audits for update using (get_my_role() = 'NSO Head' and store_id in (select id from stores where assigned_nso_id = get_my_employee_id()));
create policy "audits_admin" on audits for all using (get_my_role() = 'Admin');
create policy "audit_items_sm" on audit_items for all using (audit_id in (select id from audits where sm_id = get_my_employee_id()));
create policy "audit_items_nso" on audit_items for all using (audit_id in (select a.id from audits a join stores s on a.store_id = s.id where s.assigned_nso_id = get_my_employee_id()));
create policy "audit_items_admin" on audit_items for all using (get_my_role() = 'Admin');
create policy "evidence_sm" on audit_evidence for all using (audit_id in (select id from audits where sm_id = get_my_employee_id()));
create policy "evidence_nso" on audit_evidence for select using (audit_id in (select a.id from audits a join stores s on a.store_id = s.id where s.assigned_nso_id = get_my_employee_id()));
create policy "evidence_admin" on audit_evidence for all using (get_my_role() = 'Admin');
create policy "notifications_own" on notifications for all using (recipient_id = get_my_employee_id());
create policy "conversations_participants" on conversations for all using (audit_id in (select id from audits where sm_id = get_my_employee_id() union select a.id from audits a join stores s on a.store_id = s.id where s.assigned_nso_id = get_my_employee_id()) or get_my_role() = 'Admin');
create policy "audit_trail_admin" on audit_trail for select using (get_my_role() = 'Admin');
