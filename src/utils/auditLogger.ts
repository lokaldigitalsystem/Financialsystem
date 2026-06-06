/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, db } from '../supabase';
import { SecurityAuditEvent } from '../types';

let cachedIp = '127.0.0.1';

// Dynamic helper to fetch client system IP address safely in background
try {
  fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => {
      if (data && data.ip) {
        cachedIp = data.ip;
      }
    })
    .catch(() => {
      // Silent pass fallback
    });
} catch (e) {
  // Silent catch
}

export async function logSecurityEvent(params: {
  tenantId: string;
  tenantName: string;
  actorEmail: string;
  actorName: string;
  category: "Autentikasi" | "Hak Akses" | "Reset Data" | "Mutasi Keuangan" | "Sistem & Langganan" | "Keamanan";
  severity: "INFO" | "WARNING" | "CRITICAL";
  action: string;
  details: string;
  status: "Sukses" | "Gagal" | "Dibatalkan" | "Ditolak";
}) {
  const finalIp = cachedIp || '114.122.14.93'; // Emulated local fallback
  const finalUa = navigator.userAgent || 'Mozilla/5.0';
  const timestamp = new Date().toISOString();
  
  // Custom secure serial sequence code
  const eventId = `SEC-${new Date().getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const auditEvent: SecurityAuditEvent = {
    id: eventId,
    timestamp,
    tenantId: params.tenantId || 'global',
    tenantName: params.tenantName || 'Platform SaaS',
    actorEmail: params.actorEmail || 'anonymous@koperasi.net',
    actorName: params.actorName || 'Petugas Anonim',
    category: params.category,
    severity: params.severity,
    action: params.action,
    details: params.details,
    ipAddress: finalIp,
    userAgent: finalUa,
    status: params.status
  };

    try {
      // Write directly using the emulated Firebase Firestore over Supabase adapter
      await setDoc(doc(db, "security_audit_trail", eventId), auditEvent);
    } catch (err) {
    console.warn("Could not save audit trail to postgres server, saving locally:", err);
    try {
      const offlineKey = 'offline_security_logs';
      const existing = localStorage.getItem(offlineKey);
      const list = existing ? JSON.parse(existing) : [];
      list.push(auditEvent);
      // Bound size
      if (list.length > 200) {
        list.shift();
      }
      localStorage.setItem(offlineKey, JSON.stringify(list));
    } catch (e) {
      // Silent ignore to prevent crash
    }
  }
}
