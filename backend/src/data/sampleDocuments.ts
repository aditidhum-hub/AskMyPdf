import { PdfDocument } from '../types.js';

export const SAMPLE_DOCUMENTS: PdfDocument[] = [
  {
    id: 'doc-clean-energy-2026',
    name: 'Global Clean Energy Transition & Grid Storage Outlook 2026.pdf',
    size: 2450000,
    fileType: 'application/pdf',
    uploadDate: 'May 14, 2026',
    pageCount: 4,
    wordCount: 1890,
    category: 'research',
    summary: 'Comprehensive analysis on renewable power generation, lithium-iron-phosphate (LFP) vs. sodium-ion battery grid storage economics, and clean hydrogen infrastructure scaling through 2030.',
    keyFindings: [
      'Battery energy storage system (BESS) capital expenditure dropped 28% year-over-year in 2025 to $112/kWh.',
      'Global solar PV installations reached 610 GW in 2025, led by utility-scale deployments in North America and APAC.',
      'Sodium-ion batteries are projected to capture 18% of stationary storage market share by 2028 due to supply chain resilience.',
      'Grid interconnection queue delays remain the single largest bottleneck, with average wait times exceeding 4.2 years.'
    ],
    suggestedQuestions: [
      'What are the primary cost drivers for grid-scale battery storage?',
      'How does sodium-ion battery technology compare to LFP?',
      'What is the estimated deployment capacity of solar PV by 2028?',
      'What regulatory and interconnection bottlenecks are highlighted?'
    ],
    pages: [
      {
        pageNumber: 1,
        title: 'Executive Summary & Global Macro Landscape',
        content: `GLOBAL CLEAN ENERGY TRANSITION & GRID STORAGE OUTLOOK 2026
Prepared by the International Energy Strategy Institute (IESI)
Published: Q1 2026 | Document ID: IESI-REP-2026-084

1. EXECUTIVE SUMMARY
The global decarbonization pathway has reached an inflection point. In 2025, combined investments in renewable power generation, transmission network modernization, and stationary energy storage surpassed $1.85 trillion globally. Solar photovoltaic (PV) continues to dominate new capacity additions, delivering 610 gigawatts (GW) of capacity additions, representing a 34% increase relative to 2024 benchmarks.

However, rapid intermittent renewable penetration has intensified grid instability and localized curtailment rates. In jurisdictions such as ERCOT (Texas) and CAISO (California), solar curtailment exceeded 8.4% during peak mid-day generation intervals. Consequently, the commercial imperative has shifted decisively toward multi-hour energy storage systems and responsive demand-side dispatch mechanisms.

Key Metrics at a Glance:
- Global Total Clean Tech Capital Allocation: $1.85 Trillion (+19.4% YoY)
- Solar PV Global Capacity Additions: 610 GW
- Offshore & Onshore Wind Additions: 124 GW
- Average Interconnection Queue Latency: 4.2 Years in North America and EU
- Levelized Cost of Storage (LCOS): $74/MWh for 4-hour utility duration.`,
        keyTopics: ['Executive Summary', 'Capital Allocation', 'Curtailment', 'Solar PV additions']
      },
      {
        pageNumber: 2,
        title: 'Battery Chemistries: LFP vs. Sodium-Ion Economics',
        content: `2. STATIONARY STORAGE DYNAMICS: CELL CHEMISTRY & COST PARITY
Utility-scale battery energy storage system (BESS) capital expenditure dropped 28% year-over-year in 2025, reaching an unprecedented low of $112/kWh at the integrated pack level (inclusive of battery management system and thermal conditioning modules).

2.1 Lithium Iron Phosphate (LFP) Maturity
LFP maintains its dominance, accounting for 84% of all stationary grid battery deployments. Energy density advancements (now reaching 195 Wh/kg at the cell level) combined with cycle life degradation exceeding 8,000 cycles at 80% Depth of Discharge (DoD) render LFP the defacto choice for 2-hour to 6-hour duration applications. Supply chains in cathode precursors have stabilized, reducing carbonate volatility.

2.2 The Rise of Sodium-Ion Alternatives
Commercialization of sodium-ion chemistries accelerated dramatically throughout late 2025. With zero reliance on critical raw materials—namely nickel, cobalt, or lithium—sodium-ion bill-of-materials costs are 32% lower than equivalent LFP formulations. While volumetric energy density remains lower (140-160 Wh/kg), its superior cold-weather discharge efficiency (-25°C with 91% capacity retention) and non-flammable electrolyte formulations position it for widespread adoption. Sodium-ion is projected to achieve 18% market share in stationary storage by 2028.`,
        keyTopics: ['LFP Batteries', 'Sodium-Ion', 'Cell Chemistry', 'Cost Parity', 'Cycle Life']
      },
      {
        pageNumber: 3,
        title: 'Grid Interconnection Backlogs & Transmission Bottlenecks',
        content: `3. INFRASTRUCTURE FRICTION: THE INTERCONNECTION CRISIS
While equipment costs and supply chain constraints have eased substantially, regional transmission infrastructure has emerged as the primary impediment to clean energy commercialization.

3.1 Queue Latencies & Speculative Filing
Across North American regional transmission organizations (RTOs) including PJM, MISO, and SPP, more than 2,100 GW of generation and storage capacity currently sits awaiting interconnection studies. The average elapsed duration between initial system impact study request and commercial operation agreement signing has expanded from 2.1 years in 2019 to 4.2 years in 2025. 

3.2 Grid Enhancing Technologies (GETs)
To mitigate multi-billion dollar traditional reconductoring timelines, progressive transmission operators are deploying Dynamic Line Rating (DLR) sensors, advanced power flow controllers, and topology optimization software. Pilot programs across 14 European utilities demonstrated transmission capacity unlock between 15% and 35% under favorable meteorological ambient cooling conditions, providing near-term alleviation at 5% of the capital cost of constructing greenfield high-voltage direct current (HVDC) corridors.`,
        keyTopics: ['Transmission Queues', 'Interconnection Crisis', 'Grid Enhancing Technologies', 'Dynamic Line Rating']
      },
      {
        pageNumber: 4,
        title: 'Regulatory Outlook & Strategic Recommendations',
        content: `4. POLICY FRAMEWORKS & STRATEGIC RECOMMENDATIONS
To preserve clean energy project developer margins while navigating macroeconomic volatility, developers and institutional infrastructure allocators must adopt a resilient tri-part strategy.

4.1 Merchant Revenue Optimization vs. Tolling Contracts
As renewable saturation compresses wholesale energy arbitrage margins during solar peak hours, pure merchant battery assets face heightened revenue uncertainty. Hybrid contracting structures—combining fixed-price capacity tolls (covering 60% of debt service obligations) with algorithmic participation in frequency regulation and spinning reserve ancillary service markets—are yielding optimal risk-adjusted returns (IRRs of 11.8% to 14.2%).

4.2 Recommendations for Policymakers and Grid Operators:
1. Mandate "First-Ready, First-Served" Cluster Study Reforms to purge speculative filings from interconnection queues.
2. Provide standardized safety qualification protocols for next-generation sodium-ion installations under UL 9540 standards.
3. Accelerate statutory cross-state HVDC permitting deadlines to under 24 months for designated critical energy corridors.
4. Establish capacity remuneration mechanisms that compensate clean firm capacity and rapid ramping capabilities.`,
        keyTopics: ['Policy Framework', 'Revenue Optimization', 'Ancillary Services', 'Regulatory Reform']
      }
    ]
  },
  {
    id: 'doc-ai-agent-architecture',
    name: 'Agentic Workflows & Multi-Agent Reasoning Architectures.pdf',
    size: 1850000,
    fileType: 'application/pdf',
    uploadDate: 'Apr 28, 2026',
    pageCount: 3,
    wordCount: 1420,
    category: 'technology',
    summary: 'Technical whitepaper on autonomous agent loops, tool-augmented reasoning, reflection mechanisms, and deterministic guardrails in production LLM systems.',
    keyFindings: [
      'Multi-agent reflection architectures reduced task hallucination rates by 42% compared to single-pass prompting.',
      'Dynamic context compression preserves up to 78% of relevant token window while reducing latency by 3.4x.',
      'Deterministic state machines wrapping LLM agents prevent circular delegation loops and unconstrained API tool calls.',
      'Hybrid RAG using dense vector embeddings coupled with sparse BM25 keyword search yielded 93.4% retrieval accuracy.'
    ],
    suggestedQuestions: [
      'What are the key differences between single-pass and multi-agent reflection?',
      'How does the paper propose handling context window limits?',
      'What guardrails are recommended to stop infinite tool-calling loops?',
      'What are the benchmark scores for hybrid vs. pure vector search?'
    ],
    pages: [
      {
        pageNumber: 1,
        title: 'Introduction to Autonomous Agentic Frameworks',
        content: `AGENTIC WORKFLOWS & MULTI-AGENT REASONING ARCHITECTURES
Published by AI Systems Research Lab | Technical Report #TR-2026-402

1. EVOLUTION FROM CHATBOTS TO AUTONOMOUS AGENTS
The deployment paradigm for large language models (LLMs) has undergone a fundamental transition from single-turn conversational chatbots to persistent, autonomous agentic systems. An agentic system differs from a traditional LLM pipeline by exhibiting four foundational characteristics:
1. Environment Perception & Tool Invocations: Interacting dynamically with external APIs, databases, and sandboxed code execution environments.
2. Autonomous Goal Deconstruction: Decomposing complex ambiguous goals into structured dependency graphs of micro-actions.
3. Self-Reflection & Error Correction: Evaluating tool outputs against internal success criteria and iteratively revising downstream steps.
4. Working Memory & Episodic Retrieval: Maintaining state across long interaction horizons through hierarchical memory architectures.

Empirical evaluation indicates that across challenging software engineering benchmarks (such as SWE-bench Verified), autonomous multi-turn agentic loops achieve 54.8% resolution rates, compared to only 18.2% for zero-shot prompts.`,
        keyTopics: ['Agentic Systems', 'Tool Invocations', 'Goal Deconstruction', 'Self-Reflection', 'SWE-bench']
      },
      {
        pageNumber: 2,
        title: 'Memory Systems, Context Compression & RAG',
        content: `2. MEMORY HIERARCHIES AND DYNAMIC CONTEXT COMPRESSION
As interaction contexts lengthen, agents face memory degradation and token cost explosions. To maintain coherence across long-horizon executions, enterprise architectures employ three distinct memory tiers:

2.1 The Three-Tier Memory Architecture
- Scratchpad / Working Memory: Short-term buffer holding immediate step reasoning and the latest tool execution outputs.
- Episodic / Task Memory: Summarized milestone checkpoints of previous task phases, compressed using hierarchical recursive summarization.
- Semantic Long-Term Memory: Vector-indexed external store querying domain manuals, enterprise knowledge bases, and user preferences.

2.2 Hybrid Retrieval-Augmented Generation (RAG)
Pure semantic vector similarity search suffers from precision degradation when dealing with precise part numbers, SKU codes, or exact technical parameters. The hybrid approach combines:
1. Dense Vector Embeddings (e.g., text-embedding-004) for conceptual relevance.
2. Sparse Lexical Search (BM25 or Lucene inverted index) for exact syntactic token matches.
3. Cross-Encoder Re-ranking: Scoring top 50 retrieved chunks through a neural cross-encoder model to produce a precision-ranked context bundle.
In rigorous comparative benchmarks, Hybrid RAG with Cross-Encoder re-ranking achieved 93.4% MRR@10, outperforming standard vector-only cosine similarity by 21.6 percentage points.`,
        keyTopics: ['Three-Tier Memory', 'Context Compression', 'Hybrid RAG', 'BM25', 'Cross-Encoder']
      },
      {
        pageNumber: 3,
        title: 'Production Guardrails & Failure Modes',
        content: `3. PRODUCTION GUARDRAILS AND DETERMINISTIC SAFETY
Unconstrained LLM agents present unique failure vectors when deployed in production enterprise workflows.

3.1 Primary Failure Vectors
- Circular Delegation Loops: Two or more specialized sub-agents ping-ponging sub-tasks indefinitely without reaching convergence.
- Tool Parameter Drift: Generating subtly malformed JSON arguments when invoking third-party transactional APIs.
- Context Contamination: Carrying forward intermediate failed reasoning into subsequent planning prompts.

3.2 Mitigation Architectural Patterns
To ensure deterministic execution, production implementations must wrap LLM agents within a deterministic state machine:
- Explicit Step Quotas: Hard cap of maximum tool executions per user request (e.g., maximum 8 tool steps).
- JSON Schema Enforcement: Constraining model generation using strict grammar-guided decoding (e.g., Gemini structured output schemas).
- Human-in-the-Loop Interrupts: For irreversible destructive operations (e.g., database writes, monetary transactions, email dispatches), the agent must yield execution to a user approval gate.`,
        keyTopics: ['Guardrails', 'Circular Delegation', 'Deterministic State Machines', 'Human-in-the-Loop']
      }
    ]
  },
  {
    id: 'doc-saas-legal-msa',
    name: 'Enterprise Cloud SaaS Master Services Agreement (MSA).pdf',
    size: 1420000,
    fileType: 'application/pdf',
    uploadDate: 'Mar 19, 2026',
    pageCount: 3,
    wordCount: 1650,
    category: 'legal',
    summary: 'Standard enterprise Master Services Agreement governing SaaS software licenses, service level agreements (99.9% uptime SLA), data processing addendum, and limitation of liability.',
    keyFindings: [
      'Service Level Agreement specifies 99.9% monthly uptime, with 10% to 25% service credits for downtime breaches.',
      'Aggregate liability is capped at total fees paid by Customer during the 12 months preceding the incident, with uncapped exceptions for gross negligence.',
      'Customer retains sole ownership of Customer Data; Provider receives only a limited license to host and process data.',
      'Termination for convenience requires 60 days advance written notice prior to annual renewal.'
    ],
    suggestedQuestions: [
      'What are the uptime guarantees and service credit remedies?',
      'What is the cap on limitation of liability and what are the exclusions?',
      'How is Customer Data treated under GDPR / data privacy clauses?',
      'What is the notice period required for contract termination?'
    ],
    pages: [
      {
        pageNumber: 1,
        title: 'Section 1: Scope, Subscription & Service Levels',
        content: `MASTER SERVICES AGREEMENT (MSA)
Reference Contract Number: MSA-ENT-2026-9921
Effective Date: March 1, 2026

BETWEEN: CloudScale Systems Inc. ("Provider") AND Enterprise Global Logistics Corp ("Customer").

1. SUBSCRIPTION SERVICES & ACCESS GRANTS
Subject to the terms and payment of fees specified in each Order Form, Provider grants Customer a non-exclusive, non-transferable, worldwide right to access and use the hosted SaaS applications during the Subscription Term solely for Customer's internal business operations.

2. SERVICE LEVEL AGREEMENT (SLA) & UPTIME COMMITMENT
2.1 Uptime Percentage: Provider warrants that the SaaS Services will maintain an Monthly Uptime Percentage of not less than 99.9% during each calendar month, excluding Scheduled Maintenance.
2.2 Service Credits: In the event of a failure to meet the 99.9% SLA, Customer's sole and exclusive remedy shall be the issuance of Service Credits calculated as follows:
- Monthly Uptime 99.0% to 99.89%: 10% credit of monthly recurring fee.
- Monthly Uptime 95.0% to 98.99%: 25% credit of monthly recurring fee.
- Monthly Uptime below 95.0%: 50% credit of monthly recurring fee and right to terminate without penalty within 30 days.`,
        keyTopics: ['Subscription Grant', 'Service Level Agreement', '99.9% Uptime', 'Service Credits']
      },
      {
        pageNumber: 2,
        title: 'Section 2: Data Protection, Security & Intellectual Property',
        content: `3. INTELLECTUAL PROPERTY & PROPRIETARY RIGHTS
3.1 Customer Data Ownership: As between the parties, Customer retains all right, title, and interest (including all patent, copyright, trademark, and trade secret rights) in and to all data, text, files, and information uploaded or submitted by Customer to the SaaS Service ("Customer Data"). Provider acquires no right or title to Customer Data other than the limited, non-exclusive right to host, transmit, and process such data solely as necessary to provide the Services.
3.2 Provider Technology: Provider retains all proprietary rights in the SaaS software, platform architecture, underlying machine learning models, and documentation.

4. DATA SECURITY & REGULATORY COMPLIANCE
Provider shall maintain industry-standard administrative, physical, and technical safeguards designed to protect the security, confidentiality, and integrity of Customer Data. Provider complies with SOC 2 Type II certifications, ISO/IEC 27001, and the General Data Protection Regulation (GDPR). In the event of a confirmed Security Incident involving Customer Data, Provider shall notify Customer in writing within 48 hours of verification.`,
        keyTopics: ['Customer Data Ownership', 'Intellectual Property', 'Data Security', 'SOC 2 Type II', 'GDPR', 'Breach Notification']
      },
      {
        pageNumber: 3,
        title: 'Section 3: Indemnification, Liability Cap & Term',
        content: `5. LIMITATION OF LIABILITY
5.1 Consequential Damages Waiver: EXCEPT FOR WILLFUL MISCONDUCT OR BREACH OF CONFIDENTIALITY OBLIGATIONS, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION.
5.2 Aggregate Dollar Cap: EACH PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL BE STRICTLY LIMITED TO THE AGGREGATE FEES PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
5.3 Uncapped Claims: The liability limitations in Section 5.2 shall not apply to: (a) Provider's IP indemnification obligations; (b) Customer's payment obligations; or (c) either party's gross negligence or intentional fraud.

6. TERM AND TERMINATION
6.1 Term: This Agreement commences on the Effective Date and continues for an initial term of 24 months, automatically renewing for successive 12-month periods unless either party delivers written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.`,
        keyTopics: ['Limitation of Liability', '12-Month Fee Cap', 'Consequential Damages', 'Term and Renewal', '60-day Notice']
      }
    ]
  },
  {
    id: 'doc-fintech-q1-2026',
    name: 'FinTech Capital Q1 2026 Financial Results & Outlook.pdf',
    size: 2100000,
    fileType: 'application/pdf',
    uploadDate: 'Feb 12, 2026',
    pageCount: 3,
    wordCount: 1540,
    category: 'finance',
    summary: 'Quarterly financial earnings report outlining recurring software revenue growth, net interest margins, customer acquisition cost payback, and fiscal year 2026 guidance.',
    keyFindings: [
      'Total ARR reached $142.6M, representing a 31.4% YoY expansion.',
      'Net Revenue Retention (NRR) remained strong at 119% driven by enterprise account tier expansions.',
      'Operating cash flow turned positive at $18.4M compared to -$6.2M in Q1 2025.',
      'Customer Acquisition Cost (CAC) payback period improved from 14.2 months to 9.8 months.'
    ],
    suggestedQuestions: [
      'What was the Annual Recurring Revenue (ARR) and YoY growth rate?',
      'How did operating cash flow perform compared to last year?',
      'What is the current CAC payback period and Net Retention Rate?',
      'What is the full-year 2026 revenue guidance?'
    ],
    pages: [
      {
        pageNumber: 1,
        title: 'Executive Financial Highlights & Revenue Breakdown',
        content: `FINTECH CAPITAL HOLDINGS (NYSE: FTC)
Q1 2026 SHAREHOLDER LETTER & EARNINGS TRANSCRIPT
Period Ended: March 31, 2026

1. FINANCIAL HIGHLIGHTS OVERVIEW
We are pleased to report exceptional performance for the first quarter of fiscal year 2026, characterized by accelerating adoption of our embedded banking API and liquidity management platform among mid-market enterprise clients.

Key Financial Results:
- Total Annual Recurring Revenue (ARR): $142.6 Million (+31.4% YoY from $108.5M in Q1 2025)
- Q1 GAAP Revenue: $38.2 Million (+29.8% YoY)
- Gross Profit Margin: 77.4% (expanded 280 basis points YoY)
- Net Revenue Retention (NRR): 119% across all accounts, 126% within enterprise cohort ($100k+ ARR)
- Free Cash Flow: $16.2 Million (representing a 42.4% Free Cash Flow margin improvement)
- GAAP Net Income: $4.1 Million, achieving our second consecutive quarter of GAAP profitability.`,
        keyTopics: ['Financial Highlights', 'ARR Growth', 'Gross Margin', 'Net Revenue Retention', 'GAAP Profitability']
      },
      {
        pageNumber: 2,
        title: 'Operational Metrics: Cohorts, CAC Payback & Churn',
        content: `2. OPERATING EFFICIENCY & UNIT ECONOMICS
Our strategic pivot toward enterprise pipeline generation delivered significant operating leverage across our sales and marketing vectors.

2.1 Unit Economics & Sales Efficiency
- Customer Acquisition Cost (CAC) Payback: Decreased from 14.2 months in Q1 2025 to 9.8 months in Q1 2026.
- Magic Number (Sales Efficiency): 1.18, indicating high return on sales expenditures.
- Customer Count: 1,480 active business customers, up from 1,190 in Q1 2025.
- Average Revenue Per Account (ARPA): Increased 14.5% to $96,350 annually.

2.2 Churn & Gross Retention
- Gross Logo Churn: 0.62% monthly (annualized 7.4%), reaching an all-time low.
- Net Dollar Expansion: Enterprise customers added an average of 2.4 secondary API modules (led by Instant Treasury Payouts and FX Clearing) within the first 6 months of onboarding.`,
        keyTopics: ['Unit Economics', 'CAC Payback', 'Sales Efficiency', 'Logo Churn', 'ARPA Expansion']
      },
      {
        pageNumber: 3,
        title: 'Balance Sheet & Full Year 2026 Guidance',
        content: `3. BALANCE SHEET STRENGTH & FORWARD GUIDANCE
FinTech Capital maintains a fortress balance sheet with zero outstanding term debt and significant liquidity reserves to fund organic product expansion and strategic tuck-in technology acquisitions.

3.1 Balance Sheet Summary
- Cash, Cash Equivalents, and Short-Term Treasury Securities: $214.8 Million
- Accounts Receivable: $19.4 Million (DSO of 38 days)
- Total Assets: $318.5 Million against Total Liabilities of $64.2 Million.

3.2 Updated Full Year 2026 Guidance:
- Full Year ARR: Raised to $168.0M - $172.0M (previously $162M - $166M)
- Full Year Revenue: $156.0M - $160.0M (representing 28% to 31% YoY growth)
- Adjusted EBITDA Margin: 18.0% to 20.0%
- Capex: Estimated between $8.0M and $10.0M, primarily for server infrastructure and SOC 2 Type II compliance audits.`,
        keyTopics: ['Balance Sheet', 'Cash Reserves', 'Full Year Guidance', 'Adjusted EBITDA', 'Capex']
      }
    ]
  }
];
