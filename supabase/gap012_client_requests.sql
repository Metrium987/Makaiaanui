-- GAP-012: Client Portal — client_requests table
-- Enables white-label client portal: request submission + approval workflow

CREATE TABLE IF NOT EXISTS client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  module_type TEXT NOT NULL CHECK (module_type IN ('transport', 'accommodation', 'catering', 'laundry', 'additional_services', 'accreditations', 'deliveries')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED')),
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  details JSONB DEFAULT '{}'::jsonb,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_client_requests_org ON client_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_module ON client_requests(module_type);
CREATE INDEX IF NOT EXISTS idx_client_requests_created ON client_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_requests_org_status ON client_requests(organization_id, status);

-- Auto-update trigger
DROP TRIGGER IF EXISTS set_updated_at_client_requests ON client_requests;
CREATE TRIGGER set_updated_at_client_requests
  BEFORE UPDATE ON client_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Enable row-level security
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view requests in their organization
DROP POLICY IF EXISTS "Users can view org requests" ON client_requests;
CREATE POLICY "Users can view org requests" ON client_requests
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS: Any role can insert requests
DROP POLICY IF EXISTS "Users can create requests" ON client_requests;
CREATE POLICY "Users can create requests" ON client_requests
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS: BACK_OFFICE + ADMIN can update (approve/reject)
DROP POLICY IF EXISTS "Back-office can update requests" ON client_requests;
CREATE POLICY "Back-office can update requests" ON client_requests
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('BACK_OFFICE', 'ADMIN')
  );

-- RLS: Only ADMIN can hard-delete (though soft-delete is preferred)
DROP POLICY IF EXISTS "Admins can delete requests" ON client_requests;
CREATE POLICY "Admins can delete requests" ON client_requests
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );
