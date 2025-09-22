-- AnonSignals Database Schema
-- This file contains the complete database schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    email_blueprint VARCHAR(500) NOT NULL, -- GitHub blueprint format: username/blueprint-name@version
    semaphore_group_id VARCHAR(100) NOT NULL UNIQUE,
    creator_anonymous_id VARCHAR(100) NOT NULL,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships table
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_anonymous_id VARCHAR(100) NOT NULL,
    semaphore_identity_commitment VARCHAR(200) NOT NULL,
    zk_email_proof_hash VARCHAR(200) NOT NULL,
    zk_verify_proof_hash VARCHAR(200) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_anonymous_id),
    UNIQUE(group_id, semaphore_identity_commitment)
);

-- Posts table (includes both posts and proposals)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    author_anonymous_id VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('post', 'proposal')) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    semaphore_proof TEXT NOT NULL, -- JSON serialized Semaphore proof
    zk_verify_proof_hash VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    voter_anonymous_id VARCHAR(100) NOT NULL,
    vote_choice VARCHAR(10) CHECK (vote_choice IN ('yes', 'no')) NOT NULL,
    semaphore_proof TEXT NOT NULL, -- JSON serialized Semaphore proof
    zk_verify_proof_hash VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, voter_anonymous_id) -- Prevent double voting
);

-- Semaphore identities table (stores encrypted identity secrets)
CREATE TABLE semaphore_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_anonymous_id VARCHAR(100) NOT NULL UNIQUE,
    identity_commitment VARCHAR(200) NOT NULL UNIQUE,
    identity_secret TEXT NOT NULL, -- Encrypted with user's local key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_groups_creator ON groups(creator_anonymous_id);
CREATE INDEX idx_groups_semaphore_id ON groups(semaphore_group_id);
CREATE INDEX idx_memberships_group ON group_memberships(group_id);
CREATE INDEX idx_memberships_user ON group_memberships(user_anonymous_id);
CREATE INDEX idx_posts_group ON posts(group_id);
CREATE INDEX idx_posts_author ON posts(author_anonymous_id);
CREATE INDEX idx_votes_post ON votes(post_id);
CREATE INDEX idx_votes_voter ON votes(voter_anonymous_id);
CREATE INDEX idx_identities_user ON semaphore_identities(user_anonymous_id);

-- Row Level Security (RLS) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE semaphore_identities ENABLE ROW LEVEL SECURITY;

-- Public read access for groups
CREATE POLICY "Groups are publicly readable" ON groups
    FOR SELECT USING (true);

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (true);

-- Allow public updates to groups (for simplicity in anonymous context)
CREATE POLICY "Public group updates" ON groups
    FOR UPDATE USING (true);

-- Public read access for group memberships (for member counts)
CREATE POLICY "Group memberships are publicly readable" ON group_memberships
    FOR SELECT USING (true);

-- Users can join groups
CREATE POLICY "Users can join groups" ON group_memberships
    FOR INSERT WITH CHECK (true);

-- Public read access for posts
CREATE POLICY "Posts are publicly readable" ON posts
    FOR SELECT USING (true);

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (true);

-- Public read access for votes (for vote counts)
CREATE POLICY "Votes are publicly readable" ON votes
    FOR SELECT USING (true);

-- Users can cast votes
CREATE POLICY "Users can cast votes" ON votes
    FOR INSERT WITH CHECK (true);

-- Allow public access to semaphore identities (they're already anonymous)
CREATE POLICY "Public access to semaphore identities" ON semaphore_identities
    FOR ALL USING (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update member count when someone joins/leaves a group
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for member count updates
CREATE TRIGGER update_member_count_trigger
    AFTER INSERT OR DELETE ON group_memberships
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
