"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Shield, Users, Eye, Upload, X, Check } from "lucide-react"

// Mock data - will be replaced with database data later
const mockGroups = [
  {
    id: 1,
    name: "YC W24 Batch",
    description:
      "Anonymous feedback and discussions for Y Combinator Winter 2024 batch members. Share honest thoughts about the program, network, and experiences.",
    restrictions: ["@ycombinator.com email", "YC W24 participant verification"],
    memberCount: 47,
    createdAt: "2024-01-15",
  },
  {
    id: 3,
    name: "Hacker House Berlin",
    description:
      "For participants of the Berlin Hacker House program. Share feedback about the experience, vote on improvements, and connect anonymously.",
    restrictions: ["Berlin Hacker House attendance proof"],
    memberCount: 23,
    createdAt: "2024-03-10",
  },
]

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<(typeof mockGroups)[0] | null>(null)
  const [joinGroup, setJoinGroup] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleViewGroup = (group: (typeof mockGroups)[0]) => {
    setSelectedGroup(group)
  }

  const handleJoinGroup = (groupId: number) => {
    setJoinGroup(groupId)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleSubmitJoin = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false)
      setJoinGroup(null)
      setUploadFile(null)
      alert('Successfully joined group! Check "My Groups" to see your new group.')
    }, 2000)
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
              <Link href="/groups" className="text-primary font-medium">
                Browse Groups
              </Link>
              <Link href="/my-groups" className="text-muted-foreground hover:text-foreground transition-colors">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Groups</h1>
          <p className="text-muted-foreground">
            Discover verified communities and join groups that match your background
          </p>
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGroups.map((group) => (
            <div key={group.id} className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-card-foreground mb-2">{group.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3">{group.description}</p>
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Users className="h-4 w-4 mr-1" />
                  {group.memberCount} members
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewGroup(group)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mockGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a group for your community</p>
            <Link
              href="/create-group"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create First Group
            </Link>
          </div>
        )}
      </div>

      {/* View Group Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-card-foreground">{selectedGroup.name}</h2>
                <button onClick={() => setSelectedGroup(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-card-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedGroup.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-card-foreground mb-2">Verification Requirements</h3>
                  <ul className="space-y-1">
                    {selectedGroup.restrictions.map((restriction, index) => (
                      <li key={index} className="text-muted-foreground text-sm flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        {restriction}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center mb-1">
                      <Users className="h-4 w-4 mr-1" />
                      {selectedGroup.memberCount} members
                    </div>
                    <div>Created {new Date(selectedGroup.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGroup(null)
                      handleJoinGroup(selectedGroup.id)
                    }}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Join Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {joinGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-card-foreground">Join Group</h2>
                <button
                  onClick={() => {
                    setJoinGroup(null)
                    setUploadFile(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Upload your email verification proof to join this group. This will be processed using zero-knowledge
                  technology to verify your eligibility without revealing your identity.
                </p>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Verification File *</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="verification-file"
                      accept=".eml"
                    />
                    <label htmlFor="verification-file" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadFile ? uploadFile.name : "Click to upload verification file"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Supported: .eml</p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setJoinGroup(null)
                      setUploadFile(null)
                    }}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitJoin}
                    disabled={!uploadFile || isUploading}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Verifying..." : "Join Group"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
