create table public.defense_news (
  id uuid not null default gen_random_uuid (),
  title text not null,
  link text not null,
  published_at timestamp with time zone null,
  thumbnail_url text null,
  created_at timestamp with time zone null default now(),
  constraint defense_news_pkey primary key (id),
  constraint defense_news_link_key unique (link)
) TABLESPACE pg_default;

create index IF not exists idx_defense_news_published_at on public.defense_news using btree (published_at desc) TABLESPACE pg_default;