create index if not exists article_briefs_article_id_idx on public.article_briefs(article_id);
create index if not exists agent_conversations_article_id_idx on public.agent_conversations(article_id);
create index if not exists agent_conversations_job_id_idx on public.agent_conversations(job_id);
create index if not exists seo_research_job_id_idx on public.seo_research(job_id);
create index if not exists source_research_job_id_idx on public.source_research(job_id);
create index if not exists technical_audits_job_id_idx on public.technical_audits(job_id);
create index if not exists review_decisions_recommendation_id_idx on public.review_decisions(recommendation_id);

create policy "server only articles"
  on public.articles
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only article briefs"
  on public.article_briefs
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only agent conversations"
  on public.agent_conversations
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only optimization jobs"
  on public.optimization_jobs
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only seo research"
  on public.seo_research
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only source research"
  on public.source_research
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only technical audits"
  on public.technical_audits
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only recommendations"
  on public.recommendations
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "server only review decisions"
  on public.review_decisions
  for all
  to anon, authenticated
  using (false)
  with check (false);
