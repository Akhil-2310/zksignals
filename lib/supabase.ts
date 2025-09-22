import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Database schema types
export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          description: string
          email_blueprint: string
          semaphore_group_id: string
          creator_anonymous_id: string
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          email_blueprint: string
          semaphore_group_id: string
          creator_anonymous_id: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          email_blueprint?: string
          semaphore_group_id?: string
          creator_anonymous_id?: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_anonymous_id: string
          semaphore_identity_commitment: string
          zk_email_proof_hash: string
          zk_verify_proof_hash: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_anonymous_id: string
          semaphore_identity_commitment: string
          zk_email_proof_hash: string
          zk_verify_proof_hash: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_anonymous_id?: string
          semaphore_identity_commitment?: string
          zk_email_proof_hash?: string
          zk_verify_proof_hash?: string
          joined_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          group_id: string
          author_anonymous_id: string
          type: 'post' | 'proposal'
          title: string
          content: string
          semaphore_proof: string
          zk_verify_proof_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          author_anonymous_id: string
          type: 'post' | 'proposal'
          title: string
          content: string
          semaphore_proof: string
          zk_verify_proof_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          author_anonymous_id?: string
          type?: 'post' | 'proposal'
          title?: string
          content?: string
          semaphore_proof?: string
          zk_verify_proof_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          post_id: string
          voter_anonymous_id: string
          vote_choice: 'yes' | 'no'
          semaphore_proof: string
          zk_verify_proof_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          voter_anonymous_id: string
          vote_choice: 'yes' | 'no'
          semaphore_proof: string
          zk_verify_proof_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          voter_anonymous_id?: string
          vote_choice?: 'yes' | 'no'
          semaphore_proof?: string
          zk_verify_proof_hash?: string
          created_at?: string
        }
      }
      semaphore_identities: {
        Row: {
          id: string
          user_anonymous_id: string
          identity_commitment: string
          identity_secret: string // Encrypted with user's local key
          created_at: string
        }
        Insert: {
          id?: string
          user_anonymous_id: string
          identity_commitment: string
          identity_secret: string
          created_at?: string
        }
        Update: {
          id?: string
          user_anonymous_id?: string
          identity_commitment?: string
          identity_secret?: string
          created_at?: string
        }
      }
    }
  }
}
