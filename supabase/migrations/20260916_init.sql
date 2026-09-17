-- Migration: 20260916_init.sql
-- Royal Mgwasi Hotel Supabase Schema & Initial Setup

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

-- 1. Tables

create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  category text not null,               -- 'Standard' | 'Suite' | 'Superior' | 'Executive' | 'Apartment'
  capacity_label text,
  price_tzs numeric(12,2),              -- null = "Price on Request"
  total_units integer not null default 1,
  description text,
  tags text[] default '{}',
  amenities text[] default '{}',
  color_class text,
  sort_order smallint default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists room_images (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade,
  storage_path text not null,           -- path inside the 'room-images' bucket
  sort_order smallint default 0,
  is_cover boolean default false
);

create table if not exists gallery_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,               -- 'Grounds' | 'Rooms' | 'Pool' | 'Dining' | 'Events'
  storage_path text,
  color_class text,
  sort_order smallint default 0,
  is_published boolean not null default true
);

do $$ begin
  create type booking_status as enum ('pending','confirmed','checked_in','checked_out','cancelled','no_show');
exception
  when duplicate_object then null;
end $$;

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_code text unique not null default upper(substr(uuid_generate_v4()::text, 1, 8)),
  guest_name text not null,
  guest_phone text not null,
  room_id uuid not null references rooms(id),
  check_in date not null,
  check_out date not null,
  guest_count_label text,
  special_requests text,
  status booking_status not null default 'pending',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  guest_name text not null,
  trip_type text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  is_published boolean not null default false,   -- moderation gate
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  badge text,
  description text,
  perks text[] default '{}',
  price_note text,
  is_active boolean not null default true,
  sort_order smallint default 0
);

create table if not exists event_inquiries (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  event_type text,
  guest_count text,
  target_date date,
  notes text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  email text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 2. Admin access profiles

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff'    -- 'owner' | 'manager' | 'staff'
);

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid());
$$ language sql security definer;

-- 3. Row Level Security

alter table rooms enable row level security;
alter table room_images enable row level security;
alter table gallery_items enable row level security;
alter table offers enable row level security;
alter table site_settings enable row level security;
alter table reviews enable row level security;
alter table bookings enable row level security;
alter table event_inquiries enable row level security;
alter table contact_messages enable row level security;
alter table profiles enable row level security;

-- Public (anon) can read published/active content
drop policy if exists "public read rooms" on rooms;
create policy "public read rooms" on rooms for select using (is_active = true);

drop policy if exists "public read room_images" on room_images;
create policy "public read room_images" on room_images for select using (true);

drop policy if exists "public read gallery" on gallery_items;
create policy "public read gallery" on gallery_items for select using (is_published = true);

drop policy if exists "public read offers" on offers;
create policy "public read offers" on offers for select using (is_active = true);

drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);

drop policy if exists "public read published reviews" on reviews;
create policy "public read published reviews" on reviews for select using (is_published = true);

-- Public can submit — but never read, update, or delete each other's data
drop policy if exists "public submit bookings" on bookings;
create policy "public submit bookings" on bookings for insert with check (true);

drop policy if exists "public submit reviews" on reviews;
create policy "public submit reviews" on reviews for insert with check (is_published = false);

drop policy if exists "public submit event inquiries" on event_inquiries;
create policy "public submit event inquiries" on event_inquiries for insert with check (true);

drop policy if exists "public submit contact messages" on contact_messages;
create policy "public submit contact messages" on contact_messages for insert with check (true);

-- Admins (matched via profiles) get full access everywhere
drop policy if exists "admin full access rooms" on rooms;
create policy "admin full access rooms" on rooms for all using (is_admin());

drop policy if exists "admin full access room_images" on room_images;
create policy "admin full access room_images" on room_images for all using (is_admin());

drop policy if exists "admin full access gallery" on gallery_items;
create policy "admin full access gallery" on gallery_items for all using (is_admin());

drop policy if exists "admin full access offers" on offers;
create policy "admin full access offers" on offers for all using (is_admin());

drop policy if exists "admin full access settings" on site_settings;
create policy "admin full access settings" on site_settings for all using (is_admin());

drop policy if exists "admin full access reviews" on reviews;
create policy "admin full access reviews" on reviews for all using (is_admin());

drop policy if exists "admin full access bookings" on bookings;
create policy "admin full access bookings" on bookings for all using (is_admin());

drop policy if exists "admin full access event_inquiries" on event_inquiries;
create policy "admin full access event_inquiries" on event_inquiries for all using (is_admin());

drop policy if exists "admin full access contact_messages" on contact_messages;
create policy "admin full access contact_messages" on contact_messages for all using (is_admin());

drop policy if exists "admin full access profiles" on profiles;
create policy "admin full access profiles" on profiles for all using (is_admin());

-- 4. Storage buckets & policies
insert into storage.buckets (id, name, public) values
  ('room-images', 'room-images', true),
  ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to room-images" on storage.objects;
create policy "Public Access to room-images"
  on storage.objects for select
  using ( bucket_id = 'room-images' );

drop policy if exists "Public Access to gallery-images" on storage.objects;
create policy "Public Access to gallery-images"
  on storage.objects for select
  using ( bucket_id = 'gallery-images' );

drop policy if exists "Admin Insert to room-images" on storage.objects;
create policy "Admin Insert to room-images"
  on storage.objects for insert
  with check ( bucket_id = 'room-images' and is_admin() );

drop policy if exists "Admin Update to room-images" on storage.objects;
create policy "Admin Update to room-images"
  on storage.objects for update
  using ( bucket_id = 'room-images' and is_admin() );

drop policy if exists "Admin Delete to room-images" on storage.objects;
create policy "Admin Delete to room-images"
  on storage.objects for delete
  using ( bucket_id = 'room-images' and is_admin() );

drop policy if exists "Admin Insert to gallery-images" on storage.objects;
create policy "Admin Insert to gallery-images"
  on storage.objects for insert
  with check ( bucket_id = 'gallery-images' and is_admin() );

drop policy if exists "Admin Update to gallery-images" on storage.objects;
create policy "Admin Update to gallery-images"
  on storage.objects for update
  using ( bucket_id = 'gallery-images' and is_admin() );

drop policy if exists "Admin Delete to gallery-images" on storage.objects;
create policy "Admin Delete to gallery-images"
  on storage.objects for delete
  using ( bucket_id = 'gallery-images' and is_admin() );

-- 5. Seed Site Settings
insert into site_settings (key, value) values
  ('whatsapp_number', '255762555557'),
  ('reception_hours', 'Open 24 hours'),
  ('reply_promise_minutes', '15'),
  ('address', 'Forest Mpya, Mzumbe University area, Mbeya 54113')
on conflict (key) do update set value = excluded.value;

-- 6. Seed Rooms catalog (8 real rooms)
insert into rooms (slug, name, category, price_tzs, total_units, color_class, capacity_label, description, amenities, tags, sort_order)
values
  (
    'junior-suite', 
    'Junior Suite', 
    'Suite', 
    250000, 
    4, 
    'ph--forest', 
    '2 Guests', 
    'An expansive, beautifully appointed suite featuring a luxurious king bed, private balcony, and serene garden and pool views.', 
    array['King-size Bed', 'Private Balcony', 'Pool Access', 'Free Breakfast', 'Free Wi-Fi', 'En-suite Hot Shower', 'Air Conditioning'], 
    array['Free breakfast', 'Pool access', 'Private Balcony', 'King Bed'], 
    1
  ),
  (
    'standard-twin-beds', 
    'Standard Twin Beds', 
    'Standard', 
    null, 
    3, 
    'ph--slate', 
    '2 Guests (Twin)', 
    'Comfortable and quiet room furnished with two separate twin beds, ideal for colleagues, friends, or travel companions.', 
    array['Two Twin Beds', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', 'Daily Housekeeping'], 
    array['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Twin Beds'], 
    2
  ),
  (
    'standard-double-room', 
    'Standard Double Room', 
    'Standard', 
    100000, 
    3, 
    'ph--sand', 
    '2 Guests', 
    'Cozy and restful double accommodation equipped with en-suite hot shower, dedicated work desk, and fast Wi-Fi.', 
    array['Double Bed', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'En-suite Shower', 'Daily Housekeeping'], 
    array['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Double Bed'], 
    3
  ),
  (
    'superior-room', 
    'Superior Room', 
    'Superior', 
    200000, 
    15, 
    'ph--olive', 
    '2 Guests', 
    'Elevated comfort with premium bedding, generous room layout, ambient lighting, and convenient access to the poolside.', 
    array['King-size Bed', 'Air Conditioning', 'Flat-screen TV', 'Free Breakfast', 'Free Wi-Fi', 'Hot Shower', 'Work Desk'], 
    array['Free breakfast', 'Pool access', 'Free Wi-Fi', 'King Bed'], 
    4
  ),
  (
    'executive-room', 
    'Executive Room', 
    'Executive', 
    220000, 
    6, 
    'ph--dusk', 
    '2 Guests', 
    'Tailored for corporate travelers and diplomats desiring executive workspace, refined finishes, and tranquil surroundings.', 
    array['King-size Bed', 'Executive Work Desk', 'Air Conditioning', 'Free Breakfast', 'High-Speed Wi-Fi', 'En-suite Hot Shower', 'Room Service'], 
    array['Free breakfast', 'Work Desk', 'Pool access', 'King Bed'], 
    5
  ),
  (
    'one-bed-apartment', 
    'One Bed Apartment', 
    'Apartment', 
    350000, 
    2, 
    'ph--brown', 
    '2 Guests + Kitchenette', 
    'Self-contained apartment featuring a separate bedroom, comfortable living room, and convenient kitchenette for extended stays.', 
    array['Double Bed', 'Kitchenette', 'Separate Living Area', 'Free Breakfast', 'Free Wi-Fi', 'Refrigerator', 'En-suite Bathroom'], 
    array['Free breakfast', 'Kitchenette', 'Living Area', 'Free Parking'], 
    6
  ),
  (
    'standard-studio-room', 
    'Standard Studio Room', 
    'Standard', 
    150000, 
    18, 
    'ph--green', 
    '2-3 Guests', 
    'Open-plan studio offering flexible sleeping space, comfortable seating area, and seamless Wi-Fi connectivity.', 
    array['Studio Bedding', 'Seating Lounge', 'Free Breakfast', 'Free Wi-Fi', 'Work Desk', 'Hot Shower', 'Daily Housekeeping'], 
    array['Free breakfast', 'Free Wi-Fi', 'Seating Area', 'Work Desk'], 
    7
  ),
  (
    'standard-deluxe-room', 
    'Standard Deluxe Room', 
    'Standard', 
    120000, 
    3, 
    'ph--sand', 
    '2 Guests', 
    'Enhanced standard room offering extra square footage, plush mattress, smart workstation, and modern en-suite amenities.', 
    array['Queen-size Bed', 'Air Conditioning', 'Flat-screen TV', 'Free Breakfast', 'Free Wi-Fi', 'En-suite Shower', 'Work Desk'], 
    array['Free breakfast', 'Free Wi-Fi', 'Free Parking', 'Queen Bed'], 
    8
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  price_tzs = excluded.price_tzs,
  total_units = excluded.total_units,
  capacity_label = excluded.capacity_label,
  description = excluded.description,
  amenities = excluded.amenities,
  tags = excluded.tags,
  color_class = excluded.color_class,
  sort_order = excluded.sort_order;

-- 7. Seed Offers
insert into offers (title, badge, description, perks, price_note, is_active, sort_order)
values
  ('Weekend Live Music & Stay Package', 'Popular', 'Enjoy a 2-night weekend stay inclusive of daily free breakfast and reserved VIP seating for our Fri-Sun live band performance.', array['2 Nights Deluxe Room', 'Complimentary Breakfast', 'Reserved Live Band Seating', 'Late Check-out at 2:00 PM'], 'Inquire for Weekend Rate', true, 1),
  ('Corporate & Government Delegate Rate', 'Business', 'Special discounted rates for business executives and delegates visiting Mbeya for conferences, university events, or meetings.', array['Discounted Room Rate', 'Free Fast Wi-Fi', 'Express Laundry Service', 'Invoice / EFD Receipt Available'], 'Special Business Discount', true, 2),
  ('Extended Stay Discount (7+ Nights)', 'Best Value', 'Planning a longer visit in Mbeya? Save significantly on stays of 7 consecutive nights or more with complimentary laundry credits.', array['Up to 20% Off Room Rate', 'Complimentary Weekly Laundry', 'Daily Room Service', 'Free Airport Shuttle Assistance'], '7+ Night Discount', true, 3)
on conflict do nothing;

-- 8. Seed Verified Guest Reviews (published)
insert into reviews (guest_name, trip_type, rating, comment, is_published)
values
  ('Thorsten Fink', 'Business trip', 5, 'Rooms clean, staff friendly and the restaurant has amazing food. The tilapia was really great. A very solid place to stay in Mbeya!', true),
  ('Yasira Mohamed', 'Family holiday', 5, 'Clean, organised rooms with very pleasant staff who were very helpful—worth the value for the money paid.', true),
  ('Jackson Stapher', 'Weekend stay', 5, 'Cool place, live band every weekend—you get Royal services and great food by the poolside.', true),
  ('Emmanuel M.', 'Corporate Traveler', 5, 'Great location near Mzumbe University in Forest Mpya. Quiet atmosphere for working, excellent security and parking.', true),
  ('Grace K.', 'Leisure stay', 4, 'Wonderful hospitality! The tilapia dish in the restaurant lives up to the reputation. Rooms are spotless and quiet.', true)
on conflict do nothing;

-- 9. Seed Gallery Items
insert into gallery_items (title, category, color_class, is_published, sort_order)
values
  ('Hotel Grounds & Main Entrance', 'Grounds', 'ph--forest', true, 1),
  ('Deluxe Double Bedroom', 'Rooms', 'ph--brown', true, 2),
  ('Outdoor Swimming Pool', 'Pool', 'ph--slate', true, 3),
  ('Signature Fresh Tilapia Dish', 'Dining', 'ph--sand', true, 4),
  ('Fresh Daily Breakfast', 'Dining', 'ph--sand', true, 5),
  ('Hotel Restaurant & Lounge', 'Dining', 'ph--dusk', true, 6),
  ('Weekend Live Band Stage', 'Events', 'ph--olive', true, 7),
  ('Main Conference & Event Hall', 'Events', 'ph--brown', true, 8),
  ('Conference Hall Stage & Banquet', 'Events', 'ph--forest', true, 9),
  ('Standard Room Setup', 'Rooms', 'ph--sand', true, 10),
  ('Guest Suite Setup', 'Rooms', 'ph--sand', true, 11)
on conflict do nothing;
