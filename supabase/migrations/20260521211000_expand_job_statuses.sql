alter table public.optimization_jobs
  drop constraint if exists optimization_jobs_status_check;

alter table public.optimization_jobs
  add constraint optimization_jobs_status_check
  check (
    status in (
      'queued',
      'preparing',
      'researching',
      'keyword_research',
      'source_research',
      'technical_audit',
      'saving_research',
      'drafting',
      'reviewing',
      'generating_rewrites',
      'saving_recommendations',
      'completed',
      'failed'
    )
  );
