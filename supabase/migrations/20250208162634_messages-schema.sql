drop table if exists messages;

create table messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id bigint not null, -- Убрали связь с chats и сделали BIGINT
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_messages_chat_id on messages(chat_id);