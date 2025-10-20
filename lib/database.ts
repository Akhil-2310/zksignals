// Database utility functions for AnonSignals
// This file contains functions to interact with Supabase database

import { supabase } from './supabase'
import { createSemaphoreGroup, serializeGroup } from './semaphore'

export interface Group {
  id: string
  name: string
  description: string
  email_blueprint: string
  semaphore_group_id: string
  creator_anonymous_id: string
  member_count: number
  created_at: string
  updated_at?: string
}

export interface Post {
  id: string
  group_id: string
  author_anonymous_id: string
  type: "post" | "proposal"
  title: string
  content: string
  semaphore_proof: string
  zk_verify_proof_hash: string
  created_at: string
  updated_at?: string
  votes?: {
    yes: number
    no: number
  }
  user_vote?: "yes" | "no" | null
}

export interface GroupMembership {
  id: string
  group_id: string
  user_anonymous_id: string
  semaphore_identity_commitment: string
  zk_email_proof_hash: string
  zk_verify_proof_hash: string
  joined_at: string
}

export interface Vote {
  id: string
  post_id: string
  voter_anonymous_id: string
  vote_choice: "yes" | "no"
  semaphore_proof: string
  zk_verify_proof_hash: string
  created_at: string
}
  
// Database functions using Supabase

export async function getAllGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching groups:', error)
    throw new Error('Failed to fetch groups')
  }

  return data || []
}

export async function getGroupById(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Group not found
    }
    console.error('Error fetching group:', error)
    throw new Error('Failed to fetch group')
  }

  return data
}

export async function getUserGroups(userAnonymousId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_memberships')
    .select(`
      groups (
        id,
        name,
        description,
        email_blueprint,
        semaphore_group_id,
        creator_anonymous_id,
        member_count,
        created_at,
        updated_at
      )
    `)
    .eq('user_anonymous_id', userAnonymousId)

  if (error) {
    console.error('Error fetching user groups:', error)
    throw new Error('Failed to fetch user groups')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => item.groups).filter(Boolean) || []
}

export async function getGroupPosts(groupId: string, userAnonymousId: string): Promise<Post[]> {
  // First get all posts for the group
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (postsError) {
    console.error('Error fetching posts:', postsError)
    throw new Error('Failed to fetch posts')
  }

  // Get vote counts and user votes for each post
  const postsWithVotes = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('vote_choice, voter_anonymous_id')
        .eq('post_id', post.id)

      if (votesError) {
        console.error('Error fetching votes:', votesError)
        return { ...post, votes: { yes: 0, no: 0 }, user_vote: null }
      }

      const yesVotes = votes?.filter(v => v.vote_choice === 'yes').length || 0
      const noVotes = votes?.filter(v => v.vote_choice === 'no').length || 0
      const userVote = votes?.find(v => v.voter_anonymous_id === userAnonymousId)?.vote_choice || null

      return {
        ...post,
        votes: { yes: yesVotes, no: noVotes },
        user_vote: userVote as "yes" | "no" | null
      }
    })
  )

  return postsWithVotes
}

export async function createGroup(
  group: Omit<Group, "id" | "member_count" | "created_at" | "updated_at">
): Promise<Group> {
  // Create Semaphore group
  const semaphoreGroup = createSemaphoreGroup()
  // Serialize group for future use if needed
  serializeGroup(semaphoreGroup)
  
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: group.name,
      description: group.description,
      email_blueprint: group.email_blueprint,
      semaphore_group_id: group.semaphore_group_id,
      creator_anonymous_id: group.creator_anonymous_id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating group:', error)
    throw new Error('Failed to create group')
  }

  return data
}

export async function createPost(
  post: Omit<Post, "id" | "created_at" | "updated_at" | "votes" | "user_vote">
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      group_id: post.group_id,
      author_anonymous_id: post.author_anonymous_id,
      type: post.type,
      title: post.title,
      content: post.content,
      semaphore_proof: post.semaphore_proof,
      zk_verify_proof_hash: post.zk_verify_proof_hash
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }

  return { ...data, votes: { yes: 0, no: 0 }, user_vote: null }
}

export async function joinGroup(
  groupId: string,
  userAnonymousId: string,
  semaphoreIdentityCommitment: string,
  zkEmailProofHash: string,
  zkVerifyProofHash: string
): Promise<GroupMembership> {
  const { data, error } = await supabase
    .from('group_memberships')
    .insert({
      group_id: groupId,
      user_anonymous_id: userAnonymousId,
      semaphore_identity_commitment: semaphoreIdentityCommitment,
      zk_email_proof_hash: zkEmailProofHash,
      zk_verify_proof_hash: zkVerifyProofHash
    })
    .select()
    .single()

  if (error) {
    console.error('Error joining group:', error)
    throw new Error('Failed to join group')
  }

  return data
}

export async function castVote(
  postId: string, 
  voterAnonymousId: string, 
  voteChoice: "yes" | "no",
  semaphoreProof: string,
  zkVerifyProofHash: string
): Promise<Vote> {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      post_id: postId,
      voter_anonymous_id: voterAnonymousId,
      vote_choice: voteChoice,
      semaphore_proof: semaphoreProof,
      zk_verify_proof_hash: zkVerifyProofHash
    })
    .select()
    .single()

  if (error) {
    console.error('Error casting vote:', error)
    throw new Error('Failed to cast vote')
  }

  return data
}

export async function storeSemaphoreIdentity(
  userAnonymousId: string,
  identityCommitment: string,
  encryptedSecret: string
): Promise<void> {
  const { error } = await supabase
    .from('semaphore_identities')
    .upsert(
      {
        user_anonymous_id: userAnonymousId,
        identity_commitment: identityCommitment,
        identity_secret: encryptedSecret
      },
      {
        onConflict: 'user_anonymous_id'
      }
    )

  if (error) {
    console.error('Error storing Semaphore identity:', error)
    throw new Error('Failed to store Semaphore identity')
  }
}

export async function getSemaphoreIdentity(userAnonymousId: string): Promise<{
  identity_commitment: string
  identity_secret: string
} | null> {
  const { data, error } = await supabase
    .from('semaphore_identities')
    .select('identity_commitment, identity_secret')
    .eq('user_anonymous_id', userAnonymousId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Identity not found
    }
    console.error('Error fetching Semaphore identity:', error)
    throw new Error('Failed to fetch Semaphore identity')
  }

  return data
}

// Get user's stored identity commitment from group membership
export async function getUserIdentityCommitmentFromGroup(groupId: string, userAnonymousId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('group_memberships')
    .select('semaphore_identity_commitment')
    .eq('group_id', groupId)
    .eq('user_anonymous_id', userAnonymousId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Membership not found
    }
    console.error('Error fetching user group membership:', error)
    return null
  }

  return data.semaphore_identity_commitment
}

export async function isUserGroupMember(groupId: string, userAnonymousId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_anonymous_id', userAnonymousId)
    .maybeSingle()

  if (error) {
    console.error('Error checking group membership:', error)
    return false
  }

  return !!data
}

export async function getGroupMembers(groupId: string): Promise<GroupMembership[]> {
  const { data, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching group members:', error)
    throw new Error('Failed to fetch group members')
  }

  return data || []
}

// Utility function to generate anonymous user IDs
export function generateAnonymousId(): string {
  return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
}