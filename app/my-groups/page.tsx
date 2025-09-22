"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, Users, MessageSquare, Calendar, ArrowRight, Loader2 } from "lucide-react"
import { getUserGroups, type Group } from "../../lib/database"
import { getCurrentAnonymousUser } from "../../lib/auth"

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Load user's groups on component mount
  useEffect(() => {
    async function loadUserGroups() {
      try {
        const user = getCurrentAnonymousUser()
        const userGroups = await getUserGroups(user.anonymousId)
        setGroups(userGroups)
      } catch (error) {
        console.error('Error loading user groups:', error)
        setError('Failed to load your groups')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserGroups()
  }, [])
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading your groups...</span>
          </div>
        ) : (
          <>
            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Groups List */}
            {groups.length > 0 ? (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.id} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-card-foreground">{group.name}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{group.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {group.member_count} members
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Created {new Date(group.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            Blueprint: {group.email_blueprint}
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
            {groups.length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-card-foreground mb-1">{groups.length}</div>
                  <div className="text-sm text-muted-foreground">Groups Joined</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-card-foreground mb-1">
                    {groups.reduce((sum, group) => sum + group.member_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Community Size</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
