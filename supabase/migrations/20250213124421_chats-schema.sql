drop table if exists chats;

create table chats (
  id uuid primary key default uuid_generate_v4(),
  chat_id bigint unique not null,
  model text not null default 'meta-llama/llama-3.1-70b-instruct:free' check (model in ('meta-llama/llama-3.1-70b-instruct:free', 'meta-llama/llama-3.1-70b-instruct:free', 'deepseek/deepseek-r1:free'))
);