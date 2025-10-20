"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Plus, X, Loader2 } from "lucide-react"
import { createGroup } from "../../lib/database"
import { getCurrentAnonymousUser } from "../../lib/auth"
import { validateBlueprintFormat, BLUEPRINT_EXAMPLES } from "../../lib/zk-email"
import { createSemaphoreGroup, serializeGroup } from "../../lib/semaphore"

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emailBlueprint: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate blueprint format
      if (!validateBlueprintFormat(formData.emailBlueprint)) {
        throw new Error("Invalid blueprint format. Please use: username/blueprint-name@version")
      }

      // Get current user
      const user = getCurrentAnonymousUser()
      
      // Create Semaphore group
      const semaphoreGroup = createSemaphoreGroup()
      const semaphoreGroupId = `semaphore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create group in database
      const newGroup = await createGroup({
        name: formData.name,
        description: formData.description,
        email_blueprint: formData.emailBlueprint,
        semaphore_group_id: semaphoreGroupId,
        creator_anonymous_id: user.anonymousId
      })

      console.log("Group created successfully:", newGroup)
      
      // Redirect to groups page or show success message
      window.location.href = "/groups"
      
    } catch (error) {
      console.error("Error creating group:", error)
      setError(error instanceof Error ? error.message : "Failed to create group")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/beyou logo.jpeg"        // path to your image (e.g., in /public/logo.png)
          alt="BeYou Logo"
          width={32}              // adjust as needed
          height={32}
          className="rounded-full" // optional styling
        />
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

      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Group</h1>
          <p className="text-muted-foreground">Set up a verified community for anonymous feedback and signaling</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., YC W24 Batch, MIT Alumni 2023, Hacker House Berlin"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose of this group..."
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Email Blueprint */}
          <div>
            <label htmlFor="emailBlueprint" className="block text-sm font-medium text-foreground mb-2">
              Email Blueprint *
            </label>
            <input
              type="text"
              id="emailBlueprint"
              required
              value={formData.emailBlueprint}
              onChange={(e) => setFormData((prev) => ({ ...prev, emailBlueprint: e.target.value }))}
              placeholder="username/blueprint-name@version"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: GitHub username/repository-name@version (e.g., zkemail/yc-demo-day@v1.0.0)
            </p>
          </div>

          {/* Blueprint Examples */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">Example Blueprints:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {BLUEPRINT_EXAMPLES.map((example, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>• {example}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, emailBlueprint: example }))}
                    className="text-xs text-primary hover:text-primary/80 transition-colors ml-2"
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Group...
                </>
              ) : (
                "Create Group"
              )}
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
