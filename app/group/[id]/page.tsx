"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Shield, Users, MessageSquare, Plus, ThumbsUp, ThumbsDown, ArrowLeft, User, Loader2, Check, X, AlertCircle } from "lucide-react"
import { getGroupById, getGroupPosts, createPost, castVote, isUserGroupMember, getGroupMembers, getUserIdentityCommitmentFromGroup, type Group, type Post } from "../../../lib/database"
import { getCurrentAnonymousUser } from "../../../lib/auth"
import { getOrCreateSemaphoreIdentity, generateSemaphoreProof, getSemaphoreIdentityFromStorage, createSemaphoreGroup, addMemberToGroup, generateSemaphoreProofDeterministic } from "../../../lib/semaphore"
import { submitPostProof, submitVoteProof, waitForProofVerification } from "../../../lib/zk-verify"
import { config } from "../../../lib/config"

type VerificationDetails = {
  context: 'vote' | 'post'
  jobId?: string
  status?: string
  txHash?: string
  raw?: any
}

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string
  
  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [lastVerification, setLastVerification] = useState<VerificationDetails | null>(null)
  const [newPost, setNewPost] = useState({
    type: "post" as "post" | "proposal",
    title: "",
    content: "",
  })

  // Load group data and check membership
  useEffect(() => {
    async function loadGroupData() {
      try {
        const user = getCurrentAnonymousUser()
        
        // Load group details
        const groupData = await getGroupById(groupId)
        if (!groupData) {
          setError("Group not found")
          return
        }
        setGroup(groupData)

        // Check if user is a member
        const membershipStatus = await isUserGroupMember(groupId, user.anonymousId)
        setIsMember(membershipStatus)

        if (membershipStatus) {
          // Load posts if user is a member
          const groupPosts = await getGroupPosts(groupId, user.anonymousId)
          setPosts(groupPosts)
        }

      } catch (error) {
        console.error('Error loading group data:', error)
        setError('Failed to load group data')
      } finally {
        setIsLoading(false)
      }
    }

    loadGroupData()
  }, [groupId])

  const handleVote = async (postId: string, vote: "yes" | "no") => {
    if (!group || !isMember) return
    
    setIsVoting(postId)
    setError("")
    setSuccessMessage("")
    setLastVerification(null)

    try {
      const user = getCurrentAnonymousUser()
      
      // Get Semaphore identity
      const semaphoreIdentity = getSemaphoreIdentityFromStorage()
      if (!semaphoreIdentity) {
        throw new Error("Semaphore identity not found. Please rejoin the group.")
      }

      // Get group members to reconstruct Semaphore group
      const groupMembers = await getGroupMembers(groupId)
      const semaphoreGroup = createSemaphoreGroup() // Use depth 20 for Semaphore
      
      // Add all members to the group
      for (const member of groupMembers) {
        addMemberToGroup(semaphoreGroup, member.semaphore_identity_commitment)
      }
      
      // Get the user's commitment from the database as source of truth
      const dbUserCommitment = await getUserIdentityCommitmentFromGroup(groupId, user.anonymousId)
      
      if (!dbUserCommitment) {
        throw new Error("You are not a member of this group. Please join the group first.")
      }
      
      // Verify identity consistency
      const calculatedCommitment = semaphoreIdentity.identity.commitment.toString()
      
      if (dbUserCommitment !== calculatedCommitment) {
        console.warn('Identity commitment mismatch detected for voting. Database:', dbUserCommitment, 'Calculated:', calculatedCommitment)
        throw new Error("Identity mismatch detected. Please clear your browser data and rejoin the group.")
      }
      
      // Create message and scope for the vote proof (following working example)
      const message = vote === "yes" ? 1 : 0 // Numeric values like working example
      const scope = semaphoreGroup.root // Use group root as scope like working example
      
      // Generate Semaphore proof
      const proofData = await generateSemaphoreProof(
        semaphoreIdentity.identity,
        semaphoreGroup,
        message,
        scope
      )

      // Submit proof to ZK Verify
      const zkVerifyResult = await submitVoteProof(
        proofData,
        groupId,
        postId,
        vote
      )

      if (!zkVerifyResult.success) {
        throw new Error(zkVerifyResult.error || "Failed to submit vote proof")
      }

      // Wait for verification using raw jobId
      const verificationResult = await waitForProofVerification(
        zkVerifyResult.jobId || zkVerifyResult.proofHash,
        { maxAttempts: 90, intervalMs: 7000 }
      )
      if (!verificationResult.success) {
        throw new Error(`Vote proof verification failed: ${verificationResult.error || verificationResult.status}`)
      }

      // Show success message with transaction hash
      const txHash = verificationResult.data?.raw?.txHash
        || verificationResult.data?.raw?.transactionHash
        || verificationResult.data?.raw?.tx_hash
      if (txHash) {
        console.log(`Vote verified on-chain! Transaction: ${txHash}`)
      }

      setLastVerification({
        context: 'vote',
        jobId: verificationResult.data?.raw?.jobId ?? (zkVerifyResult.jobId || zkVerifyResult.proofHash),
        status: verificationResult.status,
        txHash,
        raw: verificationResult.data?.raw ?? verificationResult.data,
      })

      setSuccessMessage('Vote proof verified successfully! See verification details below.')

      // Cast vote in database
      await castVote(
        postId,
        user.anonymousId,
        vote,
        JSON.stringify(proofData),
        zkVerifyResult.proofHash
      )

      // Refresh posts to show updated vote counts
      const updatedPosts = await getGroupPosts(groupId, user.anonymousId)
      setPosts(updatedPosts)

    } catch (error) {
      console.error("Error voting:", error)
      setError(error instanceof Error ? error.message : "Failed to cast vote")
      setLastVerification(null)
    } finally {
      setIsVoting(null)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !isMember) return

    setIsCreatingPost(true)
    setError("")
    setSuccessMessage("")
    setLastVerification(null)

    try {
      const user = getCurrentAnonymousUser()
      
      // Get Semaphore identity
      const semaphoreIdentity = getSemaphoreIdentityFromStorage()
      if (!semaphoreIdentity) {
        throw new Error("Semaphore identity not found. Please rejoin the group.")
      }

      // Get group members to reconstruct Semaphore group
      const groupMembers = await getGroupMembers(groupId)
      const semaphoreGroup = createSemaphoreGroup() // Use depth 20 for Semaphore
      
      // Add all members to the group
      for (const member of groupMembers) {
        addMemberToGroup(semaphoreGroup, member.semaphore_identity_commitment)
      }
      
      // Get the user's commitment from the database as source of truth
      const dbUserCommitment = await getUserIdentityCommitmentFromGroup(groupId, user.anonymousId)
      
      if (!dbUserCommitment) {
        throw new Error("You are not a member of this group. Please join the group first.")
      }
      
      // Verify identity consistency
      const localCommitment = semaphoreIdentity.commitment
      const calculatedCommitment = semaphoreIdentity.identity.commitment.toString()
      
      console.log('Identity debugging:', {
        dbCommitment: dbUserCommitment,
        localCommitment: localCommitment,
        calculatedCommitment: calculatedCommitment,
        dbMatchesLocal: dbUserCommitment === localCommitment,
        dbMatchesCalculated: dbUserCommitment === calculatedCommitment,
        localMatchesCalculated: localCommitment === calculatedCommitment
      })
      
      // If there's a mismatch, we need to use the database commitment
      if (dbUserCommitment !== calculatedCommitment) {
        console.warn('Identity commitment mismatch detected. Database commitment:', dbUserCommitment, 'Calculated:', calculatedCommitment)
        throw new Error("Identity mismatch detected. Please clear your browser data and rejoin the group.")
      }
      
      console.log('Group reconstructed with', groupMembers.length, 'members, user commitment found:', dbUserCommitment)
      
      // Create message and scope for the post proof
      // Use the SAME approach as working voting
      const message = `${newPost.type}_${newPost.title}` // String message
      const scope = "posts" // Different scope from voting to allow both
      
      // Generate Semaphore proof (same as voting)
      const proofData = await generateSemaphoreProof(
        semaphoreIdentity.identity,
        semaphoreGroup,
        message,
        scope
      )

      // For posts, submit proof to ZK Verify for verification
      // For proposals, skip ZK Verify (will be verified when people vote)
      let zkVerifyProofHash = `local_semaphore_${Date.now()}`
      
      if (newPost.type === "post") {
        // Use same approach as voting - pass proofData
        const zkVerifyResult = await submitPostProof(proofData)

        if (!zkVerifyResult.success) {
          throw new Error(zkVerifyResult.error || "Failed to submit post proof")
        }

        // Wait for verification
        const verificationResult = await waitForProofVerification(
          zkVerifyResult.jobId || zkVerifyResult.proofHash,
          { maxAttempts: 90, intervalMs: 7000 }
        )
        if (!verificationResult.success) {
          throw new Error(`Post proof verification failed: ${verificationResult.error || verificationResult.status}`)
        }

        // Show success message with transaction hash for posts
        const txHash = verificationResult.data?.raw?.txHash
          || verificationResult.data?.raw?.transactionHash
          || verificationResult.data?.raw?.tx_hash
        if (txHash) {
          console.log(`Post verified on-chain! Transaction: ${txHash}`)
        }
        
        setLastVerification({
          context: 'post',
          jobId: verificationResult.data?.raw?.jobId ?? (zkVerifyResult.jobId || zkVerifyResult.proofHash),
          status: verificationResult.status,
          txHash,
          raw: verificationResult.data?.raw ?? verificationResult.data,
        })

        setSuccessMessage('Post proof verified successfully! See verification details below.')

        zkVerifyProofHash = zkVerifyResult.proofHash
      } else {
        // For proposals, just log that proof was generated locally
        console.log('Proposal proof generated successfully:', proofData)
      }

      // Create post in database
      await createPost({
        group_id: groupId,
        author_anonymous_id: user.anonymousId,
        type: newPost.type,
        title: newPost.title,
        content: newPost.content,
        semaphore_proof: JSON.stringify(proofData), // Store the proof data
        zk_verify_proof_hash: zkVerifyProofHash
      })

      // Refresh posts
      const updatedPosts = await getGroupPosts(groupId, user.anonymousId)
      setPosts(updatedPosts)

      // Reset form
      setNewPost({ type: "post", title: "", content: "" })
      setShowCreatePost(false)

    } catch (error) {
      console.error("Error creating post:", error)
      setError(error instanceof Error ? error.message : "Failed to create post")
      setLastVerification(null)
    } finally {
      setIsCreatingPost(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading group...</span>
        </div>
      </div>
    )
  }

  if (!group || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Group not found"}
          </h1>
          <Link href="/groups" className="text-primary hover:underline">
            Browse all groups
          </Link>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You must be a member of this group to view its content.
          </p>
          <Link href="/groups" className="text-primary hover:underline">
            Browse all groups
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">BeYou</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/groups" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse Groups
              </Link>
              <Link href="/my-groups" className="text-muted-foreground hover:text-foreground transition-colors">
                My Groups
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/my-groups"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Groups
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{group.name}</h1>
            <div className="flex items-center text-muted-foreground text-sm">
              <Users className="h-4 w-4 mr-1" />
              {group.member_count} members
            </div>
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-600 font-medium">{successMessage}</p>
            {lastVerification && (
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lastVerification.jobId && (
                    <div>
                      <span className="font-medium text-foreground">Job ID:</span> {lastVerification.jobId}
                    </div>
                  )}
                  {lastVerification.status && (
                    <div>
                      <span className="font-medium text-foreground">Relayer status:</span> {lastVerification.status}
                    </div>
                  )}
                </div>

                {lastVerification.txHash && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">Transaction:</span>
                    <a
                      href={`${config.zkVerify.explorerBaseUrl}${lastVerification.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-700"
                    >
                      {lastVerification.txHash.slice(0, 10)}…{lastVerification.txHash.slice(-6)}
                    </a>
                  </div>
                )}

                {lastVerification.raw && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-foreground font-medium">View raw relayer response</summary>
                    <pre className="mt-2 bg-background border border-border rounded-md p-3 overflow-x-auto text-xs text-foreground/80">
                      {JSON.stringify(lastVerification.raw, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Anonymous</span>
                  {post.type === "proposal" && (
                    <span className="bg-chart-1 text-white text-xs px-2 py-1 rounded-full">Proposal</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</div>
              </div>

              <h3 className="text-lg font-semibold text-card-foreground mb-3">{post.title}</h3>
              <p className="text-muted-foreground mb-4">{post.content}</p>

              {post.type === "proposal" && post.votes && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">{post.votes.yes + post.votes.no} votes cast</div>
                    {post.user_vote && (
                      <div className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 py-1 rounded">
                        Already Voted
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => handleVote(post.id, "yes")}
                      disabled={isVoting === post.id || !!post.user_vote}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        post.user_vote === "yes"
                          ? "bg-green-500/10 border-green-500/20 text-green-600"
                          : post.user_vote
                          ? "border-border opacity-50"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {isVoting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Yes
                    </button>
                    <button
                      onClick={() => handleVote(post.id, "no")}
                      disabled={isVoting === post.id || !!post.user_vote}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        post.user_vote === "no"
                          ? "bg-red-500/10 border-red-500/20 text-red-600"
                          : post.user_vote
                          ? "border-border opacity-50"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {isVoting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      No
                    </button>
                  </div>

                  {/* Vote Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(post.votes.yes / (post.votes.yes + post.votes.no)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{Math.round((post.votes.yes / (post.votes.yes + post.votes.no)) * 100)}% Yes</span>
                    <span>{Math.round((post.votes.no / (post.votes.yes + post.votes.no)) * 100)}% No</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to start a discussion in this group</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create First Post
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-card-foreground mb-4">Create New Post</h2>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Post Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="post"
                        checked={newPost.type === "post"}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, type: e.target.value as "post" | "proposal" }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Discussion Post (ZK Verified)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="proposal"
                        checked={newPost.type === "proposal"}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, type: e.target.value as "post" | "proposal" }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Proposal (Voting ZK Verified)</span>
                    </label>
                  </div>
                </div>

                {newPost.type === "post" ? (
                  // Single input for posts
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-card-foreground mb-2">
                      Post Content (Will be ZK Verified) *
                    </label>
                    <textarea
                      id="content"
                      required
                      rows={6}
                      value={newPost.title}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value, content: e.target.value }))}
                      placeholder="What's your post about? This will be verified on-chain..."
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
                    />
                  </div>
                ) : (
                  // Title and content for proposals
                  <>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-2">
                        Proposal Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        value={newPost.title}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter proposal title..."
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-card-foreground mb-2">
                        Proposal Description *
                      </label>
                      <textarea
                        id="content"
                        required
                        rows={6}
                        value={newPost.content}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Describe your proposal. Members will vote Yes or No (votes are ZK verified)..."
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                  </>
                )}

                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Anonymous posting:</strong> Your identity will remain completely anonymous to all group
                    members. Posts cannot be traced back to you.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false)
                      setNewPost({ type: "post", title: "", content: "" })
                    }}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPost}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingPost ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      newPost.type === "proposal" ? "Create Proposal" : "Create Post"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
