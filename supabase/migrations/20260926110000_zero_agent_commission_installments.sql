-- A later tuition installment may earn university commission after the
-- package's one-time fixed agent reward has already been paid.
alter table public."commission_calculations"
  drop constraint "commission_calculations_finance_check";

alter table public."commission_calculations"
  add constraint "commission_calculations_finance_check" check (
    (
      "status" in ('PAYABLE', 'PARTIALLY_PAID', 'PAID')
      and "university_receivable_id" is not null
      and ("agent_amount" = 0 or "agent_payable_id" is not null)
      and ("agent_amount" > 0 or "agent_payable_id" is null)
    )
    or "status" not in ('PAYABLE', 'PARTIALLY_PAID', 'PAID')
  );
