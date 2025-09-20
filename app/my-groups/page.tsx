"use client"

import Link from "next/link"
import { Shield, Users, MessageSquare, Calendar, ArrowRight } from "lucide-react"

// Mock data for user's joined groups - will be replaced with database data later
const myGroups = [
  {
    id: 1,
    name: "YC W24 Batch",
    description:
      "Anonymous feedback and discussions for Y Combinator Winter 2024 batch members. Share honest thoughts about the program, network, and experiences.",
    memberCount: 47,
    joinedAt: "2024-01-20",
    lastActivity: "2024-03-15",
    unreadPosts: 3,
    activeProposals: 2,
  },
  {
    id: 2,
    name: "Hacker House Berlin",
    description:
      "For participants of the Berlin Hacker House program. Share feedback about the experience, vote on improvements, and connect anonymously.",
    memberCount: 23,
    joinedAt: "2024-03-12",
    lastActivity: "2024-03-14",
    unreadPosts: 1,
    activeProposals: 0,
  },
]

export default function MyGroupsPage() {
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
              <Link href="/my-groups" className="text-primary font-medium">
                My Groups
              </Link>
              <Link
                href="/create-group"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Group
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Groups</h1>
          <p className="text-muted-foreground">Groups you've joined and can participate in anonymously</p>
        </div>

        {/* Groups List */}
        {myGroups.length > 0 ? (
          <div className="space-y-6">
            {myGroups.map((group) => (
              <div key={group.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-card-foreground">{group.name}</h3>
                      <div className="flex gap-2">
                        {group.unreadPosts > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {group.unreadPosts} new
                          </span>
                        )}
                        {group.activeProposals > 0 && (
                          <span className="bg-chart-1 text-white text-xs px-2 py-1 rounded-full">
                            {group.activeProposals} votes
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{group.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {group.memberCount} members
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined {new Date(group.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Last activity {new Date(group.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-48">
                    <Link
                      href={`/group/${group.id}`}
                      className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Enter Group
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <div className="flex gap-2">
                      <div className="flex-1 text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-foreground">{group.unreadPosts}</div>
                        <div className="text-xs text-muted-foreground">New Posts</div>
                      </div>
                      <div className="flex-1 text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-foreground">{group.activeProposals}</div>
                        <div className="text-xs text-muted-foreground">Active Votes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No groups joined yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Browse available groups and join communities that match your background to start participating in
              anonymous discussions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/groups"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Groups
              </Link>
              <Link
                href="/create-group"
                className="border border-border text-foreground px-6 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                Create New Group
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {myGroups.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-card-foreground mb-1">{myGroups.length}</div>
              <div className="text-sm text-muted-foreground">Groups Joined</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-card-foreground mb-1">
                {myGroups.reduce((sum, group) => sum + group.unreadPosts, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Unread Posts</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-card-foreground mb-1">
                {myGroups.reduce((sum, group) => sum + group.activeProposals, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Active Proposals</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
