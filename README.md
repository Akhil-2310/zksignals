# 🛡️ zkSignals

**Anonymous Signaling for Verified Communities**

zkSignals is a privacy-preserving platform that enables anonymous communication, feedback, and voting within verified communities. By combining ZK Email proofs with Semaphore's zero-knowledge technology, users can participate in group discussions and decision-making while maintaining complete anonymity.

---

## 🎯 **Why zkSignals?**

In today's digital world, authentic anonymous communication is challenging. Traditional platforms either:
- **Lack verification** → Anyone can create fake accounts and spam
- **Compromise privacy** → Your identity is tied to your communications
- **Enable bad actors** → No accountability mechanisms

zkSignals solves this by creating **verified anonymous communities** where:
- ✅ **Members are verified** (through email domain verification)
- ✅ **Communication is anonymous** (using zero-knowledge proofs)
- ✅ **Participation is secure** (cryptographically guaranteed)
- ✅ **Votes are private** (but verifiable on-chain)

---

## 🚀 **Key Features**

### 🔐 **Email-Verified Groups**
- Create groups restricted to specific email domains (e.g., company.com, university.edu)
- ZK Email proofs verify membership without revealing the actual email
- On-chain verification ensures authenticity

### 👤 **Complete Anonymity**
- Semaphore protocol ensures your identity cannot be traced
- Anonymous posting and voting within groups
- Cryptographic guarantees prevent de-anonymization

### 🗳️ **Private Voting**
- Create proposals and vote anonymously
- ZK proofs verify vote validity without revealing voter identity
- Real-time vote counting with privacy preservation
- Prevent double voting while maintaining anonymity

### 📝 **Anonymous Discussions**
- Post discussions and feedback anonymously
- Two types of content:
  - **Posts**: General discussions (ZK verified)
  - **Proposals**: Votable items (voting is ZK verified)

### 🔗 **On-Chain Verification**
- All proofs are verified on zkVerify testnet
- Transaction hashes provided for transparency
- Cryptographic proof of authenticity

---

## 🏗️ **Technical Architecture**

### **Core Technologies**
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **ZK Proofs**: Semaphore Protocol v4
- **Email Verification**: ZK Email SDK
- **On-Chain Verification**: zkVerify Relayer
- **Styling**: Tailwind CSS + shadcn/ui



### **Privacy Guarantees**

| Component | Privacy Feature | Technical Implementation |
|-----------|----------------|-------------------------|
| **Email Verification** | Domain verification without email exposure | ZK Email circuits + regex proofs |
| **Group Membership** | Anonymous participation | Semaphore merkle tree commitments |
| **Voting** | Vote secrecy + no double voting | Nullifier-based ZK proofs |
| **Posts** | Anonymous authorship | Identity commitment hiding |
| **On-Chain** | Public verification, private data | zkVerify proof verification |

---



## 📋 **Usage Guide**

### **1. Create a Group**
1. Go to "Create Group"
2. Set group name, description, and email domain restriction
3. Choose or create a ZK Email blueprint for domain verification
4. Group is created and ready for members

### **2. Join a Group**
1. Browse available groups
2. Upload a `.eml` file from the required email domain
3. ZK Email proof verifies domain without revealing email
4. Semaphore identity is generated for anonymous participation
5. Transaction hash confirms on-chain verification

### **3. Participate Anonymously**
1. **Create Posts**: Share thoughts anonymously (ZK verified)
2. **Create Proposals**: Start votable discussions
3. **Vote on Proposals**: Cast anonymous votes (ZK verified on-chain)
4. **View Results**: See aggregate voting results and discussions

### **4. Privacy Features**
- ✅ **"Already Joined"** status for groups you're in
- ✅ **"Already Voted"** indicator without revealing vote choice
- ✅ **Transaction hashes** for verification transparency
- ✅ **Anonymous posting** with cryptographic guarantees

---

## 🔒 **Security & Privacy**

### **Threat Model**
- **Malicious Users**: Cannot fake group membership (email verification required)
- **Curious Members**: Cannot de-anonymize other members (ZK proofs)
- **Platform Operators**: Cannot link identities to actions (client-side key generation)
- **External Observers**: Cannot correlate on-chain activity to real identities

### **Privacy Properties**
1. **Anonymity**: Your posts/votes cannot be traced back to you
2. **Unlinkability**: Your different actions cannot be linked together  
3. **Unforgeability**: Only verified group members can participate
4. **Double-spend Protection**: Cannot vote twice on the same proposal
5. **Forward Secrecy**: Past communications remain private even if keys are compromised

### **Security Audits**
- Semaphore Protocol: [Audited by multiple firms](https://semaphore.pse.dev/docs/security)
- ZK Email: [Open source and audited](https://github.com/zkemail)
- zkVerify: Horizen's blockchain verification layer

---

## 🏛️ **Use Cases**

### **🏢 Corporate**
- **Anonymous employee feedback** within company domains
- **Sensitive decision making** with privacy guarantees
- **Whistleblowing channels** with verified authenticity

### **🎓 Academic**
- **Student feedback** on courses and faculty
- **Research collaboration** with privacy
- **Academic voting** on proposals and policies

### **🏛️ Governance**
- **DAO voting** with privacy preservation
- **Community signaling** on proposals
- **Anonymous governance participation**

### **🤝 Communities**
- **Professional networks** with domain verification
- **Interest groups** with authentic membership
- **Sensitive topic discussions** with anonymity

---



## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **[Semaphore Protocol](https://semaphore.pse.dev/)** - Zero-knowledge group membership
- **[ZK Email](https://github.com/zkemail)** - Email verification proofs
- **[zkVerify](https://www.horizen.io/zkverify/)** - On-chain proof verification
- **[Supabase](https://supabase.com/)** - Backend infrastructure
- **[Privacy & Scaling Explorations](https://pse.dev/)** - ZK research and tools

**Built with ❤️ for privacy-preserving communities**