#!/usr/bin/env node
/**
 * Standalone HTTP server for Russian Law MCP.
 *
 * Used for Docker / Fly.io deployment where we have a persistent filesystem
 * and can serve the full database without size constraints.
 *
 * Exposes:
 *   POST /mcp   — MCP Streamable HTTP transport
 *   GET  /mcp   — Server identity JSON
 *   GET  /health — Health check
 */

import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import Database from '@ansvar/mcp-sqlite';
import { readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { registerTools } from './tools/registry.js';
import type { AboutContext } from './tools/about.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PKG_PATH = join(__dirname, '..', 'package.json');
const pkgVersion: string = JSON.parse(readFileSync(PKG_PATH, 'utf-8')).version;

const SERVER_NAME = 'russian-legal-citations';
const PORT = parseInt(process.env.PORT || '8080', 10);

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const DB_PATH = process.env.RUSSIAN_LAW_DB_PATH
  || join(__dirname, '..', 'data', 'database.db');

let db: InstanceType<typeof Database> | null = null;
let aboutContext: AboutContext | null = null;

function getDatabase(): InstanceType<typeof Database> {
  if (!db) {
    // Clean stale lock from previous runs
    const lockPath = DB_PATH + '.lock';
    if (existsSync(lockPath)) {
      rmSync(lockPath, { recursive: true, force: true });
    }
    // Clean WAL/SHM files
    for (const ext of ['-wal', '-shm']) {
      const p = DB_PATH + ext;
      if (existsSync(p)) rmSync(p, { force: true });
    }

    console.log(`[${SERVER_NAME}] Opening database: ${DB_PATH}`);
    db = new Database(DB_PATH, { readonly: true });
    db.pragma('foreign_keys = ON');
    console.log(`[${SERVER_NAME}] Database ready`);
  }
  return db;
}

function getAboutContext(): AboutContext {
  if (!aboutContext) {
    let fingerprint = 'unknown';
    let dbBuilt = new Date().toISOString();
    try {
      const dbBuffer = readFileSync(DB_PATH);
      fingerprint = createHash('sha256').update(dbBuffer).digest('hex').slice(0, 12);
      const dbStat = statSync(DB_PATH);
      dbBuilt = dbStat.mtime.toISOString();
    } catch {
      // Non-fatal
    }
    aboutContext = { version: pkgVersion, fingerprint, dbBuilt };
  }
  return aboutContext;
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const httpServer = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      server: SERVER_NAME,
      version: pkgVersion,
      uptime_seconds: Math.floor(process.uptime()),
      database: existsSync(DB_PATH) ? 'available' : 'missing',
    }));
    return;
  }

  // MCP endpoint
  if (url.pathname === '/mcp') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: SERVER_NAME,
        version: pkgVersion,
        protocol: 'mcp-streamable-http',
      }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const database = getDatabase();

        const server = new Server(
          { name: SERVER_NAME, version: pkgVersion },
          { capabilities: { tools: {} } },
        );
        registerTools(server, database, getAboutContext());

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        await server.connect(transport);

        // Read body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        // Bridge Node http req/res to the Vercel-style interface expected by
        // StreamableHTTPServerTransport.handleRequest
        const vercelLikeReq = Object.assign(req, {
          body,
          query: Object.fromEntries(url.searchParams),
        });
        const vercelLikeRes = Object.assign(res, {
          status(code: number) {
            res.statusCode = code;
            return vercelLikeRes;
          },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vercelLikeRes;
          },
        });

        await transport.handleRequest(vercelLikeReq as any, vercelLikeRes as any, body);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('MCP handler error:', message);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        }
      }
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVER_NAME}] HTTP server listening on 0.0.0.0:${PORT}`);
});

process.on('SIGINT', () => {
  console.log(`[${SERVER_NAME}] Shutting down...`);
  if (db) db.close();
  httpServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`[${SERVER_NAME}] Shutting down...`);
  if (db) db.close();
  httpServer.close();
  process.exit(0);
});
