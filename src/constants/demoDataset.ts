/**
 * Demo Dataset for TransformAI (SIH 26154)
 * Allows judges and users to explore all platform features (Results, Local Editing,
 * FactMesh™ Grounding, AudienceLens™, Video Workspace, Storyboard, Teleprompter,
 * Consistency Check, Exports) safely with ZERO Gemini API quota consumption.
 */

import {
  ProjectRecord,
  GenerationRecord,
  GeneratedDeliverable,
  ProjectDraft,
  TransformationConfig,
  FactMeshAudit,
  AudienceLensReport,
} from "../types";

/**
 * Computes deterministic content hash to verify caching freshness.
 */
export function computeClientContentHash(text: string): string {
  const clean = (text || "").trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}_${clean.length}`;
}

/**
 * Robustly detects if the given draft, deliverable, or project is part of the Showcase Demo dataset.
 */
export function isShowcaseDemo(
  draft?: ProjectDraft | null,
  deliverable?: GeneratedDeliverable | null,
  projectId?: string | null
): boolean {
  if (projectId === "demo-project-nidci-2026" || projectId === "demo-gen-nidci-001") return true;
  if (draft?.name?.includes("NIDCI") || draft?.sourceText?.includes("NATIONAL INITIATIVE ON DIGITAL CROP INSURANCE")) return true;
  if (deliverable?.audienceLensReport?.reportId === "demo-report-nidci-2026") return true;
  if (deliverable?.factMeshAudit?.auditId === "demo-audit-nidci-001") return true;
  if (deliverable?.title?.includes("National Initiative on Digital Crop Insurance") || deliverable?.content?.includes("National Initiative on Digital Crop Insurance (NIDCI)")) return true;
  return false;
}

export const DEMO_SOURCE_TEXT = `GOVERNMENT OF INDIA
MINISTRY OF AGRICULTURE & FARMERS WELFARE
NATIONAL INITIATIVE ON DIGITAL CROP INSURANCE (NIDCI)

Date of Release: 15 October 2026
Executive Summary & Operational Directives

1. Executive Overview:
The Government of India has approved the National Initiative on Digital Crop Insurance (NIDCI) with a dedicated budgetary allocation of ₹4,200 crore for FY 2026-27. The primary objective is to expedite claims settlement from the existing 60-day cycle down to 7 business days using satellite imagery and drone surveys.

2. Beneficiary Scope & Target Groups:
- Target Beneficiaries: 1.25 crore small and marginal farmers across 18 high-risk drought and flood agro-climatic zones.
- Premium Subsidies: Farmers contribute a fixed 1.5% premium for Kharif crops and 2.0% for Rabi crops. The remaining 98% subsidy is shared 50:50 between the Central and State Governments.
- Mandatory Digital Registration Deadline: 30 November 2026 via the Unified Agritech Portal.

3. Technological Architecture:
- Automated NDVI vegetation health tracking via ISRO Remote Sensing Satellites.
- Field verification using Aadhaar-linked e-KYC and geo-tagged plot coordinates.
- Direct Benefit Transfer (DBT) routed through NPCI Aadhaar Payment Bridge within 48 hours of claim certification.

4. Implementation Milestones:
- 01 November 2026: Nationwide launch of Common Service Centre (CSC) village assistance camps.
- 30 November 2026: Final date for farmer enrollment and premium deposit.
- 15 December 2026: Deployment of automated satellite loss estimation models.
- 31 March 2027: Mandatory evaluation of claim settlement ratios across participating commercial and cooperative banks.

5. Helpline & Grievance Redressal:
A toll-free 24x7 multilingual Kisan Sahayata line (1800-180-1551) will resolve disputes within 72 hours. District Agriculture Officers (DAOs) will serve as statutory grievance appellate authorities.`;

export const DEMO_FACTMESH_AUDIT: FactMeshAudit = {
  auditId: "demo-audit-nidci-001",
  generatedAt: "2026-10-15T09:30:00.000Z",
  deliverableId: "executive_summary",
  deliverableTitle: "Executive Summary & Operational Directives",
  sourceSummary: {
    sourceName: "NIDCI National Initiative on Digital Crop Insurance (Govt of India)",
    sourceType: "Official Government Release",
    sourceUnitCount: 5,
  },
  summary: {
    totalClaims: 6,
    verifiedClaims: 5,
    inferredClaims: 0,
    unsupportedClaims: 0,
    nonFactStatements: 1,
    numbersChecked: 5,
    numbersVerified: 5,
    datesChecked: 4,
    datesVerified: 4,
    integrityScore: 96,
  },
  claims: [
    {
      claimId: "claim-1",
      claimText: "₹4,200 crore budget allocated for National Initiative on Digital Crop Insurance in FY 2026-27.",
      claimType: "number",
      status: "verified",
      confidence: 98,
      supportingSourceIds: ["S001"],
      explanation: "Directly matches the budgetary allocation in Section 1.",
      detectedNumberOrDate: "₹4,200 crore",
    },
    {
      claimId: "claim-2",
      claimText: "Claims settlement timeframe reduced from 60 days to 7 business days using satellite and drone surveys.",
      claimType: "number",
      status: "verified",
      confidence: 96,
      supportingSourceIds: ["S001"],
      explanation: "Accurately reflects the speed upgrade in Section 1.",
      detectedNumberOrDate: "7 business days",
    },
    {
      claimId: "claim-3",
      claimText: "Farmer premium rates capped at 1.5% for Kharif and 2.0% for Rabi crops.",
      claimType: "number",
      status: "verified",
      confidence: 99,
      supportingSourceIds: ["S002"],
      explanation: "Directly matches premium rates in Section 2.",
      detectedNumberOrDate: "1.5% / 2.0%",
    },
    {
      claimId: "claim-4",
      claimText: "Mandatory digital registration deadline is 30 November 2026.",
      claimType: "date",
      status: "verified",
      confidence: 99,
      supportingSourceIds: ["S002"],
      explanation: "Direct match with official deadline in Section 2.",
      detectedNumberOrDate: "30 November 2026",
    },
    {
      claimId: "claim-5",
      claimText: "1.25 crore small and marginal farmers targeted across 18 agro-climatic zones.",
      claimType: "number",
      status: "verified",
      confidence: 97,
      supportingSourceIds: ["S002"],
      explanation: "Accurately represents beneficiary scope.",
      detectedNumberOrDate: "1.25 crore",
    },
    {
      claimId: "claim-6",
      claimText: "Toll-free Kisan Sahayata line (1800-180-1551) operates 24x7 with 72-hour grievance turnaround.",
      claimType: "factual_statement",
      status: "inferred",
      confidence: 88,
      supportingSourceIds: ["S005"],
      explanation: "Number and timeframe confirmed in release; procedural arbitration handled locally.",
      detectedNumberOrDate: "1800-180-1551",
    },
  ],
  sourceUnits: [
    {
      id: "S001",
      index: 1,
      section: "Executive Overview",
      text: "The Government of India has approved the National Initiative on Digital Crop Insurance (NIDCI) with a dedicated budgetary allocation of ₹4,200 crore for FY 2026-27. The primary objective is to expedite claims settlement from the existing 60-day cycle down to 7 business days using satellite imagery and drone surveys.",
    },
    {
      id: "S002",
      index: 2,
      section: "Beneficiary Scope & Target Groups",
      text: "Target Beneficiaries: 1.25 crore small and marginal farmers across 18 high-risk drought and flood agro-climatic zones. Premium Subsidies: Farmers contribute a fixed 1.5% premium for Kharif crops and 2.0% for Rabi crops. Mandatory Digital Registration Deadline: 30 November 2026.",
    },
    {
      id: "S003",
      index: 3,
      section: "Technological Architecture",
      text: "Automated NDVI vegetation health tracking via ISRO Remote Sensing Satellites. Direct Benefit Transfer (DBT) routed through NPCI Aadhaar Payment Bridge within 48 hours of claim certification.",
    },
    {
      id: "S004",
      index: 4,
      section: "Implementation Milestones",
      text: "01 November 2026: CSC village camps launch. 30 November 2026: Final enrollment date. 31 March 2027: Claim settlement evaluation.",
    },
    {
      id: "S005",
      index: 5,
      section: "Helpline & Grievance Redressal",
      text: "A toll-free 24x7 multilingual Kisan Sahayata line (1800-180-1551) will resolve disputes within 72 hours.",
    },
  ],
};

export const DEMO_EXECUTIVE_SUMMARY_CONTENT = `# National Initiative on Digital Crop Insurance (NIDCI)
**Executive Policy Brief & Strategic Summary**

## Strategic Impact & Budgetary Allocation
The Government of India has sanctioned the **National Initiative on Digital Crop Insurance (NIDCI)** with a dedicated budgetary outlay of **₹4,200 crore** for FY 2026-27. This landmark initiative aims to protect **1.25 crore small and marginal farmers** across 18 vulnerable agro-climatic zones.

### Core Breakthrough: 7-Day Settlement Cycle
By leveraging satellite remote sensing (ISRO NDVI) and drone-based loss validation, claim settlement durations are compressed from the historic **60-day turnaround down to just 7 business days**.

## Key Financial Provisions & Deadlines
- **Farmer Premium Contribution:** Capped at **1.5% for Kharif crops** and **2.0% for Rabi crops**.
- **Subsidy Structure:** The remaining 98% premium subsidy is funded **50:50 by Central and State Governments**.
- **Mandatory Enrollment Cutoff:** **30 November 2026** via the Unified Agritech Portal.
- **Direct Payouts:** Fast-tracked via NPCI Aadhaar Payment Bridge within **48 hours** of claim certification.

## Governance & Milestone Timetable
| Date | Milestone |
| :--- | :--- |
| **01 Nov 2026** | Nationwide rollout of CSC village assistance centers |
| **30 Nov 2026** | Final date for farmer enrollment and premium deposit |
| **15 Dec 2026** | Activation of automated satellite damage analysis |
| **31 Mar 2027** | Mandatory annual claim settlement ratio evaluation |

*Statutory Grievances: Handled by District Agriculture Officers with 72-hour maximum SLA via Kisan Sahayata Helpline (1800-180-1551).*`;

export const DEMO_ADAPTATIONS: Record<
  string,
  {
    adaptedContent: string;
    explanation: string;
  }
> = {
  rural_citizen: {
    adaptedContent: `# Kisan Digital Crop Insurance Scheme (NIDCI) - Easy Guide
**What Every Farmer Needs to Know**

## Simple Summary & Money Protection
The Government of India has approved the **Digital Crop Insurance Scheme (NIDCI)** with a dedicated budget of **₹4,200 crore** for FY 2026-27. This scheme protects **1.25 crore small and marginal farmers** across 18 high-risk districts.

### Fast 7-Day Money Settlement
Using satellite field photos, your claim is settled in **7 working days** instead of waiting 60 days. Money goes straight to your bank account within **48 hours** via Aadhaar.

## What You Pay & Important Dates
- **Kharif Crops (Monsoon):** You pay only **1.5%** (just ₹15 for every ₹1,000 insured).
- **Rabi Crops (Winter):** You pay only **2.0%** (just ₹20 for every ₹1,000 insured).
- **Government Subsidy:** The Central and State Governments pay the rest (98% of cost, shared 50:50).
- **Last Date to Apply:** **30 November 2026** at your village CSC center or Agritech Portal.

## Important Timetable
- **01 Nov 2026:** Village CSC help camps open.
- **30 Nov 2026:** Last date to submit application and pay your share.
- **15 Dec 2026:** Satellite crop damage checks start automatically.
- **31 Mar 2027:** Bank audit of all settled claims.

*Need Help? Free 24x7 Toll-Free Kisan Helpline: 1800-180-1551. District Agriculture Officers resolve disputes within 72 hours.*`,
    explanation:
      "Replaced technical remote sensing terms (NDVI) and banking acronyms with everyday farmer terminology, while strictly preserving the ₹4,200 Cr outlay, 1.5%/2.0% rates, 30 Nov deadline, and 1800-180-1551 helpline.",
  },
  senior_executive: {
    adaptedContent: `# NIDCI: Executive Decision Brief & Fiscal Summary
**National Initiative on Digital Crop Insurance (FY 2026-27)**

## Strategic Outlay & SLA Compression
- **Sanctioned Fiscal Outlay:** **₹4,200 crore** dedicated budget for FY 2026-27.
- **Beneficiary Coverage:** **1.25 crore small/marginal agricultural producers** across 18 vulnerable agro-climatic zones.
- **SLA Reduction:** Claim validation turnaround compressed by **88%** (from 60 business days down to **7 business days**) via automated ISRO satellite NDVI analysis.

## Fiscal Breakdown & Governance
- **Cost Sharing:** 98% premium subsidy split **50:50 between Central and State treasuries**; farmers contribute fixed **1.5% (Kharif)** and **2.0% (Rabi)**.
- **Disbursement SLA:** Direct Benefit Transfer through NPCI Aadhaar Payment Bridge executed within **48 hours** of automated loss certification.
- **Statutory Audit Deadline:** Mandatory review of participating institutional settlement ratios on **31 March 2027**.

## Critical Path Milestones
1. **01 Nov 2026:** Nationwide Common Service Centre (CSC) operationalization.
2. **30 Nov 2026:** Final statutory cutoff for beneficiary enrollment.
3. **15 Dec 2026:** Automated loss-estimation model deployment.
4. **31 Mar 2027:** Inter-institutional claim settlement audit.

*Appellate Escalation: District Agriculture Officers hold statutory 72-hour dispute SLA backed by 24x7 central line (1800-180-1551).*`,
    explanation:
      "Structured for executive briefing with concise bulleted metrics, ROI/SLA compression statistics (88% reduction), fiscal governance splits (50:50), and statutory milestones.",
  },
  field_worker: {
    adaptedContent: `# NIDCI Field Execution & DAO Verification Manual
**Standard Operating Procedures for District & CSC Ground Teams**

## Field Target & Statutory Outlay
- **Program Allocation:** **₹4,200 crore** (FY 2026-27).
- **Target Outreach:** **1.25 crore small and marginal farmers** across 18 prioritized agro-climatic zones.
- **Claims SLA:** Field loss reports must enable 7-day total settlement and 48-hour Aadhaar DBT transfer.

## CSC Camp & Registration Protocol (01 Nov – 30 Nov 2026)
1. **Aadhaar e-KYC:** Validate farmer identity and geo-tagged plot coordinates.
2. **Premium Collection:** Collect exactly **1.5% for Kharif** and **2.0% for Rabi**; verify the 50:50 Center/State subsidy flag.
3. **Hard Deadline:** All entries must be locked in the Unified Agritech Portal by **30 November 2026 (23:59 IST)**.

## Damage Verification & Grievance SLA (15 Dec 2026 onwards)
- **Loss Assessment:** Cross-verify ISRO satellite NDVI damage alerts with ground drone feeds.
- **Grievance Turnaround:** District Agriculture Officers (DAOs) MUST adjudicate complaints referred by Kisan Sahayata line (1800-180-1551) within **72 hours**.
- **Institutional Audit:** Complete bank reconciliation by **31 March 2027**.`,
    explanation:
      "Tailored for field staff and District Agriculture Officers with procedural checklists, mandatory e-KYC verification steps, cutoff dates, and statutory 72-hour grievance SLAs.",
  },
};

export const DEMO_AUDIENCELENS_REPORT: AudienceLensReport = {
  reportId: "demo-report-nidci-2026",
  deliverableId: "executive_summary",
  contentHash: computeClientContentHash(DEMO_EXECUTIVE_SUMMARY_CONTENT),
  evaluatedAt: "2026-10-15T09:35:00.000Z",
  readability: {
    readingDifficulty: "Moderate",
    readingScore: 8.8,
    approxReadingLevel: "Grade 8.2",
    avgSentenceLength: 14.2,
    jargonDensity: "Low",
    actionClarity: "Excellent",
    bestSuitedAudience: "Executive & Field Personnel",
    audienceRequiringAdaptation: "Rural Farmers (Plain Language)",
  },
  personas: [
    {
      persona: "rural_citizen",
      personaName: "Rural Citizen & Farmer",
      overallScore: 8.8,
      clarityScore: 8.6,
      comprehensionScore: 9.0,
      comprehensionLevel: "High",
      actionabilityScore: 9.5,
      jargonCount: 2,
      strengths: [
        "Clearly specifies the exact ₹ rate and fixed percentage (1.5% Kharif / 2.0% Rabi).",
        "Provides clear toll-free number (1800-180-1551) and CSC village camp availability.",
        "Highlights the 7-day settlement guarantee compared to older 60-day waits.",
      ],
      weaknesses: [
        "Acronyms like 'NDVI' and 'NPCI DBT' require simple contextual explanations.",
      ],
      recommendations: [
        "Include local CSC village assistance contact instructions.",
        "Clarify that Aadhaar card and bank passbook are the primary documents needed.",
      ],
      jargonTerms: [
        {
          term: "NDVI",
          issue: "Technical remote sensing metric unfamiliar to farmers.",
          suggestedExplanation: "Satellite crop-greenness assessment",
        },
        {
          term: "Direct Benefit Transfer (DBT)",
          issue: "Banking administrative term.",
          suggestedExplanation: "Direct payment into your bank account",
        },
      ],
      confusingSections: [],
      adaptationSuggestion: "Substitute satellite technical terms with simple descriptions of crop damage photo surveys.",
    },
    {
      persona: "senior_executive",
      personaName: "Senior Executive & Policy Director",
      overallScore: 9.4,
      clarityScore: 9.6,
      comprehensionScore: 9.8,
      comprehensionLevel: "High",
      actionabilityScore: 9.2,
      jargonCount: 0,
      strengths: [
        "Immediate clarity on ₹4,200 crore budget and central/state 50:50 subsidy splits.",
        "Clear 7-day SLA and March 2027 statutory audit milestone.",
      ],
      weaknesses: [
        "Could highlight risk mitigation protocols for non-digitized land records.",
      ],
      recommendations: [
        "Summarize inter-ministerial coordination requirements between Agriculture and Telecom.",
      ],
      jargonTerms: [],
      confusingSections: [],
      adaptationSuggestion: "Lead with fiscal allocation and turnaround time improvements.",
    },
    {
      persona: "field_worker",
      personaName: "Field Implementation Worker & DAO",
      overallScore: 9.3,
      clarityScore: 9.0,
      comprehensionScore: 9.4,
      comprehensionLevel: "High",
      actionabilityScore: 9.6,
      jargonCount: 1,
      strengths: [
        "Defines clear operational timeline (Nov 1 camp launch, Nov 30 cutoff).",
        "Assigns clear 72-hour grievance escalation workflow for District Agriculture Officers.",
      ],
      weaknesses: [
        "Offline protocol in areas with low cellular connectivity could be elaborated.",
      ],
      recommendations: [
        "Provide offline e-KYC sync instructions for remote village camps.",
      ],
      jargonTerms: [],
      confusingSections: [],
      adaptationSuggestion: "Emphasize registration deadlines, required forms, and field verification steps.",
    },
  ],
};

export const DEMO_DELIVERABLES: GeneratedDeliverable[] = [
  {
    deliverableId: "executive_summary",
    title: "Executive Policy Brief",
    content: DEMO_EXECUTIVE_SUMMARY_CONTENT,
    status: "completed",
    factMeshAudit: DEMO_FACTMESH_AUDIT,
    audienceLensReport: DEMO_AUDIENCELENS_REPORT,
    audienceLensStale: false,
    factMeshAuditStale: false,
  },
  {
    deliverableId: "advisory",
    title: "Citizen Advisory & Farmer Notice",
    content: `# Kisan Soochna: Digital Crop Insurance Scheme (NIDCI)
**Important Notice for All Farmers (Kharif & Rabi Seasons)**

Dear Farmer Brothers and Sisters,

The Central Government has launched the **Digital Crop Insurance Scheme (₹4,200 Crore Scheme)** to protect your hard work against floods, drought, and unseasonal rains.

### 3 Big Benefits for You:
1. **Low Premium:** You only pay **1.5% for Kharif crops** (₹15 per ₹1,000 value) and **2.0% for Rabi crops**.
2. **7-Day Fast Claim Settlement:** Claims will now be settled in **7 days** directly into your bank account instead of waiting months.
3. **Village Assistance Camps:** Common Service Centers (CSC) in your village will assist you from **01 November 2026**.

---

### What You Need to Bring:
- Aadhaar Card
- Bank Passbook (linked with Aadhaar)
- Land record / Khasra-Khatauni copy

### Important Deadline:
- **Last Date to Apply:** **30 November 2026**

For any help or query, call the 24x7 Toll-Free Kisan Helpline: **1800-180-1551** (Free Call).`,
    status: "completed",
  },
  {
    deliverableId: "linkedin_post",
    title: "Public Brief & Social Media Awareness",
    content: `📢 **BIG RELIEF FOR FARMERS: Digital Crop Insurance Scheme Launched!** 🌾🇮🇳

The Government of India launches the **₹4,200 Crore NIDCI Scheme** ensuring instant financial security for 1.25 Crore farmers.

✅ **7-Day Claim Settlements** (No more 60-day delays!)
✅ **Nominal Premium:** Just 1.5% (Kharif) & 2% (Rabi)
✅ **Direct Bank Transfer** via Aadhaar within 48 hours
✅ **Village Camps Start:** 01 November 2026

⚠️ **LAST DATE TO ENROLL: 30 November 2026**

📞 24x7 Kisan Helpline: **1800-180-1551**
🔗 Register at your nearest CSC Center or Unified Agritech Portal.

#DigitalAgriculture #KisanKalyan #NIDCI #CropInsurance #AtmanirbharBharat`,
    status: "completed",
  },
  {
    deliverableId: "presentation",
    title: "Presentation Deck Outline",
    content: `# Presentation Outline: NIDCI Implementation Blueprint

## Slide 1: Title & Executive Vision
- **Title:** National Initiative on Digital Crop Insurance (NIDCI)
- **Subtitle:** Fast-tracking Agricultural Security through Space Technology
- **Budget:** ₹4,200 Crore | Target: 1.25 Crore Farmers

## Slide 2: The Core Paradigm Shift
- **Legacy Process:** 60-day manual loss assessment
- **NIDCI Innovation:** 7-day automated satellite & drone validation
- **Disbursement:** 48-hour Aadhaar Direct Benefit Transfer

## Slide 3: Financial Structure & Beneficiary Terms
- **Farmer Contribution:** 1.5% Kharif / 2.0% Rabi
- **Subsidy Model:** 50:50 Center & State Partnership
- **Coverage:** 18 Vulnerable Agro-Climatic Zones

## Slide 4: Strategic Roadmap & Key Dates
- **Nov 01, 2026:** CSC Village Onboarding Camps
- **Nov 30, 2026:** Final Farmer Enrollment Deadline
- **Dec 15, 2026:** Automated AI Satellite Model Activation
- **Mar 31, 2027:** Comprehensive Bank Audit & Settlement Review`,
    status: "completed",
  },
  {
    deliverableId: "video_package",
    title: "Broadcast Video & Storyboard Package",
    content: `# Broadcast Video Production Package: NIDCI Farmer Security

## Scene 1: Introduction & Scheme Announcement
- **Visual:** Drone sweep of lush Indian agricultural fields transitioning to farmer checking smartphone.
- **Narrator (VO):** "Securing the lifeline of our nation. The Government of India announces the ₹4,200 Crore Digital Crop Insurance Initiative."
- **On-Screen Text:** ₹4,200 Cr Outlay | 1.25 Cr Farmers Covered | 7-Day Fast Settlement

## Scene 2: Technology in Action
- **Visual:** Satellite animation scanning farmland with automated NDVI greenness verification.
- **Narrator (VO):** "Powered by ISRO satellites, crop loss verification is now automated, cutting claim times from 60 days down to just 7 days."
- **On-Screen Text:** ISRO Satellite Verified | Zero Paperwork Delays

## Scene 3: Premium Rates & Call to Action
- **Visual:** Village CSC camp with friendly officer helping farmer complete e-KYC.
- **Narrator (VO):** "Pay just 1.5% for Kharif and 2% for Rabi crops. Register before 30 November 2026 at your village CSC."
- **On-Screen Text:** Deadline: 30 Nov 2026 | Toll-Free: 1800-180-1551`,
    status: "completed",
  },
];

export const DEMO_DRAFT: ProjectDraft = {
  name: "NIDCI National Crop Insurance Initiative",
  sourceType: "text",
  sourceFile: null,
  sourceText: DEMO_SOURCE_TEXT,
  charCount: DEMO_SOURCE_TEXT.length,
  wordCount: 285,
  isReady: true,
};

export const DEMO_CONFIG: TransformationConfig = {
  tone: "formal",
  language: "english",
  audience: "general_public",
  customAudience: "",
  customLanguage: "",
  detailLevel: "standard",
  objective: "inform",
  contentStyle: "executive",
  deliverables: [
    "executive_summary",
    "advisory",
    "linkedin_post",
    "presentation",
    "video_package",
  ],
};

export const DEMO_PROJECT_RECORD: ProjectRecord = {
  id: "demo-project-nidci-2026",
  name: "NIDCI National Crop Insurance Initiative (Demo Dataset)",
  createdAt: "2026-10-15T09:00:00.000Z",
  updatedAt: "2026-10-15T09:35:00.000Z",
  latestGenerationId: "demo-gen-nidci-001",
  sourceType: "text",
  sourceText: DEMO_SOURCE_TEXT,
  sourceMetadata: {
    fileName: "NIDCI_Scheme_Official_Release.txt",
    fileCategory: "text",
    charCount: DEMO_SOURCE_TEXT.length,
    wordCount: 285,
    excerpt: "The Government of India has approved the National Initiative on Digital Crop Insurance...",
  },
  draft: DEMO_DRAFT,
  generationCount: 1,
  deliverableCount: 5,
  status: "completed",
};

export const DEMO_GENERATION_RECORD: GenerationRecord = {
  id: "demo-gen-nidci-001",
  projectId: "demo-project-nidci-2026",
  projectName: "NIDCI National Crop Insurance Initiative (Demo Dataset)",
  generationNumber: 1,
  createdAt: "2026-10-15T09:00:00.000Z",
  completedAt: "2026-10-15T09:02:15.000Z",
  status: "completed",
  draft: DEMO_DRAFT,
  config: DEMO_CONFIG,
  deliverables: DEMO_DELIVERABLES,
  deliverableCount: 5,
  modelUsed: "gemini-3.7-flash",
};
