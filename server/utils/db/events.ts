import type { HookEvent, FilterOptions } from '../types';
import { getDatabase } from './init';

export function insertEvent(event: HookEvent): HookEvent {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO events (source_app, session_id, hook_event_type, payload, chat, summary, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const timestamp = event.timestamp || Date.now();
  const result = stmt.run(
    event.source_app,
    event.session_id,
    event.hook_event_type,
    JSON.stringify(event.payload),
    event.chat ? JSON.stringify(event.chat) : null,
    event.summary || null,
    timestamp
  );
  
  return {
    ...event,
    id: result.lastInsertRowid as number,
    timestamp
  };
}

export function getFilterOptions(): FilterOptions {
  const db = getDatabase();
  const sourceApps = db.prepare('SELECT DISTINCT source_app FROM events ORDER BY source_app').all() as { source_app: string }[];
  const sessionIds = db.prepare('SELECT DISTINCT session_id FROM events ORDER BY session_id DESC LIMIT 100').all() as { session_id: string }[];
  const hookEventTypes = db.prepare('SELECT DISTINCT hook_event_type FROM events ORDER BY hook_event_type').all() as { hook_event_type: string }[];
  
  return {
    source_apps: sourceApps.map(row => row.source_app),
    session_ids: sessionIds.map(row => row.session_id),
    hook_event_types: hookEventTypes.map(row => row.hook_event_type)
  };
}

export function getRecentEvents(limit: number = 100): HookEvent[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, source_app, session_id, hook_event_type, payload, chat, summary, timestamp
    FROM events
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    source_app: row.source_app,
    session_id: row.session_id,
    hook_event_type: row.hook_event_type,
    payload: JSON.parse(row.payload),
    chat: row.chat ? JSON.parse(row.chat) : undefined,
    summary: row.summary || undefined,
    timestamp: row.timestamp
  })).reverse();
}

export function getHistoricalEvents(beforeTimestamp: number, limit: number = 50): {
  events: HookEvent[];
  has_more: boolean;
  earliest_timestamp: string | null;
} {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, source_app, session_id, hook_event_type, payload, chat, summary, timestamp
    FROM events
    WHERE timestamp < ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(beforeTimestamp, limit) as any[];
  
  const events = rows.map(row => ({
    id: row.id,
    source_app: row.source_app,
    session_id: row.session_id,
    hook_event_type: row.hook_event_type,
    payload: JSON.parse(row.payload),
    chat: row.chat ? JSON.parse(row.chat) : undefined,
    summary: row.summary || undefined,
    timestamp: row.timestamp
  })).reverse();
  
  // Check if there are more events beyond this batch
  let has_more = false;
  let earliest_timestamp: string | null = null;
  
  if (events.length > 0) {
    const earliestEvent = events[0]; // First event after reverse (oldest in this batch)
    earliest_timestamp = new Date(earliestEvent.timestamp).toISOString();
    
    // Check if there are more events older than the earliest in this batch
    const checkMoreStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM events
      WHERE timestamp < ?
    `);
    const result = checkMoreStmt.get(earliestEvent.timestamp) as { count: number };
    has_more = result.count > 0;
  }
  
  return {
    events,
    has_more,
    earliest_timestamp
  };
}