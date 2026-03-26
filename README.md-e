# Russian Law MCP Server

**The КонсультантПлюс (Konsultant Plus) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Frussian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/russian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Russian-Law-MCP?style=social)](https://github.com/Ansvar-Systems/Russian-Law-MCP)
[![CI](https://github.com/Ansvar-Systems/Russian-Law-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Russian-Law-MCP/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Russian-Law-MCP/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Russian-Law-MCP/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/INTERNATIONAL_ALIGNMENT_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-77%2C647-blue)](docs/INTERNATIONAL_ALIGNMENT_GUIDE.md)

Query **12,369 Russian federal statutes** -- from ФЗ 152-ФЗ о персональных данных and Уголовный кодекс РФ to Гражданский кодекс, Трудовой кодекс, Федеральный закон об информации, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Russian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Russian legal research typically requires КонсультантПлюс or Гарант subscriptions -- expensive, non-API-accessible, and unavailable for programmatic use. Whether you're:
- A **lawyer** validating citations for comparative legal research
- A **compliance officer** assessing Russian operations or cross-border obligations
- A **legal tech developer** building tools that include Russian law coverage
- A **researcher** studying Russian legislative provisions for comparative legal analysis

...you shouldn't need an expensive subscription and manual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Russian federal law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://russian-law-mcp.fly.dev/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add russian-law --transport http https://russian-law-mcp.fly.dev/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "russian-law": {
      "type": "url",
      "url": "https://russian-law-mcp.fly.dev/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "russian-law": {
      "type": "http",
      "url": "https://russian-law-mcp.fly.dev/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/russian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "russian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/russian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "russian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/russian-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"Что гласит статья 6 Федерального закона 152-ФЗ об условиях обработки персональных данных?"* (What does Article 6 of Federal Law 152-FZ say about personal data processing conditions?)
- *"Поиск 'защита персональных данных' в российском праве (ФЗ 152-ФЗ)"* (Search for personal data protection in Russian law)
- *"Какие статьи Уголовного кодекса РФ касаются компьютерных преступлений?"* (Which articles of the Criminal Code concern computer crimes?)
- *"Найди положения о расторжении трудового договора в Трудовом кодексе"* (Find provisions on employment contract termination in the Labor Code)
- *"Search for provisions on corporate governance in the Federal Law on Joint-Stock Companies (208-FZ)"*
- *"Validate the citation 'Статья 272 УК РФ'"* (Validate the citation Article 272 of the Criminal Code)
- *"Find provisions about banking regulation in the Federal Law on Banks and Banking Activities"*
- *"Compare Russian personal data law (152-FZ) with GDPR requirements for data subject rights"*
- *"Поиск 'информационная безопасность' в российском законодательстве"* (Search for information security in Russian legislation)
- *"What does Federal Law 149-FZ say about information and information technologies?"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Federal Statutes** | 12,369 laws | Federal Laws (Федеральные законы), Codes (Кодексы) |
| **Provisions** | 77,647 articles | Full-text searchable with FTS5 (Cyrillic and Latin) |
| **Case Law** | 0 (free tier) | Reserved for future ingestion |
| **Preparatory Works** | 0 (free tier) | Reserved for future ingestion |
| **Agency Guidance** | 0 (free tier) | Reserved for future ingestion |
| **Database Size** | ~530 MB | Optimized SQLite, portable |
| **Daily Updates** | Automated | Freshness checks against pravo.gov.ru |

**Verified data only** -- every citation is validated against official sources (pravo.gov.ru, consultant.ru). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from pravo.gov.ru (Официальный интернет-портал правовой информации) and supplementary sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law number + article
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
pravo.gov.ru / RusLawOD --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                              ^                        ^
                       Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| КонсультантПлюс / Гарант subscription | Search by plain Russian: *"персональные данные обработка"* |
| Navigate multi-chapter codes manually | Get the exact provision with context |
| Manual cross-referencing between federal laws | `build_legal_stance` aggregates across sources |
| "Действует ли этот закон?" -> check manually | `check_currency` tool -> answer in seconds |
| Find international alignment -> dig through legal databases | `get_eu_basis` -> linked international frameworks instantly |
| Expensive subscriptions, no API | MCP protocol -> AI-native |
| No programmatic access | Open-source, self-hostable |

**Traditional:** Open КонсультантПлюс -> Search -> Navigate code -> Cross-reference with federal law -> Repeat

**This MCP:** *"Сравните требования к обработке персональных данных по ФЗ 152-ФЗ и требования GDPR"* -> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 77,647 provisions with BM25 ranking (Cyrillic full-text search) |
| `get_provision` | Retrieve specific provision by law number + article (e.g., "152-ФЗ" + "Статья 6") |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes across multiple federal laws |
| `format_citation` | Format citations per Russian conventions (full/short/pinpoint) |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Alignment Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international frameworks and comparative law references for Russian statutes |
| `get_russian_implementations` | Find Russian laws addressing similar domains to international frameworks |
| `search_eu_implementations` | Search international documents with Russian law alignment analysis |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Comparative analysis of Russian statute coverage against international standards |

---

## International Law Alignment

Russia is not an EU member state. Russia left the Council of Europe in March 2022 following its exclusion after the invasion of Ukraine, and is no longer a party to the European Convention on Human Rights. International alignment is now primarily through BRICS, CIS, and bilateral frameworks.

| Metric | Value |
|--------|-------|
| **Legal System** | Civil law tradition (Continental European heritage) |
| **Data Protection** | Federal Law 152-FZ on Personal Data -- Roskomnadzor oversight |
| **Cybersecurity** | Federal Law 149-FZ (Information Technologies) + 187-FZ (Critical Infrastructure) |
| **Council of Europe** | Russia excluded March 2022 (no longer party to ECHR) |
| **International Bodies** | BRICS, CIS, SCO, UN frameworks |

### Key Russian Federal Laws for International Comparison

1. **Federal Law 152-FZ** (Personal Data, 2006) -- Russian data protection framework; predates GDPR. Roskomnadzor oversight
2. **Federal Law 149-FZ** (Information, Information Technologies, 2006) -- Foundational information law
3. **Federal Law 187-FZ** (Critical Infrastructure Security, 2017) -- Critical information infrastructure protection
4. **Federal Law 63-FZ** (Electronic Signature, 2011) -- Electronic signature law
5. **Federal Law 208-FZ** (Joint-Stock Companies, 1995) -- Corporate law
6. **Уголовный кодекс РФ**, Chapter 28 (Computer Crimes, Art. 272-274) -- Cybercrime provisions

> **Note:** This MCP provides access to Russian federal law for comparative legal research, academic study, and compliance analysis. The available tools allow for research into how Russian law addresses similar domains to EU and international frameworks. Users should be aware of applicable sanctions regimes when conducting business involving Russian-law obligations.

---

## Data Sources & Freshness

All content is sourced from authoritative Russian legal databases:

- **[pravo.gov.ru](http://pravo.gov.ru/)** -- Официальный интернет-портал правовой информации (Official Russian legal information portal)
- **[RusLawOD](https://github.com/opendatalab/RusLawOD)** -- Open Russian legal dataset (supplementary)

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Государственная правовая система (pravo.gov.ru) |
| **Retrieval method** | pravo.gov.ru ingest + RusLawOD supplementary dataset |
| **Languages** | Russian (Cyrillic -- official language of law) |
| **License** | Public domain (Russian official publications) |
| **Coverage** | 12,369 federal laws and codes |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks (Daily)

A [daily GitHub Actions workflow](.github/workflows/check-updates.yml) monitors all data sources:

| Source | Check | Method |
|--------|-------|--------|
| **Statute amendments** | pravo.gov.ru date comparison | All 12,369 laws checked |
| **New statutes** | Official gazette publications (90-day window) | Diffed against database |
| **Reference staleness** | Git commit timestamps | Flagged if >90 days old |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official pravo.gov.ru publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for jurisprudence research
> - **Verify critical citations** against primary sources
> - **International alignment** reflects comparative and analytical relationships, not direct equivalence
> - **Sanctions awareness:** Users should independently assess applicable international sanctions regimes before acting on any Russian-law analysis

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. For guidance on professional obligations under Russian law, consult the Федеральная палата адвокатов Российской Федерации (ФПА РФ). See [PRIVACY.md](PRIVACY.md) for compliance guidance.

---

## Documentation

- **[International Alignment Guide](docs/INTERNATIONAL_ALIGNMENT_GUIDE.md)** -- International framework and comparative law documentation
- **[Security Policy](SECURITY.md)** -- Vulnerability reporting and scanning details
- **[Disclaimer](DISCLAIMER.md)** -- Legal disclaimers and professional use notices
- **[Privacy](PRIVACY.md)** -- Client confidentiality and data handling

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Russian-Law-MCP
cd Russian-Law-MCP
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                    # Ingest statutes from pravo.gov.ru
npm run ingest:ruslawod           # Ingest from RusLawOD supplementary dataset
npm run build:db                  # Rebuild SQLite database
npm run drift:detect              # Run drift detection against anchors
npm run check-updates             # Check for amendments and new statutes
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~530 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 12,369 federal laws

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### @ansvar/russian-law-mcp (This Project)
**Query 12,369 Russian federal statutes directly from Claude** -- 152-ФЗ, Уголовный кодекс, Гражданский кодекс, Трудовой кодекс, and more. Full Cyrillic provision text. `npx @ansvar/russian-law-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Верховный Суд, Конституционный Суд)
- Roskomnadzor guidance documents
- Historical statute versions and amendment tracking
- Regional law (субъекты федерации) coverage

---

## Roadmap

- [x] Core statute database with FTS5 search (Cyrillic)
- [x] Full corpus ingestion (12,369 federal laws, 77,647 provisions)
- [x] International law alignment tools
- [x] Fly.io deployment (database >500MB)
- [x] npm package publication
- [ ] Верховный Суд case law coverage
- [ ] Roskomnadzor guidance and decisions
- [ ] Historical statute versions (amendment tracking)
- [ ] Regional law coverage (субъекты федерации)

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{russian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Russian Law MCP Server: Production-Grade Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Russian-Law-MCP},
  note = {12,369 Russian federal statutes with 77,647 provisions from pravo.gov.ru}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** pravo.gov.ru (public domain -- Russian official publications)
- **RusLawOD dataset:** Open data license (see RusLawOD repository)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server provides programmatic, open access to Russian federal law -- an alternative to expensive КонсультантПлюс and Гарант subscriptions for research and comparative analysis.

Navigating 12,369 federal laws and codes shouldn't require an expensive subscription.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
