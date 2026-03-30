/**
 * validate_citation — Validate a Russian legal citation against the database.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { parseCitation } from '../citations.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

const CODE_SEARCH_TERMS: Record<string, string[]> = {
  'Налоговый кодекс': ['НК РФ', 'Налоговый кодекс', 'налогов%кодекс'],
  'Гражданский кодекс': ['ГК РФ', 'Гражданский кодекс', 'гражданск%кодекс'],
  'Трудовой кодекс': ['ТК РФ', 'Трудовой кодекс', 'трудов%кодекс'],
  'Жилищный кодекс': ['ЖК РФ', 'Жилищный кодекс', 'жилищн%кодекс'],
  'Земельный кодекс': ['ЗК РФ', 'Земельный кодекс', 'земельн%кодекс'],
  'Семейный кодекс': ['СК РФ', 'Семейный кодекс', 'семейн%кодекс'],
  'Уголовный кодекс': ['УК РФ', 'Уголовный кодекс', 'уголовн%кодекс'],
  'Кодекс об административных правонарушениях': ['КоАП РФ', 'Административн%кодекс'],
  'Уголовно-процессуальный кодекс': ['УПК РФ', 'Уголовно-процессуальн%кодекс'],
  'Гражданский процессуальный кодекс': ['ГПК РФ', 'Гражданский процессуальн%кодекс'],
  'Арбитражный процессуальный кодекс': ['АПК РФ', 'Арбитражн%процессуальн%кодекс'],
  'Бюджетный кодекс': ['БК РФ', 'Бюджетн%кодекс'],
};

export interface ValidateCitationInput { citation: string; }

export interface ValidateCitationResult {
  citation: string;
  parsed_type: string;
  formatted_citation: string;
  valid: boolean;
  document_exists: boolean;
  provision_exists: boolean;
  document_title?: string;
  status?: string;
  warnings: string[];
}

export async function validateCitationTool(db: Database, input: ValidateCitationInput): Promise<ToolResponse<ValidateCitationResult>> {
  if (!input.citation || input.citation.trim().length === 0) {
    return { results: { citation: input.citation, parsed_type: 'unknown', formatted_citation: '', valid: false, document_exists: false, provision_exists: false, warnings: ['Empty citation'] }, _metadata: generateResponseMetadata(db) };
  }

  const parsed = parseCitation(input.citation);

  if (!parsed.valid) {
    return { results: { citation: input.citation, parsed_type: parsed.type, formatted_citation: input.citation, valid: false, document_exists: false, provision_exists: false, warnings: [parsed.error ?? 'Could not parse citation'] }, _metadata: generateResponseMetadata(db) };
  }

  const warnings: string[] = [];
  let documentExists = false;
  let provisionExists = false;
  let documentTitle: string | undefined;
  let status: string | undefined;

  if (parsed.number) {
    const docs = db.prepare(`SELECT id, title, status FROM laws WHERE identifier = ? OR id LIKE ?`).all(parsed.number, `%${parsed.number}%`) as { id: string; title: string; status: string }[];

    if (docs.length > 0) {
      documentExists = true;
      documentTitle = docs[0].title;
      status = docs[0].status;
      const repealed = docs.find(d => d.status === 'repealed');
      if (repealed) warnings.push('This statute has been repealed (утратил силу)');

      if (parsed.article) {
        for (const d of docs) {
          const prov = db.prepare(`SELECT 1 FROM provisions WHERE law_id = ? AND (provision_ref = ? OR article = ? OR provision_ref LIKE ?) LIMIT 1`).get(d.id, parsed.article, parsed.article, `%${parsed.article}%`);
          if (prov) { provisionExists = true; break; }
        }
        if (!provisionExists) warnings.push(`Article ${parsed.article} not found in this document`);
      } else {
        provisionExists = true;
      }
    } else {
      warnings.push('Document not found in database');
    }
  } else if (parsed.title) {
    let doc: { id: string; title: string; status: string } | undefined;
    doc = db.prepare(`SELECT id, title, status FROM laws WHERE title LIKE ? LIMIT 1`).get(`%${parsed.title}%`) as typeof doc;

    if (!doc && CODE_SEARCH_TERMS[parsed.title]) {
      for (const term of CODE_SEARCH_TERMS[parsed.title]) {
        doc = db.prepare(`SELECT id, title, status FROM laws WHERE title LIKE ? OR identifier LIKE ? LIMIT 1`).get(`%${term}%`, `%${term}%`) as typeof doc;
        if (doc) break;
      }
    }

    if (doc) {
      documentExists = true;
      documentTitle = doc.title;
      status = doc.status;
      if (doc.status === 'repealed') warnings.push('This statute has been repealed (утратил силу)');

      if (parsed.article) {
        let allDocIds: string[] = [doc.id];
        if (CODE_SEARCH_TERMS[parsed.title]) {
          for (const term of CODE_SEARCH_TERMS[parsed.title]) {
            const found = db.prepare(`SELECT id FROM laws WHERE title LIKE ? OR identifier LIKE ?`).all(`%${term}%`, `%${term}%`) as { id: string }[];
            if (found.length > 0) { allDocIds = found.map(f => f.id); break; }
          }
        }
        for (const lawId of allDocIds) {
          const prov = db.prepare(`SELECT 1 FROM provisions WHERE law_id = ? AND (provision_ref = ? OR article = ? OR provision_ref LIKE ?) LIMIT 1`).get(lawId, parsed.article, parsed.article, `%${parsed.article}%`);
          if (prov) { provisionExists = true; break; }
        }
        if (!provisionExists) warnings.push(`Article ${parsed.article} not found in this document`);
      } else {
        provisionExists = true;
      }
    } else {
      warnings.push('Document not found in database');
    }
  } else {
    warnings.push('Citation does not contain a document identifier');
  }

  return { results: { citation: input.citation, parsed_type: parsed.type, formatted_citation: parsed.raw, valid: parsed.valid && documentExists, document_exists: documentExists, provision_exists: provisionExists, document_title: documentTitle, status, warnings }, _metadata: generateResponseMetadata(db) };
}