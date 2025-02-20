drop table if exists chats;

create table chats (
  id uuid primary key default uuid_generate_v4(),
  chat_id bigint unique not null,
  model text not null default 'meta-llama/llama-3.1-70b-instruct:free' check (model in ('meta-llama/llama-3.1-70b-instruct:free', 'google/gemini-2.0-flash-lite-preview-02-05:free', 'deepseek/deepseek-r1:free')),
  lang text not null default 'en' check (lang in ('en', 'ru')),
  system_message text not null default 'You are a helpful assistant.',
  created_at timestamp with time zone default timezone('utc'::text, now())
);