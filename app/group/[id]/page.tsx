"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Shield, Users, MessageSquare, Plus, ThumbsUp, ThumbsDown, ArrowLeft, User } from "lucide-react"

// Mock data - will be replaced with database data later
const mockGroupData = {
  1: {
    id: 1,
    name: "YC W24 Batch",
    description:
      "Anonymous feedback and discussions for Y Combinator Winter 2024 batch members. Share honest thoughts about the program, network, and experiences.",
    memberCount: 47,
    posts: [
      {
        id: 1,
        type: "post",
        title: "Thoughts on the Demo Day experience",
        content:
          "I wanted to share some feedback about Demo Day. Overall it was great, but I think the timing could be improved...",
        createdAt: "2024-03-14T10:30:00Z",
        anonymous: true,
      },
      {
        id: 2,
        type: "proposal",
        title: "Should we organize a post-batch meetup?",
        content:
          "I think it would be valuable to have an in-person meetup for our batch after the program ends. What do you all think?",
        createdAt: "2024-03-13T15:45:00Z",
        anonymous: true,
        votes: {
          yes: 23,
          no: 5,
        },
        userVote: null, // null, 'yes', or 'no'
      },
      {
        id: 3,
        type: "proposal",
        title: "Extend office hours by 2 hours daily?",
        content:
          "The current office hours feel a bit rushed. Would extending them by 2 hours daily help everyone get more value?",
        createdAt: "2024-03-12T09:15:00Z",
        anonymous: true,
        votes: {
          yes: 15,
          no: 12,
        },
        userVote: "yes",
      },
    ],
  },
}

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = Number.parseInt(params.id as string)
  const group = mockGroupData[groupId as keyof typeof mockGroupData]

  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({
    type: "post",
    title: "",
    content: "",
  })

  const handleVote = (postId: number, vote: "yes" | "no") => {
    // TODO: Implement voting logic with database
    console.log(`Voting ${vote} on post ${postId}`)
    alert(`Voted ${vote}! (This will be connected to database later)`)
  }

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement post creation with database
    console.log("Creating post:", newPost)
    alert("Post created successfully! (This will be connected to database later)")
    setNewPost({ type: "post", title: "", content: "" })
    setShowCreatePost(false)
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Group not found</h1>
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
                <span className="text-xl font-bold text-foreground">AnonSignals</span>
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
                {group.memberCount} members
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

        {/* Posts Feed */}
        <div className="space-y-6">
          {group.posts.map((post) => (
            <div key={post.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Anonymous</span>
                  {post.type === "proposal" && (
                    <span className="bg-chart-1 text-white text-xs px-2 py-1 rounded-full">Proposal</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</div>
              </div>

              <h3 className="text-lg font-semibold text-card-foreground mb-3">{post.title}</h3>
              <p className="text-muted-foreground mb-4">{post.content}</p>

              {post.type === "proposal" && post.votes && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">{post.votes.yes + post.votes.no} votes cast</div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => handleVote(post.id, "yes")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        post.userVote === "yes"
                          ? "bg-green-500/10 border-green-500/20 text-green-600"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Yes ({post.votes.yes})
                    </button>
                    <button
                      onClick={() => handleVote(post.id, "no")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        post.userVote === "no"
                          ? "bg-red-500/10 border-red-500/20 text-red-600"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No ({post.votes.no})
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
        {group.posts.length === 0 && (
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
                        onChange={(e) => setNewPost((prev) => ({ ...prev, type: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Discussion Post</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="proposal"
                        checked={newPost.type === "proposal"}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, type: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Proposal (Yes/No Vote)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a clear, descriptive title..."
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-card-foreground mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    required
                    rows={6}
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder={
                      newPost.type === "proposal"
                        ? "Describe your proposal and what you're asking the group to vote on..."
                        : "Share your thoughts, feedback, or start a discussion..."
                    }
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

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
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {newPost.type === "proposal" ? "Create Proposal" : "Create Post"}
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
