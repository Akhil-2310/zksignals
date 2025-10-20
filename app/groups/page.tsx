"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, Users, Eye, Upload, X, Check, Loader2, AlertCircle } from "lucide-react"
import { getAllGroups, joinGroup as joinGroupDB, isUserGroupMember, type Group } from "../../lib/database"
import { getCurrentAnonymousUser } from "../../lib/auth"
import { verifyEmailWithBlueprint, waitForEmailVerification } from "../../lib/zk-email"
import { getOrCreateSemaphoreIdentity } from "../../lib/semaphore"
import { storeSemaphoreIdentity } from "../../lib/database"
import { config } from "../../lib/config"
import Image from "next/image"

type EmailVerificationDetails = {
  jobId?: string
  status?: string
  txHash?: string
  raw?: any
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<{[groupId: string]: boolean}>({}) // Track membership for each group
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'upload' | 'verifying-email' | 'generating-proof' | 'submitting-proof'>('upload')
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [verificationDetails, setVerificationDetails] = useState<EmailVerificationDetails | null>(null)

  // Load groups on component mount
  useEffect(() => {
    async function loadGroups() {
      try {
        const user = getCurrentAnonymousUser()
        const fetchedGroups = await getAllGroups()
        setGroups(fetchedGroups)

        // Check membership status for each group
        const membershipChecks = await Promise.all(
          fetchedGroups.map(async (group) => {
            const isMember = await isUserGroupMember(group.id, user.anonymousId)
            return { groupId: group.id, isMember }
          })
        )

        // Build membership status object
        const membershipMap: {[groupId: string]: boolean} = {}
        membershipChecks.forEach(({ groupId, isMember }) => {
          membershipMap[groupId] = isMember
        })
        setMembershipStatus(membershipMap)

      } catch (error) {
        console.error('Error loading groups:', error)
        setError('Failed to load groups')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadGroups()
  }, [])

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group)
  }

  const handleJoinGroup = (groupId: string) => {
    setJoinGroupId(groupId)
    setError("")
    setVerificationStep('upload')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.eml')) {
      setUploadFile(file)
      setError("")
    } else {
      setError("Please select a valid .eml file")
    }
  }

  const handleSubmitJoin = async () => {
    if (!uploadFile || !joinGroupId) return

    setIsUploading(true)
    setError("")
    setSuccessMessage("")
    setVerificationDetails(null)

    try {
      const user = getCurrentAnonymousUser()
      const group = groups.find(g => g.id === joinGroupId)
      
      if (!group) {
        throw new Error("Group not found")
      }

      // Check if user is already a member
      const isMember = await isUserGroupMember(joinGroupId, user.anonymousId)
      if (isMember) {
        throw new Error("You are already a member of this group")
      }

      // Step 1: Verify email with ZK Email and submit to ZK Verify
      setVerificationStep('verifying-email')
      const emailVerification = await verifyEmailWithBlueprint(uploadFile, group.email_blueprint)
      
      if (!emailVerification.isValid) {
        throw new Error(emailVerification.error || "Email verification failed")
      }

      // Step 2: Wait for ZK Verify verification to complete
      setVerificationStep('submitting-proof')
      const verificationResult = await waitForEmailVerification(emailVerification.jobId)
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || "Email proof verification failed")
      }

      // Show success message with transaction hash
      const txHash = verificationResult.data?.raw?.txHash
        || verificationResult.data?.raw?.transactionHash
        || verificationResult.data?.raw?.tx_hash
      if (txHash) {
        console.log(`Email verified on-chain! Transaction: ${txHash}`)
      }

      setVerificationDetails({
        jobId: verificationResult.data?.raw?.jobId ?? emailVerification.jobId,
        status: verificationResult.status,
        txHash,
        raw: verificationResult.data?.raw ?? verificationResult.data,
      })

      setSuccessMessage('Email proof verified successfully! See verification details below.')

      // Step 3: Generate Semaphore identity
      setVerificationStep('generating-proof')
      const semaphoreIdentity = getOrCreateSemaphoreIdentity()
      
      // Store identity in database
      await storeSemaphoreIdentity(
        user.anonymousId,
        semaphoreIdentity.commitment,
        semaphoreIdentity.encryptedSecret
      )

      // Step 4: Join the group in database
      await joinGroupDB(
        joinGroupId,
        user.anonymousId,
        semaphoreIdentity.commitment,
        emailVerification.jobId, // Use jobId as proof hash
        `zkverify_${emailVerification.jobId}` // ZK Verify proof reference
      )

      // Success!
      setJoinGroupId(null)
      setUploadFile(null)
      
      // Update membership status for this group
      setMembershipStatus(prev => ({ ...prev, [joinGroupId]: true }))
      
      const transactionInfo = txHash
        || verificationResult.data?.raw?.transactionHash
        || verificationResult.data?.raw?.txHash
        || verificationResult.data?.raw?.tx_hash
        || verificationResult.data?.raw?.jobId
        || verificationResult.status
      const message = `Successfully joined group!\n\nZK Email Proof: ${emailVerification.jobId}\nZK Verify Status: ${verificationResult.status}\nTransaction: ${transactionInfo}\n\nCheck "My Groups" to see your new group.`
      alert(message)
      
    } catch (error) {
      console.error("Error joining group:", error)
      setError(error instanceof Error ? error.message : "Failed to join group")
      setVerificationDetails(null)
    } finally {
      setIsUploading(false)
      setVerificationStep('upload')
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading groups...</span>
          </div>
        ) : (
          <>
            {/* Error State */}
            {error && !isUploading && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Groups Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{group.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">{group.description}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      {group.member_count} members
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Blueprint: {group.email_blueprint}
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
                    {membershipStatus[group.id] ? (
                      <div className="flex-1 bg-green-500/10 border border-green-500/20 text-green-600 px-3 py-2 rounded-lg text-sm text-center">
                        ✓ Already Joined
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {groups.length === 0 && (
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
          </>
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
                  <h3 className="font-medium text-card-foreground mb-2">Email Blueprint</h3>
                  <div className="text-muted-foreground text-sm flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    {selectedGroup.email_blueprint}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center mb-1">
                      <Users className="h-4 w-4 mr-1" />
                      {selectedGroup.member_count} members
                    </div>
                    <div>Created {new Date(selectedGroup.created_at).toLocaleDateString()}</div>
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
      {joinGroupId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-card-foreground">Join Group</h2>
                <button
                  onClick={() => {
                    setJoinGroupId(null)
                    setUploadFile(null)
                    setError("")
                    setSuccessMessage("")
                    setVerificationDetails(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isUploading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Upload your email (.eml file) to verify your eligibility using zero-knowledge proofs. Your identity will remain private.
                </p>

                {/* Verification Steps */}
                {isUploading && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {verificationStep === 'verifying-email' && 'Generating ZK Email proof...'}
                          {verificationStep === 'submitting-proof' && 'Verifying proof with ZK Verify...'}
                          {verificationStep === 'generating-proof' && 'Creating Semaphore identity...'}
                          {verificationStep === 'upload' && 'Processing...'}
                        </p>
                        <p className="text-xs text-muted-foreground">This may take a few moments</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Success Display */}
                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-sm text-green-600 font-medium">{successMessage}</p>
                    {verificationDetails && (
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {verificationDetails.jobId && (
                            <div>
                              <span className="font-medium text-foreground">Job ID:</span> {verificationDetails.jobId}
                            </div>
                          )}
                          {verificationDetails.status && (
                            <div>
                              <span className="font-medium text-foreground">Relayer status:</span> {verificationDetails.status}
                            </div>
                          )}
                        </div>

                        {verificationDetails.txHash && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">Transaction:</span>
                            <a
                              href={`${config.zkVerify.explorerBaseUrl}${verificationDetails.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-green-700"
                            >
                              {verificationDetails.txHash.slice(0, 10)}…{verificationDetails.txHash.slice(-6)}
                            </a>
                          </div>
                        )}

                        {verificationDetails.raw && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-foreground font-medium">View raw relayer response</summary>
                            <pre className="mt-2 bg-background border border-border rounded-md p-3 overflow-x-auto text-xs text-foreground/80">
                              {JSON.stringify(verificationDetails.raw, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Email File (.eml) *</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="verification-file"
                      accept=".eml"
                      disabled={isUploading}
                    />
                    <label htmlFor="verification-file" className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadFile ? uploadFile.name : "Click to upload email file"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Only .eml files are supported</p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setJoinGroupId(null)
                      setUploadFile(null)
                      setError("")
                      setSuccessMessage("")
                      setVerificationDetails(null)
                    }}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitJoin}
                    disabled={!uploadFile || isUploading}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Join Group"
                    )}
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
