-- Scholarship composition data is administered only by the ERP server.
-- Keep it unavailable through the public Data API until role-aware policies exist.
ALTER TABLE public.commission_package_scholarship_awards
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commission_package_scholarship_award_programs
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.commission_package_scholarship_awards
  FROM anon, authenticated;

REVOKE ALL ON TABLE public.commission_package_scholarship_award_programs
  FROM anon, authenticated;

GRANT ALL ON TABLE public.commission_package_scholarship_awards
  TO service_role;

GRANT ALL ON TABLE public.commission_package_scholarship_award_programs
  TO service_role;
