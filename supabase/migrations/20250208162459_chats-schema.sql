drop table if exists chats;

create table chats (
  id uuid primary key default uuid_generate_v4(),
  chat_id text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone
);
