import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Upload, 
  Save, 
  Shield, 
  Users, 
  UserPlus, 
  FileText, 
  Check, 
  AlertTriangle, 
  Key, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Landmark, 
  ToggleLeft, 
  ToggleRight, 
  Smile, 
  PenTool, 
  Layout, 
  RotateCcw,
  Edit,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ShieldCheck,
  Server,
  Download,
  Database,
  X,
  CheckCircle2
} from 'lucide-react';
import { auth, db, doc, setDoc, getDoc, onSnapshot } from '../supabase';

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

const ALL_MENU_PAGES = [
  { id: "dashboard", name: "Dashboard Ringkasan", desc: "Akses sisa saldo, grafik SHU & rekap cepat" },
  { id: "jurnal", name: "Jurnal Umum Ledger", desc: "Akses buku harian jurnal akuntansi & pencatatan" },
  { id: "stok", name: "Stok Inventaris Toko", desc: "Akses inventaris barang, sisa stok, & pencatatan" },
  { id: "stockopname", name: "Stock Opname Gudang", desc: "Akses audit fisik penyesuaian kuantitas gudang" },
  { id: "kontak", name: "Kontak Personel/Supplier", desc: "Akses daftar kelola data mitra & supplier" },
  { id: "anggota", name: "Daftar Anggota & Tagihan", desc: "Akses buku iuran wajib, piutang, dan debitur" },
  { id: "kasbank", name: "Saldo Kas & Bank", desc: "Akses monitoring dompet likuid & rekening koperasi" },
  { id: "coa", name: "Chart of Accounts (COA)", desc: "Akses struktur kode perkiraan & saldo awal neraca" },
  { id: "asettetap", name: "Aset Tetap & Pelepasan", desc: "Akses buku harta berwujud, depresiasi, & disposal" },
  { id: "invoice", name: "Cetak Lembar Tagihan", desc: "Akses form cetak invoice tagihan resmi/struk" },
  { id: "rekappenjualan", name: "Rekap Penjualan Bulanan", desc: "Akses analisis grafik tren omset & item terlaris" },
  { id: "laporan", name: "Laporan SHU Neraca", desc: "Akses kalkulator laba-rugi & penutupan tahunan" },
  { id: "pengaturan", name: "Pengaturan Sistem", desc: "Akses kontrol penuh system, hak akses user, & profil" }
];

interface RekeningBank {
  id: string;
  nama: string;
  nomorRekening: string;
  lokasiText: string;
  saldo: number;
  status?: "Aktif" | "Tidak Aktif";
}

interface PengaturanProps {
  currentUsername: string;
  userAccounts: UserAccount[];
  onUpdateUserAccounts: (accounts: UserAccount[]) => void;
  koperasiName: string;
  onUpdateKoperasiName: (name: string) => void;
  koperasiAlamat: string;
  onUpdateKoperasiAlamat: (alamat: string) => void;
  koperasiLogo: string;
  onUpdateKoperasiLogo: (logo: string) => void;
  koperasiInvoiceSize: string;
  onUpdateKoperasiInvoiceSize: (size: string) => void;
  koperasiSubtext?: string;
  onUpdateKoperasiSubtext?: (subtext: string) => void;
  rekeningData: RekeningBank[];
  onUpdateRekeningData: (data: RekeningBank[]) => void;
  onUpdateCurrentUsername?: (newUsername: string) => void;
  onUpdateRekening?: (id: string, nama: string, nomor: string, lokasi: string) => void;
  onResetData?: (toZero: boolean) => void;
  koperasiId?: string;
  onDisconnectKoperasi?: () => void;
  coaData?: any[];
  jurnalData?: any[];
  stokData?: any[];
  stokHistoriData?: any[];
  anggotaData?: any[];
  kontakLainData?: any[];
  tagihanData?: any[];
  fixedAssets?: any[];
}

export function Pengaturan({
  currentUsername,
  userAccounts,
  onUpdateUserAccounts,
  koperasiName,
  onUpdateKoperasiName,
  koperasiAlamat,
  onUpdateKoperasiAlamat,
  koperasiLogo,
  onUpdateKoperasiLogo,
  koperasiInvoiceSize,
  onUpdateKoperasiInvoiceSize,
  koperasiSubtext = "Supercloud Integrated",
  onUpdateKoperasiSubtext,
  rekeningData,
  onUpdateRekeningData,
  onUpdateCurrentUsername,
  onUpdateRekening,
  onResetData,
  koperasiId,
  onDisconnectKoperasi,
  coaData = [],
  jurnalData = [],
  stokData = [],
  stokHistoriData = [],
  anggotaData = [],
  kontakLainData = [],
  tagihanData = [],
  fixedAssets = []
}: PengaturanProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'bank' | 'reset' | 'backup'>('profile');
  
  // Backup system toast notification states
  const [backupToast, setBackupToast] = useState<{
    show: boolean;
    message: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    if (backupToast && backupToast.show) {
      const timer = setTimeout(() => {
        setBackupToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [backupToast]);

  // Helper to convert arrays to CSV formatted strings
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    // Extract headers
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        let stringVal = val === undefined || val === null ? '' : String(val);
        // Clean and escape value
        stringVal = stringVal.replace(/"/g, '""');
        if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
          stringVal = `"${stringVal}"`;
        }
        return stringVal;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Helper to trigger a client-side download
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Full JSON database package (Backup)
  const handleExportJSON = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      koperasiId: koperasiId || 'Supercloud',
      koperasiName: koperasiName,
      koperasiAlamat: koperasiAlamat,
      coaData,
      jurnalData,
      stokData,
      stokHistoriData,
      anggotaData,
      kontakLainData,
      tagihanData,
      rekeningData,
      fixedAssets,
      userAccounts: userAccounts.map(u => ({
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        isAdmin: u.isAdmin,
        canAccessSettings: u.canAccessSettings,
        permittedPages: u.permittedPages
      }))
    };

    const jsonString = JSON.stringify(fullBackup, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `backup_koperasi_${koperasiId || 'system'}_${dateStr}.json`;
    triggerDownload(jsonString, filename, 'application/json');

    setBackupToast({
      show: true,
      message: "Cadangan data utama (JSON) berhasil dibuat dan diunduh secara aman ke perangkat Anda!",
      filename
    });
  };

  // Export Individual CSV Data
  const handleExportCSV = (data: any[], filenamePrefix: string) => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }
    const csvContent = convertToCSV(data);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${dateStr}.csv`;
    triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');

    setBackupToast({
      show: true,
      message: `Tabel data ${filenamePrefix.replace(/_/g, ' ')} berhasil diunduh secara mandiri!`,
      filename
    });
  };
  
  // States for bank editor in settings
  const [editingBank, setEditingBank] = useState<RekeningBank | null>(null);
  const [editBankNama, setEditBankNama] = useState("");
  const [editBankNomor, setEditBankNomor] = useState("");
  const [editBankLokasi, setEditBankLokasi] = useState("");
  const [bankErrorMsg, setBankErrorMsg] = useState("");

  // States for professional system reset confirmation
  const [showSystemResetConfirm, setShowSystemResetConfirm] = useState<'zero' | 'demo' | 'localStorage' | null>(null);

  
  // States for user manager
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newCanAccessSettings, setNewCanAccessSettings] = useState(false);
  const [newPermittedPages, setNewPermittedPages] = useState<string[]>(ALL_MENU_PAGES.map(p => p.id));

  // States to edit other user account (personnel name & menu access controls)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editCanAccessSettings, setEditCanAccessSettings] = useState(false);
  const [editPermittedPages, setEditPermittedPages] = useState<string[]>([]);

  // Password visibility states
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);
  
  // Validation / Feedback messages
  const [userSuccessMessage, setUserSuccessMessage] = useState("");
  const [userErrorMessage, setUserErrorMessage] = useState("");
  
  // Custom secure state to delete user safety within iframe configurations
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // States to edit current profile / password
  const currentUser = userAccounts.find(u => u.username === currentUsername) || {
    username: currentUsername,
    name: "Pengguna",
    role: "Petugas",
    password: ""
  };
  
  const [editProfileName, setEditProfileName] = useState(currentUser.name);
  const [editProfileUsername, setEditProfileUsername] = useState(currentUser.username);
  const [editProfileRole, setEditProfileRole] = useState(currentUser.role);
  const [editProfilePassword, setEditProfilePassword] = useState(currentUser.password || "");
  const [editProfileConfirmPassword, setEditProfileConfirmPassword] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  
  // Local states for Institutional Profile & Invoice Layout to avoid instant parent render/saves and allow saving with a button
  const [localKoperasiName, setLocalKoperasiName] = useState(koperasiName);
  const [localKoperasiAlamat, setLocalKoperasiAlamat] = useState(koperasiAlamat);
  const [localKoperasiInvoiceSize, setLocalKoperasiInvoiceSize] = useState(koperasiInvoiceSize);
  const [localKoperasiSubtext, setLocalKoperasiSubtext] = useState(koperasiSubtext);
  const [localKoperasiLogo, setLocalKoperasiLogo] = useState(koperasiLogo);
  const [isInstansiSaving, setIsInstansiSaving] = useState(false);
  const [instansiSuccessMsg, setInstansiSuccessMsg] = useState("");
  const [instansiErrorMsg, setInstansiErrorMsg] = useState("");

  // SaaS Super Admin Initial Setup
  const [globalAdminLocked, setGlobalAdminLocked] = useState(true);
  const isOwnerEmail = auth.currentUser?.email?.toLowerCase() === 'komarudink403@gmail.com';

  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, "super_admins", auth.currentUser!.uid), (snap) => {
        setGlobalAdminLocked(!snap.exists());
      });
      return () => unsub();
    }
  }, [auth.currentUser]);

  const handleClaimSuperAdmin = async () => {
    if (!auth.currentUser) {
      alert("Anda harus login terlebih dahulu.");
      return;
    }
    if (!isOwnerEmail) {
      alert("Hanya System Owner (komarudink403@gmail.com) yang dapat mengaktifkan master access.");
      return;
    }
    try {
      await setDoc(doc(db, "super_admins", auth.currentUser.uid), {
        email: auth.currentUser.email,
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || localKoperasiName || "Master Admin"
      });
      alert("Akses Super Admin Berhasil Diaktifkan! Menu System Control Board kini tersedia di sidebar.");
    } catch (e) {
      alert("Gagal mengaktifkan admin: " + (e as Error).message);
    }
  };

  // Keep local states synchronized with props when they are updated in parent/supabase
  useEffect(() => {
    setLocalKoperasiName(koperasiName);
  }, [koperasiName]);

  useEffect(() => {
    setLocalKoperasiAlamat(koperasiAlamat);
  }, [koperasiAlamat]);

  useEffect(() => {
    setLocalKoperasiInvoiceSize(koperasiInvoiceSize);
  }, [koperasiInvoiceSize]);

  useEffect(() => {
    setLocalKoperasiSubtext(koperasiSubtext);
  }, [koperasiSubtext]);

  useEffect(() => {
    setLocalKoperasiLogo(koperasiLogo);
  }, [koperasiLogo]);

  // File input ref for logo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo upload preview / convert to base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran berkas logo terlalu besar! Maksimal 2MB agar sistem dapat menyimpan data secara lancar.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalKoperasiLogo(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLocalKoperasiLogo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveInstansi = () => {
    if (!localKoperasiName.trim()) {
      setInstansiErrorMsg("Nama Koperasi / Instansi tidak boleh kosong!");
      return;
    }
    setIsInstansiSaving(true);
    setInstansiErrorMsg("");
    setInstansiSuccessMsg("");

    try {
      onUpdateKoperasiName(localKoperasiName);
      if (onUpdateKoperasiSubtext) {
        onUpdateKoperasiSubtext(localKoperasiSubtext);
      }
      onUpdateKoperasiInvoiceSize(localKoperasiInvoiceSize);
      onUpdateKoperasiAlamat(localKoperasiAlamat);
      onUpdateKoperasiLogo(localKoperasiLogo);

      setInstansiSuccessMsg("Profil Instansi & Desain Invoice berhasil disimpan!");
      setTimeout(() => {
        setInstansiSuccessMsg("");
      }, 4000);
    } catch (error) {
      setInstansiErrorMsg("Gagal menyimpan profil instansi. Silakan coba lagi.");
    } finally {
      setIsInstansiSaving(false);
    }
  };

  // Profile save handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (editProfilePassword !== editProfileConfirmPassword) {
      setProfileError("Konfirmasi sandi tidak sesuai! Mohon periksa kembali.");
      return;
    }

    const cleanNewUsername = editProfileUsername.trim();
    if (!cleanNewUsername) {
      setProfileError("Username tidak boleh kosong!");
      return;
    }

    // If username changed, check if new one exists
    if (cleanNewUsername !== currentUsername) {
      if (userAccounts.some(u => u.username.toLowerCase() === cleanNewUsername.toLowerCase())) {
        setProfileError(`Username "${cleanNewUsername}" sudah digunakan oleh orang lain.`);
        return;
      }
      
      // SuperIT check - usually shouldn't change for owner, but if it does, handle correctly
      if (currentUsername === "SuperIT" && cleanNewUsername !== "SuperIT") {
         // Optionally restrict if needed, but for now let's allow if user is brave
      }
    }

    if (editProfilePassword.length < 8) {
      setProfileError("Kata sandi minimal harus 8 karakter!");
      return;
    }
    if (!/[A-Z]/.test(editProfilePassword)) {
      setProfileError("Kata sandi harus mengandung minimal satu huruf BESAR!");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(editProfilePassword)) {
      setProfileError("Kata sandi harus mengandung minimal satu simbol unik/spesial!");
      return;
    }

    const updated = userAccounts.map(u => {
      if (u.username === currentUsername) {
        return {
          ...u,
          username: cleanNewUsername,
          name: editProfileName,
          role: editProfileRole,
          password: editProfilePassword
        };
      }
      return u;
    });
    onUpdateUserAccounts(updated);
    
    // If username changed, update current username in parent
    if (cleanNewUsername !== currentUsername && onUpdateCurrentUsername) {
      onUpdateCurrentUsername(cleanNewUsername);
    }

    setProfileSuccess("Profil berhasil diperbarui!");
    setEditProfileConfirmPassword("");
    setTimeout(() => setProfileSuccess(""), 4000);
  };

  // Add user handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMessage("");
    setUserSuccessMessage("");
    
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setUserErrorMessage("Username, Password, dan Nama Lengkap wajib diisi!");
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setUserErrorMessage("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    if (newPassword.length < 8) {
      setUserErrorMessage("Kata sandi minimal harus 8 karakter!");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setUserErrorMessage("Kata sandi harus mengandung minimal satu huruf BESAR!");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setUserErrorMessage("Kata sandi harus mengandung minimal satu simbol unik/spesial!");
      return;
    }

    const exists = userAccounts.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) {
      setUserErrorMessage(`Username "${newUsername}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    const newUser: UserAccount = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      email: newEmail.trim() || undefined,
      name: newName.trim(),
      role: newRole.trim() || "Staf Unit",
      isAdmin: newIsAdmin,
      canAccessSettings: newCanAccessSettings,
      permittedPages: newPermittedPages
    };

    onUpdateUserAccounts([...userAccounts, newUser]);
    setUserSuccessMessage(`Akun baru untuk "${newUsername}" berhasil didaftarkan!`);
    
    // reset form
    setNewUsername("");
    setNewPassword("");
    setNewConfirmPassword("");
    setNewEmail("");
    setNewName("");
    setNewRole("");
    setNewIsAdmin(false);
    setNewCanAccessSettings(false);
    setNewPermittedPages(ALL_MENU_PAGES.map(p => p.id));
    setShowNewUserPassword(false);
    
    setTimeout(() => setUserSuccessMessage(""), 4000);
  };

  // Start editing a user account
  const startEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword(user.password || "");
    setEditConfirmPassword(user.password || "");
    setEditEmail(user.email || "");
    setEditIsAdmin(user.isAdmin);
    setEditCanAccessSettings(user.canAccessSettings);
    setShowEditUserPassword(false);
    // If user has no permittedPages yet, set default pages based on their access
    if (user.permittedPages) {
      setEditPermittedPages(user.permittedPages);
    } else {
      const defaultPages = ALL_MENU_PAGES.map(p => p.id);
      if (user.canAccessSettings) {
        setEditPermittedPages(defaultPages);
      } else {
        setEditPermittedPages(defaultPages.filter(p => p !== "pengaturan"));
      }
    }
  };

  // Save edited user account
  const handleSaveEditedUser = () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      alert("Nama Lengkap personel wajib diisi!");
      return;
    }

    if (editPassword !== editConfirmPassword) {
      alert("Konfirmasi sandi baru tidak cocok!");
      return;
    }

    if (editPassword.length < 8) {
      alert("Kata sandi minimal harus 8 karakter!");
      return;
    }
    if (!/[A-Z]/.test(editPassword)) {
      alert("Kata sandi harus mengandung minimal satu huruf BESAR!");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(editPassword)) {
      alert("Kata sandi harus mengandung minimal satu simbol unik/spesial!");
      return;
    }

    const updated = userAccounts.map(u => {
      if (u.username === editingUser.username) {
        // Enforce settings access sync
        let finalPermitted = [...editPermittedPages];
        if (editCanAccessSettings) {
          if (!finalPermitted.includes("pengaturan")) {
            finalPermitted.push("pengaturan");
          }
        } else {
          finalPermitted = finalPermitted.filter(p => p !== "pengaturan");
        }

        return {
          ...u,
          name: editName.trim(),
          role: editRole.trim() || "Staf Unit",
          password: editPassword,
          email: editEmail.trim() || undefined,
          isAdmin: editingUser.username === "SuperIT" ? true : editIsAdmin,
          canAccessSettings: editingUser.username === "SuperIT" ? true : editCanAccessSettings,
          permittedPages: editingUser.username === "SuperIT" ? ALL_MENU_PAGES.map(p => p.id) : finalPermitted
        };
      }
      return u;
    });

    onUpdateUserAccounts(updated);
    setEditingUser(null);
    setUserSuccessMessage(`Akun & wewenang "${editingUser.username}" berhasil diperbarui!`);
    setTimeout(() => setUserSuccessMessage(""), 4000);
  };

  // Toggle permission helper
  const handleToggleAdmin = (username: string) => {
    const updated = userAccounts.map(u => {
      if (u.username === username) {
        // SuperIT owner has hardcoded rights to prevent lockout
        if (username === "SuperIT") return u;
        return { ...u, isAdmin: !u.isAdmin };
      }
      return u;
    });
    onUpdateUserAccounts(updated);
  };

  const handleToggleSettingsAccess = (username: string) => {
    const updated = userAccounts.map(u => {
      if (u.username === username) {
        if (username === "SuperIT") return u;
        return { ...u, canAccessSettings: !u.canAccessSettings };
      }
      return u;
    });
    onUpdateUserAccounts(updated);
  };

  // Delete user account
  const handleDeleteUser = (username: string) => {
    if (username === "SuperIT") {
      setUserErrorMessage("Akun SuperIT (Pembuat System) tidak dapat dihapus!");
      return;
    }
    if (username === currentUsername) {
      setUserErrorMessage("Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk!");
      return;
    }
    setUserToDelete(username);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    onUpdateUserAccounts(userAccounts.filter(u => u.username !== userToDelete));
    setUserSuccessMessage(`Akun pengguna "${userToDelete}" berhasil dihapus dari sistem.`);
    setUserToDelete(null);
  };

  // Bank Active/Inactive status toggle
  const handleToggleBankStatus = (id: string) => {
    const updated = rekeningData.map(r => {
      if (r.id === id) {
        const currentStatus = r.status || "Aktif";
        const nextStatus: "Aktif" | "Tidak Aktif" = currentStatus === "Aktif" ? "Tidak Aktif" : "Aktif";
        return { ...r, status: nextStatus };
      }
      return r;
    });
    onUpdateRekeningData(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="pengaturan-layout">
      {/* HEADER BAR */}
      <div className="bg-slate-900 px-6 py-6 border-b border-slate-800 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600/20 text-red-500 rounded-lg">
              <Settings className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Pengaturan Manajemen &amp; Hak Akses Berkas</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi server utama untuk mengontrol hak akses, detail cetakan nota/faktur, profil usaha, serta validitas instrumen rekening bank.
          </p>
        </div>
        
        {/* SUPERIT STATUS WATERMARK */}
        <div className="px-3.5 py-1.5 bg-red-600/10 border border-red-500/20 rounded-lg text-right flex items-center gap-2 self-start md:self-auto">
          <Shield className="h-4.5 w-4.5 text-red-500 animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] font-black uppercase text-red-400 tracking-wider">Keamanan System</div>
            <div className="text-[11px] font-bold text-slate-200">
              {currentUsername === "SuperIT" ? "Owner Level: SuperIT" : "Status: Terlindungi"}
            </div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-100 bg-slate-50 p-2.5 gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="h-4 w-4" /> Koperasi, Profil &amp; Logo Cetakan
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'users' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" /> Hak Akses &amp; Manajemen User
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'bank' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Landmark className="h-4 w-4" /> Status &amp; Edit Detail Bank
        </button>
        <button
          onClick={() => setActiveTab('reset')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'reset' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="h-4 w-4" /> Reset &amp; Pemulihan Sistem
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'backup' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="h-4 w-4" /> Ekspor &amp; Cadangan
        </button>
      </div>

      <div className="p-6">
        {/* TAB 1: KOPERASI, PROFILE & LOGO */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in duration-200" id="tab-profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* PROFILE USAHA (KOPERASI) */}
              <div className="lg:col-span-2 space-y-6">
                {koperasiId && (
                  <div className="p-4 bg-red-50 border border-red-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black tracking-wider text-red-700 uppercase">Koneksi Cloud Supabase Aktif</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded">Multi-User Live</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          ID Koperasi Cloud: <span className="font-mono text-red-600 font-extrabold bg-red-100/50 px-1.5 py-0.5 rounded">{currentUsername?.toLowerCase() === "superit" ? "supercloud" : koperasiId}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Semua data disinkronkan ke cloud secara real-time. Bagikan ID di atas ke staff lain agar mereka bisa masuk bersamaan.
                        </p>
                      </div>
          <button
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin memutuskan terminal dari Organisasi ini dan kembali ke menu hubungkan?")) {
                onDisconnectKoperasi();
              }
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-center"
          >
            <RotateCcw className="h-3 w-3" /> Ganti Organisasi
          </button>
                    </div>
                  </div>
                )}

          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="h-4.5 w-4.5 text-red-600 animate-pulse" /> Profil Organisasi &amp; Desain Invoice
          </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Nama Usaha / Organisasi</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition font-medium text-slate-800"
                      value={localKoperasiName}
                      onChange={(e) => setLocalKoperasiName(e.target.value)}
                      placeholder="Masukkan nama Organisasi resmi..."
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Ukuran Cetak Kertas Invoice</label>
                  <select
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition font-medium cursor-pointer"
                    value={localKoperasiInvoiceSize}
                    onChange={(e) => setLocalKoperasiInvoiceSize(e.target.value)}
                  >
                    <option value="A4">Standar Lembaran Besar (A4 / Letter)</option>
                    <option value="80mm">Struk Kertas Thermal Kasir (80mm Width)</option>
                    <option value="58mm">Struk Kertas Thermal Mini (58mm Width)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Alamat Pada Kop Invoice</label>
                  <textarea
                    rows={2.5}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition resize-none font-medium text-slate-800"
                    value={localKoperasiAlamat}
                    onChange={(e) => setLocalKoperasiAlamat(e.target.value)}
                    placeholder="Masukkan alamat lengkap lembaga..."
                  />
                  <p className="text-[10px] text-gray-400 font-medium">Informasi alamat ini langsung masuk ke Kop Surat Cetakan Invoice & Penawaran secara realtime.</p>
                </div>
                
                {/* LOGO REPLACEMENT COMPONENT */}
                <div className="bg-slate-50/70 border border-slate-150 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200/60 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {localKoperasiLogo ? (
                          <img src={localKoperasiLogo} alt="Logo Kustom" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-850">Logo Instansi Kustom</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Unggah gambar logo koperasi untuk menampilkan identitas visual instansi pada kop berkas nota.</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">Format file: JPG, PNG • Ukuran maks: 2MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoChange} 
                        accept="image/*"
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#141313] text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        <Upload className="h-3.5 w-3.5" /> Pilih Berkas
                      </button>
                      {localKoperasiLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 bg-white border border-slate-250 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-650 transition flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FEEDBACK & SAVE ACTION */}
                {instansiSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{instansiSuccessMsg}</span>
                  </div>
                )}
                {instansiErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                    <AlertTriangle className="h-4 w-4 text-red-650 shrink-0" />
                    <span>{instansiErrorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveInstansi}
                    disabled={isInstansiSaving}
                    id="save-instansi-settings-btn"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Save className="h-4 w-4 animate-bounce" /> {isInstansiSaving ? "Menyimpan..." : "Simpan Perubahan Profil & Invoice"}
                  </button>
                </div>

                {/* SUPER ADMIN INITIAL PROVISIONING - ONLY FOR OWNER EMAIL */}
                {isOwnerEmail && globalAdminLocked && (
                  <div className="mt-12 p-6 bg-indigo-900 rounded-3xl border-4 border-indigo-500/20 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <ShieldCheck className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          Universal System Control Board
                          <span className="px-2 py-0.5 bg-indigo-500 text-[9px] font-black uppercase rounded tracking-widest">Master Access</span>
                        </h3>
                        <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed font-medium">
                          Email Anda terdeteksi sebagai <strong>System Owner</strong>. Aktifkan lisensi administrator global untuk mengelola ribuan tenant, menangguhkan akses sistem, dan mengonfigurasi billing berlangganan secara terpusat.
                        </p>
                        <div className="mt-5 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={handleClaimSuperAdmin}
                            className="px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-900 font-black text-xs rounded-2xl transition shadow-xl active:scale-95 flex items-center gap-2 tracking-tight uppercase"
                          >
                            <Server className="h-4 w-4" /> Aktifkan Status Super Admin
                          </button>
                          <div className="text-[10px] text-indigo-300/60 font-mono">
                            UID: {auth.currentUser?.uid}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PROFILE PEMILIK USERNAME */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-5 bg-white shadow-xs">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-4.5 w-4.5 text-red-600" /> Profil Pengguna Aktif
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Ubah nama pemilik akun serta sandi rahasia untuk masuk dengan username <code className="font-mono text-red-650 font-bold bg-red-50/60 px-1 py-0.5 rounded">{currentUsername}</code>.</p>
                </div>

                {profileSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg text-center animate-in fade-in">
                    {profileSuccess}
                  </div>
                )}

                {profileError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-lg text-center animate-in shake">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Nama Pemilik Akun</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition"
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      placeholder="Nama Lengkap..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Username Login</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition"
                      value={editProfileUsername}
                      onChange={(e) => setEditProfileUsername(e.target.value)}
                      placeholder="Username baru..."
                    />
                    <p className="text-[8px] text-slate-400 px-1 italic">* Mengganti username akan berpengaruh pada sesi login berikutnya.</p>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Deskripsi Peran / Role</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition"
                      value={editProfileRole}
                      onChange={(e) => setEditProfileRole(e.target.value)}
                      placeholder="Jabatan..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Ubah Sandi Baru (Min 8 Karakter + Simbol)</label>
                    <div className="relative">
                      <input
                        type={showProfilePassword ? "text" : "password"}
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition"
                        value={editProfilePassword}
                        onChange={(e) => setEditProfilePassword(e.target.value)}
                        placeholder="Min 8 karakter, A-Z, & simbol..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                        className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title={showProfilePassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showProfilePassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Hints */}
                    <div className="mt-1 space-y-0.5 px-1">
                      <div className="flex items-center gap-1.5 text-[8.5px]">
                        <div className={`h-1 w-1 rounded-full ${editProfilePassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${editProfilePassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Min 8 karakter</span>
                        <div className={`h-1 w-1 rounded-full ml-1 ${/[A-Z]/.test(editProfilePassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${/[A-Z]/.test(editProfilePassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Huruf BESAR</span>
                        <div className={`h-1 w-1 rounded-full ml-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(editProfilePassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(editProfilePassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Simbol</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Konfirmasi Sandi Baru</label>
                    <input
                      type={showProfilePassword ? "text" : "password"}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition"
                      value={editProfileConfirmPassword}
                      onChange={(e) => setEditProfileConfirmPassword(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Ulangi sandi baru..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 transition text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" /> Simpan Profil &amp; Sandi
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGER & PERMISSIONS */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in duration-200" id="tab-users">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* LIST USERS */}
              <div className="xl:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" /> Pengaturan Hak Akses &amp; Otoritas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Daftar akun pengguna terdaftar yang boleh mengoperasikan database akuntansi koperasi.</p>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-150">
                          <th className="py-3 px-4">Nama Pengguna (Username)</th>
                          <th className="py-3 px-4">Nama Personil &amp; Jabatan</th>
                          <th className="py-3 px-4 text-center">Hak Edit / Input Data (Akses Admin)</th>
                          <th className="py-3 px-4 text-center">Akses Menu Pengaturan</th>
                          <th className="py-3 px-4 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {userAccounts
                          .filter((user) => user.username !== "SuperIT" || currentUsername === "SuperIT")
                          .map((user) => {
                            const isMainUser = user.username === "SuperIT";
                          const isLoginSelf = user.username === currentUsername;
                          
                          return (
                            <tr key={user.username} className={`hover:bg-slate-50/60 ${isLoginSelf ? 'bg-amber-50/20' : ''}`}>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900">
                                  <span>{user.username}</span>
                                  {isMainUser && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-wide border border-red-200">
                                      Creator
                                    </span>
                                  )}
                                  {isLoginSelf && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-wide border border-amber-200">
                                      Anda
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-800 leading-tight">{user.name}</p>
                                <div className="text-[10px] text-slate-450 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{user.role}</span>
                                  {user.email ? (
                                    <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 border border-emerald-100" title="Terkoneksi Supabase Cloud">
                                      <KeyRound className="h-2.5 w-2.5 text-emerald-500 shrink-0" /> {user.email}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-150" title="Sandi lokal konvensional">
                                      Sandi Lokal
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* ADMIN CONTROL TOGGLE */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdmin(user.username)}
                                    disabled={isMainUser}
                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      user.isAdmin ? 'bg-red-600' : 'bg-slate-200'
                                    } ${isMainUser ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                    title={isMainUser ? "Akses Master dilarang diturunkan!" : "Klik untuk mengubah hak akses edit"}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        user.isAdmin ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </td>
                              {/* SETTINGS CONTROL TOGGLE */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSettingsAccess(user.username)}
                                    disabled={isMainUser}
                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      user.canAccessSettings ? 'bg-red-600' : 'bg-slate-200'
                                    } ${isMainUser ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                    title={isMainUser ? "Otoritas Utama dilarang diturunkan!" : "Klik untuk mengubah akses menu pengaturan"}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        user.canAccessSettings ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </td>
                              
                              {/* ACTIONS */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditUser(user)}
                                    className="p-1 px-2 border border-slate-200 bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-lg text-[11px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                                    title="Ubah Data Personil & Hak Akses"
                                  >
                                    <PenTool className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user.username)}
                                    disabled={isMainUser || isLoginSelf}
                                    className={`p-1 px-2 border rounded-lg text-[11px] font-bold transition active:scale-95 flex items-center gap-1 ${
                                      isMainUser || isLoginSelf
                                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                        : 'border-red-100 bg-red-50/50 hover:bg-red-100 text-red-600 hover:text-red-700 cursor-pointer'
                                    }`}
                                    title="Hapus Akun Pengguna"
                                  >
                                    <Trash2 className="h-3 w-3" /> Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL SECURE DELETE CONFIRMATION */}
                {userToDelete && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 space-y-4 text-left animate-in zoom-in-95 duration-150">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Konfirmasi Hapus Pengguna</h4>
                          <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                            Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-900 font-mono font-bold">"{userToDelete}"</strong> secara permanen dari sistem?
                          </p>
                          <div className="p-2.5 bg-red-50 text-[10px] text-red-800 rounded-lg mt-2.5 font-semibold leading-relaxed border border-red-100">
                            Peringatan: Tindakan ini tidak dapat dibatalkan. Anggota/personil ini akan kehilangan semua hak akses masuk ke database Koperasi ini.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setUserToDelete(null)}
                          className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={confirmDeleteUser}
                          className="px-3.5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition shadow-sm cursor-pointer"
                        >
                          Ya, Hapus Akun
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CREATE USER FORM */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/40 space-y-5">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="h-4.5 w-4.5 text-red-600" /> Daftarkan Username Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Registrasi kredensial login baru untuk didistribusikan kepada personel pengurus koperasi.</p>
                </div>

                {userSuccessMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg text-center animate-bounce">
                     {userSuccessMessage}
                  </div>
                )}
                
                {userErrorMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-lg text-center">
                    {userErrorMessage}
                  </div>
                )}

                <form onSubmit={handleAddUser} className="space-y-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Nama Akun (Username ID)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition font-mono"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Misal: joko_kasir"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Kata Sandi (Password)</label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        className="w-full pl-3 pr-10 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter, A-Z, & simbol..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title={showNewUserPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showNewUserPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Hints */}
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[8.5px]">
                        <div className={`h-1 w-1 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${newPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Min 8 karakter</span>
                        <div className={`h-1 w-1 rounded-full ml-1 ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${/[A-Z]/.test(newPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Huruf BESAR</span>
                        <div className={`h-1 w-1 rounded-full ml-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Simbol</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Konfirmasi Kata Sandi</label>
                    <input
                      type={showNewUserPassword ? "text" : "password"}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition"
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Ketik ulang sandi..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Nama Lengkap Anggota/Karyawan</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Misal: Joko Widodo, S.Ak"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Email Resmi (Google / Supabase Auth - Opsional)</label>
                    <input
                      type="email"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition font-mono"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Contoh: nama_personil@gmail.com"
                    />
                    <p className="text-[8.5px] text-slate-450 text-left leading-normal">Membantu personil login secara cloud menggunakan keamanan Google (Supabase Auth).</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase justify-self-start text-left">Gelar Jabatan / Peran</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-red-600 transition"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Misal: Kasir Pembantu"
                    />
                  </div>

                  {/* SELECT MENUS CHECKLIST FOR REGISTRATION */}
                  <div className="space-y-2 select-none text-left">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Pilih Wewenang Akses Menu</label>
                    <div className="grid grid-cols-1 gap-2 bg-white/70 p-3 rounded-lg border border-slate-150 max-h-48 overflow-y-auto">
                      {ALL_MENU_PAGES.map((p) => {
                        const isChecked = newPermittedPages.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-start gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none hover:text-slate-900">
                            <input
                              type="checkbox"
                              className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5 mt-0.5 shrink-0"
                              checked={isChecked}
                              onChange={() => {
                                let nextPages = [...newPermittedPages];
                                if (isChecked) {
                                  nextPages = nextPages.filter(id => id !== p.id);
                                  if (p.id === "pengaturan") {
                                    setNewCanAccessSettings(false);
                                  }
                                } else {
                                  nextPages.push(p.id);
                                  if (p.id === "pengaturan") {
                                    setNewCanAccessSettings(true);
                                  }
                                }
                                setNewPermittedPages(nextPages);
                              }}
                            />
                            <div>
                              <div className="text-[10px] font-bold text-slate-800">{p.name}</div>
                              <div className="text-[8.5px] text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-left">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="new-is-admin-check"
                        className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                        checked={newIsAdmin}
                        onChange={(e) => setNewIsAdmin(e.target.checked)}
                      />
                      <label htmlFor="new-is-admin-check" className="text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                        Beri Akses Modifikasi (Admin Write Access)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="new-can-settings-check"
                        className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                        checked={newCanAccessSettings}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setNewCanAccessSettings(val);
                          if (val) {
                            if (!newPermittedPages.includes("pengaturan")) {
                              setNewPermittedPages([...newPermittedPages, "pengaturan"]);
                            }
                          } else {
                            setNewPermittedPages(newPermittedPages.filter(p => p !== "pengaturan"));
                          }
                        }}
                      />
                      <label htmlFor="new-can-settings-check" className="text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                        Beri Akses Menu Pengaturan Sistem
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Amankan &amp; Registrasi Akun
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BANK STATUS ACTIVATION */}
        {activeTab === 'bank' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left" id="tab-bank">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4.5 w-4.5 text-red-600 animate-pulse" /> Aktivasi &amp; Penyesuaian Detail Rekening Kasir / Bank
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan panel kendali ini untuk menyalakan, mematikan, atau merubah informasi detail rekening kasir/bank resmi koperasi. Rekening bank yang ditandai tidak aktif 
                <strong> tidak akan muncul</strong> dalam pilihan metode pembayaran / kasir penjualan, serta keterangannya akan disajikan sebagai non-aktif pada ringkasan saldo utama.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rekeningData.map((bank) => {
                const isActive = (bank.status || "Aktif") === "Aktif";
                return (
                  <div 
                    key={bank.id} 
                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-48 relative overflow-hidden ${
                      isActive 
                        ? 'bg-white border-slate-150 shadow-sm hover:shadow-md' 
                        : 'bg-slate-50/70 border-slate-200 text-slate-400 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md inline-block ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-200/80 text-slate-500'
                          }`}>
                            {isActive ? "Aktif (Online)" : "Tidak Aktif"}
                          </span>
                        </div>
                        <h4 className={`text-xs font-black tracking-tight uppercase truncate max-w-[170px] ${isActive ? 'text-slate-900' : 'text-slate-405 line-through'}`}>
                          {bank.nama}
                        </h4>
                        <p className={`text-[10px] font-mono mt-0.5 font-semibold ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                          No: {bank.nomorRekening}
                        </p>
                        <p className="text-[9.5px] italic font-medium opacity-80 mt-1 leading-normal truncate max-w-[170px]">
                          {bank.lokasiText}
                        </p>
                      </div>
                      <span className={`p-2 rounded-xl transition ${isActive ? 'bg-red-50 text-red-650 shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
                        <Landmark className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                      <div className="flex flex-col">
                        <span className="text-[8.5px] text-slate-400 uppercase font-black tracking-wider">Saldo Tercatat</span>
                        <span className={`text-xs font-bold font-mono ${isActive ? 'text-slate-900' : 'text-slate-450'}`}>
                          Rp {bank.saldo.toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {/* Edit bank details button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBank(bank);
                            setEditBankNama(bank.nama);
                            setEditBankNomor(bank.nomorRekening);
                            setEditBankLokasi(bank.lokasiText);
                            setBankErrorMsg("");
                          }}
                          className="px-2 py-1 text-[9.5px] text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded font-black transition flex items-center gap-1 cursor-pointer"
                          title="Ubah detail nama, nomor rekening atau lokasi penempatan"
                        >
                          <Edit className="h-2.5 w-2.5" /> Ubah
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleBankStatus(bank.id)}
                            className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-red-600' : 'bg-slate-300'
                            }`}
                            title={isActive ? "Nonaktifkan rekening ini" : "Aktifkan rekening ini"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: RESET SYSTEM */}
        {activeTab === 'reset' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left" id="tab-reset">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <RotateCcw className="h-4.5 w-4.5 text-red-600 animate-pulse" /> Pemulihan, Reset, &amp; Inisialisasi Database Sistem
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola integritas pangkalan data koperasi melalui panel pemulihan darurat ini. Tindakan di bawah bersifat <strong>permanen dan tidak dapat dibatalkan</strong>. Perhatikan tingkat otorisasi Anda sebelum melakukan operasi merusak.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: RESET TO ZERO */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition duration-150">
                <div className="space-y-2">
                  <div className="p-2.5 bg-red-50 text-red-650 rounded-xl w-10 h-10 flex items-center justify-center border border-red-150">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Mulai Jurnal Baru (Reset ke Nol)</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Menghapus seluruh postingan jurnal umum, mengosongkan riwayat stock opname, meniadakan invoice, dan mengembalikan seluruh saldo kas, bank, serta akun perkiraan ke angka nol. 
                  </p>
                  <p className="text-[11px] font-bold text-red-600">
                    * Akun User Admin/SuperIT dan setup koperasi tetap aman dipertahankan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSystemResetConfirm('zero')}
                  className="w-full py-2 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Bersihkan Jurnal &amp; Saldo
                </button>
              </div>

              {/* CARD 2: RESTORE SIMULATION DEMO */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition duration-150">
                <div className="space-y-2">
                  <div className="p-2.5 bg-amber-50 text-amber-750 rounded-xl w-10 h-10 flex items-center justify-center border border-amber-150">
                    <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Muat Database Demo Simulasi</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Mengisi ulang pangkalan data sistem koperasi dengan paket catatan contoh berupa jajaran jurnal simulasi, iuran anggota wajib pokok, data inventaris toko, serta sandingan neraca yang aktif. Sangat berguna untuk simulasi presentasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSystemResetConfirm('demo')}
                  className="w-full py-2 bg-slate-50 hover:bg-amber-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Muat Contoh Demo Simulasi
                </button>
              </div>

              {/* CARD 3: HARD SYSTEM WIPE */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition duration-150">
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl w-10 h-10 flex items-center justify-center border border-slate-200">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pembersihan Penuh Flash Cache</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Melakukan penghancuran data bersih berskala penuh pada media penyimpanan Lokal browser (LocalStorage), menghapus logo koperasi, semua custom username, invoice, serta memaksa sistem melakukan log-out dan inisialisasi ulang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSystemResetConfirm('localStorage')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-950 hover:text-white border border-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Factory Reset Browser
                </button>
              </div>
            </div>

            {/* Warning Banner block */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-150 text-orange-950 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-650 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h5 className="font-bold text-xs">PENTING: Kebijakan Keamanan Koperasi &amp; Ledger Buku</h5>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                  Semua transaksi yang melibatkan pembersihan dan pemulihan data akan langsung memperbarui sisa dompet dan COA, memastikan keselarasan penuh. Pastikan Anda memiliki salinan laporannya terlebih dahulu sebelum mengeksekusi agar meminimalkan resiko kehilangan pembukuan resmi koperasi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BACKUP & EXPORT SYSTEM */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left" id="tab-backup">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-red-600 animate-pulse" /> Ekspor &amp; Manajemen Cadangan Data (Backup)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unduh salinan cadangan pangkalan data akuntansi koperasi secara mandiri. Disarankan melakukan pencadangan berkala sebelum penutupan buku tahunan.
              </p>
            </div>

            {/* FULL BACKUP (JSON) CARD */}
            <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl p-6 border border-red-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="p-3 bg-red-600/10 text-red-600 rounded-xl w-12 h-12 flex items-center justify-center border border-red-200/50">
                  <Database className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Unduh Berkas Cadangan Utama (JSON)</h4>
                <p className="text-xs text-slate-650 leading-normal">
                  Satu berkas mandiri berisi seluruh struktur dan transaksi koperasi meliputi: data COA, jurnal ledger lengkap, sediaan barang toko, rekaman anggota, seluruh tagihan berjalan, rekening bank, serta profil aset tetap. Sangat ideal untuk disimpan di drive eksternal Anda.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-500 font-bold font-mono">
                  <span>📊 COA Accounts: {coaData.length} rec</span>
                  <span>📝 Jurnal Entries: {jurnalData.length} rec</span>
                  <span>👥 Anggota: {anggotaData.length} rec</span>
                  <span>📦 Stok Toko: {stokData.length} rec</span>
                  <span>🏷️ Tagihan: {tagihanData.length} rec</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                <Download className="h-4.5 w-4.5" /> Unduh Backup Lengkap (.JSON)
              </button>
            </div>

            {/* SEPARATE PARTS EXPORTS (CSV) SECTION */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ekspor Tabel Parsial dalam Format CSV</h4>
                <p className="text-[11.5px] text-slate-500 mt-0.5">Dapat dibuka langsung via Microsoft Excel, Google Sheets, atau aplikasi Spreadsheet sejenis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Jurnal Ledger */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Jurnal Ledger Umum</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Rekaman buku harian seluruh postingan posisi debet dan kredit keuangan koperasi.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{jurnalData.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={jurnalData.length === 0}
                    onClick={() => handleExportCSV(jurnalData, 'jurnal_umum')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>

                {/* 2. Stok Inventaris */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Stok Inventaris Produk</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Katalog barang dagang toko, kuantitas saat ini, harga jual, serta nominal modal.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{stokData.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={stokData.length === 0}
                    onClick={() => handleExportCSV(stokData, 'stok_barang')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>

                {/* 3. Daftar Anggota */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Daftar Anggota Koperasi</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Data identitas, alamat, data iuran wajib dan tabungan pokok milik anggota terdaftar.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{anggotaData.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={anggotaData.length === 0}
                    onClick={() => handleExportCSV(anggotaData, 'anggota_koperasi')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>

                {/* 4. Bagan Akun COA */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Chart of Accounts (COA)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Struktur klasifikasi kode akun perkiraan lengkap beserta nominal saldo buku besar.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{coaData.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={coaData.length === 0}
                    onClick={() => handleExportCSV(coaData, 'chart_of_accounts')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>

                {/* 5. Tagihan & Piutang */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Daftar Tagihan &amp; Piutang</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Kelompok invoices iuran wajib bulanan, pupuk, atau barang dengan status pelunasan.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{tagihanData.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={tagihanData.length === 0}
                    onClick={() => handleExportCSV(tagihanData, 'tagihan_piutang')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>

                {/* 6. Aset Tetap */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 border-slate-200 flex flex-col justify-between space-y-3 hover:border-slate-350 transition duration-150">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-850 uppercase">Aset Tetap &amp; Depresiasi</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Buku aset berwujud kantor, biaya perolehan, umur ekonomis, dan akumulasi depresiasi.</p>
                    <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1.5">{fixedAssets.length} Records</span>
                  </div>
                  <button
                    type="button"
                    disabled={fixedAssets.length === 0}
                    onClick={() => handleExportCSV(fixedAssets, 'aset_tetap')}
                    className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Ekspor ke CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT BANK DETAIL */}
        {editingBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-4 text-left animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-amber-600 animate-pulse" />
                  Edit Detail Rekening: <code className="text-red-650 font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{editingBank.id}</code>
                </h3>
                <button
                  onClick={() => setEditingBank(null)}
                  className="text-slate-400 hover:text-slate-700 font-black text-lg p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {bankErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-[11px] font-black rounded-lg leading-relaxed animate-shake">
                  {bankErrorMsg}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Nama Rekening / Lembaga Bank</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-bold uppercase"
                  value={editBankNama}
                  onChange={(e) => setEditBankNama(e.target.value)}
                  placeholder="Contoh: BANK MANDIRI KOPERASI"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Nomor Rekening Resmi</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-mono font-bold"
                  value={editBankNomor}
                  onChange={(e) => setEditBankNomor(e.target.value)}
                  placeholder="Contoh: 900-12345-678"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Lokasi / Keterangan Penempatan</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-medium"
                  value={editBankLokasi}
                  onChange={(e) => setEditBankLokasi(e.target.value)}
                  placeholder="Contoh: Kantor Cabang Cikampek"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pr-1 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editBankNama || !editBankNomor || !editBankLokasi) {
                      setBankErrorMsg("Mohon lengkapi seluruh isian data bank!");
                      return;
                    }
                    if (onUpdateRekening) {
                      onUpdateRekening(editingBank.id, editBankNama, editBankNomor, editBankLokasi);
                    } else {
                      const updated = rekeningData.map(r => r.id === editingBank.id ? { ...r, nama: editBankNama, nomorRekening: editBankNomor, lokasiText: editBankLokasi } : r);
                      onUpdateRekeningData(updated);
                    }
                    setEditingBank(null);
                  }}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFESSIONAL RESET SYSTEM CONFIRMATION OVERLAY */}
        {showSystemResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 space-y-4 text-left animate-in zoom-in-95 duration-150">
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider">Konfirmasi Tindakan Darurat Sistem</span>
              </div>

              {showSystemResetConfirm === 'zero' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Konfirmasi Reset Jurnal/Saldo (Reset ke Nol)?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem akan menghapus seluruh data jurnal operasional harian, mengembalikan saldo COA, kas, dan stok barang dagangan ke nol. Personel akun login tetap aman agar Anda tidak terkunci dari sistem koperasi.
                  </p>
                  <p className="text-xs font-black text-red-600">Tindakan ini tidak dapat dibatalkan!</p>
                </div>
              )}

              {showSystemResetConfirm === 'demo' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Konfirmasi Memuat Pangkalan Data Demo Simulasi?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Operasi ini akan menimpa seluruh data akuntansi yang tercatat saat ini dengan paket catatan simulasi komprehensif, bertujuan untuk demonstrasi instan struktur koperasi.
                  </p>
                  <p className="text-xs font-black text-amber-600">Sangat disarankan mengamankan data yang ada terlebih dahulu!</p>
                </div>
              )}

              {showSystemResetConfirm === 'localStorage' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Konfirmasi Bersihkan Seluruh Browser Storage?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem akan melakukan pembersihan keras LocalStorage. Seluruh pengaturan koperasi, custom logo, seluruh sandi login, riwayat pembukuan dan kasir akan terhapus mentah-mentah seperti instalasi perdana baru. Anda akan otomatis keluar dipaksa.
                  </p>
                  <p className="text-xs font-black text-red-600 font-semibold">Sistem akan memuat ulang paksa (Full Reload)!</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setShowSystemResetConfirm(null)}
                  className="px-4.5 py-2 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 hover:text-slate-950 rounded-xl text-xs font-bold transition duration-150 cursor-pointer shadow-xs active:scale-95"
                >
                  Batal / Kembali
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showSystemResetConfirm === 'zero') {
                      if (onResetData) {
                        onResetData(true);
                      }
                    } else if (showSystemResetConfirm === 'demo') {
                      if (onResetData) {
                        onResetData(false);
                      }
                    } else if (showSystemResetConfirm === 'localStorage') {
                      localStorage.clear();
                      window.location.reload();
                    }
                    setShowSystemResetConfirm(null);
                  }}
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-extrabold transition duration-150 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 ${
                    showSystemResetConfirm === 'demo' 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : showSystemResetConfirm === 'localStorage'
                      ? 'bg-slate-900 hover:bg-slate-950'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showSystemResetConfirm === 'demo' ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-bounce" /> Ya, Muat Simulasi Demo
                    </>
                  ) : showSystemResetConfirm === 'localStorage' ? (
                    <>
                      <RotateCcw className="h-4 w-4" /> Ya, Factory Reset Browser
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Ya, Bersihkan & Jurnal Baru
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CO-PILOT UNTUK EDIT USER SELECTION */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 space-y-6 text-left">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600 animate-pulse" />
                    Ubah Data &amp; Hak Akses: <code className="text-red-600 font-mono text-xs">{editingUser.username}</code>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Ubah nama resmi personel, kata sandi log masuk, jabatan kerja, dan pilih lembar wewenang menu sistem.</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left justify-self-start">Nama Lengkap Personel</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-medium"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Tulis nama lengkap..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left justify-self-start">Gelar Jabatan / Peran</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-medium"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder="Contoh: Kasir Pembantu"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left justify-self-start">Sandi Masuk (Min 8 Karakter + Simbol)</label>
                  <div className="relative">
                    <input
                      type={showEditUserPassword ? "text" : "password"}
                      className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-mono"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Min 8 karakter, A-Z, & simbol..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title={showEditUserPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showEditUserPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {/* Hints */}
                  <div className="mt-1 space-y-0.5 px-1">
                    <div className="flex items-center gap-1.5 text-[8.5px]">
                      <div className={`h-1 w-1 rounded-full ${editPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${editPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Min 8 karakter</span>
                      <div className={`h-1 w-1 rounded-full ml-1 ${/[A-Z]/.test(editPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${/[A-Z]/.test(editPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Huruf BESAR</span>
                      <div className={`h-1 w-1 rounded-full ml-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(editPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(editPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Simbol</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left justify-self-start">Konfirmasi Sandi Baru</label>
                  <input
                    type={showEditUserPassword ? "text" : "password"}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-mono"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Konfirmasi ulang sandi..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left justify-self-start">Email Resmi (Google / Supabase Auth)</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition text-slate-800 font-mono"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Tautkan email milik staf..."
                  />
                </div>
              </div>

              {/* Permitted Menus Grid Checklist */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-left">Wewenang Akses Menu Sistem</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                  {ALL_MENU_PAGES.map((p) => {
                    const isSelected = editPermittedPages.includes(p.id);
                    const isForbiddenToToggle = editingUser.username === "SuperIT" || (editingUser.username === "admin" && p.id === "pengaturan");
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isForbiddenToToggle) return;
                          if (isSelected) {
                            setEditPermittedPages(editPermittedPages.filter(id => id !== p.id));
                          } else {
                            setEditPermittedPages([...editPermittedPages, p.id]);
                          }
                        }}
                        className={`p-2.5 rounded-lg border transition text-left flex items-start gap-2.5 ${
                          isForbiddenToToggle 
                            ? 'opacity-65 bg-slate-100 cursor-not-allowed text-slate-450 border-slate-200' 
                            : 'cursor-pointer'
                        } ${
                          isSelected && !isForbiddenToToggle
                            ? 'bg-red-50/50 border-red-200 text-red-950'
                            : 'bg-white border-slate-150 text-slate-700 hover:border-slate-350'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          disabled={isForbiddenToToggle}
                          className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5 mt-0.5 shrink-0 pointer-events-none"
                        />
                        <div>
                          <div className="text-[11px] font-bold tracking-tight">{p.name}</div>
                          <div className="text-[9.5px] opacity-85 mt-0.5 leading-tight">{p.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Boolean Global Access Checkboxes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-is-admin"
                    disabled={editingUser.username === "SuperIT"}
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4 shrink-0"
                  />
                  <label htmlFor="edit-is-admin" className="font-bold text-amber-900 cursor-pointer">
                    Akses Admin Modifikasi (Admin Write)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-can-settings"
                    disabled={editingUser.username === "SuperIT"}
                    checked={editCanAccessSettings}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEditCanAccessSettings(val);
                      if (val) {
                        if (!editPermittedPages.includes("pengaturan")) {
                          setEditPermittedPages([...editPermittedPages, "pengaturan"]);
                        }
                      } else {
                        setEditPermittedPages(editPermittedPages.filter(p => p !== "pengaturan"));
                      }
                    }}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4 shrink-0"
                  />
                  <label htmlFor="edit-can-settings" className="font-bold text-amber-900 cursor-pointer">
                    Akses Menu Pengaturan Sistem
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedUser}
                  className="px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="h-4 w-4" /> Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING SUCCESS TOAST NOTIFICATION FOR BACKUPS & EXPORTS */}
        {backupToast && backupToast.show && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-emerald-200 rounded-2xl shadow-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-5 duration-350 ease-out" id="backup-success-toast">
            <div className="bg-emerald-50 text-emerald-650 rounded-xl p-2 h-10 w-10 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle2 className="h-5 w-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase block mb-0.5">Cadangan Data Berhasil</span>
              <p className="text-xs text-slate-700 font-semibold leading-normal mb-1.5">{backupToast.message}</p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 px-2 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-[10px] font-mono text-slate-500 truncate select-all">{backupToast.filename}</span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">READY</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setBackupToast(null)}
              className="text-slate-400 hover:text-slate-705 hover:bg-slate-50 rounded-lg p-1 h-fit transition cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
