alter type public."AgreementStatus" add value if not exists 'NONE';
alter type public."AgreementStatus" add value if not exists 'PENDING';

alter type public."PartnershipStatus" add value if not exists 'AGREEMENT_PENDING';
alter type public."PartnershipStatus" add value if not exists 'SUSPENDED';
alter type public."PartnershipStatus" add value if not exists 'ARCHIVED';

alter type public."ProgramStatus" add value if not exists 'INACTIVE';

alter type public."RelatedEntityType" add value if not exists 'PERIOD';

alter type public."ScholarshipType" add value if not exists 'AMOUNT';
alter type public."ScholarshipType" add value if not exists 'CUSTOM';

alter type public."SchoolType" add value if not exists 'PUBLIC_PRIVATE';
alter type public."SchoolType" add value if not exists 'COLLEGE';
alter type public."SchoolType" add value if not exists 'LANGUAGE_SCHOOL';
alter type public."SchoolType" add value if not exists 'OTHER';

alter type public."UserRole" add value if not exists 'HR';
alter type public."UserRole" add value if not exists 'READ_ONLY';
