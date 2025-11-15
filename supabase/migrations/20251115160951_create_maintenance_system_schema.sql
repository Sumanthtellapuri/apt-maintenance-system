/*
  # Apartment Maintenance Request System Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'tenant' or 'landlord')
      - `created_at` (timestamptz)
    
    - `maintenance_requests`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category` (text: plumbing, electrical, hvac, appliance, other)
      - `priority` (text: low, medium, high, urgent)
      - `status` (text: pending, in_progress, completed, cancelled)
      - `photo_url` (text, nullable)
      - `assigned_to` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `request_comments`
      - `id` (uuid, primary key)
      - `request_id` (uuid, references maintenance_requests)
      - `user_id` (uuid, references profiles)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, update only their own
    - Maintenance Requests: Tenants can CRUD their own, landlords can read/update all
    - Comments: Users can create comments, read comments on requests they have access to
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  photo_url text,
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own requests"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'landlord')
  );

CREATE POLICY "Tenants can create own requests"
  ON maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update own requests"
  ON maintenance_requests FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'landlord')
  )
  WITH CHECK (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'landlord')
  );

CREATE POLICY "Users can delete own requests"
  ON maintenance_requests FOR DELETE
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE TABLE IF NOT EXISTS request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible requests"
  ON request_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = request_id AND (
        mr.tenant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'landlord')
      )
    )
  );

CREATE POLICY "Users can create comments on accessible requests"
  ON request_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = request_id AND (
        mr.tenant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'landlord')
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_request_comments_request_id ON request_comments(request_id);
