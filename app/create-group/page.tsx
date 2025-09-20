"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Plus, X } from "lucide-react"

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    restrictions: [""],
  })

  const addRestriction = () => {
    setFormData((prev) => ({
      ...prev,
      restrictions: [...prev.restrictions, ""],
    }))
  }

  const removeRestriction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index),
    }))
  }

  const updateRestriction = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.map((restriction, i) => (i === index ? value : restriction)),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle form submission
    console.log("Creating group:", formData)
    alert("Group created successfully! (This will be connected to database later)")
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

          {/* Email Restrictions */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Blueprint *</label>
            <div className="space-y-3">
              {formData.restrictions.map((restriction, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={restriction}
                    onChange={(e) => updateRestriction(index, e.target.value)}
                    placeholder="<github-username>/<blueprint-name>@version"
                    className="flex-1 px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                  />
                  {formData.restrictions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRestriction(index)}
                      className="px-3 py-3 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">Example Requirements:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Alumni from specific program or residency</li>
              <li>• Attended YC Demo Day 2024</li>
              <li>• Participated in ETH Global hackathon</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Create Group
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
