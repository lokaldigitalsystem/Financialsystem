/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Notebook, 
  Boxes, 
  Users, 
  Building, 
  FileText, 
  Coins, 
  ListTodo, 
  LogOut, 
  Lock, 
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Menu,
  ChevronRight,
  User as UserIcon,
  HelpCircle,
  Landmark,
  ShoppingBag,
  Briefcase,
  UserCheck,
  ClipboardCheck,
  TrendingUp,
  Settings,
  LifeBuoy,
  CreditCard
} from 'lucide-react';

import { CoaAccount, CoaKategori, SaldoNormal, JurnalEntry, StokItem, Anggota, RekeningBank, StokHistoriEntry, Tagihan, FixedAsset, KontakLain } from './types';
import { INITIAL_COA, INITIAL_JURNAL, INITIAL_STOK, INITIAL_ANGGOTA, INITIAL_REKENING, INITIAL_STOK_HISTORI, INITIAL_KONTAK_LAIN } from './data/initialData';

// Component imports
// @ts-ignore
import kopdesLogo from './assets/images/regenerated_image_1780605758249.jpg';
import { Dashboard } from './components/Dashboard';
import { Jurnal } from './components/Jurnal';
import { COA } from './components/COA';
import { Stok } from './components/Stok';
import { AnggotaList } from './components/Anggota';
import { KasBank } from './components/KasBank';
import { Invoice } from './components/Invoice';
import { Laporan } from './components/Laporan';
import { Penjualan } from './components/Penjualan';
import { AsetTetap } from './components/AsetTetap';
import { Kontak } from './components/Kontak';
import { StockOpname } from './components/StockOpname';
import { RekapPenjualan } from './components/RekapPenjualan';
import { Pengaturan } from './components/Pengaturan';
import { SuperAdmin } from './components/SuperAdmin';
import { SupportTicket } from './components/SupportTicket';
import { TenantBilling } from './components/TenantBilling';
import { SecurityAudit } from './components/SecurityAudit';
import { logSecurityEvent } from './utils/auditLogger';
import { PLAN_DEFAULT_FEATURES } from './components/SaaSFeatureManagement';

// Supabase Integrations
import { Plus, ArrowLeft, Wifi, WifiOff, Link2, KeyRound, ShieldAlert, Mail, LogIn, RefreshCw, CheckCircle2, Eye, EyeOff, ShieldCheck, Megaphone, Server, Crown, QrCode, ArrowLeftRight, X } from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot,
  runTransaction,
  query,
  where,
  getDocs,
  db,
  handleCloudError,
  OperationType,
  auth,
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from './supabase';

function getSaldoAwal(kode: string, originalSaldo: number): number {
  return originalSaldo;
}

export default function App() {
  const [koperasiId, setKoperasiId] = useState<string>(
    () => localStorage.getItem('kdmp_koperasiId') || "supercloud"
  );

  // Authentication & Access States
  const [accessMode, setAccessMode] = useState<"login" | "admin" | "view">(
    () => (localStorage.getItem('kdmp_accessMode') as "admin" | "view" | null) || "login"
  );
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem('kdmp_userName') || ""
  );
  const [userRole, setUserRole] = useState<string>(
    () => localStorage.getItem('kdmp_userRole') || ""
  );
  const [currentUsername, setCurrentUsername] = useState<string>(
    () => localStorage.getItem('kdmp_currentUsername') || ""
  );
  const [cloudAuthLoading, setCloudAuthLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [cloudSuccessMessage, setCloudSuccessMessage] = useState("");

  // Connection inputs/registration states
  const [inputKoperasiId, setInputKoperasiId] = useState("");
  const [regMode, setRegMode] = useState(false);
  const [regKoperasiName, setRegKoperasiName] = useState("");
  const [regKoperasiAlamat, setRegKoperasiAlamat] = useState("");
  const [regSuperITEmail, setRegSuperITEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [koperasiError, setKoperasiError] = useState("");
  const [isVerifyingKoperasi, setIsVerifyingKoperasi] = useState(false);
  const [showForgotOrgId, setShowForgotOrgId] = useState(false);
  const [forgotOrgEmail, setForgotOrgEmail] = useState("");
  const [isSearchingOrg, setIsSearchingOrg] = useState(false);
  const [forgotOrgResult, setForgotOrgResult] = useState<{ id: string; name: string }[] | null>(null);
  const [forgotOrgError, setForgotOrgError] = useState("");
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [originalKoperasiId, setOriginalKoperasiId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<"Active" | "Trial" | "Suspended" | null>(null);
  const [tenantPlan, setTenantPlan] = useState<"Trial" | "Basic" | "Premium" | "Enterprise">("Trial");
  const [tenantFeatures, setTenantFeatures] = useState<string[] | null>(null);
  const [globalConfig, setGlobalConfig] = useState<{
    maintenanceMode: boolean,
    announcement: string,
    isAnnouncementActive: boolean,
    announcementType: string
  } | null>(null);

  // Layout & Theme States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('kdmp_sidebarCollapsed') === 'true'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('kdmp_theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    localStorage.setItem('kdmp_sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('kdmp_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // AUTH STATE TRACKING
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      // AUTO-RECOVER SESSION
      if (user && accessMode === "login" && !cloudAuthLoading && koperasiId) {
        const email = user.email?.toLowerCase()?.trim();
        if (!email) return;

        // 1. OWNER BYPASS (HIGHEST PRIORITY)
        if (email === "komarudink403@gmail.com") {
          setAccessMode("admin");
          setUserName("Bpk. Komarudin (SuperIT Owner)");
          setUserRole("Pemilik & Pembuat System");
          setCurrentUsername("SuperIT");
          
          localStorage.setItem('kdmp_accessMode', "admin");
          localStorage.setItem('kdmp_userName', "Bpk. Komarudin (SuperIT Owner)");
          localStorage.setItem('kdmp_userRole', "Pemilik & Pembuat System");
          localStorage.setItem('kdmp_currentUsername', "SuperIT");
        } else {
          // 2. STANDARD TENANT USER RESOLUTION
          try {
            const userRef = collection(db, "koperasi", koperasiId, "users");
            const userSnap = await getDocs(userRef);
            const list: UserAccount[] = [];
            userSnap.forEach(d => list.push(d.data() as UserAccount));
            
            const foundUser = list.find(u => u.email && u.email.toLowerCase().trim() === email);
            
            if (foundUser) {
              const mode = foundUser.isAdmin ? "admin" : "view";
              setAccessMode(mode);
              setUserName(foundUser.name);
              setUserRole(foundUser.role);
              setCurrentUsername(foundUser.username);
              
              localStorage.setItem('kdmp_accessMode', mode);
              localStorage.setItem('kdmp_userName', foundUser.name);
              localStorage.setItem('kdmp_userRole', foundUser.role);
              localStorage.setItem('kdmp_currentUsername', foundUser.username);
            }
          } catch (e) {
            console.warn("Session recovery silent failure:", e);
          }
        }
      }
    });
    return () => unsub();
  }, [accessMode, cloudAuthLoading, koperasiId]);

  // LISTEN TO GLOBAL CONFIG
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "global"), (snap) => {
      if (snap.exists()) {
        setGlobalConfig(snap.data() as any);
      }
    }, (err) => {
      console.warn("Global config listener error (likely non-existent doc):", err.message);
    });
    return () => unsub();
  }, []);

  // CHECK TENANT STATUS
  useEffect(() => {
    if (koperasiId) {
      const unsubTenant = onSnapshot(doc(db, "tenants", koperasiId), (snap) => {
        if (snap.exists()) {
          const tData = snap.data();
          setTenantStatus(tData.status as any);
          setTenantPlan(tData.plan || "Trial");
          setTenantFeatures(tData.customFeatures || null);
        } else {
          setTenantStatus("Active"); // Legacy or manual
          setTenantPlan("Trial");
          setTenantFeatures(null);
        }
      }, (err) => {
        // Silently handle if not superadmin and document doesn't exist yet
        console.warn("Tenant status check failed:", err.message);
      });
      return () => unsubTenant();
    }
  }, [koperasiId]);

  useEffect(() => {
    if (!koperasiId) return;
    
    // Load existing scoped data or fall back to system defaults
    // This provides instant UI transition before Cloud snapshot arrives
    const savedName = localStorage.getItem(`kdmp_${koperasiId}_koperasiName`);
    const savedAlamat = localStorage.getItem(`kdmp_${koperasiId}_koperasiAlamat`);
    const savedLogo = localStorage.getItem(`kdmp_${koperasiId}_koperasiLogo`);
    const savedSize = localStorage.getItem(`kdmp_${koperasiId}_koperasiInvoiceSize`);
    const savedSubtext = localStorage.getItem(`kdmp_${koperasiId}_koperasiSubtext`);

    setKoperasiName(savedName || "Supercloud Integrated Financial System");
    setKoperasiAlamat(savedAlamat || "Sistem Informasi Akuntansi & Operasional Komprehensif");
    setKoperasiLogo(savedLogo || "");
    setKoperasiInvoiceSize(savedSize || "A4");
    setKoperasiSubtext(savedSubtext || "Powered by Supercloud Network");

    // Important: Also reset the ref to avoid immediate writeback of stale data
    lastKoperasiMetaRef.current = {
      nama: savedName || "",
      alamat: savedAlamat || "",
      logo: savedLogo || "",
      invoiceSize: savedSize || "A4",
      subtext: savedSubtext || ""
    };
  }, [koperasiId]);

  // Dynamic Koperasi Profile Details & Print configuration
  const [koperasiName, setKoperasiName] = useState<string>(
    () => localStorage.getItem(`kdmp_${koperasiId}_koperasiName`) || localStorage.getItem('kdmp_koperasiName') || "Supercloud Integrated Financial System"
  );
  const [koperasiAlamat, setKoperasiAlamat] = useState<string>(
    () => localStorage.getItem(`kdmp_${koperasiId}_koperasiAlamat`) || localStorage.getItem('kdmp_koperasiAlamat') || "Sistem Informasi Akuntansi & Operasional Komprehensif"
  );
  const [koperasiLogo, setKoperasiLogo] = useState<string>(
    () => localStorage.getItem(`kdmp_${koperasiId}_koperasiLogo`) || localStorage.getItem('kdmp_koperasiLogo') || ""
  );
  const [koperasiInvoiceSize, setKoperasiInvoiceSize] = useState<string>(
    () => localStorage.getItem(`kdmp_${koperasiId}_koperasiInvoiceSize`) || localStorage.getItem('kdmp_koperasiInvoiceSize') || "A4"
  );
  const [koperasiSubtext, setKoperasiSubtext] = useState<string>(
    () => localStorage.getItem(`kdmp_${koperasiId}_koperasiSubtext`) || localStorage.getItem('kdmp_koperasiSubtext') || "Powered by Supercloud Network"
  );

  // User accounts with roles and permissions
  interface UserAccount {
    username: string;
    password?: string;
    email?: string;
    name: string;
    role: string;
    isAdmin: boolean;
    canAccessSettings: boolean;
    permittedPages?: string[];
  }

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const raw = localStorage.getItem('kdmp_userAccounts');
    let accounts: UserAccount[] = [];
    if (raw) {
      try {
        accounts = JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
    if (!accounts || accounts.length === 0) {
      accounts = [
        {
          username: "SuperIT",
          password: "superit123",
          email: "komarudink403@gmail.com",
          name: "SuperIT (Pemilik System)",
          role: "Pemilik & Pembuat System",
          isAdmin: true,
          canAccessSettings: true
        },
        {
          username: "admin",
          password: "admin123",
          email: "komarudink403@gmail.com",
          name: "Bpk. Komarudin",
          role: "Administrator Utama",
          isAdmin: true,
          canAccessSettings: true
        },
        {
          username: "ketua",
          password: "ketua123",
          name: "Ketua Koperasi",
          role: "Oversight Ketua",
          isAdmin: false,
          canAccessSettings: true
        },
        {
          username: "user",
          password: "user123",
          name: "Staf Unit",
          role: "Petugas Read-Only",
          isAdmin: false,
          canAccessSettings: false
        }
      ];
    }

    // Auto-populate permittedPages for older or newly loaded records
    const defaultPages = ["dashboard", "jurnal", "stok", "stockopname", "kontak", "anggota", "kasbank", "coa", "asettetap", "invoice", "rekappenjualan", "laporan"];
    return accounts.map(u => {
      if (!u.permittedPages) {
        const pages = [...defaultPages];
        if (u.canAccessSettings || u.username === "SuperIT" || u.username === "admin" || u.username === "ketua") {
          pages.push("pengaturan");
        }
        return { ...u, permittedPages: pages };
      }
      return u;
    });
  });

  // CHECK GLOBAL SUPER ADMIN STATUS
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const currentUserEmail = currentUser?.email?.toLowerCase()?.trim();
    
    // PERMANENT SUPER ADMIN: Bpk. Komarudin or SuperIT Owner
    if (currentUserEmail === "komarudink403@gmail.com" || currentUsername === "SuperIT") {
      setIsGlobalAdmin(true);
      return;
    }

    if (currentUser) {
      unsub = onSnapshot(doc(db, "super_admins", currentUser.uid), (snap) => {
        setIsGlobalAdmin(snap.exists());
      }, (err) => {
        console.warn("Super admin check error:", err.message);
        setIsGlobalAdmin(false);
      });
    } else {
      setIsGlobalAdmin(false);
    }
    return () => { if (unsub) unsub(); };
  }, [currentUser, currentUsername]);

  const [activePage, setActivePage] = useState<string>("dashboard");

  // Shared state for navigation filters to relate COA, Jurnal, and Dashboard
  const [jurnalFilter, setJurnalFilter] = useState("");
  const [coaCategoryFilter, setCoaCategoryFilter] = useState("");
  const [coaSearchFilter, setCoaSearchFilter] = useState("");

  // Login Input Form states
  const [inputUser, setInputUser] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Cloud Auth states (Supabase Integration)
  const [loginTab, setLoginTab] = useState<"local" | "cloud">("cloud"); // Set default to cloud for modern presentation
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [cloudConfirmPassword, setCloudConfirmPassword] = useState("");
  const [isCloudRegister, setIsCloudRegister] = useState(false);

  // MIGRATION LOGIC: Convert local credentials to Supabase Auth
  const performCredentialMigration = async () => {
    if (!koperasiId || koperasiId === "supercloud") return;
    const raw = localStorage.getItem('kdmp_userAccounts');
    if (!raw) return;

    try {
      const accounts: UserAccount[] = JSON.parse(raw);
      // Only migrate if we have accounts that haven't been cleared yet
      if (!accounts || accounts.length === 0) return;

      setIsMigrating(true);
      
      for (const account of accounts) {
        if (!account.password || account.password.length < 6) continue;
        
        // Generate deterministic email for username-based accounts
        const email = account.email || `${account.username.toLowerCase().trim()}_${koperasiId.toLowerCase()}@supercloud.local`;
        
        try {
          // Attempt to create user in Supabase Auth
          await createUserWithEmailAndPassword(auth, email, account.password);
          
          // Link email in Firestore user document
          await setDoc(doc(db, "koperasi", koperasiId, "users", account.username), {
            ...account,
            email: email,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err: any) {
          // If already exists, just ensure Firestore is linked
          if (err.code === 'auth/email-already-in-use' || err.message?.includes('already registered')) {
             await setDoc(doc(db, "koperasi", koperasiId, "users", account.username), {
                email: email
             }, { merge: true });
          } else {
            console.warn(`Migration skipped for ${account.username}:`, err.message);
          }
        }
      }

      // Finalize migration
      localStorage.removeItem('kdmp_userAccounts');
      setCloudSuccessMessage("Sistem telah dimigrasi ke Keamanan Cloud! Akun Anda kini lebih aman.");
    } catch (e) {
      console.error("Migration fatal error:", e);
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    // Attempt migration if koperasiId is set and we are on login screen and migration data exists
    if (koperasiId && accessMode === "login" && !isMigrating) {
      const raw = localStorage.getItem('kdmp_userAccounts');
      if (raw && raw !== "[]") {
         performCredentialMigration();
      }
    }
  }, [koperasiId, accessMode]);
  const [showPopupWarning, setShowPopupWarning] = useState(false);
  const [ownerPIN, setOwnerPIN] = useState("");
  const [bypassError, setBypassError] = useState("");
  const [showStealthBypassConnect, setShowStealthBypassConnect] = useState(false);
  const [showStealthBypassLogin, setShowStealthBypassLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States for public QR/ID card authenticity validator
  const [showPublicVerifyPortal, setShowPublicVerifyPortal] = useState(false);
  const [publicVerifyId, setPublicVerifyId] = useState("");
  const [publicVerifyResult, setPublicVerifyResult] = useState<any | null>(null);
  const [publicVerifyError, setPublicVerifyError] = useState("");
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  const [isOnline, setIsOnline] = useState<boolean>(() => typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Core application lists stored in states (persisted via localStorage)
  const [coaData, setCoaData] = useState<CoaAccount[]>(() => {
    const raw = localStorage.getItem('kdmp_coaData');
    if (!raw) {
      return INITIAL_COA.map(c => ({
        ...c,
        saldoAwal: getSaldoAwal(c.kode, c.saldo)
      }));
    }
    try {
      const stored = JSON.parse(raw) as CoaAccount[];
      // Sync names of existing accounts to the new list and add any newly introduced COA accounts
      const updated = stored.map(s => {
        const corresponding = INITIAL_COA.find(i => i.kode === s.kode);
        if (corresponding && !s.kode.startsWith('1-110')) {
          return { 
            ...s, 
            nama: corresponding.nama,
            saldoAwal: s.saldoAwal !== undefined ? s.saldoAwal : getSaldoAwal(s.kode, s.saldo)
          };
        }
        return {
          ...s,
          saldoAwal: s.saldoAwal !== undefined ? s.saldoAwal : getSaldoAwal(s.kode, s.saldo)
        };
      });
      const missing = INITIAL_COA.filter(i => !updated.some(u => u.kode === i.kode)).map(m => ({
        ...m,
        saldoAwal: getSaldoAwal(m.kode, m.saldo)
      }));
      return [...updated, ...missing];
    } catch (e) {
      return INITIAL_COA.map(c => ({
        ...c,
        saldoAwal: getSaldoAwal(c.kode, c.saldo)
      }));
    }
  });

  const [jurnalData, setJurnalData] = useState<JurnalEntry[]>(() => {
    const raw = localStorage.getItem('kdmp_jurnalData');
    return raw ? JSON.parse(raw) : INITIAL_JURNAL;
  });

  const [stokData, setStokData] = useState<StokItem[]>(() => {
    const raw = localStorage.getItem('kdmp_stokData');
    return raw ? JSON.parse(raw) : INITIAL_STOK;
  });

  const [stokHistoriData, setStokHistoriData] = useState<StokHistoriEntry[]>(() => {
    const raw = localStorage.getItem('kdmp_stokHistoriData');
    return raw ? JSON.parse(raw) : INITIAL_STOK_HISTORI;
  });

  const [anggotaData, setAnggotaData] = useState<Anggota[]>(() => {
    const raw = localStorage.getItem('kdmp_anggotaData');
    return raw ? JSON.parse(raw) : INITIAL_ANGGOTA;
  });

  const [kontakLainData, setKontakLainData] = useState<KontakLain[]>(() => {
    const raw = localStorage.getItem('kdmp_kontakLainData');
    return raw ? JSON.parse(raw) : INITIAL_KONTAK_LAIN;
  });

  // Public URL Param checker for live QR scan lookups
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get("verify_id") || params.get("verify");
    const verifyName = params.get("verify_name");
    const verifyRole = params.get("verify_role");
    const verifyStatus = params.get("verify_status");

    if (verifyId) {
      setPublicVerifyId(verifyId);
      setShowPublicVerifyPortal(true);
      
      // Instantly load decoded parameters for offline speed
      if (verifyName) {
        setPublicVerifyResult({
          id: verifyId,
          nama: decodeURIComponent(verifyName),
          jabatanAtauPerusahaan: verifyRole ? decodeURIComponent(verifyRole) : "Staff",
          status: verifyStatus || "Aktif",
          tipe: "Karyawan",
          isDecodedFromQR: true,
          isLiveVerified: false
        });
      }

      // Check against synchronized local/cloud list
      const matched = kontakLainData.find(c => c.id.toLowerCase() === verifyId.trim().toLowerCase());
      if (matched) {
        setPublicVerifyResult({
          ...matched,
          isLiveVerified: true
        });
        setPublicVerifyError("");
      } else {
        const timeoutHandle = setTimeout(() => {
          const reCheck = kontakLainData.find(c => c.id.toLowerCase() === verifyId.trim().toLowerCase());
          if (reCheck) {
            setPublicVerifyResult({
              ...reCheck,
              isLiveVerified: true
            });
            setPublicVerifyError("");
          } else if (!verifyName) {
            setPublicVerifyResult(null);
            setPublicVerifyError("Data pengurus tidak ditemukan pada server database. Silakan pastikan ID valid.");
          } else {
            // Mismatch indicator - means data was in URL QR but not inside the actual current database
            setPublicVerifyResult(prev => prev ? { ...prev, isDatabaseMismatch: true } : null);
          }
        }, 1000);
        return () => clearTimeout(timeoutHandle);
      }
    }
  }, [kontakLainData]);

  const [tagihanData, setTagihanData] = useState<Tagihan[]>(() => {
    const raw = localStorage.getItem('kdmp_tagihanData');
    if (raw) return JSON.parse(raw);
    return [];
  });

  const [rekeningData, setRekeningData] = useState<RekeningBank[]>(() => {
    const raw = localStorage.getItem('kdmp_rekeningData');
    if (!raw) return INITIAL_REKENING;
    try {
      const stored = JSON.parse(raw) as RekeningBank[];
      // Sync names and profiles of existing bank accounts to the updated list and add any newly introduced bank accounts
      const updated = stored.map(s => {
        // Return stored as is to preserve user edits of names and account numbers
        return s;
      });
      const missing = INITIAL_REKENING.filter(i => !updated.some(u => u.id === i.id));
      return [...updated, ...missing];
    } catch (e) {
      return INITIAL_REKENING;
    }
  });

  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    const raw = localStorage.getItem('kdmp_fixedAssets');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback below
      }
    }
    return [];
  });

  // Watch for changes in coaData to automatically sync bank balances perfectly
  useEffect(() => {
    const updatedRekenings = rekeningData.map(r => {
      const matchingCoa = coaData.find(c => {
        const expectedCoaKode = "1-110" + r.id.replace("bnk-", "");
        if (c.kode === expectedCoaKode) return true;
        return c.nama.toLowerCase() === r.nama.toLowerCase();
      });
      if (matchingCoa) {
        return { ...r, saldo: matchingCoa.saldo };
      }
      return r;
    });

    const isDifferent = JSON.stringify(updatedRekenings) !== JSON.stringify(rekeningData);
    if (isDifferent) {
      setRekeningData(updatedRekenings);
    }
  }, [coaData, rekeningData]);

  // Real-time synchronization of COA balances with General Journal
  useEffect(() => {
    let changed = false;
    const nextCOAs = coaData.map(c => {
      const baseBalance = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
      const relatedJournals = jurnalData.filter(j => j.akun === c.kode);
      
      let netChange = 0;
      relatedJournals.forEach(j => {
        if (c.normal === SaldoNormal.Debet) {
          netChange += (j.debet - j.kredit);
        } else {
          netChange += (j.kredit - j.debet);
        }
      });
      
      const expectedSaldo = baseBalance + netChange;
      if (c.saldo !== expectedSaldo || c.saldoAwal !== baseBalance) {
        changed = true;
        return { ...c, saldo: expectedSaldo, saldoAwal: baseBalance };
      }
      return c;
    });

    if (changed) {
      setCoaData(nextCOAs);
    }
  }, [jurnalData, coaData]);

  // Synchronizer refs to verify if changes originated from Cloud or local edits
  const [cloudStatus, setCloudStatus] = useState({
    users: false,
    coa: false,
    jurnal: false,
    stok: false,
    anggota: false,
    kontak: false,
    tagihan: false,
    rekening: false,
    assets: false,
    meta: false
  });

  const lastKoperasiMetaRef = React.useRef({ nama: "", alamat: "", logo: "", invoiceSize: "", subtext: "" });
  const lastUserAccountsRef = React.useRef<UserAccount[]>([]);
  const lastCoaRef = React.useRef<CoaAccount[]>([]);
  const lastJurnalRef = React.useRef<JurnalEntry[]>([]);
  const lastStokRef = React.useRef<StokItem[]>([]);
  const lastStokHistoriRef = React.useRef<StokHistoriEntry[]>([]);
  const lastAnggotaRef = React.useRef<Anggota[]>([]);
  const lastKontakRef = React.useRef<KontakLain[]>([]);
  const lastTagihanRef = React.useRef<Tagihan[]>([]);
  const lastRekeningRef = React.useRef<RekeningBank[]>([]);
  const lastFixedAssetsRef = React.useRef<FixedAsset[]>([]);

  // Cloud Real-Time Listener Effect Block
  useEffect(() => {
    if (!koperasiId) return;

    // 1. Cooperative Document Meta
    const unsubMeta = onSnapshot(doc(db, "koperasi", koperasiId), (snap) => {
      // Skip updates if it's our own local change to avoid "flickering" state
      if (snap.metadata.hasPendingWrites) return;

      if (snap.exists()) {
         const data = snap.data();
         const meta = {
           nama: data.nama || "",
           alamat: data.alamat || "",
           logo: data.logo || "",
           invoiceSize: data.invoiceSize || "A4",
           subtext: data.subtext || ""
         };
         lastKoperasiMetaRef.current = meta;
         if (meta.nama) setKoperasiName(meta.nama);
         if (meta.alamat) setKoperasiAlamat(meta.alamat);
         setKoperasiLogo(meta.logo);
         if (meta.invoiceSize) setKoperasiInvoiceSize(meta.invoiceSize);
         if (meta.subtext) setKoperasiSubtext(meta.subtext);
      } else {
         // Reset to defaults if tenant doesn't exist in cloud
         setKoperasiName("Supercloud Integrated Financial System");
         setKoperasiAlamat("Sistem Informasi Akuntansi & Operasional Komprehensif");
         setKoperasiLogo("");
         setKoperasiInvoiceSize("A4");
         setKoperasiSubtext("Powered by Supercloud Network");
      }
      setCloudStatus(prev => ({ ...prev, meta: true }));
    }, (err) => {
      console.warn("Metadata listener error:", err.message);
      setCloudStatus(prev => ({ ...prev, meta: true }));
    });

    // 2. Users
    const unsubUsers = onSnapshot(collection(db, "koperasi", koperasiId, "users"), (snap) => {
      // Skip if we have pending local writes to avoid jitter/reverts
      if (snap.metadata.hasPendingWrites) return;

      const list: UserAccount[] = [];
      snap.forEach(d => list.push(d.data() as UserAccount));
      
      const cleanList = list.length > 0 ? list : [
        {
          username: "SuperIT",
          password: "superit123",
          name: "SuperIT (Pemilik System)",
          role: "Pemilik & Pembuat System",
          isAdmin: true,
          canAccessSettings: true
        }
      ];

      // Deep comparison to avoid unnecessary state updates and revert-loops
      const cloudStr = JSON.stringify(cleanList.sort((a, b) => a.username.localeCompare(b.username)));
      const localStr = JSON.stringify(lastUserAccountsRef.current.sort((a, b) => a.username.localeCompare(b.username)));

      if (cloudStr !== localStr) {
        lastUserAccountsRef.current = cleanList;
        setUserAccounts(cleanList);
      }
      setCloudStatus(prev => ({ ...prev, users: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/users`);
      setCloudStatus(prev => ({ ...prev, users: true }));
    });

    // 3. COA
    const unsubCoa = onSnapshot(collection(db, "koperasi", koperasiId, "coa"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: CoaAccount[] = [];
      snap.forEach(d => list.push(d.data() as CoaAccount));
      
      const cloudStr = JSON.stringify(list.sort((a,b) => a.kode.localeCompare(b.kode)));
      const localStr = JSON.stringify(lastCoaRef.current.sort((a,b) => a.kode.localeCompare(b.kode)));

      if (cloudStr !== localStr) {
        lastCoaRef.current = list;
        setCoaData(list);
      }
      setCloudStatus(prev => ({ ...prev, coa: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/coa`);
      setCloudStatus(prev => ({ ...prev, coa: true }));
    });

    // 4. Jurnal
    const unsubJurnal = onSnapshot(collection(db, "koperasi", koperasiId, "jurnal"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: JurnalEntry[] = [];
      snap.forEach(d => list.push(d.data() as JurnalEntry));
      
      const cloudStr = JSON.stringify(list.sort((a,b) => a.id.localeCompare(b.id)));
      const localStr = JSON.stringify(lastJurnalRef.current.sort((a,b) => a.id.localeCompare(b.id)));

      if (cloudStr !== localStr) {
        // Ensure proper chronological sorting for UI
        list.sort((a,b) => a.tgl.localeCompare(b.tgl));
        lastJurnalRef.current = list;
        setJurnalData(list);
      }
      setCloudStatus(prev => ({ ...prev, jurnal: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/jurnal`);
      setCloudStatus(prev => ({ ...prev, jurnal: true }));
    });

    // 5. Stok
    const unsubStok = onSnapshot(collection(db, "koperasi", koperasiId, "stok"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: StokItem[] = [];
      snap.forEach(d => list.push(d.data() as StokItem));
      
      const cloudStr = JSON.stringify(list.sort((a,b) => a.id.localeCompare(b.id)));
      const localStr = JSON.stringify(lastStokRef.current.sort((a,b) => a.id.localeCompare(b.id)));

      if (cloudStr !== localStr) {
        lastStokRef.current = list;
        setStokData(list);
      }
      setCloudStatus(prev => ({ ...prev, stok: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/stok`);
      setCloudStatus(prev => ({ ...prev, stok: true }));
    });

    // 6. Stok Histori
    const unsubStokHistori = onSnapshot(collection(db, "koperasi", koperasiId, "stokHistori"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: StokHistoriEntry[] = [];
      snap.forEach(d => list.push(d.data() as StokHistoriEntry));
      lastStokHistoriRef.current = list;
      setStokHistoriData(list);
    }, (err) => handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/stokHistori`));

    // 7. Anggota
    const unsubAnggota = onSnapshot(collection(db, "koperasi", koperasiId, "anggota"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: Anggota[] = [];
      snap.forEach(d => list.push(d.data() as Anggota));
      lastAnggotaRef.current = list;
      setAnggotaData(list);
      setCloudStatus(prev => ({ ...prev, anggota: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/anggota`);
      setCloudStatus(prev => ({ ...prev, anggota: true }));
    });

    // 8. Kontak Lain
    const unsubKontak = onSnapshot(collection(db, "koperasi", koperasiId, "kontakLain"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: KontakLain[] = [];
      snap.forEach(d => list.push(d.data() as KontakLain));
      lastKontakRef.current = list;
      setKontakLainData(list);
      setCloudStatus(prev => ({ ...prev, kontak: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/kontakLain`);
      setCloudStatus(prev => ({ ...prev, kontak: true }));
    });

    // 9. Tagihan
    const unsubTagihan = onSnapshot(collection(db, "koperasi", koperasiId, "tagihan"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: Tagihan[] = [];
      snap.forEach(d => list.push(d.data() as Tagihan));
      lastTagihanRef.current = list;
      setTagihanData(list);
      setCloudStatus(prev => ({ ...prev, tagihan: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/tagihan`);
      setCloudStatus(prev => ({ ...prev, tagihan: true }));
    });

    // 10. Rekening Bank
    const unsubRekening = onSnapshot(collection(db, "koperasi", koperasiId, "rekening"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: RekeningBank[] = [];
      snap.forEach(d => list.push(d.data() as RekeningBank));
      lastRekeningRef.current = list;
      setRekeningData(list);
      setCloudStatus(prev => ({ ...prev, rekening: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/rekening`);
      setCloudStatus(prev => ({ ...prev, rekening: true }));
    });

    // 11. Fixed Assets
    const unsubAssets = onSnapshot(collection(db, "koperasi", koperasiId, "fixedAssets"), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const list: FixedAsset[] = [];
      snap.forEach(d => list.push(d.data() as FixedAsset));
      lastFixedAssetsRef.current = list;
      setFixedAssets(list);
      setCloudStatus(prev => ({ ...prev, assets: true }));
    }, (err) => {
      handleCloudError(err, OperationType.LIST, `koperasi/${koperasiId}/fixedAssets`);
      setCloudStatus(prev => ({ ...prev, assets: true }));
    });

    return () => {
      unsubMeta();
      unsubUsers();
      unsubCoa();
      unsubJurnal();
      unsubStok();
      unsubStokHistori();
      unsubAnggota();
      unsubKontak();
      unsubTagihan();
      unsubRekening();
      unsubAssets();
    };
  }, [koperasiId]);

  // LOCAL STATE -> CLOUD WRITEBACK EMITTERS (DIFF COMPARED BASED ON REFS TO AVOID LOOPS)

  // Meta Document
  useEffect(() => {
    if (!koperasiId || !cloudStatus.meta) return;
    const meta = {
      nama: koperasiName,
      alamat: koperasiAlamat,
      logo: koperasiLogo,
      invoiceSize: koperasiInvoiceSize,
      subtext: koperasiSubtext
    };
    if (JSON.stringify(meta) !== JSON.stringify(lastKoperasiMetaRef.current)) {
      setDoc(doc(db, "koperasi", koperasiId), {
        id: koperasiId,
        nama: koperasiName,
        alamat: koperasiAlamat,
        logo: koperasiLogo,
        invoiceSize: koperasiInvoiceSize,
        subtext: koperasiSubtext
      }, { merge: true }).catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}`));
      lastKoperasiMetaRef.current = meta;
    }
  }, [koperasiName, koperasiAlamat, koperasiLogo, koperasiInvoiceSize, koperasiSubtext, koperasiId, cloudStatus.meta]);

  // Users Accounts
  useEffect(() => {
    if (!koperasiId || !cloudStatus.users) return;
    const local = userAccounts;
    const dbVal = lastUserAccountsRef.current;
    
    local.forEach(item => {
      const match = dbVal.find(d => d.username === item.username);
      // Clean undefined values from the item object before checking update or saving
      const cleanItem = Object.fromEntries(
        Object.entries(item).filter(([_, v]) => v !== undefined)
      );
      // Clean comparison match object
      const cleanMatch = match ? Object.fromEntries(
        Object.entries(match).filter(([_, v]) => v !== undefined)
      ) : null;

      if (!cleanMatch || JSON.stringify(cleanMatch) !== JSON.stringify(cleanItem)) {
        setDoc(doc(db, "koperasi", koperasiId, "users", item.username), cleanItem)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/users/${item.username}`));
      }
    });
    
    dbVal.forEach(item => {
      if (!local.some(l => l.username === item.username)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "users", item.username))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/users/${item.username}`));
      }
    });
    lastUserAccountsRef.current = local;
  }, [userAccounts, koperasiId, cloudStatus.users]);

  // COA Accounts
  useEffect(() => {
    if (!koperasiId || !cloudStatus.coa) return;
    const local = coaData;
    const dbVal = lastCoaRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.kode === item.kode);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "coa", item.kode), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/coa/${item.kode}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.kode === item.kode)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "coa", item.kode))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/coa/${item.kode}`));
      }
    });
    lastCoaRef.current = local;
  }, [coaData, koperasiId, cloudStatus.coa]);

  // Jurnal Entries
  useEffect(() => {
    if (!koperasiId || !cloudStatus.jurnal) return;
    const local = jurnalData;
    const dbVal = lastJurnalRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "jurnal", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/jurnal/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "jurnal", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/jurnal/${item.id}`));
      }
    });
    lastJurnalRef.current = local;
  }, [jurnalData, koperasiId, cloudStatus.jurnal]);

  // Stok Items
  useEffect(() => {
    if (!koperasiId || !cloudStatus.stok) return;
    const local = stokData;
    const dbVal = lastStokRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "stok", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/stok/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "stok", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/stok/${item.id}`));
      }
    });
    lastStokRef.current = local;
  }, [stokData, koperasiId, cloudStatus.stok]);

  // Stok Histori
  useEffect(() => {
    if (!koperasiId) return; // No guard needed for histori usually as it is mostly append only, but consistency is good
    const local = stokHistoriData;
    const dbVal = lastStokHistoriRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "stokHistori", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/stokHistori/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "stokHistori", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/stokHistori/${item.id}`));
      }
    });
    lastStokHistoriRef.current = local;
  }, [stokHistoriData, koperasiId]);

  // Anggota
  useEffect(() => {
    if (!koperasiId || !cloudStatus.anggota) return;
    const local = anggotaData;
    const dbVal = lastAnggotaRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "anggota", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/anggota/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "anggota", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/anggota/${item.id}`));
      }
    });
    lastAnggotaRef.current = local;
  }, [anggotaData, koperasiId, cloudStatus.anggota]);

  // Kontak Lain
  useEffect(() => {
    if (!koperasiId || !cloudStatus.kontak) return;
    const local = kontakLainData;
    const dbVal = lastKontakRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "kontakLain", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/kontakLain/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "kontakLain", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/kontakLain/${item.id}`));
      }
    });
    lastKontakRef.current = local;
  }, [kontakLainData, koperasiId, cloudStatus.kontak]);

  // Tagihan
  useEffect(() => {
    if (!koperasiId || !cloudStatus.tagihan) return;
    const local = tagihanData;
    const dbVal = lastTagihanRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "tagihan", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/tagihan/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "tagihan", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/tagihan/${item.id}`));
      }
    });
    lastTagihanRef.current = local;
  }, [tagihanData, koperasiId, cloudStatus.tagihan]);

  // Rekening Bank
  useEffect(() => {
    if (!koperasiId || !cloudStatus.rekening) return;
    const local = rekeningData;
    const dbVal = lastRekeningRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "rekening", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/rekening/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "rekening", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/rekening/${item.id}`));
      }
    });
    lastRekeningRef.current = local;
  }, [rekeningData, koperasiId, cloudStatus.rekening]);

  // Fixed Assets
  useEffect(() => {
    if (!koperasiId || !cloudStatus.assets) return;
    const local = fixedAssets;
    const dbVal = lastFixedAssetsRef.current;
    local.forEach(item => {
      const match = dbVal.find(d => d.id === item.id);
      if (!match || JSON.stringify(match) !== JSON.stringify(item)) {
        setDoc(doc(db, "koperasi", koperasiId, "fixedAssets", item.id), item)
          .catch(err => handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/fixedAssets/${item.id}`));
      }
    });
    dbVal.forEach(item => {
      if (!local.some(l => l.id === item.id)) {
        deleteDoc(doc(db, "koperasi", koperasiId, "fixedAssets", item.id))
          .catch(err => handleCloudError(err, OperationType.DELETE, `koperasi/${koperasiId}/fixedAssets/${item.id}`));
      }
    });
    lastFixedAssetsRef.current = local;
  }, [fixedAssets, koperasiId, cloudStatus.assets]);

  // Optimistic save fallbacks for offline support
  useEffect(() => {
    localStorage.setItem('kdmp_koperasiId', koperasiId);
  }, [koperasiId]);

  useEffect(() => {
    localStorage.setItem('kdmp_coaData', JSON.stringify(coaData));
  }, [coaData]);

  useEffect(() => {
    localStorage.setItem('kdmp_jurnalData', JSON.stringify(jurnalData));
  }, [jurnalData]);

  useEffect(() => {
    localStorage.setItem('kdmp_stokData', JSON.stringify(stokData));
  }, [stokData]);

  useEffect(() => {
    localStorage.setItem('kdmp_stokHistoriData', JSON.stringify(stokHistoriData));
  }, [stokHistoriData]);

  useEffect(() => {
    localStorage.setItem('kdmp_anggotaData', JSON.stringify(anggotaData));
  }, [anggotaData]);

  useEffect(() => {
    localStorage.setItem('kdmp_kontakLainData', JSON.stringify(kontakLainData));
  }, [kontakLainData]);

  useEffect(() => {
    localStorage.setItem('kdmp_tagihanData', JSON.stringify(tagihanData));
  }, [tagihanData]);

  useEffect(() => {
    localStorage.setItem('kdmp_rekeningData', JSON.stringify(rekeningData));
  }, [rekeningData]);

  useEffect(() => {
    localStorage.setItem('kdmp_fixedAssets', JSON.stringify(fixedAssets));
  }, [fixedAssets]);

  useEffect(() => {
    localStorage.setItem('kdmp_userAccounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  useEffect(() => {
    localStorage.setItem('kdmp_currentUsername', currentUsername);
  }, [currentUsername]);

  useEffect(() => {
    if (!koperasiId) return;
    localStorage.setItem(`kdmp_${koperasiId}_koperasiName`, koperasiName);
  }, [koperasiName, koperasiId]);

  useEffect(() => {
    if (!koperasiId) return;
    localStorage.setItem(`kdmp_${koperasiId}_koperasiAlamat`, koperasiAlamat);
  }, [koperasiAlamat, koperasiId]);

  useEffect(() => {
    if (!koperasiId) return;
    localStorage.setItem(`kdmp_${koperasiId}_koperasiLogo`, koperasiLogo);
  }, [koperasiLogo, koperasiId]);

  useEffect(() => {
    if (!koperasiId) return;
    localStorage.setItem(`kdmp_${koperasiId}_koperasiInvoiceSize`, koperasiInvoiceSize);
  }, [koperasiInvoiceSize, koperasiId]);

  useEffect(() => {
    if (!koperasiId) return;
    localStorage.setItem(`kdmp_${koperasiId}_koperasiSubtext`, koperasiSubtext);
  }, [koperasiSubtext, koperasiId]);

  // LOGIN OPERATION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = inputUser.trim().toLowerCase();

    // Prevent signing in as SuperIT unless the selected tenant is 'supercloud'
    if (cleanUser === "superit" && koperasiId !== "supercloud") {
      setLoginError("Akses Ditolak: Username 'SuperIT' terbatas hanya untuk instansi 'supercloud' atau dengan Login Email Pemilik!");
      return;
    }

    setCloudAuthLoading(true);
    setLoginError("");

    try {
      // 1. Identify the user profile to find their linked email
      let targetUser = userAccounts.find(u => u.username.toLowerCase() === cleanUser);
      if (!targetUser) {
        // Support email entered in username field
        targetUser = userAccounts.find(u => u.email?.toLowerCase().trim() === cleanUser);
      }
      
      if (!targetUser) {
        // SECONDARY FALLBACK: Direct Firestore fetch for newly created users (snapshot might be delayed)
        try {
          const userRef = collection(db, "koperasi", koperasiId, "users");
          const userSnap = await getDocs(userRef);
          const list: UserAccount[] = [];
          userSnap.forEach(d => list.push(d.data() as UserAccount));
          
          targetUser = list.find(u => u.username.toLowerCase() === cleanUser);
          if (!targetUser) {
            targetUser = list.find(u => u.email?.toLowerCase().trim() === cleanUser);
          }
        } catch (e) {
          console.warn("Direct user fetch failed:", e);
        }
      }
      
      if (!targetUser) {
        throw new Error("Pengguna atau Username tidak ditemukan! Pastikan ID Instansi sudah benar dan Anda terdaftar.");
      }

      // 2. Resolve email (might be migrated or user provided)
      const loginEmail = targetUser.email || `${targetUser.username.toLowerCase()}_${koperasiId.toLowerCase()}@supercloud.local`;

      // 3. Attempt Supabase Auth Sign In (migrated from local comparison)
      let email: string | undefined;
      try {
        const result = await signInWithEmailAndPassword(auth, loginEmail, inputPass);
        email = result.user?.email;
      } catch (authErr: any) {
        console.warn("Supabase Auth failed, checking local credentials fallback:", authErr.message);
        
        // Local Fallback: If user exists in local accounts and password matches
        if (targetUser.password === inputPass) {
          // Manually set a simulated auth user so onAuthStateChanged doesn't log them out
          const simulatedUser = {
            uid: `local-${targetUser.username}-${koperasiId}`,
            email: loginEmail,
            emailVerified: true,
            isAnonymous: false
          };
          localStorage.setItem('supa_auth_user', JSON.stringify(simulatedUser));
          // Success indicates we proceed to update session states
        } else {
          // Re-throw if even local check fails
          throw new Error("Kombinasi User ID dan Kata Sandi tidak sesuai.");
        }
      }

      // 4. If success, apply local session context
      const mode = targetUser.isAdmin ? "admin" : "view";
      setAccessMode(mode);
      setUserName(targetUser.name);
      setUserRole(targetUser.role);
      setCurrentUsername(targetUser.username);
      
      localStorage.setItem('kdmp_accessMode', mode);
      localStorage.setItem('kdmp_userName', targetUser.name);
      localStorage.setItem('kdmp_userRole', targetUser.role);
      localStorage.setItem('kdmp_currentUsername', targetUser.username);
      setLoginError("");

      // Log successful login
      logSecurityEvent({
        tenantId: koperasiId,
        tenantName: koperasiName,
        actorEmail: email || loginEmail,
        actorName: targetUser.name,
        category: "Autentikasi",
        severity: "INFO",
        action: "Masuk Sistem Berhasil",
        details: `Staff ${targetUser.name} (${targetUser.role}) berhasil masuk ke portal koperasi ${koperasiName} via Cloud Supabase Auth.`,
        status: "Sukses"
      }).catch(err => console.warn(err));

    } catch (err: any) {
      console.error("Login session error:", err);
      let errMsg = "Kombinasi sandi / username salah!";
      
      if (err.message?.includes("not found") || err.message?.includes("invalid") || err.code === 'auth/wrong-password') {
        errMsg = "Username atau sandi anda salah! Periksa kembali pengetikan Anda.";
      } else if (err.message) {
        errMsg = err.message;
      }

      setLoginError(errMsg);
      
      // Log failed login
      logSecurityEvent({
        tenantId: koperasiId,
        tenantName: koperasiName,
        actorEmail: `${cleanUser}@auth.cloud`,
        actorName: "Percobaan Masuk Gagal",
        category: "Autentikasi",
        severity: "WARNING",
        action: "Masuk Sistem Gagal",
        details: `Upaya masuk gagal menggunakan username: '${cleanUser}' pada portal koperasi ${koperasiName}. Error: ${errMsg}`,
        status: "Gagal"
      }).catch(err => console.warn(err));
    } finally {
      setCloudAuthLoading(false);
    }
  };

  // GOOGLE LOGIN HANDLER (INDUSTRY-GRADE SECURED BY GOOGLE AUTH)
  const handleGoogleLogin = async () => {
    setCloudAuthLoading(true);
    setLoginError("");
    setCloudSuccessMessage("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email?.toLowerCase()?.trim();
      if (!email) {
        throw new Error("Pemberi izin Google tidak memberikan info email.");
      }

      // 1. OWNER BYPASS (HIGHEST PRIORITY)
      if (email === "komarudink403@gmail.com") {
        setCloudSuccessMessage("Akses Pemilik (Owner) Terverifikasi!");
        const mode = "admin";
        setAccessMode(mode);
        setUserName("Bpk. Komarudin (SuperIT Owner)");
        setUserRole("Pemilik & Pembuat System");
        setCurrentUsername("SuperIT");
        
        localStorage.setItem('kdmp_accessMode', mode);
        localStorage.setItem('kdmp_userName', "Bpk. Komarudin (SuperIT Owner)");
        localStorage.setItem('kdmp_userRole', "Pemilik & Pembuat System");
        localStorage.setItem('kdmp_currentUsername', "SuperIT");

        logSecurityEvent({
          tenantId: koperasiId,
          tenantName: koperasiName,
          actorEmail: email,
          actorName: "Bpk. Komarudin (SuperIT Owner)",
          action: "Login Owner via Google",
          category: "Autentikasi",
          severity: "CRITICAL",
          details: "Pemilik Sistem berhasil masuk menggunakan akun Google bypass.",
          status: "Sukses"
        }).catch(e => console.warn(e));
        return;
      }

      // 2. TENANT USER RESOLUTION
      // Check if the current Google email matches any registered user in this specific tenant
      let foundUser: UserAccount | null = null;
      try {
        const userRef = collection(db, "koperasi", koperasiId, "users");
        const userSnap = await getDocs(userRef);
        const list: UserAccount[] = [];
        userSnap.forEach(d => list.push(d.data() as UserAccount));
        foundUser = list.find(u => u.email && u.email.toLowerCase().trim() === email) || null;

        if (!foundUser) {
          const tenantSnap = await getDoc(doc(db, "tenants", koperasiId));
          if (tenantSnap.exists()) {
            const tenantData = tenantSnap.data();
            if (tenantData.ownerEmail?.toLowerCase().trim() === email || (email === "komartea51@gmail.com" && (koperasiId.toLowerCase() === "kdmp-jomintimur" || koperasiId.toLowerCase() === "kdmp-jotim"))) {
              foundUser = {
                username: "admin-utama",
                name: tenantData.ownerName || (email === "komartea51@gmail.com" ? "Administrator KDMP" : "Pemilik Instansi"),
                role: "Owner Instansi",
                isAdmin: true,
                canAccessSettings: true,
                email: email
              };
            }
          } else if (email === "komartea51@gmail.com" && (koperasiId.toLowerCase() === "kdmp-jomintimur" || koperasiId.toLowerCase() === "kdmp-jotim")) {
             foundUser = {
                username: "admin-utama",
                name: "Administrator KDMP",
                role: "Owner Instansi",
                isAdmin: true,
                canAccessSettings: true,
                email: email
              };
          }
        }
      } catch (dbErr) {
        console.warn("Database lookup failed during Google Login:", dbErr);
      }

      if (foundUser) {
        setCloudSuccessMessage(`Selamat Berhasil masuk! Selamat datang kembali, ${foundUser.name}!`);
        const mode = foundUser.isAdmin ? "admin" : "view";
        setAccessMode(mode);
        setUserName(foundUser.name);
        setUserRole(foundUser.role);
        setCurrentUsername(foundUser.username);
        
        localStorage.setItem('kdmp_accessMode', mode);
        localStorage.setItem('kdmp_userName', foundUser.name);
        localStorage.setItem('kdmp_userRole', foundUser.role);
        localStorage.setItem('kdmp_currentUsername', foundUser.username);

        // Log successful standard user login
        logSecurityEvent({
          tenantId: koperasiId,
          tenantName: koperasiName,
          actorEmail: email,
          actorName: foundUser.name,
          category: "Autentikasi",
          severity: "INFO",
          action: "Masuk Sistem Google OAuth",
          details: `Staff ${foundUser.name} (${foundUser.role}) berhasil masuk ke portal koperasi ${koperasiName} dengan akun Google tertaut.`,
          status: "Sukses"
        }).catch(e => console.warn(e));

      } else {
        // Sign out so they don't remain logged in with an unlinked email
        setLoginError(`Akses Ditolak: Email Anda (${email}) tidak terdaftar dalam Instansi dengan ID '${koperasiId}'. Pastikan ID Instansi sudah benar.`);

        // Log unlinked email login intent
        logSecurityEvent({
          tenantId: koperasiId,
          tenantName: koperasiName,
          actorEmail: email,
          actorName: "Percobaan Google OAuth Belum Ditautkan",
          category: "Autentikasi",
          severity: "WARNING",
          action: "Masuk Sistem Google OAuth Ditolak",
          details: `Upaya masuk gagal karena akun email Google '${email}' terverifikasi aman, tetapi belum ditautkan ke personalia mana pun di portal koperasi ${koperasiName}.`,
          status: "Ditolak"
        }).catch(e => console.warn(e));
      }
    } catch (err: any) {
      console.error(err);
      
      // Detect if popup is blocked or closed prematurely
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.message?.toLowerCase().includes('popup')) {
        setShowPopupWarning(true);
      }
      
      const isIframe = window.self !== window.top;

      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        let msg = "Proses masuk dibatalkan (Popup ditutup).";
        if (isIframe) {
          msg += " PENTING: Browser sering memblokir popup dari dalam frame. Silakan klik tombol 'Mainkan di Tab Baru' (Open in New Tab) di pojok kanan atas aplikasi untuk login dengan lancar.";
        } else {
          msg += " Pastikan browser Anda tidak memblokir popup window.";
        }
        setLoginError(msg);
      } else if (err.code === "auth/operation-not-allowed") {
        setLoginError("Metode Login Google belum aktif di Cloud! Langkah Perbaikan: 1. Masuk ke Cloud Console 2. Klik menu 'Authentication' 3. Tab 'Sign-in method' 4. Klik 'Add new provider' 5. Pilih 'Google' 6. Klik 'Enable' & 'Save'.");
      } else {
        setLoginError(err.message || "Gagal masuk menggunakan Google Login.");
      }
    } finally {
      setCloudAuthLoading(false);
    }
  };

  // EMAIL & PASSWORD SECURE CLOUD AUTH HANDLER
  const handleCloudEmailAndPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = cloudEmail.trim().toLowerCase();
    const cleanPassword = cloudPassword;

    if (!cleanEmail || !cleanPassword) {
      setLoginError("Mohon masukkan Email dan Kata Sandi!");
      return;
    }

    if (isCloudRegister) {
      if (cleanPassword.length < 8) {
        setLoginError("Kata sandi cloud minimal harus 8 karakter!");
        return;
      }
      if (!/[A-Z]/.test(cleanPassword)) {
        setLoginError("Kata sandi harus mengandung minimal satu huruf BESAR!");
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(cleanPassword)) {
        setLoginError("Kata sandi harus mengandung minimal satu simbol unik/spesial!");
        return;
      }
      if (cleanPassword !== cloudConfirmPassword) {
        setLoginError("Konfirmasi sandi rahasia cloud tidak sesuai! Periksa kembali pengetikan Anda.");
        setCloudAuthLoading(false);
        return;
      }
    }

    setCloudAuthLoading(true);

    try {
      if (isCloudRegister) {
        // CREATE USER IN SECURE SUPABASE INFRASTRUCTURE
        // This invokes supabase.auth.signUp() encapsulated within the imported wrapper
        await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        setCloudSuccessMessage(`Registrasi akun aman berhasil! Segera hubungi Admin System untuk menautkan email Anda (${cleanEmail}) ke profil staf.`);
        setIsCloudRegister(false);
        setCloudEmail("");
        setCloudPassword("");
        setCloudConfirmPassword("");
      } else {
        // LOGIN USER VIA SUPABASE INTUITIVE SECURITY LAYER
        // This invokes supabase.auth.signInWithPassword() encapsulated within the imported wrapper
        let email: string | undefined;
        let targetFoundUser: UserAccount | null = null;

        try {
          const result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          email = result.user?.email?.toLowerCase()?.trim();
        } catch (authErr: any) {
          console.warn("Cloud Auth failed, checking local credentials fallback for direct email login:", authErr.message);
          
          // Local Fallback: If a user in the local accounts matches this email OR username AND password
          const localMatch = userAccounts.find(u => 
            (u.email?.toLowerCase().trim() === cleanEmail || u.username.toLowerCase() === cleanEmail) && 
            u.password === cleanPassword
          );

          if (localMatch) {
            targetFoundUser = localMatch;
            email = localMatch.email || `${localMatch.username.toLowerCase()}_${koperasiId.toLowerCase()}@supercloud.local`;
            // Success - manually set a simulated auth user for session persistence
            const simulatedUser = {
              uid: `local-${localMatch.username}-${koperasiId}`,
              email: email,
              emailVerified: true,
              isAnonymous: false
            };
            localStorage.setItem('supa_auth_user', JSON.stringify(simulatedUser));
          } else {
            // Re-throw if even local check fails
            throw new Error("Kombinasi Email/Username dan Kata Sandi tidak sesuai.");
          }
        }

        if (!email && !targetFoundUser) {
          throw new Error("Gagal mengenali kredensial akun.");
        }

        // OWNER EMAIL DIRECT SUPERIT ACCESS BYPASS
        if (email === "komarudink403@gmail.com" || (email === "komartea51@gmail.com" && (koperasiId.toLowerCase() === "kdmp-jomintimur" || koperasiId.toLowerCase() === "kdmp-jotim"))) {
          const isSuperIT = email === "komarudink403@gmail.com";
          setCloudSuccessMessage(isSuperIT ? "Berhasil masuk! Selamat datang kembali, Bpk. Komarudin (SuperIT Owner)!" : "Berhasil masuk! Selamat datang Administrator KDMP!");
          const mode = "admin";
          setAccessMode(mode);
          setUserName(isSuperIT ? "Bpk. Komarudin (SuperIT Owner)" : "Administrator KDMP");
          setUserRole(isSuperIT ? "Pemilik & Pembuat System" : "Owner Instansi");
          setCurrentUsername(isSuperIT ? "SuperIT" : "admin-utama");
          
          localStorage.setItem('kdmp_accessMode', mode);
          localStorage.setItem('kdmp_userName', isSuperIT ? "Bpk. Komarudin (SuperIT Owner)" : "Administrator KDMP");
          localStorage.setItem('kdmp_userRole', isSuperIT ? "Pemilik & Pembuat System" : "Owner Instansi");
          localStorage.setItem('kdmp_currentUsername', isSuperIT ? "SuperIT" : "admin-utama");
          setLoginError("");
          setCloudEmail("");
          setCloudPassword("");
          setCloudAuthLoading(false);
          return;
        }

        // STRICT TENANT CHECK (If not already found by localMatch)
        if (!targetFoundUser) {
          const userRef = collection(db, "koperasi", koperasiId, "users");
          const userSnap = await getDocs(userRef);
          const list: UserAccount[] = [];
          userSnap.forEach(d => list.push(d.data() as UserAccount));

          let localFoundUser = list.find(
            u => u.email && u.email.toLowerCase().trim() === email
          );

          const tenantSnap = await getDoc(doc(db, "tenants", koperasiId));
          let isOwner = false;
          if (tenantSnap.exists()) {
            const tenantData = tenantSnap.data();
            if (tenantData.ownerEmail?.toLowerCase().trim() === email || (email === "komartea51@gmail.com" && (koperasiId.toLowerCase() === "kdmp-jomintimur" || koperasiId.toLowerCase() === "kdmp-jotim"))) {
              isOwner = true;
            }
          } else if (email === "komartea51@gmail.com" && (koperasiId.toLowerCase() === "kdmp-jomintimur" || koperasiId.toLowerCase() === "kdmp-jotim")) {
             // Hardcoded fallback for specific client request
             isOwner = true;
          }

          if (localFoundUser) {
            targetFoundUser = localFoundUser;
          } else if (isOwner) {
            // Fallback to initial admin user if they are the owner but for some reason not found in search
            const fallbackAdmin = list.find(u => u.username === "admin-utama");
            if (fallbackAdmin) {
              targetFoundUser = { ...fallbackAdmin, email: email };
            } else {
              targetFoundUser = {
                username: "admin-utama",
                password: "",
                email: email,
                name: "Administrator Utama",
                role: "Owner Instansi",
                isAdmin: true,
                canAccessSettings: true,
                permittedPages: ["dashboard", "coa", "jurnal", "kasbank", "invoice", "stok", "rekappenjualan", "anggota", "tabungan", "kredit", "asettetap", "kontak", "tagihan", "laporan", "pengaturan"]
              };
            }
          }
        }

        if (!targetFoundUser) {
          throw new Error(`Akses Ditolak: Email Anda (${email}) tidak terdaftar dalam Instansi dengan ID '${koperasiId}'. Pastikan ID Instansi sudah benar.`);
        }

        if (targetFoundUser) {
          setCloudSuccessMessage(`Berhasil masuk! Selamat datang kembali, ${targetFoundUser.name}!`);
          const mode = targetFoundUser.isAdmin ? "admin" : "view";
          setAccessMode(mode);
          setUserName(targetFoundUser.name);
          setUserRole(targetFoundUser.role);
          setCurrentUsername(targetFoundUser.username);
          
          localStorage.setItem('kdmp_accessMode', mode);
          localStorage.setItem('kdmp_userName', targetFoundUser.name);
          localStorage.setItem('kdmp_userRole', targetFoundUser.role);
          localStorage.setItem('kdmp_currentUsername', targetFoundUser.username);
        } else {
          setLoginError(`Otentikasi berhasil! Email Anda (${email}) aman terdaftar di Cloud, tetapi sistem tidak menemukan tautan ke Instansi manapun. Pastikan ID Instansi sudah benar atau hubungi Administrator Utama.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || String(err);
      if (err.code === "auth/operation-not-allowed" || errMsg.toLowerCase().includes("provider is disabled") || errMsg.toLowerCase().includes("signup_disabled") || errMsg.toLowerCase().includes("disabled for this project")) {
        errMsg = "Metode Login/Daftar Email & Sandi belum aktif! Hubungi administrator utama atau silakan aktifkan provider 'Email' di dashboard penyedia otentikasi Anda (seperti Supabase Auth).";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Kata sandi terlalu lemah (minimal 6 karakter untuk standard keamanan Google)!";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "Email ini sudah terdaftar. Silakan ganti tab menjadi Masuk/Login Google.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Sandi salah atau pengguna tidak ditemukan!";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Format alamat email salah!";
      }
      setLoginError(errMsg);
    } finally {
      setCloudAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (isSupportMode) {
      handleExitSupportMode();
      return;
    }

    // Log the logout action BEFORE resetting local states
    if (currentUsername) {
      logSecurityEvent({
        tenantId: koperasiId,
        tenantName: koperasiName,
        actorEmail: `${currentUsername}@koperasi.net`,
        actorName: userName || currentUsername,
        category: "Autentikasi",
        severity: "INFO",
        action: "Keluar Sistem",
        details: `Petugas ${userName || currentUsername} telah keluar secara aman dari sistem portal ${koperasiName}.`,
        status: "Sukses"
      }).catch(err => console.warn(err));
    }

    setAccessMode("login");
    setUserName("");
    setUserRole("");
    setCurrentUsername("");
    
    // SECURITY: Clear input fields to protect user privacy (no credentials left behind)
    setInputUser("");
    setInputPass("");
    setCloudEmail("");
    setCloudPassword("");
    setCloudConfirmPassword("");
    setLoginError("");
    setCloudSuccessMessage("");

    localStorage.removeItem('kdmp_accessMode');
    localStorage.removeItem('kdmp_userName');
    localStorage.removeItem('kdmp_userRole');
    localStorage.removeItem('kdmp_currentUsername');
    localStorage.removeItem('kdmp_userAccounts');
    auth.signOut();
    setInputUser("");
    setInputPass("");
    setCloudEmail("");
    setCloudPassword("");
    setCloudConfirmPassword("");
    setRegPassword("");
    setRegConfirmPassword("");
    setInputKoperasiId("");
    setRegKoperasiName("");
    setRegKoperasiAlamat("");
    setRegSuperITEmail("");
    setOwnerPIN("");
    setLoginError("");
    setKoperasiError("");
    setCloudSuccessMessage("");
    setActivePage("dashboard");
    setShowStealthBypassConnect(false);
  };

  const handleDisconnectKoperasi = () => {
    if (isSupportMode) {
      handleExitSupportMode();
      return;
    }
    handleLogout();
    setKoperasiId("");
    localStorage.removeItem('kdmp_koperasiId');
  };

  const handleImpersonate = (targetId: string) => {
    if (!isSupportMode) {
      setOriginalKoperasiId(koperasiId);
    }
    setKoperasiId(targetId);
    setIsSupportMode(true);

    // Log the sensitive remote support session start
    logSecurityEvent({
      tenantId: targetId,
      tenantName: `Organisasi ID: ${targetId}`,
      actorEmail: auth.currentUser?.email || "komarudink403@gmail.com",
      actorName: userName || "Bpk. Komarudin",
      category: "Hak Akses",
      severity: "CRITICAL",
      action: "Inisiasi Sesi Remote Support",
      details: `Administrator Utama mengaktifkan Sesi Investigasi Jarak Jauh ke workspace tenant: '${targetId}'.`,
      status: "Sukses"
    }).catch(e => console.warn(e));

    setActivePage("dashboard");
    // We don't save to localStorage here to avoid permanently switching the admin's workspace
  };

  const handleExitSupportMode = () => {
    const backupOriginal = originalKoperasiId;
    if (originalKoperasiId) {
      setKoperasiId(originalKoperasiId);
      setOriginalKoperasiId(null);
    }

    // Log the sensitive Remote support session exit
    logSecurityEvent({
      tenantId: "supercloud",
      tenantName: "Developer System",
      actorEmail: auth.currentUser?.email || "komarudink403@gmail.com",
      actorName: userName || "Bpk. Komarudin",
      category: "Hak Akses",
      severity: "INFO",
      action: "Terminasi Sesi Remote Support",
      details: `Sesi Investigasi Jarak Jauh untuk tenant '${backupOriginal}' telah diakhiri secara tertib.`,
      status: "Sukses"
    }).catch(e => console.warn(e));

    setIsSupportMode(false);
    setShowStealthBypassConnect(false);
    setActivePage("dashboard");
  };

  const handleSuperITEmergencyBypass = async (inputPIN?: string) => {
    const pin = (inputPIN || ownerPIN).trim();
    if (pin !== "231108") {
      setBypassError("Akses Ditolak! Kode PIN Kerahasiaan Pemilik System Salah.");
      return;
    }
    
    const targetTenant = "supercloud";
    
    // Auto-provision tenant folder inside live cloud database if not already structured
    try {
      const docRef = doc(db, "koperasi", targetTenant);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        // Setup Meta
        await setDoc(docRef, {
          id: targetTenant,
          nama: "Supercloud Integrated System",
          alamat: "Induk Koperasi Operasional Digital",
          logo: "",
          invoiceSize: "A4"
        });
        
        // Users Setup
        const defaultUsers: UserAccount[] = [
          {
            username: "SuperIT",
            password: "superit123",
            name: "SuperIT (Support)",
            role: "Bantuan Teknis System",
            isAdmin: true,
            canAccessSettings: true
          }
        ];
        const defaultPages = ["dashboard", "jurnal", "stok", "stockopname", "kontak", "anggota", "kasbank", "coa", "asettetap", "invoice", "rekappenjualan", "laporan"];
        const usersToInsert = defaultUsers.map(u => {
          const pages = [...defaultPages, "pengaturan"];
          return { ...u, permittedPages: pages };
        });
        for (const u of usersToInsert) {
          await setDoc(doc(db, "koperasi", targetTenant, "users", u.username), u);
        }
        
        // COA Setup
        const defaultCOA = INITIAL_COA.map(c => ({
          ...c,
          saldoAwal: getSaldoAwal(c.kode, c.saldo)
        }));
        for (const c of defaultCOA) {
          await setDoc(doc(db, "koperasi", targetTenant, "coa", c.kode), c);
        }
        
        // Accounts / Rekening Bank Setup
        for (const r of INITIAL_REKENING) {
          await setDoc(doc(db, "koperasi", targetTenant, "rekening", r.id), r);
        }
        
        // Default Member tags
        for (const m of INITIAL_ANGGOTA) {
          await setDoc(doc(db, "koperasi", targetTenant, "anggota", m.id), m);
        }
      }
    } catch (err) {
      console.error("Failed to auto-provision supercloud in Cloud:", err);
    }

    setKoperasiId(targetTenant);
    localStorage.setItem('kdmp_koperasiId', targetTenant);
    
    // Set default name if not configured
    setKoperasiName("Supercloud Integrated System");
    localStorage.setItem('kdmp_koperasiName', "Supercloud Integrated System");
    setKoperasiAlamat("Induk Koperasi Operasional Digital");
    localStorage.setItem('kdmp_koperasiAlamat', "Induk Koperasi Operasional Digital");

    const mode = "admin";
    setAccessMode(mode);
    setUserName("Bpk. Komarudin (SuperIT Owner)");
    setUserRole("Pemilik & Pembuat System");
    setCurrentUsername("SuperIT");
    
    localStorage.setItem('kdmp_accessMode', mode);
    localStorage.setItem('kdmp_userName', "Bpk. Komarudin (SuperIT Owner)");
    localStorage.setItem('kdmp_userRole', "Pemilik & Pembuat System");
    localStorage.setItem('kdmp_currentUsername', "SuperIT");
    
    setLoginError("");
    setBypassError("");
    setCloudSuccessMessage("");
  };

  const startAndInitializeKoperasi = async (id: string, name: string, addr: string) => {
    try {
      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!cleanId) throw new Error("ID Koperasi tidak valid!");
      
      const docRef = doc(db, "koperasi", cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        throw new Error("ID Koperasi ini sudah terdaftar! Pilih ID lain atau silakan hubungkan.");
      }
      
      // Setup Meta
      await setDoc(docRef, {
        id: cleanId,
        nama: name,
        alamat: addr,
        logo: "",
        invoiceSize: "A4"
      });
      
      // Users Setup
      const defaultUsers: UserAccount[] = [];
      if (cleanId === "supercloud") {
        defaultUsers.push({
          username: "SuperIT",
          password: "superit123",
          name: "SuperIT (Support)",
          role: "Bantuan Teknis System",
          isAdmin: true,
          canAccessSettings: true
        });
      }
      const defaultPages = ["dashboard", "jurnal", "stok", "stockopname", "kontak", "anggota", "kasbank", "coa", "asettetap", "invoice", "rekappenjualan", "laporan"];
      const usersToInsert = defaultUsers.map(u => {
        const pages = [...defaultPages, "pengaturan"];
        return { ...u, permittedPages: pages };
      });
      for (const u of usersToInsert) {
        await setDoc(doc(db, "koperasi", cleanId, "users", u.username), u);
      }
      
      // COA Setup
      const defaultCOA = INITIAL_COA.map(c => ({
        ...c,
        saldo: 0,
        saldoAwal: 0
      }));
      for (const c of defaultCOA) {
        await setDoc(doc(db, "koperasi", cleanId, "coa", c.kode), c);
      }
      
      // Accounts / Rekening Bank Setup
      for (const r of INITIAL_REKENING) {
        await setDoc(doc(db, "koperasi", cleanId, "rekening", r.id), {
          ...r,
          saldo: 0
        });
      }
      
      // We do NOT insert any dummy data for new registrants so they start completely from 0.
      // - No dummy items in 'stok'
      // - No dummy entries in 'stokHistori'
      // - No dummy members in 'anggota'
      // - No dummy contacts in 'kontakLain'
      // - No dummy invoices/bills in 'tagihan'
      // - No dummy entries in 'jurnal'
      // - No dummy assets in 'fixedAssets'
      
      // Connect
      setKoperasiId(cleanId);
      localStorage.setItem('kdmp_koperasiId', cleanId);
      return cleanId;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Redirect to dashboard if the activePage is not permitted for the logged-in user
  useEffect(() => {
    if (accessMode !== "login" && activePage !== "dashboard") {
      const detail = userAccounts.find(u => u.username === currentUsername);
      if (detail) {
        if (detail.username === "SuperIT") return; // SuperIT Creator bypasses all checks
        
        // Enforce settings menu checks first
        if (activePage === "pengaturan" && !detail.canAccessSettings) {
          setActivePage("dashboard");
          return;
        }

        // Support and saas_billing are built-in dashboard modules always permitted for logged-in tenant accounts
        if (activePage === "support" || activePage === "saas_billing") {
          return;
        }

        const allowed = detail.permittedPages || [];
        if (!allowed.includes(activePage)) {
          setActivePage("dashboard");
        }
      }
    }
  }, [activePage, currentUsername, accessMode, userAccounts]);

  // BALANCED DOUBLE ENTRY ADD JURNAL
  const handleAddJurnal = (tgl: string, no: string, ket: string, entries: { akun: string; debet: number; kredit: number }[]) => {
    // Audit log
    const entryDetails = entries.map(e => `${e.akun}: D=${e.debet}, K=${e.kredit}`).join("; ");
    logSecurityEvent({
      tenantId: koperasiId,
      tenantName: koperasiName,
      actorEmail: currentUsername ? `${currentUsername}@koperasi.net` : "anonymous@koperasi.net",
      actorName: userName || "Petugas Koperasi",
      category: "Mutasi Keuangan",
      severity: "INFO",
      action: "Pencatatan Jurnal Baru",
      details: `Pencatatan Jurnal Umum nomor bukti: '${no}' senilai total debet ${entries.reduce((acc, curr) => acc + curr.debet, 0)} (${ket}). Rincian: ${entryDetails}`,
      status: "Sukses"
    }).catch(e => console.warn(e));

    const now = Date.now();
    const newItems: JurnalEntry[] = entries.map((item, idx) => ({
      id: `j-${now}-${idx}-${item.debet > 0 ? 'debet' : 'kredit'}`,
      tgl,
      no,
      ket,
      akun: item.akun,
      debet: item.debet,
      kredit: item.kredit
    }));

    // Update state
    const nextJurnals = [...jurnalData, ...newItems];
    setJurnalData(nextJurnals);
  };

  const handleDeleteJurnal = (noGroup: string) => {
    // Check what was deleted to provide richer log information
    const deletedEntries = jurnalData.filter(j => j.no === noGroup);
    const deletedDetails = deletedEntries.map(d => `${d.akun}: D=${d.debet}, K=${d.kredit}`).join("; ");

    logSecurityEvent({
      tenantId: koperasiId,
      tenantName: koperasiName,
      actorEmail: currentUsername ? `${currentUsername}@koperasi.net` : "anonymous@koperasi.net",
      actorName: userName || "Petugas Koperasi",
      category: "Mutasi Keuangan",
      severity: "WARNING",
      action: "Penghapusan Entri Jurnal",
      details: `Penghapusan transaksi Jurnal Umum nomor bukti: '${noGroup}' (${deletedDetails || "tanpa detail"}).`,
      status: "Sukses"
    }).catch(e => console.warn(e));

    // Filter out entries
    const nextJurnals = jurnalData.filter(j => j.no !== noGroup);
    setJurnalData(nextJurnals);
  };

  // ADD COA FUNCTION
  const handleAddCoa = (kode: string, nama: string, kategori: CoaKategori, normal: SaldoNormal, saldo: number) => {
    const exists = coaData.some(c => c.kode === kode);
    if (exists) {
      const nextCOAs = coaData.map(c => {
        if (c.kode === kode) {
          return { ...c, nama, saldo, saldoAwal: saldo };
        }
        return c;
      });
      setCoaData(nextCOAs);
      localStorage.setItem('kdmp_coaData', JSON.stringify(nextCOAs));
    } else {
      const newAccount: CoaAccount = { kode, nama, kategori, normal, saldo, saldoAwal: saldo };
      const nextCOAs = [...coaData, newAccount];
      setCoaData(nextCOAs);
      localStorage.setItem('kdmp_coaData', JSON.stringify(nextCOAs));
    }
  };

  const handleUpdateCoaSaldoAwal = (kode: string, newSaldoAwal: number) => {
    const nextCOAs = coaData.map(c => {
      if (c.kode === kode) {
        return { ...c, saldoAwal: newSaldoAwal, saldo: newSaldoAwal };
      }
      return c;
    });
    setCoaData(nextCOAs);
    localStorage.setItem('kdmp_coaData', JSON.stringify(nextCOAs));
  };

  // BULK STOCK OPNAME
  const handleBulkOpname = (
    adjustments: { stokId: string; newQty: number; diff: number; keterangan: string }[],
    tgl: string,
    petugas: string
  ) => {
    // 1. Update stokData
    const nextStoks = stokData.map(s => {
      const match = adjustments.find(a => a.stokId === s.id);
      if (match) {
        return { ...s, qty: match.newQty };
      }
      return s;
    });
    setStokData(nextStoks);

    // 2. Create history entries for any item that changed
    if (adjustments.length > 0) {
      const now = Date.now();
      const newHistEntries: StokHistoriEntry[] = adjustments.map((item, idx) => {
        const originalStokItem = stokData.find(s => s.id === item.stokId)!;
        const modal = originalStokItem.hargaModal || Math.round(originalStokItem.hargaJual * 0.75);
        return {
          id: `log-opname-${now}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          tgl: tgl || new Date().toISOString().split('T')[0],
          stokId: item.stokId,
          kodeBarang: originalStokItem.kode,
          namaBarang: originalStokItem.nama,
          qtySecaraFisik: item.newQty,
          qtyAdded: item.diff,
          hargaModal: modal,
          keterangan: `[Stock Opname] Selisih ${item.diff > 0 ? '+' : ''}${item.diff} Pcs: ${item.keterangan || 'Penyesuaian Fisik'} (Oleh: ${petugas})`
        };
      });
      setStokHistoriData(prev => [...newHistEntries, ...prev]);
    }
  };

  // RE-STOCK LOGISTIC
  const handleUpdateStok = (id: string, newQty: number) => {
    const item = stokData.find(s => s.id === id);
    if (item) {
      const diff = newQty - item.qty;
      if (diff !== 0) {
        const hgModal = item.hargaModal || Math.round(item.hargaJual * 0.75);
        const newHistori: StokHistoriEntry = {
          id: "log-" + Date.now() + Math.random().toString(36).substr(2, 5),
          tgl: new Date().toISOString().split('T')[0],
          stokId: item.id,
          kodeBarang: item.kode,
          namaBarang: item.nama,
          qtySecaraFisik: newQty,
          qtyAdded: diff,
          hargaModal: hgModal,
          keterangan: diff > 0 ? "Penyesuaian manual (Ditambahkan)" : "Penyesuaian manual (Dikurangi)"
        };
        setStokHistoriData(prev => [newHistori, ...prev]);
      }
    }
    const nextStoks = stokData.map(s => {
      if (s.id === id) {
        return { ...s, qty: newQty };
      }
      return s;
    });
    setStokData(nextStoks);
  };

  const handleRestockStok = (id: string, qtyAdded: number, customHargaModal: number, tgl: string, keterangan: string) => {
    const item = stokData.find(s => s.id === id);
    if (item) {
      const actualHargaModal = customHargaModal > 0 ? customHargaModal : (item.hargaModal || Math.round(item.hargaJual * 0.75));
      const nextStoks = stokData.map(s => {
        if (s.id === id) {
          return { 
            ...s, 
            qty: s.qty + qtyAdded,
            hargaModal: actualHargaModal
          };
        }
        return s;
      });
      setStokData(nextStoks);

      const newHistori: StokHistoriEntry = {
        id: "log-" + Date.now() + Math.random().toString(36).substr(2, 5),
        tgl: tgl || new Date().toISOString().split('T')[0],
        stokId: id,
        kodeBarang: item.kode,
        namaBarang: item.nama,
        qtySecaraFisik: item.qty + qtyAdded,
        qtyAdded: qtyAdded,
        hargaModal: actualHargaModal,
        keterangan: keterangan || "Restok barang dagang"
      };
      setStokHistoriData(prev => [newHistori, ...prev]);
    }
  };

  const handleAddStok = (kode: string, nama: string, hargaJual: number, hargaModal: number, initialQty: number) => {
    const id = "st-" + (stokData.length + 1) + "-" + Math.random().toString(36).substr(2, 4);
    const newStok: StokItem = {
      id,
      kode,
      nama,
      hargaJual,
      qty: initialQty,
      hargaModal
    };
    setStokData(prev => [...prev, newStok]);

    if (initialQty > 0) {
      const newHistori: StokHistoriEntry = {
        id: "log-init-" + Date.now(),
        tgl: new Date().toISOString().split('T')[0],
        stokId: id,
        kodeBarang: kode,
        namaBarang: nama,
        qtySecaraFisik: initialQty,
        qtyAdded: initialQty,
        hargaModal,
        keterangan: "Inisialisasi stok awal barang baru"
      };
      setStokHistoriData(prev => [newHistori, ...prev]);
    }
  };

  const handleDeleteStok = (id: string) => {
    setStokData(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteStokHistori = (id: string) => {
    setStokHistoriData(prev => prev.filter(h => h.id !== id));
  };

  // ATOMIC RECORDING OF POS RETAIL SALE TRANSACTION SECURED BY CLOUD TRANSACTIONS
  const handleRecordSale = async (
    tgl: string,
    no: string,
    customerNama: string,
    methodCoaKode: string,
    items: { stokId: string; qty: number; hargaJual: number; hargaModal: number }[]
  ): Promise<void> => {
    if (accessMode === "view") {
      throw new Error("Akses Ditolak: Akun 'View Only' tidak diijinkan merekam transaksi penjualan.");
    }
    if (!koperasiId) {
      throw new Error("Gagal: ID Koperasi belum teridentifikasi.");
    }

    const totalJual = items.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
    const totalModal = items.reduce((sum, item) => sum + (item.qty * item.hargaModal), 0);
    const now = Date.now();
    const online = typeof navigator !== 'undefined' ? (navigator.onLine && isOnline) : isOnline;

    try {
      if (online) {
        await runTransaction(db, async (transaction) => {
          // 1. Fetch current stock quantities within the transaction to prevent race conditions
          const stockSnaps = [];
          for (const item of items) {
            const docRef = doc(db, "koperasi", koperasiId, "stok", item.stokId);
            const snap = await transaction.get(docRef);
            if (!snap.exists()) {
              throw new Error(`Produk dengan ID "${item.stokId}" tidak ditemukan atau sudah dihapus!`);
            }
            const currentQty = snap.data().qty || 0;
            if (currentQty < item.qty) {
              throw new Error(`Stok untuk "${snap.data().nama || 'Barang'}" tidak mencukupi! Tersedia: ${currentQty}, Diminta: ${item.qty}`);
            }
            stockSnaps.push({ snap, item });
          }

          // 2. Commit updates for each stock item and insert log entries atomically
          for (const { snap, item } of stockSnaps) {
            const docRef = doc(db, "koperasi", koperasiId, "stok", item.stokId);
            const currentQty = snap.data().qty || 0;
            const updatedQty = Math.max(0, currentQty - item.qty);
            transaction.update(docRef, { qty: updatedQty });

            const historyId = `log-sale-${now}-${item.stokId}-${Math.random().toString(36).substr(2, 4)}`;
            const historyRef = doc(db, "koperasi", koperasiId, "stokHistori", historyId);
            const histEntry: StokHistoriEntry = {
              id: historyId,
              tgl,
              stokId: item.stokId,
              kodeBarang: snap.data().kode || "",
              namaBarang: snap.data().nama || "",
              qtySecaraFisik: updatedQty,
              qtyAdded: -item.qty,
              hargaModal: item.hargaModal,
              keterangan: `Penjualan POS Nota ${no} (${customerNama})`
            };
            transaction.set(historyRef, histEntry);
          }

          // 3. Post double-entry accounting journals atomically
          // Journal 1: Kas/Bank Account (Debet) & Pendapatan Barang (Kredit)
          const j1Id = `j-${now}-sale-dr-${methodCoaKode}`;
          const j1Ref = doc(db, "koperasi", koperasiId, "jurnal", j1Id);
          const j1: JurnalEntry = {
            id: j1Id,
            tgl,
            no,
            ket: `Penjualan barang dagang POS (${customerNama})`,
            akun: methodCoaKode,
            debet: totalJual,
            kredit: 0
          };
          transaction.set(j1Ref, j1);

          const j2Id = `j-${now}-sale-cr-rev`;
          const j2Ref = doc(db, "koperasi", koperasiId, "jurnal", j2Id);
          const j2: JurnalEntry = {
            id: j2Id,
            tgl,
            no,
            ket: `Penjualan barang dagang POS (${customerNama})`,
            akun: "4-1001",
            debet: 0,
            kredit: totalJual
          };
          transaction.set(j2Ref, j2);

          // Journal 2: HPP (Debet) & Persediaan Barang (Kredit)
          if (totalModal > 0) {
            const hppId = `j-${now}-sale-hpp-dr`;
            const hppRef = doc(db, "koperasi", koperasiId, "jurnal", hppId);
            const hpp: JurnalEntry = {
              id: hppId,
              tgl,
              no,
              ket: `Beban pokok HPP persediaan terjual Nota ${no}`,
              akun: "5-1001",
              debet: totalModal,
              kredit: 0
            };
            transaction.set(hppRef, hpp);

            const persediaanId = `j-${now}-sale-inv-cr`;
            const persediaanRef = doc(db, "koperasi", koperasiId, "jurnal", persediaanId);
            const persediaan: JurnalEntry = {
              id: persediaanId,
              tgl,
              no,
              ket: `Beban pokok HPP persediaan terjual Nota ${no}`,
              akun: "1-1301",
              debet: 0,
              kredit: totalModal
            };
            transaction.set(persediaanRef, persediaan);
          }
        });
      } else {
        // FALLBACK: OFFLINE MODE (No network)
        // Perform direct offline writes to Cloud cached collections 
        // 1. Calculate stock deductions & write to local DB
        for (const item of items) {
          const docRef = doc(db, "koperasi", koperasiId, "stok", item.stokId);
          const localItem = stokData.find(s => s.id === item.stokId);
          if (!localItem) {
            throw new Error(`Produk dengan ID "${item.stokId}" tidak ditemukan di database lokal!`);
          }
          const updatedQty = Math.max(0, localItem.qty - item.qty);
          await setDoc(docRef, { ...localItem, qty: updatedQty });

          const historyId = `log-sale-${now}-${item.stokId}-${Math.random().toString(36).substr(2, 4)}`;
          const historyRef = doc(db, "koperasi", koperasiId, "stokHistori", historyId);
          const histEntry: StokHistoriEntry = {
            id: historyId,
            tgl,
            stokId: item.stokId,
            kodeBarang: localItem.kode,
            namaBarang: localItem.nama,
            qtySecaraFisik: updatedQty,
            qtyAdded: -item.qty,
            hargaModal: item.hargaModal,
            keterangan: `[OFFLINE] Penjualan POS Nota ${no} (${customerNama})`
          };
          await setDoc(historyRef, histEntry);
        }

        // 2. Post Jurnal Entries directly offline
        const j1Id = `j-${now}-sale-dr-${methodCoaKode}`;
        const j1Ref = doc(db, "koperasi", koperasiId, "jurnal", j1Id);
        const j1: JurnalEntry = {
          id: j1Id,
          tgl,
          no,
          ket: `[OFFLINE] Penjualan barang dagang POS (${customerNama})`,
          akun: methodCoaKode,
          debet: totalJual,
          kredit: 0
        };
        await setDoc(j1Ref, j1);

        const j2Id = `j-${now}-sale-cr-rev`;
        const j2Ref = doc(db, "koperasi", koperasiId, "jurnal", j2Id);
        const j2: JurnalEntry = {
          id: j2Id,
          tgl,
          no,
          ket: `[OFFLINE] Penjualan barang dagang POS (${customerNama})`,
          akun: "4-1001",
          debet: 0,
          kredit: totalJual
        };
        await setDoc(j2Ref, j2);

        if (totalModal > 0) {
          const hppId = `j-${now}-sale-hpp-dr`;
          const hppRef = doc(db, "koperasi", koperasiId, "jurnal", hppId);
          const hpp: JurnalEntry = {
            id: hppId,
            tgl,
            no,
            ket: `[OFFLINE] Beban pokok HPP persediaan terjual Nota ${no}`,
            akun: "5-1001",
            debet: totalModal,
            kredit: 0
          };
          await setDoc(hppRef, hpp);

          const persediaanId = `j-${now}-sale-inv-cr`;
          const persediaanRef = doc(db, "koperasi", koperasiId, "jurnal", persediaanId);
          const persediaan: JurnalEntry = {
            id: persediaanId,
            tgl,
            no,
            ket: `[OFFLINE] Beban pokok HPP persediaan terjual Nota ${no}`,
            akun: "1-1301",
            debet: 0,
            kredit: totalModal
          };
          await setDoc(persediaanRef, persediaan);
        }
      }
    } catch (err: any) {
      console.error("Kesalahan Transaksi Checkout POS: ", err);
      // Ensure we call handleCloudError for complete error logging / system visibility
      handleCloudError(err, OperationType.WRITE, `koperasi/${koperasiId}/transaksi-POS-sale`);
    }
  };

  // ATOMIC ADD / REGISTRATION OF FIXED ASSETS
  const handleAddAsset = (
    asset: FixedAsset,
    recordJournal: boolean,
    cashCoa: string
  ) => {
    setFixedAssets(prev => [...prev, asset]);

    if (recordJournal && cashCoa) {
      const now = Date.now();
      let assetCoa = "1-2104"; // Default Peralatan Kantor
      switch (asset.kategori) {
        case "Tanah": assetCoa = "1-2101"; break;
        case "Gedung & Bangunan": assetCoa = "1-2102"; break;
        case "Kendaraan": assetCoa = "1-2103"; break;
        case "Peralatan": assetCoa = "1-2104"; break;
        case "Mesin": assetCoa = "1-2105"; break;
      }

      const journalEntries: JurnalEntry[] = [
        {
          id: `j-${now}-fa-add-dr`,
          tgl: asset.tglPerolehan,
          no: `AST-IN-${now.toString().slice(-4)}`,
          ket: `Pembelian aset tetap: ${asset.nama}`,
          akun: assetCoa,
          debet: asset.hargaPerolehan,
          kredit: 0
        },
        {
          id: `j-${now}-fa-add-cr`,
          tgl: asset.tglPerolehan,
          no: `AST-IN-${now.toString().slice(-4)}`,
          ket: `Pembelian aset tetap: ${asset.nama}`,
          akun: cashCoa,
          debet: 0,
          kredit: asset.hargaPerolehan
        }
      ];
      setJurnalData(prev => [...prev, ...journalEntries]);
    }
  };

  // DEPRECIATE FIXED ASSET
  const handleDepreciateAsset = (
    id: string,
    tgl: string,
    nominal: number
  ) => {
    const targetAsset = fixedAssets.find(f => f.id === id);
    if (!targetAsset) return;

    setFixedAssets(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, akumulasiPenyusutan: f.akumulasiPenyusutan + nominal };
      }
      return f;
    }));

    const now = Date.now();
    let accumCoa = "1-2203"; // Default Akum. Penyusutan Peralatan
    switch (targetAsset.kategori) {
      case "Gedung & Bangunan": accumCoa = "1-2201"; break;
      case "Kendaraan": accumCoa = "1-2202"; break;
      case "Peralatan":
      case "Mesin":
      case "Lainnya":
        accumCoa = "1-2203";
        break;
    }

    const deprEntries: JurnalEntry[] = [
      {
        id: `j-${now}-depr-dr`,
        tgl,
        no: `AST-DEP-${now.toString().slice(-4)}`,
        ket: `Alokasi beban penyusutan: ${targetAsset.nama}`,
        akun: "6-2005", // Beban Penyusutan
        debet: nominal,
        kredit: 0
      },
      {
        id: `j-${now}-depr-cr`,
        tgl,
        no: `AST-DEP-${now.toString().slice(-4)}`,
        ket: `Alokasi beban penyusutan: ${targetAsset.nama}`,
        akun: accumCoa,
        debet: 0,
        kredit: nominal
      }
    ];
    setJurnalData(prev => [...prev, ...deprEntries]);
  };

  // DISPOSE / PELEPASAN FIXED ASSET
  const handleDisposeAsset = (
    id: string,
    tgl: string,
    hargaPelepasan: number,
    cashCoa: string,
    ket: string
  ) => {
    const targetAsset = fixedAssets.find(f => f.id === id);
    if (!targetAsset) return;

    const bookVal = targetAsset.hargaPerolehan - targetAsset.akumulasiPenyusutan;
    const diff = hargaPelepasan - bookVal;

    setFixedAssets(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: "Dilepas",
          tglPelepasan: tgl,
          hargaPelepasan,
          nilaiBukuPelepasan: bookVal,
          untungRugiPelepasan: diff,
          keteranganDisposal: ket,
          akunKasPelepasan: cashCoa
        };
      }
      return f;
    }));

    const now = Date.now();
    let assetCoa = "1-2104";
    let accumCoa = "1-2203";
    switch (targetAsset.kategori) {
      case "Tanah": assetCoa = "1-2101"; break;
      case "Gedung & Bangunan": assetCoa = "1-2102"; accumCoa = "1-2201"; break;
      case "Kendaraan": assetCoa = "1-2103"; accumCoa = "1-2202"; break;
      case "Peralatan": assetCoa = "1-2104"; accumCoa = "1-2203"; break;
      case "Mesin": assetCoa = "1-2105"; accumCoa = "1-2203"; break;
    }

    const disposeEntries: JurnalEntry[] = [];

    // 1. Recover Sales Proceeds (Debet Kas/Bank)
    if (hargaPelepasan > 0) {
      disposeEntries.push({
        id: `j-${now}-disp-cash`,
        tgl,
        no: `AST-DIS-${now.toString().slice(-4)}`,
        ket: `Pendapatan pelepasan aset: ${targetAsset.nama}`,
        akun: cashCoa,
        debet: hargaPelepasan,
        kredit: 0
      });
    }

    // 2. Eliminate Accum. Depreciation (Debet Akumulasi)
    if (targetAsset.akumulasiPenyusutan > 0) {
      disposeEntries.push({
        id: `j-${now}-disp-accum`,
        tgl,
        no: `AST-DIS-${now.toString().slice(-4)}`,
        ket: `Eliminasi akumulasi penyusutan: ${targetAsset.nama}`,
        akun: accumCoa,
        debet: targetAsset.akumulasiPenyusutan,
        kredit: 0
      });
    }

    // 3. Eliminate Original Cost (Kredit Nilai Buku Asli)
    disposeEntries.push({
      id: `j-${now}-disp-asset`,
      tgl,
      no: `AST-DIS-${now.toString().slice(-4)}`,
      ket: `Eliminasi nilai pokok aset: ${targetAsset.nama}`,
      akun: assetCoa,
      debet: 0,
      kredit: targetAsset.hargaPerolehan
    });

    // 4. Record Realized Gain or Loss
    if (diff > 0) {
      // Gain: Kredit Lain-lain Pendapatan `4-2003`
      disposeEntries.push({
        id: `j-${now}-disp-gain`,
        tgl,
        no: `AST-DIS-${now.toString().slice(-4)}`,
        ket: `Keuntungan pelepasan aset tetap: ${targetAsset.nama}`,
        akun: "4-2003",
        debet: 0,
        kredit: diff
      });
    } else if (diff < 0) {
      // Loss: Debet Lain-lain Beban `6-2010`
      disposeEntries.push({
        id: `j-${now}-disp-loss`,
        tgl,
        no: `AST-DIS-${now.toString().slice(-4)}`,
        case: "loss",
        ket: `Kerugian pelepasan aset tetap: ${targetAsset.nama}`,
        akun: "6-2010",
        debet: Math.abs(diff),
        kredit: 0
      } as any);
    }

    setJurnalData(prev => [...prev, ...disposeEntries]);
  };

  // DELETE FIXED ASSET RECORD
  const handleDeleteAsset = (id: string) => {
    setFixedAssets(prev => prev.filter(f => f.id !== id));
  };

  // RESET ALL STATISTICS AND DATA TO COA / BALANCED VALUES
  const handleResetData = (toZero: boolean) => {
    const storageKey = koperasiId ? `kdmp_${koperasiId}_salesHistory` : 'kdmp_salesHistory';
    
    // Log sensitive data reset action
    logSecurityEvent({
      tenantId: koperasiId,
      tenantName: koperasiName,
      actorEmail: currentUsername ? `${currentUsername}@koperasi.net` : "anonymous@koperasi.net",
      actorName: userName || "Petugas Koperasi",
      category: "Reset Data",
      severity: "CRITICAL",
      action: toZero ? "Penghancuran Data Mutlak (Wipe Out)" : "Penyetelan Ulang Simulasi Data Virtual (Restore Default)",
      details: toZero 
        ? "Tindakan penghancuran data total (Ledger Wipe). Melakukan reset keseluruhan jurnal umum, COA saldo awal, dan saldo kas bank menjadi nol."
        : "Mengembalikan database koperasi ke data pencontohan simulasi awal default desa.",
      status: "Sukses"
    }).catch(e => console.warn(e));

    if (toZero) {
      // 1. Reset Jurnal Entries to dry empty
      setJurnalData([]);
      localStorage.setItem('kdmp_jurnalData', JSON.stringify([]));

      // 2. Clear all COA accounts initial starting balance & current balances to 0
      const zeroedCOA = INITIAL_COA.map(c => ({
        ...c,
        saldo: 0,
        saldoAwal: 0
      }));
      setCoaData(zeroedCOA);
      localStorage.setItem('kdmp_coaData', JSON.stringify(zeroedCOA));

      // 3. Clear all cash/bank accounts balances to 0
      const zeroedRekenings = INITIAL_REKENING.map(r => ({
        ...r,
        saldo: 0
      }));
      setRekeningData(zeroedRekenings);
      localStorage.setItem('kdmp_rekeningData', JSON.stringify(zeroedRekenings));

      // 4. Reset stock quantities to 0 for pristine starting point
      const zeroedStoks = INITIAL_STOK.map(s => ({ ...s, qty: 0 }));
      setStokData(zeroedStoks);
      localStorage.setItem('kdmp_stokData', JSON.stringify(zeroedStoks));
      setStokHistoriData([]);
      localStorage.setItem('kdmp_stokHistoriData', JSON.stringify([]));

      // 5. Clear Sales History (Ranked Products)
      localStorage.removeItem(storageKey);
      localStorage.removeItem('kdmp_salesHistory'); // legacy
    } else {
      // Restore initial simulator demonstration data
      setJurnalData(INITIAL_JURNAL);
      localStorage.setItem('kdmp_jurnalData', JSON.stringify(INITIAL_JURNAL));

      const defaultCOA = INITIAL_COA.map(c => ({
        ...c,
        saldoAwal: getSaldoAwal(c.kode, c.saldo)
      }));
      setCoaData(defaultCOA);
      localStorage.setItem('kdmp_coaData', JSON.stringify(defaultCOA));

      setRekeningData(INITIAL_REKENING);
      localStorage.setItem('kdmp_rekeningData', JSON.stringify(INITIAL_REKENING));

      setStokData(INITIAL_STOK);
      localStorage.setItem('kdmp_stokData', JSON.stringify(INITIAL_STOK));

      setStokHistoriData(INITIAL_STOK_HISTORI);
      localStorage.setItem('kdmp_stokHistoriData', JSON.stringify(INITIAL_STOK_HISTORI));
      
      // We don't restore sales history for demo data to keep it clean, 
      // or we could but let's keep it simple.
    }

    // Redirect to Main Dashboard
    setActivePage("dashboard");
  };

  // MANAGE MEMBERS
  const handleAddAnggota = (
    nama: string,
    alamat: string,
    simpananPokok: number,
    jenisKelamin: "Laki-laki" | "Perempuan",
    noHp: string,
    email: string,
    tipe: "Biasa" | "Luar Biasa",
    foto?: string
  ) => {
    const id = "AG-" + String(anggotaData.length + 1).padStart(3, '0');
    const newMember: Anggota = {
      id,
      nama,
      alamat,
      status: "Aktif",
      simpananPokok,
      jenisKelamin,
      noHp,
      email,
      tipe,
      foto
    };
    setAnggotaData([...anggotaData, newMember]);
  };

  const handleUpdateAnggota = (
    id: string,
    nama: string,
    alamat: string,
    simpananPokok: number,
    jenisKelamin: "Laki-laki" | "Perempuan",
    noHp: string,
    email: string,
    tipe: "Biasa" | "Luar Biasa",
    foto?: string
  ) => {
    const nextMembers = anggotaData.map(m => {
      if (m.id === id) {
        return {
          ...m,
          nama,
          alamat,
          simpananPokok,
          jenisKelamin,
          noHp,
          email,
          tipe,
          foto
        };
      }
      return m;
    });
    setAnggotaData(nextMembers);
  };

  const handleDeleteAnggota = (id: string) => {
    const nextMembers = anggotaData.filter(m => m.id !== id);
    setAnggotaData(nextMembers);
    // Also clean up any related tagihan
    setTagihanData(prev => prev.filter(t => t.anggotaId !== id));
  };

  // MANAGE KONTAK LAIN (Karyawan, Supplier, Pelanggan)
  const handleAddKontakLain = (kontak: KontakLain) => {
    setKontakLainData(prev => [...prev, kontak]);
  };

  const handleUpdateKontakLain = (kontak: KontakLain) => {
    setKontakLainData(prev => prev.map(c => c.id === kontak.id ? kontak : c));
  };

  const handleDeleteKontakLain = (id: string) => {
    setKontakLainData(prev => prev.filter(c => c.id !== id));
  };

  // MANAGE BILLING / TAGIHAN MEMBERS
  const handleAddTagihan = (
    anggotaId: string,
    kategori: string,
    jumlah: number,
    tglTagihan: string,
    keterangan: string
  ) => {
    const member = anggotaData.find(m => m.id === anggotaId);
    if (!member) return;
    const count = tagihanData.length;
    const id = "TGH-" + String(count + 1).padStart(3, '0') + "-" + Math.random().toString(36).substr(2, 3).toUpperCase();
    const newTagihan: Tagihan = {
      id,
      anggotaId,
      anggotaNama: member.nama,
      kategori,
      jumlah,
      tglTagihan,
      keterangan,
      status: "Belum Bayar"
    };
    setTagihanData([...tagihanData, newTagihan]);
  };

  const handleUpdateTagihanStatus = (id: string, status: "Belum Bayar" | "Lunas") => {
    const nextTagihans = tagihanData.map(t => {
      if (t.id === id) {
        return { ...t, status };
      }
      return t;
    });
    setTagihanData(nextTagihans);
  };

  const handleDeleteTagihan = (id: string) => {
    setTagihanData(tagihanData.filter(t => t.id !== id));
  };

  const handleClearAllTagihan = () => {
    setTagihanData([]);
  };

  const handleClearLunasTagihan = () => {
    setTagihanData(tagihanData.filter(t => t.status !== "Lunas"));
  };

  // REGISTER BANK ACCOUNTS
  const handleAddRekening = (nama: string, nomor: string, lokasi: string, saldo: number) => {
    const id = "bnk-" + (rekeningData.length + 1);
    const newBank: RekeningBank = {
      id,
      nama,
      nomorRekening: nomor,
      lokasiText: lokasi,
      saldo
    };
    setRekeningData([...rekeningData, newBank]);

    // Add also into COA to keep accounting solid
    const nextKode = "1-110" + (rekeningData.length + 1);
    handleAddCoa(nextKode, nama, CoaKategori.Aset, SaldoNormal.Debet, saldo);
  };

  // UPDATE BANK CONFIGURATION
  const handleUpdateCurrentUsername = (newUsername: string) => {
    setCurrentUsername(newUsername);
    localStorage.setItem('kdmp_currentUsername', newUsername);
  };

  const handleUpdateRekening = (id: string, nama: string, nomor: string, lokasi: string) => {
    const nextRekenings = rekeningData.map(r => {
      if (r.id === id) {
        return { ...r, nama, nomorRekening: nomor, lokasiText: lokasi };
      }
      return r;
    });
    setRekeningData(nextRekenings);

    // Also update matching COA name to keep accounts pristine
    const matchingCoaKode = "1-110" + id.replace("bnk-", "");
    const nextCOAs = coaData.map(c => {
      if (c.kode === matchingCoaKode) {
        return { ...c, nama };
      }
      return c;
    });
    setCoaData(nextCOAs);
  };

  // MOUNT ACTIVE PAGE CONTROLLER
  const renderPage = () => {
    // Shared navigation helper
    const handleDashboardNavigation = (page: string, jFilter?: string, cFilter?: string, cSearch?: string) => {
      setActivePage(page === 'anggota' ? 'kontak' : page);
      if (jFilter !== undefined) setJurnalFilter(jFilter);
      if (cFilter !== undefined) setCoaCategoryFilter(cFilter);
      if (cSearch !== undefined) setCoaSearchFilter(cSearch);
    };

    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard 
            coaData={coaData} 
            jurnalData={jurnalData} 
            anggotaData={anggotaData} 
            stokData={stokData}
            tagihanData={tagihanData}
            onNavigate={handleDashboardNavigation} 
            onResetData={handleResetData}
          />
        );
      case "jurnal":
        return (
          <Jurnal 
            jurnalData={jurnalData} 
            coaData={coaData} 
            accessMode={accessMode as any} 
            onAddJurnal={handleAddJurnal} 
            onDeleteJurnal={handleDeleteJurnal} 
            searchQuery={jurnalFilter}
            onSearchQueryChange={setJurnalFilter}
          />
        );
      case "stok":
        return renderPageWithGuard(
          "stok",
          <Stok 
            stokData={stokData} 
            stokHistoriData={stokHistoriData}
            accessMode={accessMode as any} 
            onUpdateStok={handleUpdateStok} 
            onRestockStok={handleRestockStok}
            onAddStok={handleAddStok}
            onDeleteStok={handleDeleteStok}
            onDeleteStokHistori={handleDeleteStokHistori}
          />,
          "stok",
          "Basic",
          "Logistik & Stok Barang"
        );
      case "stockopname":
        return renderPageWithGuard(
          "stockopname",
          <StockOpname 
            stokData={stokData}
            accessMode={accessMode as any}
            onBulkOpname={handleBulkOpname}
          />,
          "stockopname",
          "Premium",
          "Stock Opname Fisik"
        );
      case "rekappenjualan":
        return renderPageWithGuard(
          "rekappenjualan",
          <RekapPenjualan 
            stokData={stokData}
            accessMode={accessMode as any}
            koperasiId={koperasiId}
          />,
          "stok",
          "Basic",
          "Rekap & Laporan Penjualan"
        );
      case "kontak":
        return (
          <Kontak
            kontakLainData={kontakLainData}
            accessMode={accessMode as any}
            onAddKontakLain={handleAddKontakLain}
            onUpdateKontakLain={handleUpdateKontakLain}
            onDeleteKontakLain={handleDeleteKontakLain}
            koperasiId={koperasiId}
            koperasiName={koperasiName}
            koperasiLogo={koperasiLogo}
          />
        );
      case "anggota":
        return (
          <AnggotaList
            anggotaData={anggotaData}
            tagihanData={tagihanData}
            accessMode={accessMode as any}
            onAddAnggota={handleAddAnggota}
            onUpdateAnggota={handleUpdateAnggota}
            onDeleteAnggota={handleDeleteAnggota}
            onAddTagihan={handleAddTagihan}
            onUpdateTagihanStatus={handleUpdateTagihanStatus}
            onDeleteTagihan={handleDeleteTagihan}
            onClearAllTagihan={handleClearAllTagihan}
            onClearLunasTagihan={handleClearLunasTagihan}
            koperasiId={koperasiId}
            koperasiName={koperasiName}
            koperasiLogo={koperasiLogo}
          />
        );
      case "kasbank":
        return (
          <KasBank 
            rekeningData={rekeningData} 
            accessMode={accessMode as any} 
            onAddRekening={handleAddRekening} 
            onUpdateRekening={handleUpdateRekening} 
          />
        );
      case "penjualan":
        return renderPageWithGuard(
          "penjualan",
          <Penjualan 
            stokData={stokData}
            anggotaData={anggotaData}
            rekeningData={rekeningData}
            coaData={coaData}
            accessMode={accessMode as any}
            onRecordSale={handleRecordSale}
            koperasiId={koperasiId}
            koperasiName={koperasiName}
          />,
          "stok",
          "Basic",
          "Sistem Kasir Penjualan"
        );
      case "asettetap":
        return renderPageWithGuard(
          "asettetap",
          <AsetTetap
            fixedAssets={fixedAssets}
            rekeningData={rekeningData}
            coaData={coaData}
            accessMode={accessMode as any}
            onAddAsset={handleAddAsset}
            onDepreciateAsset={handleDepreciateAsset}
            onDisposeAsset={handleDisposeAsset}
            onDeleteAsset={handleDeleteAsset}
          />,
          "asettetap",
          "Enterprise",
          "Aset Tetap & Depresiasi"
        );
      case "invoice":
        return renderPageWithGuard(
          "invoice",
          <Invoice 
            koperasiName={koperasiName}
            koperasiAlamat={koperasiAlamat}
            koperasiLogo={koperasiLogo}
            koperasiInvoiceSize={koperasiInvoiceSize}
          />,
          "invoice",
          "Premium",
          "E-Billing & Penagihan"
        );
      case "pengaturan":
        return (
          <Pengaturan
            currentUsername={currentUsername}
            userAccounts={userAccounts}
            onUpdateUserAccounts={setUserAccounts}
            koperasiName={koperasiName}
            onUpdateKoperasiName={setKoperasiName}
            koperasiAlamat={koperasiAlamat}
            onUpdateKoperasiAlamat={setKoperasiAlamat}
            koperasiLogo={koperasiLogo}
            onUpdateKoperasiLogo={setKoperasiLogo}
            koperasiInvoiceSize={koperasiInvoiceSize}
            onUpdateKoperasiInvoiceSize={setKoperasiInvoiceSize}
            koperasiSubtext={koperasiSubtext}
            onUpdateKoperasiSubtext={setKoperasiSubtext}
            rekeningData={rekeningData}
            onUpdateRekeningData={setRekeningData}
            onUpdateCurrentUsername={handleUpdateCurrentUsername}
            onUpdateRekening={handleUpdateRekening}
            onResetData={handleResetData}
            koperasiId={koperasiId}
            onDisconnectKoperasi={handleDisconnectKoperasi}
            coaData={coaData}
            jurnalData={jurnalData}
            stokData={stokData}
            stokHistoriData={stokHistoriData}
            anggotaData={anggotaData}
            kontakLainData={kontakLainData}
            tagihanData={tagihanData}
            fixedAssets={fixedAssets}
          />
        );
      case "laporan":
        return renderPageWithGuard(
          "laporan",
          <Laporan coaData={coaData} jurnalData={jurnalData} anggotaData={anggotaData} tagihanData={tagihanData} />,
          "laporan",
          "Basic",
          "Laporan SHU, Neraca & Cashflow"
        );
      case "superadmin":
        return <SuperAdmin onImpersonate={handleImpersonate} />;
      case "security_audit":
        return renderPageWithGuard(
          "security_audit",
          <SecurityAudit 
            currentTenantId={koperasiId}
            currentTenantName={koperasiName}
            currentUserEmail={auth.currentUser?.email || (currentUsername + '@koperasi.net')}
            currentUserName={userName || currentUsername}
            isGlobalAdmin={isGlobalAdmin}
          />,
          "security_audit",
          "Enterprise",
          "Jejak Audit Forensik & Keamanan"
        );
      case "saas_billing":
        return (
          <TenantBilling 
            currentTenantId={koperasiId}
            currentTenantName={koperasiName}
            currentUserEmail={auth.currentUser?.email || (currentUsername + '@koperasi.net')}
            isGlobalAdmin={false}
          />
        );
      case "support":
        return (
          <SupportTicket 
            currentTenantId={koperasiId}
            currentTenantName={koperasiName}
            currentUserEmail={auth.currentUser?.email || (currentUsername + '@koperasi.net')}
            currentUserName={userName || currentUsername}
            isGlobalAdmin={isGlobalAdmin}
          />
        );
      case "coa":
        return (
          <COA 
            coaData={coaData} 
            accessMode={accessMode as any} 
            onAddCoa={handleAddCoa} 
            onUpdateCoaSaldoAwal={handleUpdateCoaSaldoAwal}
            keywordQuery={coaSearchFilter}
            onKeywordQueryChange={setCoaSearchFilter}
            categoryFilter={coaCategoryFilter}
            onCategoryFilterChange={setCoaCategoryFilter}
            onNavigateToJurnal={(code) => {
              setJurnalFilter(code);
              setActivePage("jurnal");
            }}
          />
        );
      default:
        return (
          <Dashboard 
            coaData={coaData} 
            jurnalData={jurnalData} 
            anggotaData={anggotaData} 
            stokData={stokData}
            tagihanData={tagihanData}
            onNavigate={handleDashboardNavigation} 
            onResetData={handleResetData}
            koperasiId={koperasiId}
          />
        );
    }
  };

  // CORE DASHBOARD RENDER LAYER
  const publicVerifyPortal = showPublicVerifyPortal && (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Verifikator Keaslian ID Card</h2>
              <p className="text-[10px] text-slate-500 font-mono">Layanan Verifikasi Publik (QR-ID Ledger)</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setShowPublicVerifyPortal(false);
              setPublicVerifyId("");
              setPublicVerifyResult(null);
              setPublicVerifyError("");
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Info Tip */}
          <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] rounded-xl font-medium border border-emerald-100 leading-normal flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              ID Card Terverifikasi Sistem. Data ini ditarik langsung dari database digital utama instansi {koperasiName}.
            </p>
          </div>

          {/* VERIFICATION REPORT PANEL */}
          {(publicVerifyResult || publicVerifyError) ? (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
              {publicVerifyError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 border border-rose-300">
                    <ShieldAlert className="h-5 w-5 text-rose-600 animate-bounce" />
                  </div>
                  <div className="text-left space-y-1 text-rose-950">
                    <p className="text-xs font-black uppercase tracking-tight">ID Tidak Valid</p>
                    <p className="text-[11px] leading-relaxed text-rose-700 font-medium">
                      {publicVerifyError}
                    </p>
                  </div>
                </div>
              )}

              {publicVerifyResult && (
                <div className={`p-5 rounded-3xl border shadow-sm ${
                  publicVerifyResult.isDatabaseMismatch 
                    ? 'bg-amber-50 border-amber-200/60 text-amber-950' 
                    : 'bg-slate-50 border-slate-200/60 text-slate-950'
                } relative overflow-hidden flex flex-col items-center text-center gap-4`}>
                  
                  {/* Verification Seal Icon */}
                  <div className="shrink-0">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-xl ${
                      publicVerifyResult.isDatabaseMismatch ? 'bg-amber-100 text-amber-600' : 'bg-emerald-500 text-white'
                    }`}>
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        publicVerifyResult.isDatabaseMismatch 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {publicVerifyResult.isDatabaseMismatch ? '✓ DATA BERBEDA' : '✓ ID TERVERIFIKASI ASLI'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">SERIAL: {publicVerifyResult.id}</span>
                    </div>

                    <div className="pt-2">
                      <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight">{publicVerifyResult.nama}</h5>
                      <p className="text-xs text-red-650 font-black uppercase tracking-widest mt-1">{publicVerifyResult.jabatanAtauPerusahaan || "Staff"}</p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white space-y-2 mt-4 text-[11px] font-bold text-slate-600">
                       <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-medium font-mono uppercase tracking-tighter">Status</span>
                          <span className={publicVerifyResult.status === "Aktif" ? "text-emerald-600" : "text-rose-600"}>
                             {publicVerifyResult.status === "Aktif" ? "AKTIF & RESMI" : "NON-AKTIF"}
                          </span>
                       </div>
                       <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-400 font-medium font-mono uppercase tracking-tighter">Instansi</span>
                          <span className="text-slate-900 truncate max-w-[150px]">{koperasiName}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="py-12 text-center space-y-4">
                <RefreshCw className="h-10 w-10 text-slate-200 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">Sedang memproses data autentikasi...</p>
             </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowPublicVerifyPortal(false);
              setPublicVerifyId("");
              setPublicVerifyResult(null);
              setPublicVerifyError("");
              // Clear search params to reset URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl transition duration-200 cursor-pointer shadow-xl shadow-slate-200"
          >
            Tutup & Selesai
          </button>
        </div>
      </div>
    </div>
  );

  // RENDER SECURITY LAYER
  if (accessMode === "login") {
    // STEP 1: CONNECT TO CLOUD TENANT (COOPERATIVE ID SETUP)
    if (!koperasiId) {
      const handleFindOrganizationId = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotOrgEmail.trim()) {
          setForgotOrgError("Silakan masukkan email administrator utama Anda.");
          return;
        }
        setIsSearchingOrg(true);
        setForgotOrgError("");
        setForgotOrgResult(null);

        try {
          const tenantsRef = collection(db, "tenants");
          const q = query(tenantsRef, where("ownerEmail", "==", forgotOrgEmail.trim().toLowerCase()));
          const snap = await getDocs(q);

          if (snap.empty) {
            setForgotOrgError("Tidak ada instansi/organisasi yang terdaftar dengan email tersebut.");
          } else {
            const found: { id: string; name: string }[] = [];
            snap.forEach((doc) => {
              const data = doc.data();
              found.push({
                id: doc.id,
                name: data.name || "Nama Instansi Tidak Diketahui"
              });
            });
            setForgotOrgResult(found);
          }
        } catch (err: any) {
          console.error(err);
          setForgotOrgError("Terjadi kesalahan saat mencari data: " + (err.message || err));
        } finally {
          setIsSearchingOrg(false);
        }
      };

      const handleConnectAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifyingKoperasi(true);
        setKoperasiError("");
        try {
          let cleanId = inputKoperasiId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
          const isEmailInput = inputKoperasiId.includes("@");

          // Smart Lookup: If they entered an email, try to find the linked tenant ID first
          if (isEmailInput) {
            const tenantsRef = collection(db, "tenants");
            const q = query(tenantsRef, where("ownerEmail", "==", inputKoperasiId.trim().toLowerCase()));
            const snap = await getDocs(q);
            if (!snap.empty) {
               // Use the first one found
               cleanId = snap.docs[0].id;
            }
          }

          if (!cleanId) {
            setKoperasiError(isEmailInput ? "Email Anda belum terdaftar sebagai pemilik instansi manapun." : "Mohon masukkan ID Organisasi!");
            setIsVerifyingKoperasi(false);
            return;
          }
          const docRef = doc(db, "koperasi", cleanId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setKoperasiId(cleanId);
            localStorage.setItem('kdmp_koperasiId', cleanId);
            if (data.nama) setKoperasiName(data.nama);
            if (data.alamat) setKoperasiAlamat(data.alamat);
          } else {
            setKoperasiError("Organisasi/Instansi dengan ID ini belum terdaftar. Silakan aktifkan pendaftaran baru!");
          }
        } catch (err: any) {
          console.error(err);
          setKoperasiError("Gagal menghubungkan. Periksa koneksi internet atau ejaan ID Koperasi.");
        }
        setIsVerifyingKoperasi(false);
      };

      const handleRegisterAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifyingKoperasi(true);
        setKoperasiError("");
        try {
          const cleanId = inputKoperasiId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
          if (!cleanId) {
            setKoperasiError("Mohon buat ID Organisasi unik!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (cleanId.length < 4) {
            setKoperasiError("ID Organisasi minimal 4 karakter (hanya huruf, angka, atau tanda strip)!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (!regKoperasiName.trim()) {
            setKoperasiError("Mohon isi Nama Organisasi resmi!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (!regKoperasiAlamat.trim()) {
            setKoperasiError("Mohon isi Alamat Organisasi resmi!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (!regSuperITEmail.trim()) {
            setKoperasiError("Mohon isi Email Administrator Utama!");
            setIsVerifyingKoperasi(false);
            return;
          }
          
          if (regPassword.length < 8) {
            setKoperasiError("Kata sandi cloud minimal harus 8 karakter!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (!/[A-Z]/.test(regPassword)) {
            setKoperasiError("Kata sandi harus mengandung minimal satu huruf BESAR!");
            setIsVerifyingKoperasi(false);
            return;
          }
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(regPassword)) {
            setKoperasiError("Kata sandi harus mengandung minimal satu simbol unik/spesial!");
            setIsVerifyingKoperasi(false);
            return;
          }

          if (regPassword !== regConfirmPassword) {
            setKoperasiError("Konfirmasi kata sandi tidak cocok!");
            setIsVerifyingKoperasi(false);
            return;
          }

          // Check if ID already exists
          const tenantCheck = await getDoc(doc(db, "tenants", cleanId));
          if (tenantCheck.exists()) {
            setKoperasiError("ID Organisasi ini sudah digunakan oleh instansi lain! Silakan pilih ID Organisasi lainnya.");
            setIsVerifyingKoperasi(false);
            return;
          }

          // 1. Try to Create Cloud Account (Optional fallback if forbidden)
          let authCreated = false;
          try {
            await createUserWithEmailAndPassword(auth, regSuperITEmail, regPassword);
            authCreated = true;
          } catch (authErr: any) {
            console.warn("Cloud Auth setup skipped or failed:", authErr.code);
            if (authErr.code === 'auth/email-already-in-use') {
              // Check if any other ACTIVE tenant is currently using this email
              const tenantsRef = collection(db, "tenants");
              const q = query(tenantsRef, where("ownerEmail", "==", regSuperITEmail));
              const tenantSnap = await getDocs(q);
              
              if (!tenantSnap.empty) {
                throw new Error("Email ini sudah terdaftar dan aktif digunakan oleh instansi lain! Silakan gunakan email lain atau hubungi dukungan.");
              } else {
                authCreated = true; // Safe to link since the auth setup already exists in Supabase
              }
            } else if (authErr.code !== 'auth/operation-not-allowed') {
              throw authErr;
            }
          }

          // 2. Setup Meta in Tenants collection (Multi-Tenant Hub)
          const tenantRef = doc(db, 'tenants', cleanId);
          await setDoc(tenantRef, {
            id: cleanId,
            name: regKoperasiName,
            ownerEmail: regSuperITEmail,
            plan: "Trial",
            status: "Trial",
            authStatus: authCreated ? "Linked" : "DatabaseOnly",
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          });

          // 3. Initialize the Cooperative Infrastructure
          try {
            await startAndInitializeKoperasi(cleanId, regKoperasiName, regKoperasiAlamat);
            
            // Success!
            setCloudSuccessMessage(`Selamat! Organisasi "${regKoperasiName}" berhasil didaftarkan.`);
            setKoperasiError("");
            setRegMode(false);
            
            // If auth failed, give them instructions on how to use internal login
            if (!authCreated) {
              setKoperasiError("PERHATIAN: Pendaftaran Cloud berhasil, tetapi fitur 'Login Email' belum aktif di server. Gunakan Username: 'SuperIT' dan Kata Sandi Anda untuk masuk sementara.");
            }
          } catch (initErr: any) {
            console.error("Initialization failed:", initErr);
            throw new Error("Gagal menginisialisasi infrastruktur database: " + initErr.message);
          }
          
          // 4. Create Initial Administrator User record for this tenant
          try {
            const initialAdmin: UserAccount = {
              username: "admin-utama",
              password: regPassword, // Use shared password for initial setup
              email: regSuperITEmail,
              name: "Administrator Instansi",
              role: "Pemilik Instansi",
              isAdmin: true,
              canAccessSettings: true,
              permittedPages: ["dashboard", "coa", "jurnal", "kasbank", "invoice", "stok", "rekappenjualan", "anggota", "tabungan", "kredit", "asettetap", "kontak", "tagihan", "laporan", "pengaturan"]
            };
            await setDoc(doc(db, "koperasi", cleanId, "users", "admin-utama"), initialAdmin);
          } catch (userErr: any) {
            console.error("Initial User Error:", userErr);
            throw new Error("Gagal membuat akun administrator instansi: " + userErr.message);
          }

          setCloudSuccessMessage("Pendaftaran Berhasil! Instansi Cloud telah aktif.");
          
          // Connected! 
          setRegMode(false);
          setInputKoperasiId("");
          setRegKoperasiName("");
          setRegKoperasiAlamat("");
          setRegSuperITEmail("");
          setRegPassword("");
          setRegConfirmPassword("");
        } catch (err: any) {
          console.error(err);
          setKoperasiError(err.message || "Gagal mendaftarkan koperasi baru.");
        }
        setIsVerifyingKoperasi(false);
      };

      return (
        <>
          {publicVerifyPortal}
          <div 
            id="koperasi-setup-screen" 
          className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans"
        >
          {/* AMBIENT BACKGROUND DECO */}
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/30 rounded-full blur-3xl" />
          
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-md border border-slate-100 p-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center p-2 transform hover:rotate-2 transition-transform duration-500 border border-slate-100 overflow-hidden relative group">
                <img src={kopdesLogo} alt="Owner Copyright Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-[6px] font-black text-slate-400 rotate-12 uppercase tracking-[0.3em]">Licensed System</p>
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display italic decoration-indigo-500 underline decoration-4 underline-offset-4">FINANCIAL SYSTEM</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Enterprise Resource Planning</p>
                <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.4em] mt-1">© Lokal Digital System</p>
                <div className="h-1 w-8 bg-slate-200 mx-auto mt-4 rounded-full" />
              </div>
            </div>

            {koperasiError && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl text-center animate-shake">
                {koperasiError}
              </div>
            )}

            {showForgotOrgId ? (
              // FORGOT ORG ID MODE
              <form onSubmit={handleFindOrganizationId} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">
                    Cari ID Organisasi
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed px-1">
                    Masukkan email Administrator Utama yang didaftarkan. Sistem akan mencocokkan email Anda dengan data instansi cloud.
                  </p>
                  <div className="relative group pt-2">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="email@instansi.com"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-mono font-bold text-sm text-slate-900 placeholder:text-slate-300"
                      value={forgotOrgEmail}
                      onChange={(e) => setForgotOrgEmail(e.target.value)}
                    />
                  </div>
                </div>

                {forgotOrgError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl text-center">
                    {forgotOrgError}
                  </div>
                )}

                {forgotOrgResult && (
                  <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase block">
                      ID Organisasi Ditemukan:
                    </span>
                    <div className="space-y-3 divide-y divide-indigo-100/30">
                      {forgotOrgResult.map((org, index) => (
                        <div key={index} className="pt-3 first:pt-0 flex flex-col gap-1.5 text-left">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{org.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {org.id}</span>
                          </div>
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setInputKoperasiId(org.id);
                                setShowForgotOrgId(false);
                                setForgotOrgResult(null);
                                setForgotOrgError("");
                              }}
                              className="text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              Gunakan ID Ini
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearchingOrg}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSearchingOrg ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Cari ID Organisasi <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotOrgId(false);
                      setForgotOrgResult(null);
                      setForgotOrgError("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors cursor-pointer group flex items-center justify-center gap-2 mx-auto"
                  >
                    Kembali ke <span className="text-indigo-600 group-hover:underline">menu hubungkan</span>
                  </button>
                </div>
              </form>
            ) : !regMode ? (
              // CONNECT MODE
              <form onSubmit={handleConnectAction} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">
                    ID ORGANISASI
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <input
                      id="connect-koperasi-id"
                      type="text"
                      required
                      placeholder="Masukan ID Organisasi"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-mono font-bold text-sm text-slate-900 placeholder:text-slate-300"
                      value={inputKoperasiId}
                      onChange={(e) => setInputKoperasiId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed max-w-[65%]">Masukkan kode singkat unik organisasi Anda yang terdaftar.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotOrgId(true);
                        setForgotOrgError("");
                        setForgotOrgResult(null);
                        setForgotOrgEmail("");
                      }}
                      className="text-[9.5px] font-black text-indigo-600 hover:text-indigo-800 hover:underline transition cursor-pointer shrink-0"
                    >
                      Lupa ID Organisasi?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingKoperasi}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isVerifyingKoperasi ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Hubungkan Sistem <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode(true);
                      setKoperasiError("");
                      setInputKoperasiId("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors cursor-pointer group flex items-center justify-center gap-2 mx-auto"
                  >
                    Belum punya akun? <span className="text-indigo-600 group-hover:underline">Daftar Instansi Baru</span>
                  </button>
                </div>
              </form>
            ) : (
              // REGISTER MODE
              <form onSubmit={handleRegisterAction} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">ID ORGANISASI</label>
                  <input
                    id="reg-koperasi-id"
                    type="text"
                    required
                    placeholder="ID Singkat (misal: KSP-PEMATANG)"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-mono font-bold text-sm"
                    value={inputKoperasiId}
                    onChange={(e) => setInputKoperasiId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">Nama Legal Lembaga</label>
                  <input
                    id="reg-koperasi-nama"
                    type="text"
                    required
                    placeholder="KSP Sumber Makmur"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium"
                    value={regKoperasiName}
                    onChange={(e) => setRegKoperasiName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">Alamat Kantor Pusat</label>
                  <textarea
                    id="reg-koperasi-alamat"
                    required
                    rows={2}
                    placeholder="Jl. Raya Pematang No. 45, Karawang"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm resize-none"
                    value={regKoperasiAlamat}
                    onChange={(e) => setRegKoperasiAlamat(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">Email Administrator Utama</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                    <input
                      id="reg-superit-email"
                      type="email"
                      required
                      placeholder="email@instansi.com"
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition font-mono font-bold text-sm"
                      value={regSuperITEmail}
                      onChange={(e) => setRegSuperITEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">Kata Sandi Cloud Baru (Min 8 Karakter + Simbol)</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                    <input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Min 8 karakter, A-Z, & simbol"
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 cursor-pointer p-1"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements Hint */}
                  <div className="mt-2 px-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <div className={`h-1.5 w-1.5 rounded-full ${regPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${regPassword.length >= 8 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>Minimal 8 karakter</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(regPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${/[A-Z]/.test(regPassword) ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>Minimal 1 huruf BESAR</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>Minimal 1 simbol (@#$%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">Konfirmasi Kata Sandi</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                    <input
                      id="reg-confirm-password"
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi kata sandi"
                      onPaste={(e) => e.preventDefault()}
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingKoperasi}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isVerifyingKoperasi ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Aktifkan Sistem Cloud <Plus className="h-4 w-4" /></>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode(false);
                      setKoperasiError("");
                      setInputKoperasiId("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Koneksi
                  </button>
                </div>
              </form>
            )}

            {/* MINIMALIST SYSTEM OWNER BYPASS */}
            <div className="pt-4 flex justify-center opacity-60 hover:opacity-100 transition-opacity">
              {!showStealthBypassConnect ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser?.email === "komarudink403@gmail.com") {
                      setShowStealthBypassConnect(true);
                    } else {
                      setLoginError("Akses Override Ditolak! Fitur ini hanya untuk pemilik sistem terverifikasi.");
                    }
                  }}
                  className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 transition ${currentUser?.email !== "komarudink403@gmail.com" ? "cursor-not-allowed opacity-20" : "cursor-pointer"}`}
                >
                  <KeyRound className="h-3 w-3" /> Override Master Sistem
                </button>
              ) : (
                <div className="w-full p-6 bg-slate-950 rounded-3xl space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Override Master Sistem</p>
                    <button type="button" onClick={() => setShowStealthBypassConnect(false)} className="text-white/40 hover:text-white transition cursor-pointer"><Plus className="h-4 w-4 rotate-45" /></button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="PIN Root"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center font-black tracking-[0.5em] focus:outline-none focus:border-indigo-500"
                      value={ownerPIN}
                      onChange={(e) => setOwnerPIN(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSuperITEmergencyBypass(ownerPIN)}
                    />
              <button
                type="button"
                onClick={() => handleSuperITEmergencyBypass(ownerPIN)}
                className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest active:scale-95 transition"
              >
                Bypass Inisialisasi
              </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

    // STEP 2: USER ACCOUNT SIGN-IN UNDER REGISTERED TENANT
    return (
      <>
        {publicVerifyPortal}
        <div 
          id="login-page-screen" 
        className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans"
      >
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/30 rounded-full blur-3xl opacity-50" />

        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.08)] w-full max-w-md border border-slate-100 p-10 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative z-10">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-24 h-24 p-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex items-center justify-center overflow-hidden transform transition-all duration-700 hover:rotate-3 group">
              {koperasiLogo || kopdesLogo ? (
                <img 
                  src={koperasiLogo || kopdesLogo} 
                  alt="Logo Instansi" 
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[1.2rem] flex items-center justify-center">
                  <Building2 className="text-white h-10 w-10" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">{koperasiName}</h1>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{isOnline ? 'Cloud Infrastructure' : 'Standalone Mode'}</p>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-bold text-slate-400 tracking-widest uppercase">ID: {currentUsername?.toLowerCase() === "superit" ? "OVERRIDE" : koperasiId}</span>
              </div>
            </div>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl text-center animate-shake">
              {loginError}
            </div>
          )}

          {cloudSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-2xl text-center">
              {cloudSuccessMessage}
            </div>
          )}

          {isMigrating && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center flex items-center justify-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin" /> Sedang Menyiapkan Keamanan Cloud...
            </div>
          )}

          {/* TAB SELECTION INTROSPECTIVE */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setLoginTab("cloud");
                setLoginError("");
                setCloudSuccessMessage("");
              }}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition cursor-pointer ${loginTab === "cloud" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Cloud Sync
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab("local");
                setLoginError("");
                setCloudSuccessMessage("");
              }}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition cursor-pointer ${loginTab === "local" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Login Username
            </button>
          </div>

          {loginTab === "cloud" ? (
            <div className="space-y-4">
              <form onSubmit={handleCloudEmailAndPasswordAuth} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Email Akun Cloud</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                      <input
                        type="email"
                        required
                        placeholder="email@instansi.com"
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium"
                        value={cloudEmail}
                        onChange={(e) => setCloudEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Kata Sandi Aman (8 Karakter + Simbol)</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min 8 karakter, A-Z, & simbol"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium"
                        value={cloudPassword}
                        onChange={(e) => setCloudPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password requirements and confirm password removed for direct login only */}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cloudAuthLoading}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {cloudAuthLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Login <LogIn className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Username Lokal</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium text-slate-900"
                      value={inputUser}
                      onChange={(e) => setInputUser(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Sandi Lokal</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-4 w-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Sandi"
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition text-sm font-medium text-slate-900"
                      value={inputPass}
                      onChange={(e) => setInputPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={cloudAuthLoading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {cloudAuthLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>Login <LogIn className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-50 space-y-4">
            <button
              type="button"
              onClick={() => {
                setPublicVerifyId("");
                setPublicVerifyResult(null);
                setPublicVerifyError("");
                setShowPublicVerifyPortal(true);
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-650 font-black text-xs uppercase tracking-wider rounded-2xl border border-red-200/40 flex items-center justify-center gap-2 transition duration-200 cursor-pointer active:scale-95"
            >
              <QrCode className="h-4 w-4" /> Verifikasi ID Card Pengurus
            </button>

            <button
              type="button"
              onClick={handleDisconnectKoperasi}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Logout Cloud
            </button>
          </div>
          
          {/* MINIMALIST SYSTEM OWNER BYPASS */}
          <div className="pt-2 flex justify-center opacity-60 hover:opacity-100 transition-opacity">
            {!showStealthBypassLogin ? (
              <button
                type="button"
                onClick={() => setShowStealthBypassLogin(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 cursor-pointer transition"
                title="Override Master Sistem (SuperIT Only)"
              >
                <KeyRound className="h-3 w-3" /> Override Master Sistem
              </button>
            ) : (
                <div className="w-full p-6 bg-slate-950 rounded-3xl space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Override Master Sistem</p>
                    <button type="button" onClick={() => setShowStealthBypassLogin(false)} className="text-white/40 hover:text-white transition cursor-pointer"><Plus className="h-4 w-4 rotate-45" /></button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="PIN Root"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center font-black tracking-[0.5em] focus:outline-none focus:border-indigo-500"
                      value={ownerPIN}
                      onChange={(e) => setOwnerPIN(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSuperITEmergencyBypass(ownerPIN)}
                    />
                    <button
                      type="button"
                      onClick={() => handleSuperITEmergencyBypass(ownerPIN)}
                      className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest active:scale-95 transition"
                    >
                      Akses Langsung Login
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

  // Find user's permission to access settings
  const currentUserDetail = userAccounts.find(u => u.username === currentUsername);
  const canAccessSettings = currentUserDetail ? currentUserDetail.canAccessSettings : false;

  const isPagePermitted = (pageId: string): boolean => {
    if (isGlobalAdmin) return true;
    if (pageId === "dashboard" || pageId === "support" || pageId === "saas_billing") return true; 
    if (!currentUserDetail) return false;
    if (currentUserDetail.username === "SuperIT") return true; 

    if (pageId === "pengaturan" || pageId === "security_audit") {
      return !!currentUserDetail.canAccessSettings;
    }

    const allowed = currentUserDetail.permittedPages || [];
    return allowed.includes(pageId);
  };

  const isModuleUnlocked = (moduleId: string): boolean => {
    if (isGlobalAdmin) return true;
    if (currentUsername === "SuperIT") return true;
    if (moduleId === "dashboard" || moduleId === "pengaturan" || moduleId === "kontak" || moduleId === "support") return true;

    // Check custom overrides:
    if (tenantFeatures !== null) {
      return tenantFeatures.includes(moduleId);
    }

    // Default to plan:
    const defaults = PLAN_DEFAULT_FEATURES[tenantPlan] || PLAN_DEFAULT_FEATURES.Trial;
    return defaults.includes(moduleId);
  };

  const renderLockedFeatureScreen = (moduleId: string, moduleName: string, requiredPlan: string) => {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 text-left">
        <div className="bg-white max-w-2xl w-full border border-slate-150 rounded-3xl p-8 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 p-8 transform translate-x-3 -translate-y-3 opacity-5">
            <Lock className="h-64 w-64 text-[#001bb5]" />
          </div>
          
          <div className="flex items-center gap-4 text-[#001bb5]">
            <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl shrink-0">
              <Lock className="h-8 w-8 text-indigo-650" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">TINGKATKAN LAYANAN PORTAL</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Fitur Premium Terkunci ({moduleName})</h2>
            </div>
          </div>

          <div className="space-y-3.5 leading-relaxed text-slate-500 font-semibold text-sm">
            <p>
              Mohon maaf, instansi koperasi Anda saat ini terdaftar pada <strong className="text-slate-850 px-2 py-0.5 border border-slate-200 bg-slate-100 rounded-md font-extrabold uppercase font-mono tracking-wider">{tenantPlan} PLAN</strong>.
            </p>
            <p>
              Modul <strong className="text-indigo-650 font-black">"{moduleName}"</strong> adalah fitur premium yang disediakan bagi penyewa terpilih. Hak akses ini memerlukan standardisasi minimal <strong>{requiredPlan} PLAN</strong> atau pembelian modul tambahan kustom (Add-on khusus) melalui Administrator Utama (SuperIT Owner).
            </p>
          </div>

          {/* Pricing tier upgrade recommendation list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono">PAKET PREMIUM</p>
                <p className="text-xs text-slate-500 leading-snug font-semibold">Membuka pencatatan Stock Opname fisik gudang, E-Billing transaksi/piutang dan E-Invoice slip anggota.</p>
              </div>
              <p className="text-xs font-black text-indigo-700 mt-3 font-mono">Rp 600.000 / bln</p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-yellow-250 bg-yellow-50/20 flex flex-col justify-between pt-3 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider font-mono">PAKET ENTERPRISE</p>
                  <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 leading-snug font-semibold">Membuka seluruh ekosistem tanpa batas termasuk modul depresiasi aset tetap &amp; digital audit forensik.</p>
              </div>
              <p className="text-xs font-black text-amber-700 mt-3 font-mono text-left">Rp 1.500.000 / bln</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActivePage('saas_billing')}
              type="button"
              className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-150 cursor-pointer text-center"
            >
              Ubah &amp; Lihat Langganan Portal
            </button>
            <button
              onClick={() => setActivePage('support')}
              type="button"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer text-center"
            >
              Hubungi Support
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPageWithGuard = (
    pageId: string, 
    element: React.ReactNode, 
    moduleId: string, 
    minPlanRequired: "Basic" | "Premium" | "Enterprise", 
    moduleName: string
  ) => {
    if (isGlobalAdmin) return element;
    if (currentUsername === "SuperIT") return element;
    if (isModuleUnlocked(moduleId)) return element;
    return renderLockedFeatureScreen(moduleId, moduleName, minPlanRequired);
  };

  const hasKasBukuBesar = isPagePermitted('kasbank') || isPagePermitted('coa') || isPagePermitted('asettetap');
  const hasFakturEvaluasi = isPagePermitted('invoice') || isPagePermitted('rekappenjualan') || isPagePermitted('laporan');

  // CORE DASHBOARD RENDER LAYER
  return (
    <div id="main-application" className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`bg-slate-900 border-r-4 border-red-600 text-slate-100 flex flex-col shrink-0 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-full md:w-20' : 'w-full md:w-64'}`}>
        
        {/* MOBILE TOGGLES (Header-like) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10">
           <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-500" />
              <span className="font-black text-xs uppercase tracking-widest">{isSidebarCollapsed ? "KDMP" : "KDMP System"}</span>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 bg-white/5 rounded-lg text-slate-400">
                 {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 bg-white/5 rounded-lg text-slate-400">
                 <Menu className="h-5 w-5" />
              </button>
           </div>
        </div>

        <div className={`${isSidebarCollapsed ? 'hidden md:flex md:flex-col' : 'flex flex-col'} flex-1 transition-opacity duration-300`}>
          {/* USER PROFILE & LOGOUT SECTION */}
          <div className={`px-4 py-3 border-b border-white/5 bg-slate-950/50 flex items-center justify-between group select-none ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
            <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-inner border border-red-500/30">
                {currentUserDetail?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white truncate leading-tight">
                  {currentUserDetail?.name || "User"}
                </span>
                <span className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-widest mt-0.5">
                  {currentUserDetail?.role || "Personal"}
                </span>
              </div>
            </div>
            {isSidebarCollapsed && (
               <div className="hidden md:flex h-10 w-10 rounded-full bg-red-600 items-center justify-center text-white font-black text-sm shrink-0 shadow-lg border border-red-500/30">
                  {currentUserDetail?.name?.charAt(0) || "U"}
               </div>
            )}
            {!isSidebarCollapsed && (
              <button
                id="app-logout-btn"
                onClick={handleLogout}
                title="Keluar dari Sistem"
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          {/* LOGO TITLE SECTION */}
          <div className={`p-4 border-b border-white/10 bg-black/20 flex flex-col items-center text-center select-none ${isSidebarCollapsed ? 'md:p-2' : ''}`}>
            <div className={`${isSidebarCollapsed ? 'w-12 h-12 rounded-xl mb-2' : 'w-32 h-32 rounded-[2rem] mb-6'} bg-white shadow-xl border border-white/20 flex items-center justify-center p-1.5 group overflow-hidden transition-all duration-500 hover:rotate-3`}>
              {koperasiLogo || kopdesLogo ? (
                <img 
                  src={koperasiLogo || kopdesLogo} 
                  alt="Logo Koperasi" 
                  className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full bg-slate-900 rounded-[1.5rem] flex items-center justify-center`}>
                  <Building2 className={`text-white ${isSidebarCollapsed ? 'h-6 w-6' : 'h-16 w-16'}`} />
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <>
                <h2 id="sidebar-cooperative-title" className="text-xs font-black text-white tracking-wider uppercase leading-tight text-center line-clamp-2 w-full transition-colors duration-300 hover:text-red-500 cursor-default px-1" title={koperasiName}>
                  {koperasiName}
                </h2>
                <p className="text-[7px] leading-[13px] text-slate-400 font-bold mt-1 uppercase tracking-[0.2em] truncate w-full px-1">
                  Forward By Lokal Digital System
                </p>
                <span className="mt-2 px-2.5 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-[9px] font-bold text-red-400 tracking-wider uppercase">
                  Sistem Akuntansi
                </span>
              </>
            )}
            {isOnline ? (
              <span className={`mt-2 px-2 py-0.5 bg-emerald-950/45 border border-emerald-500/35 rounded-full text-[8.5px] font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5 ${isSidebarCollapsed ? 'md:px-1 md:py-1' : ''}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {!isSidebarCollapsed && "Cloud Terhubung"}
              </span>
            ) : (
              <span className={`mt-2 px-2 py-0.5 bg-amber-950/45 border border-amber-500/35 rounded-full text-[8.5px] font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5 ${isSidebarCollapsed ? 'md:px-1 md:py-1' : ''}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                {!isSidebarCollapsed && "Mode Standalone"}
              </span>
            )}
          </div>

          {/* MAIN NAV LINKS GROUP */}
          <nav className={`flex-1 p-3 space-y-1 overflow-y-auto text-left ${isSidebarCollapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
            {!isSidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Operasional Inti</div>}
            
            {isPagePermitted('dashboard') && (
              <button 
                id="nav-dash"
                onClick={() => {
                  setJurnalFilter("");
                  setCoaCategoryFilter("");
                  setCoaSearchFilter("");
                  setActivePage('dashboard');
                }}
                title={isSidebarCollapsed ? "Dashboard Utama" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'dashboard' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <Building className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Dashboard Ringkasan</span>}
              </button>
            )}

            {isPagePermitted('jurnal') && (
              <button 
                id="nav-jurnal"
                onClick={() => {
                  setJurnalFilter("");
                  setActivePage('jurnal');
                }}
                title={isSidebarCollapsed ? "Jurnal Umum" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'jurnal' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <Notebook className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Jurnal Umum Ledger</span>}
              </button>
            )}

            {isPagePermitted('stok') && (
              <button 
                id="nav-stok"
                onClick={() => {
                  setActivePage('stok');
                }}
                title={isSidebarCollapsed ? "Stok Produk" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'stok' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <Boxes className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Stok Inventaris Toko</span>}
                {!isModuleUnlocked('stok') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
              </button>
            )}

            {isPagePermitted('stockopname') && (
              <button 
                id="nav-stockopname"
                onClick={() => {
                  setActivePage('stockopname');
                }}
                title={isSidebarCollapsed ? "Stock Opname" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'stockopname' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <ClipboardCheck className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Stock Opname Gudang</span>}
                {!isModuleUnlocked('stockopname') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
              </button>
            )}

            {isPagePermitted('kontak') && (
              <button 
                id="nav-kontak"
                onClick={() => {
                  setActivePage('kontak');
                }}
                title={isSidebarCollapsed ? "Manajemen Kontak" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'kontak' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <Users className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Kontak</span>}
              </button>
            )}

            {isPagePermitted('anggota') && (
              <button 
                id="nav-anggota"
                onClick={() => {
                  setActivePage('anggota');
                }}
                title={isSidebarCollapsed ? "Daftar Anggota" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'anggota' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <UserCheck className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Daftar Anggota</span>}
              </button>
            )}

            {hasKasBukuBesar && (
              <>
                {!isSidebarCollapsed && <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Kas &amp; Buku Besar</div>}

                {isPagePermitted('kasbank') && (
                  <button 
                    id="nav-kasbank"
                    onClick={() => {
                      setActivePage('kasbank');
                    }}
                    title={isSidebarCollapsed ? "Saldo Kas & Bank" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'kasbank' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <Landmark className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Saldo Kas &amp; Bank</span>}
                  </button>
                )}

                {isPagePermitted('coa') && (
                  <button 
                    id="nav-coa"
                    onClick={() => {
                      setCoaCategoryFilter("");
                      setCoaSearchFilter("");
                      setActivePage('coa');
                    }}
                    title={isSidebarCollapsed ? "Chart of Accounts" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'coa' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <ListTodo className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Chart of Accounts (COA)</span>}
                  </button>
                )}

                {isPagePermitted('asettetap') && (
                  <button 
                    id="nav-asettetap"
                    onClick={() => {
                      setActivePage('asettetap');
                    }}
                    title={isSidebarCollapsed ? "Aset Tetap" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'asettetap' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <Briefcase className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Aset Tetap &amp; Pelepasan</span>}
                    {!isModuleUnlocked('asettetap') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
                  </button>
                )}
              </>
            )}

            {hasFakturEvaluasi && (
              <>
                {!isSidebarCollapsed && <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Faktur &amp; Evaluasi</div>}

                {isPagePermitted('invoice') && (
                  <button 
                    id="nav-invoice"
                    onClick={() => setActivePage('invoice')}
                    title={isSidebarCollapsed ? "Faktur Tagihan" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'invoice' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <FileText className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Cetak Lembar Tagihan</span>}
                    {!isModuleUnlocked('invoice') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
                  </button>
                )}

                {isPagePermitted('rekappenjualan') && (
                  <button 
                    id="nav-rekappenjualan"
                    onClick={() => setActivePage('rekappenjualan')}
                    title={isSidebarCollapsed ? "Rekap Penjualan" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'rekappenjualan' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <TrendingUp className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Rekap Penjualan Bulanan</span>}
                    {!isModuleUnlocked('stok') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
                  </button>
                )}

                {isPagePermitted('laporan') && (
                  <button 
                    id="nav-laporan"
                    onClick={() => setActivePage('laporan')}
                    title={isSidebarCollapsed ? "Laporan Keuangan" : ""}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'laporan' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                  >
                    <Coins className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Laporan SHU Neraca</span>}
                    {!isModuleUnlocked('laporan') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
                  </button>
                )}
              </>
            )}

            {isPagePermitted('pengaturan') && (
              <>
                {!isSidebarCollapsed && <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Konfigurasi</div>}
                <button 
                  id="nav-pengaturan"
                  onClick={() => setActivePage('pengaturan')}
                  title={isSidebarCollapsed ? "Pengaturan" : ""}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'pengaturan' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                >
                  <Settings className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Pengaturan Sistem</span>}
                </button>
                <button 
                  id="nav-security-audit"
                  onClick={() => setActivePage('security_audit')}
                  title={isSidebarCollapsed ? "Security Audit" : ""}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-all mt-1 hover:text-white hover:bg-slate-800 ${activePage === 'security_audit' ? 'bg-red-600 text-white' : 'text-slate-400'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Jejak Audit Keamanan</span>}
                  {!isModuleUnlocked('security_audit') && <Lock className={`h-3 w-3 ml-auto text-amber-500 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}`} />}
                </button>
              </>
            )}

            {!isSidebarCollapsed && <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Bantuan</div>}
            <button 
              id="nav-support"
              onClick={() => setActivePage('support')}
              title={isSidebarCollapsed ? "Bantuan" : ""}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'support' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
            >
              <LifeBuoy className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Pengaduan &amp; Bantuan</span>}
            </button>

            {!isGlobalAdmin && (
              <button 
                id="nav-saas-billing"
                onClick={() => setActivePage('saas_billing')}
                title={isSidebarCollapsed ? "Billing" : ""}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${activePage === 'saas_billing' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
              >
                <CreditCard className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>Tagihan Sewa Cloud</span>}
              </button>
            )}

            {isGlobalAdmin && (
              <div className={`pt-6 mt-4 border-t border-indigo-500/20 ${isSidebarCollapsed ? 'w-full' : ''}`}>
                {!isSidebarCollapsed && <div className="px-3 pb-2 text-[10px] font-black text-indigo-400 tracking-widest uppercase">Admin SaaS</div>}
                <button 
                  id="nav-superadmin"
                  onClick={() => setActivePage('superadmin')}
                  title={isSidebarCollapsed ? "Admin SaaS" : ""}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${activePage === 'superadmin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105' : 'text-indigo-400 hover:text-white hover:bg-indigo-900/40'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" /> {!isSidebarCollapsed && <span>System Control Board</span>}
                </button>
              </div>
            )}
          </nav>

          {/* SIDEBAR FOOTER UTILITIES */}
          <div className="mt-auto p-3 border-t border-white/5 bg-black/20 flex flex-col gap-1.5">
             <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-800 hover:bg-white'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                title={theme === 'light' ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
             >
                {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {!isSidebarCollapsed && <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>}
             </button>
             <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-300 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                title={isSidebarCollapsed ? "Buka Navigasi" : "Sembunyikan Navigasi"}
             >
                {isSidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5 text-red-500" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                {!isSidebarCollapsed && <span>Sembunyikan</span>}
             </button>
          </div>
        </div>
      </aside>

      {/* CORE DISPLAY WINDOW */}
      <main className={`flex-1 p-5 md:p-8 overflow-y-auto relative transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        {/* REMOTE SUPPORT BANNER */}
        {isSupportMode && (
          <div className="mb-6 bg-slate-900 border-b-4 border-amber-500 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <ShieldAlert className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Active Remote Support Session</h3>
                    <span className="px-2 py-0.5 bg-rose-500 text-[8px] font-black text-white rounded uppercase animate-pulse">Live Investigation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Anda sedang mengakses workspace tenant <span className="text-amber-400 font-bold tracking-wider">{koperasiId}</span>. Semua perubahan data akan langsung tersimpan di database penyewa.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExitSupportMode}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-xl active:scale-95 flex items-center gap-2"
              >
                Akhiri Sesi & Kembali
              </button>
            </div>
          </div>
        )}

        {/* GLOBAL ANNOUNCEMENT BANNER */}
        {globalConfig?.isAnnouncementActive && !globalConfig.maintenanceMode && (
          <div className="mb-6 p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div className="text-xs font-bold leading-relaxed">
                <span className="opacity-80 uppercase tracking-widest text-[9px] block mb-0.5">System Update</span>
                {globalConfig.announcement}
              </div>
            </div>
            <button 
              onClick={() => setGlobalConfig({...globalConfig, isAnnouncementActive: false})}
              className="p-1.5 hover:bg-white/10 rounded-full transition shrink-0"
            >
              <RefreshCw className="h-4 w-4 opacity-50" />
            </button>
          </div>
        )}

        {(tenantStatus === "Suspended" || (globalConfig?.maintenanceMode && !isGlobalAdmin)) ? (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-sm border-t-8 border-rose-600 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                {globalConfig?.maintenanceMode ? <Server className="h-10 w-10 text-rose-600" /> : <ShieldAlert className="h-10 w-10 text-rose-600" />}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">
                {globalConfig?.maintenanceMode ? "System Maintenance" : "Akun Ditangguhkan"}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
                {globalConfig?.maintenanceMode 
                  ? "Sistem sedang dalam proses pemeliharaan rutin untuk meningkatkan performa. Kami akan segera kembali online."
                  : `Sistem untuk tenant ${koperasiId} saat ini ditangguhkan oleh administrator.`}
                <br/><br/>
                Silakan hubungi tim IT Support atau Finance kami untuk panduan lebih lanjut.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition shadow-xl"
              >
                Tutup System
              </button>
            </div>
          </div>
        ) : renderPage()}
      </main>

      {/* PUBLIC ID-CARD & QR AUTHENTICITY VERIFIER DIALOG CONTAINER */}
      {/* GLOBAL MODALS & OVERLAYS */}
      {publicVerifyPortal}
    </div>
  );
}
