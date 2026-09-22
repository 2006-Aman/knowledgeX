-- ==============================================================
-- KnowledgeX (ConsultAI) Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================

-- 1. Users Table (Stores user accounts and profile info)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and allow public/anon access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access to users" ON public.users;
CREATE POLICY "Allow anon full access to users"
    ON public.users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. User Conversations Table (Syncs chats across devices)
CREATE TABLE IF NOT EXISTS public.user_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    conversations JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for conversations
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access to conversations" ON public.user_conversations;
CREATE POLICY "Allow anon full access to conversations"
    ON public.user_conversations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Check existing documents table
COMMENT ON TABLE public.users IS 'KnowledgeX user credentials & metadata';
COMMENT ON TABLE public.user_conversations IS 'KnowledgeX user chats synchronized to Supabase';
