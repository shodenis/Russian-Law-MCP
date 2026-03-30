/**
 * get_eu_basis — Retrieve EU legal basis for a Russian statute.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface GetEUBasisInput {
  document_id: string;
  include_articles?: boolean;
  reference_types?: string[];
}

export interface EUBasisDocument {
  id: string;
  type: 'directive' | 'regulation';
  year: number;
  number: number;
  community?: string;
  celex_number?: string;
  title?: string;
  short_name?: string;
  url_eur_lex?: string;
  reference_type: string;
  is_primary_implementation: boolean;
  articles?: string[];
}

export interface GetEUBasisResult {
  document_id: string;
  document_title: string;
  eu_documents: EUBasisDocument[];
  statistics: {
    total_eu_references: number;
    directive_count: number;
    regulation_count: number;
  };
}

export async function getEUBasis(
  db: Database,
  input: GetEUBasisInput
): Promise<ToolResponse<GetEUBasisResult>> {
  if (!input.document_id) {
    throw new Error('document_id is required');
  }

  let statute = db.prepare(`SELECT id, title FROM laws WHERE id = ?`).get(input.document_id) as { id: string; title: string } | undefined;

  if (!statute) {
    statute = db.prepare(`SELECT id, title FROM laws WHERE identifier = ? OR id LIKE ? OR identifier LIKE ? LIMIT 1`).get(input.document_id, `%${input.document_id}%`, `%${input.document_id}%`) as typeof statute;
  }

  if (!statute) {
    throw new Error(`Statute ${input.document_id} not found in database. Try searching with search_legislation first to get the correct document_id.`);
  }

  try {
    let sql = `
      SELECT ed.id, ed.type, ed.year, ed.number, ed.community, ed.celex_number, ed.title, ed.short_name, ed.url_eur_lex,
        CASE
          WHEN SUM(CASE WHEN er.reference_type = 'implements' THEN 1 ELSE 0 END) > 0 THEN 'implements'
          WHEN SUM(CASE WHEN er.reference_type = 'supplements' THEN 1 ELSE 0 END) > 0 THEN 'supplements'
          WHEN SUM(CASE WHEN er.reference_type = 'applies' THEN 1 ELSE 0 END) > 0 THEN 'applies'
          WHEN SUM(CASE WHEN er.reference_type = 'cites_article' THEN 1 ELSE 0 END) > 0 THEN 'cites_article'
          ELSE 'references'
        END AS reference_type,
        MAX(CASE WHEN er.is_primary_implementation = 1 THEN 1 WHEN er.source_type = 'document' AND er.reference_type IN ('implements', 'supplements') THEN 1 ELSE 0 END) AS is_primary_implementation,
        GROUP_CONCAT(DISTINCT er.eu_article) AS articles
      FROM eu_documents ed
      JOIN eu_references er ON ed.id = er.eu_document_id
      WHERE er.law_id = ?
    `;

    const params: (string | number)[] = [input.document_id];

    if (input.reference_types && input.reference_types.length > 0) {
      const placeholders = input.reference_types.map(() => '?').join(', ');
      sql += ` AND er.reference_type IN (${placeholders})`;
      params.push(...input.reference_types);
    }

    sql += `
      GROUP BY ed.id, ed.type, ed.year, ed.number, ed.community, ed.celex_number, ed.title, ed.short_name, ed.url_eur_lex
      ORDER BY MAX(CASE WHEN er.is_primary_implementation = 1 THEN 1 WHEN er.source_type = 'document' AND er.reference_type IN ('implements', 'supplements') THEN 1 ELSE 0 END) DESC,
        CASE WHEN SUM(CASE WHEN er.reference_type = 'implements' THEN 1 ELSE 0 END) > 0 THEN 1 WHEN SUM(CASE WHEN er.reference_type = 'supplements' THEN 1 ELSE 0 END) > 0 THEN 2 WHEN SUM(CASE WHEN er.reference_type = 'applies' THEN 1 ELSE 0 END) > 0 THEN 3 WHEN SUM(CASE WHEN er.reference_type = 'cites_article' THEN 1 ELSE 0 END) > 0 THEN 4 ELSE 5 END,
        ed.year DESC
    `;

    interface QueryRow { id: string; type: 'directive' | 'regulation'; year: number; number: number; community: string | null; celex_number: string | null; title: string | null; short_name: string | null; url_eur_lex: string | null; reference_type: string; is_primary_implementation: number; articles: string | null; }

    const rows = db.prepare(sql).all(...params) as QueryRow[];

    const euDocuments: EUBasisDocument[] = rows.map(row => {
      const doc: EUBasisDocument = { id: row.id, type: row.type, year: row.year, number: row.number, reference_type: row.reference_type, is_primary_implementation: row.is_primary_implementation === 1 };
      if (row.community) doc.community = row.community;
      if (row.celex_number) doc.celex_number = row.celex_number;
      if (row.title) doc.title = row.title;
      if (row.short_name) doc.short_name = row.short_name;
      if (row.url_eur_lex) doc.url_eur_lex = row.url_eur_lex;
      if (input.include_articles && row.articles) doc.articles = row.articles.split(',').filter(a => a && a.trim());
      return doc;
    });

    const directiveCount = euDocuments.filter(d => d.type === 'directive').length;
    const regulationCount = euDocuments.filter(d => d.type === 'regulation').length;

    return {
      results: { document_id: input.document_id, document_title: statute.title, eu_documents: euDocuments, statistics: { total_eu_references: euDocuments.length, directive_count: directiveCount, regulation_count: regulationCount } },
      _metadata: generateResponseMetadata(db),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table')) {
      return { results: { message: 'EU cross-reference data is not yet populated for Russian law. This feature will be available in a future update.' }, _metadata: generateResponseMetadata(db) } as unknown as ToolResponse<GetEUBasisResult>;
    }
    throw err;
  }
}