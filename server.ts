import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase (Backend privileged access if possible, or same as client)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://agybltchhrmgphzeulyj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWJsdGNoaHJtZ3BoemV1bHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTY5ODgsImV4cCI6MjA5NjA3Mjk4OH0.SWMkzYRkp44zH5wowcuvhUr9iDYYhllMlgJv8_RHQRg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * AUTOMATED BILLING REMINDER SYSTEM
 * Runs every 12 hours to check for subscriptions expiring in 7 days.
 */
async function runBillingReminders() {
  console.log("[Billing Automation] Checking for upcoming expirations...");
  
  try {
    const { data: tenants, error } = await supabase
      .from('koperasi_store')
      .select('id, item_id, data')
      .eq('collection', 'tenants');

    if (error) throw error;
    if (!tenants) return;

    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const tomorrowInMs = 24 * 60 * 60 * 1000;

    for (const row of tenants) {
      const tenant = row.data;
      if (!tenant.validUntil || tenant.status !== "Active") continue;

      const validUntilDate = new Date(tenant.validUntil);
      const timeDiff = validUntilDate.getTime() - now.getTime();
      
      // Check if it's approximately 7 days away (between 6 and 7 days)
      // and hasn't been notified for the 7-day mark
      const isSevenDayWindow = timeDiff > (6 * tomorrowInMs) && timeDiff <= sevenDaysInMs;
      
      if (isSevenDayWindow && !tenant.lastReminder7DaySent) {
        console.log(`[Billing Automation] Sending 7-day reminder to ${tenant.name} (${tenant.ownerEmail})`);
        
        // Simulating Email Sending by creating a System Log and a Notification record
        const logEntry = {
          id: `billing_log_${Date.now()}_${tenant.id}`,
          timestamp: new Date().toISOString(),
          tenantId: tenant.id,
          tenantName: tenant.name,
          actorEmail: "system@saas.local",
          actorName: "Automated Billing System",
          category: "Sistem & Langganan",
          severity: "WARNING",
          action: "Email Reminder Terkirim",
          details: `Pemberitahuan otomatis dikirim ke ${tenant.ownerEmail}. Langganan paket ${tenant.plan} akan berakhir pada ${new Date(tenant.validUntil).toLocaleDateString('id-ID')}.`,
          status: "Sukses"
        };

        // 1. Log security event
        await supabase.from('koperasi_store').upsert({
          id: `global:security_audit_trail:${logEntry.id}`,
          koperasi_id: "",
          collection: "security_audit_trail",
          item_id: logEntry.id,
          data: logEntry,
          updated_at: new Date().toISOString()
        });

        // 2. Create internal email notification record
        const emailRecord = {
          id: `email_${Date.now()}_${tenant.id}`,
          to: tenant.ownerEmail,
          subject: `[KDMP] Pengingat Perpanjangan Layanan: ${tenant.name}`,
          content: `Halo ${tenant.name},\n\nKami ingin memberitahukan bahwa langganan sistem KDMP Anda akan berakhir dalam 7 hari (${new Date(tenant.validUntil).toLocaleDateString('id-ID')}).\n\nSilakan lakukan perpanjangan melalui panel tagihan untuk memastikan operasional koperasi Anda tidak terganggu.\n\nTerima kasih,\nTim Support KDMP`,
          sentAt: new Date().toISOString(),
          tenantId: tenant.id
        };

        await supabase.from('koperasi_store').upsert({
          id: `global:system_emails:${emailRecord.id}`,
          koperasi_id: "",
          collection: "system_emails",
          item_id: emailRecord.id,
          data: emailRecord,
          updated_at: new Date().toISOString()
        });

        // 3. Mark tenant as reminded to prevent duplicate emails for this specific milestone
        const updatedTenant = { ...tenant, lastReminder7DaySent: true };
        await supabase.from('koperasi_store').update({
          data: updatedTenant,
          updated_at: new Date().toISOString()
        }).eq('id', row.id);
      }
    }
  } catch (err) {
    console.error("[Billing Automation] Error during check:", err);
  }
}

// Start the billing interval (12 hours)
setInterval(runBillingReminders, 12 * 60 * 60 * 1000);
// Trigger initial run on startup
setTimeout(runBillingReminders, 5000);

/**
 * MEMBER AUTOMATION: Monthly Simpanan Wajib Billing
 */
async function runMonthlyMemberBilling() {
  console.log("[Member Automation] Running monthly Simpanan Wajib billing...");
  try {
    // 1. Get all cooperatives (koperasi_id)
    const { data: koperasiList, error: kError } = await supabase
      .from('koperasi_store')
      .select('id, koperasi_id')
      .eq('collection', 'tenants');
    
    if (kError) throw kError;

    const today = new Date();
    const periodStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const tglTagihan = today.toISOString().split('T')[0];

    for (const tenant of koperasiList) {
      const kopId = tenant.id; // The tenant key
      
      // 2. Get members for this koperasi
      const { data: members, error: mError } = await supabase
        .from('koperasi_store')
        .select('item_id, data')
        .eq('koperasi_id', kopId)
        .eq('collection', 'anggota');

      if (mError) continue;

      for (const row of members) {
        const member = row.data;
        if (member.status !== "Aktif") continue;

        const billId = `AUTO-SW-${periodStr}-${member.id}`;
        
        // Check if bill already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('koperasi_store')
          .select('id')
          .eq('id', `kop:${kopId}:tagihan:${billId}`)
          .single();

        if (!existing) {
          const newBill = {
            id: billId,
            anggotaId: member.id,
            anggotaNama: member.nama,
            kategori: "Simpanan Wajib",
            jumlah: 10000, // Standard default, can be dynamic later
            tglTagihan,
            keterangan: `Simpanan Wajib Otomatis Periode ${periodStr}`,
            status: "Belum Bayar"
          };

          await supabase.from('koperasi_store').upsert({
            id: `kop:${kopId}:tagihan:${billId}`,
            koperasi_id: kopId,
            collection: "tagihan",
            item_id: billId,
            data: newBill,
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.error("[Member Automation] Monthly Auto-Billing Error:", err);
  }
}

// Run monthly billing check every 24 hours
setInterval(runMonthlyMemberBilling, 24 * 60 * 60 * 1000);

async function startServer() {
  // API route to manually trigger/test reminders (Super Admin only can be protected later)
  app.post("/api/admin/trigger-billing-reminders", async (req, res) => {
    await runBillingReminders();
    res.json({ status: "ok", message: "Billing check triggered successfully." });
  });

  app.post("/api/admin/trigger-member-billing", async (req, res) => {
    await runMonthlyMemberBilling();
    res.json({ status: "ok", message: "Monthly member billing triggered." });
  });

  app.post("/api/member/bulk-notify-unpaid", express.json(), async (req, res) => {
    const { koperasiId, bills } = req.body;
    if (!koperasiId || !bills) return res.status(400).json({ error: "Missing data" });

    console.log(`[Member Notification] Bulk reminding ${bills.length} members for Koperasi ${koperasiId}`);
    
    // In a real app, this would trigger email/WA loops. 
    // Here we log the activity to Security Audit.
    const logEntry = {
      id: `bulk_notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      tenantId: koperasiId,
      actorEmail: "system@saas.local",
      actorName: "System Billing",
      category: "Sistem & Langganan",
      severity: "INFO",
      action: "Bulk Reminder Terkirim",
      details: `Pengiriman pengingat massal ke ${bills.length} anggota untuk tagihan tertunda.`,
      status: "Sukses"
    };

    await supabase.from('koperasi_store').upsert({
      id: `global:security_audit_trail:${logEntry.id}`,
      koperasi_id: koperasiId,
      collection: "security_audit_trail",
      item_id: logEntry.id,
      data: logEntry,
      updated_at: new Date().toISOString()
    });

    res.json({ status: "ok", count: bills.length });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
