import Link from "next/link"
import { ArrowRight, Shield, Users, Vote, Eye, Lock, MessageSquare } from "lucide-react"

export default function HomePage() {
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
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </Link>
              <Link href="/groups" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse Groups
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

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Anonymous Signaling for
            <span className="text-primary"> Verified Communities</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Create secure groups based on email verification and enable anonymous signaling, feedback, and voting within
            trusted communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create-group"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Create Your Group
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/groups"
              className="border border-border text-foreground px-8 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Browse Groups
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Secure Anonymous Communication</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for communities that value privacy, trust, and authentic feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Email Verification</h3>
              <p className="text-muted-foreground">
                Groups are formed based on verified email addresses using zero-knowledge proofs, ensuring authentic
                membership without revealing identity.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Complete Anonymity</h3>
              <p className="text-muted-foreground">
                Share feedback, vote on proposals, and communicate without revealing your identity to other group
                members.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Verified Groups</h3>
              <p className="text-muted-foreground">
                Create groups for specific communities like residency alumni, hackathon participants, or company
                employees with email-based verification.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Vote className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Anonymous Voting</h3>
              <p className="text-muted-foreground">
                Create proposals and collect anonymous votes from verified group members with simple yes/no options.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Feedback & Signals</h3>
              <p className="text-muted-foreground">
                Share honest feedback, suggestions, and signals within your community without fear of retaliation or
                bias.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                Built with privacy by design. Your identity remains protected while maintaining the integrity of
                verified communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How BeYou Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple steps to create and join verified anonymous communities
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Create or Join a Group</h3>
                <p className="text-muted-foreground">
                  Create a new group with specific email verification requirements (e.g., alumni from a specific
                  program) or browse existing groups and request to join.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Verify Your Email</h3>
                <p className="text-muted-foreground">
                  Upload your email verification proof using zero-knowledge technology. Your email remains private while
                  proving you meet the group requirements.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Participate Anonymously</h3>
                <p className="text-muted-foreground">
                  Once verified, share feedback, create proposals, vote on decisions, and communicate with complete
                  anonymity within your trusted community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Start Anonymous Signaling?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Create your first verified group or join an existing community today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create-group"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Create Your Group
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/groups"
              className="border border-border text-foreground px-8 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Browse Groups
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">BeYou</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/zksignals" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="https://x.com/zk_soc" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2025 BeYou. Built for privacy-first communities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
