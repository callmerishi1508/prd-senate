import fs from 'fs';
import path from 'path';
import { IntegrationEvent } from './event-schema';
import { writeJsonAtomicSync } from '../atomic-write';

const EVENT_STORE_FILE = path.join(process.cwd(), '.senate-data', 'events.json');

export function initEventStore() {
  const dir = path.dirname(EVENT_STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(EVENT_STORE_FILE)) writeJsonAtomicSync(EVENT_STORE_FILE, []);
}

export function appendEvent(event: IntegrationEvent) {
  initEventStore();
  const events = JSON.parse(fs.readFileSync(EVENT_STORE_FILE, 'utf-8'));
  events.push(event);
  writeJsonAtomicSync(EVENT_STORE_FILE, events);
}

export function getAllEvents(): IntegrationEvent[] {
  initEventStore();
  return JSON.parse(fs.readFileSync(EVENT_STORE_FILE, 'utf-8'));
}

export function clearEventStore() {
  initEventStore();
  writeJsonAtomicSync(EVENT_STORE_FILE, []);
}
