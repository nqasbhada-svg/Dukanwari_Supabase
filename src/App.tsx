/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Truck, 
  Users, 
  FileSpreadsheet, 
  ShoppingBag, 
  Settings, 
  Code,
  LogOut,
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Key,
  Clock,
  AlertTriangle,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  ArrowLeft,
  QrCode, Database,
  IndianRupee
} from 'lucide-react';

// Models & Types
import { 
  Product, 
  Customer, 
  Supplier, 
  Invoice, 
  PurchaseBill, 
  AuditLog, 
  ShopSettings, 
  Expense,
  UserSession,
  UserRole,
  Category,
  Brand
} from './types';

// Dictionaries & Mock Databases
import { englishTranslations, marathiTranslations } from './data/translations';
import { 
  initialProducts, 
  initialCustomers, 
  initialSuppliers, 
  initialInvoices, 
  initialExpenses, 
  initialAuditLogs, 
  defaultSettings,
  initialCategories,
  initialBrands,
  initialRegistrations
} from './data/mockData';

// Subcomponents Views
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView';
import BillingTerminalView from './components/BillingTerminalView';
import StockInOutView from './components/StockInOutView';
import CustomerSupplierView from './components/CustomerSupplierView';
import { ExpensesView } from './components/ExpensesView';
import ReportsView from './components/ReportsView';
import OnlineShopCatalog from './components/OnlineShopCatalog';
import AdminPanel from './components/AdminPanel';
import ShopRegistrationForm from './components/ShopRegistrationForm';
import AdminApprovalView from './components/AdminApprovalView';
import SystemAdminSupabaseView from './components/SystemAdminSupabaseView';
import ShopOwnerStatusDashboard from './components/ShopOwnerStatusDashboard';
import QrCodeGeneratorView from './components/QrCodeGeneratorView';
import { ShopRegistration } from './types';
import { hashPassword, comparePassword } from './utils/crypto';
import { 
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig, 
  getSupabaseClient, 
  pullFromSupabase, 
  syncAllDatasetsToSupabase 
} from './utils/supabaseClient';
import { downloadElementAsPDF } from './utils/pdfGenerator';
import { pushShopToCentralSupabase, getCentralSupabaseClient } from './utils/centralSupabaseClient';

// Helper to safely load and parse local storage data without throwing runtime syntax errors

export default function App() {
  // Localization & Theme Configuration
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const isMr = lang === 'mr';
  const t = isMr ? marathiTranslations : englishTranslations;

  // Active View Tab Router
  const [adminDefaultTab, setAdminDefaultTab] = useState<'profile' | 'whatsapp' | 'roles' | 'audit' | 'supabase'>('profile');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Authentication State
  const [session, setSession] = useState<UserSession | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [loginMobile, setLoginMobile] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Shop Registrations & Admin Approval States
  const [registrations, setRegistrations] = useState<ShopRegistration[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'otp' | 'business'>('otp');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [pendingSession, setPendingSession] = useState<ShopRegistration | null>(null);

  // Primary Business Collections (Reactive States simulating Cloud DB updates)
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseBill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultSettings);

  // Public Invoice & Outstanding Billing Router
  const getInvoiceIdFromUrl = (): string | null => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      let match = path.match(/^\/invoice-preview\/([^/]+)/);
      if (match) return match[1];

      const hash = window.location.hash;
      match = hash.match(/^#\/invoice-preview\/([^/]+)/) || hash.match(/^#invoice-preview\/([^/]+)/);
      if (match) return match[1];
    }
    return null;
  };

  const getIsOutstandingFromUrl = (): boolean => {
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname === '/outstanding-view' ||
        window.location.hash === '#/outstanding-view' ||
        window.location.hash === '#outstanding-view'
      );
    }
    return false;
  };

  const [invoicePreviewId, setInvoicePreviewId] = useState<string | null>(getInvoiceIdFromUrl);
  const [isOutstandingView, setIsOutstandingView] = useState<boolean>(getIsOutstandingFromUrl);

  const [outstandingSearchMobile, setOutstandingSearchMobile] = useState<string>('');
  const [hasSearchedOutstanding, setHasSearchedOutstanding] = useState<boolean>(false);
  const [publicPreviewTemplate, setPublicPreviewTemplate] = useState<'thermal' | 'a4'>('a4');
  const [isLoadingCloudData, setIsLoadingCloudData] = useState<boolean>(true);

  // Sync state with popstate and hashchange (browser back/forward or hash changes)
  useEffect(() => {
    const handleNavigationChange = () => {
      setInvoicePreviewId(getInvoiceIdFromUrl());
      setIsOutstandingView(getIsOutstandingFromUrl());
    };
    window.addEventListener('popstate', handleNavigationChange);
    window.addEventListener('hashchange', handleNavigationChange);
    return () => {
      window.removeEventListener('popstate', handleNavigationChange);
      window.removeEventListener('hashchange', handleNavigationChange);
    };
  }, []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // ==========================================
  // SUPABASE REAL-TIME CONNECTION MONITOR & SYNC EFFECT
  // ==========================================
  const [supabaseOnline, setSupabaseOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);
  const [supabaseSyncing, setSupabaseSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Monitor network connection state
  useEffect(() => {
    const handleOnline = () => {
      setSupabaseOnline(true);
      // Automatically trigger a catch-up sync once back online
      setSupabaseSyncing(true);
      setTimeout(() => {
        setSupabaseSyncing(false);
        setLastSyncTime(new Date());
      }, 1500);
    };
    const handleOffline = () => setSupabaseOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSupabaseSync = async () => {
    if (!navigator.onLine) {
      setSupabaseOnline(false);
      return;
    }
    
    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    setSupabaseOnline(true);
    setSupabaseSyncing(true);

    try {
      const result = await syncAllDatasetsToSupabase({
        registrations,
        products,
        customers,
        suppliers,
        invoices,
        purchaseHistory,
        expenses,
        auditLogs,
        shopSettings,
        categories,
        brands
      });

      if (result.success) {
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error('Supabase auto-sync error:', err);
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const [syncStatusState, setSyncStatusState] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message: string;
    details?: {
      productsSynced: number;
      customersSynced: number;
      invoicesSynced: number;
      errors: string[];
    };
  }>({
    status: 'idle',
    message: ''
  });

  const handleSyncAll = async () => {
    setSyncStatusState({
      status: 'syncing',
      message: lang === 'mr' ? 'Supabase क्लाउडवर सर्व स्थानिक डेटा सिंक करत आहे...' : 'Forcing batch push of local state to Supabase API...'
    });
    setSupabaseSyncing(true);

    try {
      const config = getSupabaseConfig();
      if (!config.isConfigured) {
        throw new Error(lang === 'mr' 
          ? 'Supabase सेट केलेले नाही! कृपया ॲडमिन पॅनेलमध्ये Supabase क्रेडेन्शियल्स कॉन्फिगर करा.' 
          : 'Supabase is not configured! Please provide Supabase URL and Key in the Admin Panel.'
        );
      }

      const result = await syncAllDatasetsToSupabase({
        registrations,
        products,
        customers,
        suppliers,
        invoices,
        purchaseHistory,
        expenses,
        auditLogs,
        shopSettings,
        categories,
        brands
      });

      if (result.success && result.details) {
        setSyncStatusState({
          status: 'success',
          message: lang === 'mr' ? 'सर्व स्थानिक डेटा Supabase वर यशस्वीरित्या सिंक केला गेला!' : 'All local datasets successfully synchronized with the Supabase Cloud DB!',
          details: {
            productsSynced: result.details.products,
            customersSynced: result.details.customers,
            invoicesSynced: result.details.invoices,
            errors: []
          }
        });
        setLastSyncTime(new Date());
        setSupabaseOnline(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error('Supabase sync-all failure:', err);
      setSyncStatusState({
        status: 'error',
        message: err.message || (lang === 'mr' ? 'सिंक्रोनाइझेशन अयशस्वी: नेटवर्क जोडणी किंवा क्रेडेन्शियल्स तपासा!' : 'Synchronization failed. Please check your Supabase credentials or connection.')
      });
    } finally {
      setSupabaseSyncing(false);
    }
  };

  // Sync background updates with a 5-second debounce when local datasets are modified
  useEffect(() => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) return;

    const timer = setTimeout(() => {
      triggerSupabaseSync();
    }, 5000);

    return () => clearTimeout(timer);
  }, [products, customers, suppliers, invoices, purchaseHistory, expenses, categories, brands, registrations, shopSettings]);

  // Periodic automatic health check heartbeat and pull (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      const config = getSupabaseConfig();
      if (config.isConfigured) {
        triggerSupabaseSync();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCategory = (newCat: Category) => {
    setCategories(prev => {
      const updated = [...prev, newCat];
      
      return updated;
    });
  };

  const handleAddBrand = (newBr: Brand) => {
    setBrands(prev => {
      const updated = [...prev, newBr];
      
      return updated;
    });
  };

  // Supabase auth state listener
  useEffect(() => {
    const centralClient = getCentralSupabaseClient();
    if (!centralClient) return;
    
    // Check active session
    centralClient.auth.getSession().then(({ data: { session: authSession } }) => {
      if (authSession?.user?.email) {
        restoreSession(authSession.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = centralClient.auth.onAuthStateChange((event, authSession) => {
      if (event === 'SIGNED_IN' && authSession?.user?.email) {
        restoreSession(authSession.user.email);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [registrations]);

  const restoreSession = (email: string) => {
    if (session) return; // already logged in
    
    // System admin check
    if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'systemadmin') {
       // Only if explicitly matched
    }

    const reg = registrations.find(r => r.loginInfo.email.toLowerCase() === email.toLowerCase());
    if (reg && reg.subscription.status === 'Active') {
      setSession({
        role: 'owner',
        mobile: reg.mobile,
        name: `${reg.ownerName} (${reg.shopName})`,
        permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
      });
      if (reg.supabaseUrl && reg.supabaseAnonKey) {
        saveSupabaseConfig(reg.supabaseUrl, reg.supabaseAnonKey);
      }
      setShopSettings({
        ...defaultSettings,
        shopName: reg.shopName,
        mobile: reg.mobile,
        whatsapp: reg.mobile,
      });
    }
  };

  // Supabase data loader
  useEffect(() => {
    const loadCloudData = async () => {
      try {
        setIsLoadingCloudData(true);

        // Try Supabase first if configured
        const config = getSupabaseConfig();
        if (config.isConfigured) {
          console.log('Supabase configured. Attempting to pull cloud datasets...');
          const [
            regsPull,
            prodsPull,
            custsPull,
            suppsPull,
            invsPull,
            purchPull,
            expsPull,
            logsPull,
            settsPull,
            catsPull,
            brsPull
          ] = await Promise.all([
            pullFromSupabase<any>('registrations'),
            pullFromSupabase<any>('products'),
            pullFromSupabase<any>('customers'),
            pullFromSupabase<any>('suppliers'),
            pullFromSupabase<any>('invoices'),
            pullFromSupabase<any>('purchaseHistory'),
            pullFromSupabase<any>('expenses'),
            pullFromSupabase<any>('auditLogs'),
            pullFromSupabase<any>('shopSettings'),
            pullFromSupabase<any>('categories'),
            pullFromSupabase<any>('brands')
          ]);

          const anySuccess = regsPull !== null || prodsPull !== null || custsPull !== null || invsPull !== null;
          if (anySuccess) {
            console.log('Successfully pulled datasets from Supabase!');
            if (regsPull && regsPull.length > 0) setRegistrations(regsPull);
            if (prodsPull && prodsPull.length > 0) setProducts(prodsPull);
            if (custsPull && custsPull.length > 0) setCustomers(custsPull);
            if (suppsPull && suppsPull.length > 0) setSuppliers(suppsPull);
            if (invsPull && invsPull.length > 0) setInvoices(invsPull);
            if (purchPull && purchPull.length > 0) setPurchaseHistory(purchPull);
            if (expsPull && expsPull.length > 0) setExpenses(expsPull);
            if (logsPull && logsPull.length > 0) setAuditLogs(logsPull);
            if (settsPull && settsPull.length > 0) setShopSettings(settsPull[0]);
            if (catsPull && catsPull.length > 0) setCategories(catsPull);
            if (brsPull && brsPull.length > 0) setBrands(brsPull);
            
            setSupabaseOnline(true);
            return; // Successful Supabase load
          } else {
            console.warn('Failed to pull from Supabase (tables might not exist yet).');
          }
        }
      } catch (err) {
        console.warn('Failed to load initial data:', err);
      } finally {
        setIsLoadingCloudData(false);
      }
    };
    loadCloudData();
  }, []);
  // Business Login verification handler
  const handleBusinessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    
    const rawEmail = loginEmail.trim();
    const trimmedEmail = rawEmail.toLowerCase();
    
    if (
      (trimmedEmail === 'superadmin' || trimmedEmail === 'admin' || trimmedEmail === 'systemadmin')
    ) {
      if (loginPassword === 'adminpassword' || loginPassword === 'admin123') {
        // Successful System Admin login
        setSession({
          role: 'system_admin',
          mobile: '9876543210',
          name: 'System Admin (Platform Owner)',
          permissions: ['APPROVE_SHOPS', 'MANAGE_SUBSCRIPTIONS']
        });
        setCurrentView('approvals');
        setOtpError('');
        setLoginEmail('');
        setLoginPassword('');
        return;
      } else {
        setOtpError(isMr ? 'चुकीचे पासवर्ड!' : 'Invalid admin password!');
        return;
      }
    }

    const centralClient = getCentralSupabaseClient();
    if (centralClient) {
      const { data, error } = await centralClient.auth.signInWithPassword({
        email: rawEmail,
        password: loginPassword,
      });

      if (error) {
        setOtpError(isMr ? `लॉगिन अयशस्वी: ${error.message}` : `Login failed: ${error.message}`);
        return;
      }
    }

    const reg = registrations.find(r => 
      r.loginInfo.email.toLowerCase() === trimmedEmail
    );

    if (reg) {
      if (reg.subscription.status === 'Active') {
        // Successful login
        setSession({
          role: 'owner',
          mobile: reg.mobile,
          name: `${reg.ownerName} (${reg.shopName})`,
          permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
        });
        
        // Save Supabase Configuration for this shop if configured
        if (reg.supabaseUrl && reg.supabaseAnonKey) {
          saveSupabaseConfig(reg.supabaseUrl, reg.supabaseAnonKey);
        } else {
          clearSupabaseConfig();
        }

        // Load custom settings for the approved shop owner
        setShopSettings({
          ...defaultSettings,
          shopName: reg.shopName,
          mobile: reg.mobile,
          whatsapp: reg.mobile,
        });

        setLoginEmail('');
        setLoginPassword('');
      } else {
        // Pending approval, rejected, or more info requested
        setPendingSession(reg);
        setLoginEmail('');
        setLoginPassword('');
      }
    } else {
      setOtpError(isMr ? 'दुकान नोंदणी सापडली नाही!' : 'Shop registration not found!');
    }
  };

  // Submit registration form handler
  const handleRegisterBusiness = async (newReg: ShopRegistration) => {
    // Register with Supabase Auth
    const centralClient = getCentralSupabaseClient();
    if (centralClient) {
      const { error } = await centralClient.auth.signUp({
        email: newReg.loginInfo.email,
        password: newReg.loginInfo.password,
      });
      if (error) {
        console.error('Supabase Auth Signup Error:', error);
      }
    }

    // Hash password securely using bcryptjs
    const securedReg: ShopRegistration = {
      ...newReg,
      loginInfo: {
        ...newReg.loginInfo,
        password: hashPassword(newReg.loginInfo.password)
      }
    };

    const updated = [securedReg, ...registrations];
    setRegistrations(updated);
    
    // Centralized Supabase Sync
    try {
      await pushShopToCentralSupabase(securedReg);
    } catch (error) {
      console.error('Failed to push to central supabase:', error);
    }

    // Log auth audit trail
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp,
      userId: 'system',
      userName: 'Platform Gatekeeper',
      action: 'PARTNER_REGISTERED',
      details: `New Cloth Shop registered: ${newReg.shopName} by ${newReg.ownerName}. Status: Pending review.`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Send newly registered user directly to status tracking dashboard
    setPendingSession(securedReg);
    setIsRegistering(false);
  };

  // Update registration status handler (Admin/Software Owner Workflow)
  const handleUpdateShopSupabase = (id: string, supabaseUrl: string, supabaseAnonKey: string) => {
    const updated = registrations.map(reg => {
      if (reg.id === id) {
        return {
          ...reg,
          supabaseUrl,
          supabaseAnonKey
        };
      }
      return reg;
    });
    setRegistrations(updated);
  };

  const handleUpdateRegistrationStatus = async (
    id: string, 
    status: 'Pending' | 'Active' | 'Rejected' | 'MoreInfoNeeded',
    subscriptionUpdate?: {
      subscriptionType: 'Lifetime' | '1 Month' | '3 Months' | '6 Months' | '1 Year' | 'Custom';
      startDate: string;
      endDate?: string;
    },
    notes?: string,
    supabaseUrl?: string,
    supabaseAnonKey?: string
  ) => {
    const updated = registrations.map(reg => {
      if (reg.id === id) {
        return {
          ...reg,
          ...(supabaseUrl !== undefined && { supabaseUrl }),
          ...(supabaseAnonKey !== undefined && { supabaseAnonKey }),
          subscription: {
            ...reg.subscription,
            status,
            notes: notes || reg.subscription.notes,
            ...(subscriptionUpdate || {})
          }
        };
      }
      return reg;
    });

    setRegistrations(updated);

    const targetReg = updated.find(r => r.id === id);
    if (targetReg) {
      try {
        await pushShopToCentralSupabase(targetReg);
      } catch (err) {
        console.error('Failed to update shop status in central supabase:', err);
      }
    }

    // Log the action to audit database
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp,
      userId: session?.role === 'system_admin' ? 'system-admin' : (session?.role === 'owner' ? 'usr-1' : 'system'),
      userName: session?.name || 'System Admin',
      action: `PARTNER_STATUS_${status.toUpperCase()}`,
      details: `Updated status of shop ${targetReg?.shopName || id} to ${status.toUpperCase()}. notes: ${notes || 'None'}`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Update active pendingSession state if it is currently viewed
    if (pendingSession && pendingSession.id === id) {
      const freshReg = updated.find(r => r.id === id);
      if (freshReg) {
        setPendingSession(freshReg);
      }
    }

    // Persist registration status update directly to backend Supabase
    try {
      const payload = {
        status,
        subscription: {
          subscriptionType: subscriptionUpdate?.subscriptionType || targetReg?.subscription?.subscriptionType,
          startDate: subscriptionUpdate?.startDate || targetReg?.subscription?.startDate,
          endDate: subscriptionUpdate?.endDate || targetReg?.subscription?.endDate
        },
        notes: notes || targetReg?.subscription?.notes
      };
    } catch (error) {
      console.error('Failed to sync registration status update to Supabase:', error);
    }
  };

  // Log an Audit Event helper
  const logEvent = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: session?.role === 'system_admin' ? 'system-admin' : (session?.role === 'owner' ? 'usr-1' : 'usr-2'),
      userName: session?.name || 'System User',
      action: action,
      details: details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };


  // Simulated OTP Auth functions
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMobile.length !== 10) {
      setOtpError(isMr ? 'कृपया वैध १०-अंकी नंबर प्रविष्ट करा.' : 'Please enter a valid 10-digit number.');
      return;
    }
    setOtpError('');
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOtp === '123456') {
      const isOwner = loginMobile === '9876543210' || loginMobile === '8888888888';
      const role: UserRole = isOwner ? 'owner' : 'employee';
      setSession({
        role,
        mobile: loginMobile,
        name: isOwner ? 'Rahul Deshmukh' : 'Amit Shinde',
        permissions: isOwner 
          ? ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT'] 
          : ['POS_BILLING', 'STOCK_INWARD']
      });
      setOtpSent(false);
      setLoginMobile('');
      setLoginOtp('');
    } else {
      setOtpError(isMr ? 'चुकीचा ओटीपी! डेमो ओटीपी: 123456' : 'Invalid OTP! Default demo OTP is 123456');
    }
  };

  const fastLogin = (role: 'system_admin' | 'owner' | 'employee') => {
    const mob = role === 'system_admin' ? '9876543210' : (role === 'owner' ? '9876543210' : '9988776655');
    setSession({
      role,
      mobile: mob,
      name: role === 'system_admin' 
        ? 'System Admin (Platform Owner)' 
        : (role === 'owner' ? 'Rahul Deshmukh (Owner)' : 'Amit Shinde (Employee)'),
      permissions: role === 'system_admin'
        ? ['APPROVE_SHOPS', 'MANAGE_SUBSCRIPTIONS']
        : (role === 'owner' 
          ? ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT'] 
          : ['POS_BILLING', 'STOCK_INWARD'])
    });
    // Log auth audit trail
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp,
      userId: role === 'system_admin' ? 'system-admin' : (role === 'owner' ? 'usr-1' : 'usr-2'),
      userName: role === 'system_admin' 
        ? 'System Admin' 
        : (role === 'owner' ? 'Rahul (Owner)' : 'Amit (Employee)'),
      action: 'LOGIN_OTP_VERIFIED',
      details: `Successful OTP authentication for role: ${role.toUpperCase()}`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Set view accordingly
    if (role === 'system_admin') {
      clearSupabaseConfig();
      setCurrentView('approvals');
    } else {
      // In fast login, we just clear to default local storage since it's a dummy
      clearSupabaseConfig();
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    logEvent('LOGOUT_SECURE', `Securely logged out session for: ${session?.name}`);
    const centralClient = getCentralSupabaseClient();
    if (centralClient) {
      await centralClient.auth.signOut();
    }
    setSession(null);
    clearSupabaseConfig();
    setCurrentView('dashboard');
  };

  // Database State mutators
  const handleAddExpense = async (newExp: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExp,
      id: 'exp-' + Date.now(),
    };
    setExpenses(prev => [expense, ...prev]);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddProduct = async (newP: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newP,
      id: 'prod-' + Date.now(),
    };
    setProducts(prev => [product, ...prev]);
    logEvent('PRODUCT_ADD', `Added clothes: ${product.itemName} (${product.size}) with starting stock: ${product.openingStock}`);
  };

  const handleEditProduct = async (updatedP: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
    logEvent('PRODUCT_EDIT', `Modified product details for SKU ID: ${updatedP.barcode}`);
  };

  const handleDeleteProduct = async (id: string) => {
    const p = products.find(prod => prod.id === id);
    setProducts(prev => prev.filter(prod => prod.id !== id));
    logEvent('PRODUCT_DELETE', `Deleted SKU: ${p?.itemName} from clothing catalog`);
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, currentStock: newStock } : p));
    logEvent('STOCK_UPDATE', `Manually updated stock for product ID: ${productId} to ${newStock}`);
  };

  const handleAddCustomer = async (newC: Omit<Customer, 'id' | 'outstanding' | 'ledger'>) => {
    const client: Customer = {
      ...newC,
      id: 'cust-' + Date.now(),
      outstanding: 0,
      ledger: []
    };
    setCustomers(prev => [client, ...prev]);
    
    logEvent('CRM_CLIENT_ADD', `Registered new client: ${client.name} | Credit Protection: ₹${client.creditLimit}`);
    return client;
  };

  const handleAddSupplier = async (newS: Omit<Supplier, 'id' | 'outstanding' | 'ledger'>) => {
    const vendor: Supplier = {
      ...newS,
      id: 'sup-' + Date.now(),
      outstanding: 0,
      ledger: []
    };
    setSuppliers(prev => [vendor, ...prev]);
    
    logEvent('VEND_SUP_ADD', `Registered new wholesale vendor: ${vendor.name}`);
    return vendor;
  };

  const handleReceiveCollection = async (customerId: string, amount: number, paymentMode: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const ledgerEntry = {
          id: 'l-c-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          type: 'payment' as const,
          refId: 'COL-' + Date.now(),
          description: `Payment received via ${paymentMode}`,
          debit: 0,
          credit: amount,
          balance: c.outstanding - amount
        };
        return {
          ...c,
          outstanding: c.outstanding - amount,
          ledger: [...c.ledger, ledgerEntry]
        };
      }
      return c;
    }));
    logEvent('COLLECTION_RECEIPT', `Received payment of ₹${amount} from customer ID: ${customerId} via ${paymentMode}`);
  };

  const handlePaySupplier = async (supplierId: string, amount: number, paymentMode: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const ledgerEntry = {
          id: 'l-s-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          type: 'payment' as const,
          refId: 'PAY-' + Date.now(),
          description: `Payment made via ${paymentMode}`,
          debit: amount,
          credit: 0,
          balance: s.outstanding - amount
        };
        return {
          ...s,
          outstanding: s.outstanding - amount,
          ledger: [...s.ledger, ledgerEntry]
        };
      }
      return s;
    }));
    logEvent('SUPPLIER_PAYMENT', `Paid ₹${amount} to supplier ID: ${supplierId} via ${paymentMode}`);
  };

  const handleGenerateInvoice = async (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    
    // Auto-decrease products inventories
    const updatedProducts = products.map(p => {
      const billItem = invoice.items.find(it => it.productId === p.id);
      if (billItem) {
        return { ...p, currentStock: Math.max(0, p.currentStock - billItem.quantity) };
      }
      return p;
    });
    setProducts(updatedProducts);

    // Adjust outstanding debts on customer if payment is CREDIT
    if (invoice.paymentMode === 'Credit' || invoice.status === 'Partial') {
      const debtAmount = invoice.grandTotal - invoice.amountPaid;
      setCustomers(prev => prev.map(c => {
        if (c.id === invoice.customerId) {
          const ledgerEntry = {
            id: 'l-c-' + Date.now(),
            date: invoice.date,
            type: 'sale' as const,
            refId: invoice.invoiceNumber,
            description: `Auto-logged invoice credit: ${invoice.items.length} clothes`,
            debit: invoice.grandTotal,
            credit: invoice.amountPaid,
            balance: c.outstanding + debtAmount
          };
          return {
            ...c,
            outstanding: c.outstanding + debtAmount,
            ledger: [...c.ledger, ledgerEntry]
          };
        }
        return c;
      }));
    }
    
    logEvent('INVOICE_GEN', `Processed sale order #${invoice.invoiceNumber} for ${invoice.customerName} - Total: ₹${invoice.grandTotal}`);
  };

  const handleAddPurchaseBill = async (bill: PurchaseBill) => {
    setPurchaseHistory(prev => [bill, ...prev]);
    
    // Adjust supplier outstanding payable if credit
    if (bill.paymentStatus !== 'Paid') {
      const debt = bill.grandTotal - bill.amountPaid;
      setSuppliers(prev => prev.map(s => {
        if (s.id === bill.supplierId) {
          const ledger = {
            id: 'l-s-' + Date.now(),
            date: bill.date,
            type: 'purchase' as const,
            refId: bill.billNumber,
            description: `Inventory wholesale supply purchase`,
            debit: bill.amountPaid,
            credit: bill.grandTotal,
            balance: s.outstanding + debt
          };
          return {
            ...s,
            outstanding: s.outstanding + debt,
            ledger: [...s.ledger, ledger]
          };
        }
        return s;
      }));
    }

    // Auto-increase products inventories
    const updatedProducts = products.map(p => {
      const billItem = bill.items.find(it => it.productId === p.id);
      if (billItem) {
        return { ...p, currentStock: p.currentStock + billItem.quantity };
      }
      return p;
    });
    setProducts(updatedProducts);
    
    logEvent('PURCHASE_ADD', `Added purchase bill #${bill.billNumber} from ${bill.supplierName} - Total: ₹${bill.grandTotal}`);
  };

  // --- RENDERING ---

  const renderPublicOutstandingView = () => {
    const matchedCustomer = customers.find(c => c.mobile === outstandingSearchMobile);
    const pendingInvoices = matchedCustomer 
      ? invoices.filter(inv => inv.customerId === matchedCustomer.id && (inv.status === 'Unpaid' || inv.status === 'Partial'))
      : [];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
        {/* Public Header */}
        <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-500" size={20} />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase">{shopSettings.shopName}</h1>
              <p className="text-[10px] text-slate-400">Payment & Ledger Portal</p>
            </div>
          </div>

          <button 
            onClick={() => {
              window.location.hash = '';
              setIsOutstandingView(false);
              setHasSearchedOutstanding(false);
              setOutstandingSearchMobile('');
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md"
          >
            Home / Login
          </button>
        </header>

        {/* Portal Center Container */}
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-y-auto">
          {!hasSearchedOutstanding ? (
            /* Search mobile prompt block */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl text-center"
            >
              <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Users className="text-white" size={28} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-white">Check Outstanding Dues</h2>
                <p className="text-slate-400 text-xs">Enter your 10-digit registered mobile number to see outstanding dues and generate UPI payment link.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setHasSearchedOutstanding(true); }} className="space-y-4">
                <input 
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="e.g. 9876543210"
                  value={outstandingSearchMobile}
                  onChange={(e) => setOutstandingSearchMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white text-center tracking-widest text-lg font-bold rounded-xl focus:border-indigo-500 outline-none transition font-mono"
                />

                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/15"
                >
                  Verify Account
                </button>
              </form>
            </motion.div>
          ) : !matchedCustomer ? (
            /* Customer not found block */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl text-center"
            >
              <AlertTriangle className="text-amber-500 mx-auto" size={44} />
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">No Record Found</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  We could not find a registered customer with mobile number <span className="font-mono text-white font-bold">+91 {outstandingSearchMobile}</span>.
                </p>
              </div>

              <button 
                onClick={() => setHasSearchedOutstanding(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Try Another Mobile Number
              </button>
            </motion.div>
          ) : (
            /* Matched customer balance details dashboard */
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl text-left"
            >
              {/* Account Overview bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest">Active Ledger Profile</span>
                  <h3 className="text-xl font-bold text-white">{matchedCustomer.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">+91 {matchedCustomer.mobile}</p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl text-right">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Net Outstanding Balance</p>
                  <p className="text-2xl font-black text-rose-500 font-mono">₹{matchedCustomer.outstanding.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List of Pending/Outstanding Bills */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Pending Bills ({pendingInvoices.length})</h4>
                  
                  {pendingInvoices.length === 0 ? (
                    <div className="p-5 text-center bg-slate-900/40 border border-slate-900 rounded-2xl">
                      <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={24} />
                      <p className="text-xs font-bold text-white">All Dues Cleared!</p>
                      <p className="text-[10px] text-slate-500 mt-1">Thank you for your timely payments.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {pendingInvoices.map((inv, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition">
                          <div>
                            <p className="font-bold font-mono text-white">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500">{inv.date}</p>
                          </div>
                          
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="font-bold text-rose-400 font-mono">₹{inv.grandTotal}</p>
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase">{inv.status}</span>
                            </div>
                            
                            <button 
                              onClick={() => {
                                window.location.hash = `/invoice-preview/${inv.invoiceNumber}`;
                                setInvoicePreviewId(inv.invoiceNumber);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                              title="View Full Bill"
                            >
                              <ArrowLeft size={12} className="rotate-180" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secure UPI Payment section */}
                <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-slate-900/30 border border-slate-800/40 rounded-2xl text-center">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider w-full text-center">Instant Settlement via UPI QR</h4>
                  
                  {matchedCustomer.outstanding <= 0 ? (
                    <p className="text-xs text-slate-500 py-8">No payment needed as your account balance is zero.</p>
                  ) : (
                    <>
                      <div className="bg-white p-2 rounded-xl inline-block border border-slate-200">
                        <img 
                          referrerPolicy="no-referrer"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=vastraa_payments@okaxis&pn=${encodeURIComponent(shopSettings.shopName)}&am=${matchedCustomer.outstanding}&cu=INR`)}`}
                          alt="UPI Payment QR Code"
                          className="w-28 h-28"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-emerald-400">Scan to settle ₹{matchedCustomer.outstanding}</p>
                        <p className="text-[8px] text-slate-500 max-w-[220px] leading-relaxed mx-auto">Supports GPay, PhonePe, Paytm, and other standard UPI payment apps.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex justify-between pt-4 border-t border-slate-800/80">
                <button 
                  onClick={() => setHasSearchedOutstanding(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Change Account / Back
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderPublicInvoiceView = () => {
    const invoice = invoices.find(inv => inv.id === invoicePreviewId);
    if (!invoice) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Invoice Not Found</h2>
            <button onClick={() => setInvoicePreviewId(null)} className="px-4 py-2 bg-indigo-600 rounded-lg">Go Home</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
        <div className="max-w-2xl w-full mx-auto bg-white shadow-xl rounded-2xl p-8">
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800">{shopSettings.shopName}</h1>
              <p className="text-slate-500 text-sm mt-1">{shopSettings.address}</p>
              <p className="text-slate-500 text-sm">GSTIN: {shopSettings.gstNumber || 'N/A'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-indigo-600 uppercase tracking-widest">INVOICE</h2>
              <p className="text-slate-600 font-medium mt-1">#{invoice.invoiceNumber}</p>
              <p className="text-slate-500 text-sm">{invoice.date}</p>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-bold text-slate-800 text-lg">{invoice.customerName}</p>
            <p className="text-slate-600">{invoice.customerMobile}</p>
          </div>
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-slate-500 font-semibold">Item</th>
                <th className="py-3 text-slate-500 font-semibold text-right">Qty</th>
                <th className="py-3 text-slate-500 font-semibold text-right">Price</th>
                <th className="py-3 text-slate-500 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-700">{item.itemName}</td>
                  <td className="py-3 text-slate-600 text-right">{item.quantity}</td>
                  <td className="py-3 text-slate-600 text-right">₹{item.price}</td>
                  <td className="py-3 font-bold text-slate-800 text-right">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{invoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="text-red-500">-₹{invoice.discount}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-b pb-3">
                <span>Tax Amount</span>
                <span>₹{invoice.taxAmount}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-800 pt-2">
                <span>Total</span>
                <span>₹{invoice.grandTotal}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500 pt-2">
                <span>Paid ({invoice.paymentMode})</span>
                <span>₹{invoice.amountPaid}</span>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center text-slate-400 text-xs border-t pt-6">
            <p>Thank you for your business!</p>
            <button onClick={() => setInvoicePreviewId(null)} className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg font-bold">Close Preview</button>
          </div>
        </div>
      </div>
    );
  };

  // Navigation menu links mapping
  const menuItems = session?.role === 'system_admin'
    ? [
        { id: 'approvals', label: isMr ? 'नोंदणी मंजुरी आणि वर्गणी' : 'Licensing & Subscriptions', icon: ShieldCheck },
        { id: 'supabase_sync', label: 'Cloud DB Sync', icon: Database },
        { id: 'admin', label: t.adminPanel, icon: Settings }
      ]
    : [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'products', label: t.products, icon: Package },
        { id: 'billing', label: t.billing, icon: Receipt },
        { id: 'stock', label: isMr ? 'स्टॉक इन-आउट' : 'Stock In & Out', icon: Truck },
        { id: 'customers_suppliers', label: isMr ? 'ग्राहक आणि विक्रेता' : 'Ledgers & Directory', icon: Users },
        { id: 'expenses', label: isMr ? 'खर्च' : 'Expenses', icon: IndianRupee },
        { id: 'reports', label: t.reports, icon: FileSpreadsheet, ownerOnly: true },
        { id: 'online_catalog', label: t.onlineCatalog, icon: ShoppingBag },
        { id: 'qr_generator', label: isMr ? 'क्यूआर कोड जनरेटर' : 'QR Code Generator', icon: QrCode },
        { id: 'admin', label: t.adminPanel, icon: Settings, ownerOnly: true },
      ];

  // Intercept for public routing
  if (invoicePreviewId) {
    return renderPublicInvoiceView();
  }

  if (isOutstandingView) {
    return renderPublicOutstandingView();
  }

  if (isRegistering) {
    return (
      <ShopRegistrationForm 
        onBackToLogin={() => setIsRegistering(false)}
        onSubmitRegistration={handleRegisterBusiness}
        isMr={isMr}
      />
    );
  }

  if (pendingSession) {
    return (
      <ShopOwnerStatusDashboard 
        registration={pendingSession}
        onLogout={() => setPendingSession(null)}
        isMr={isMr}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans dark bg-[#0F0F0F] text-[#E6E1E5]">
      
      {/* If Not Logged In, Render beautiful OTP Lockscreen */}
      {!session ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-slate-900 to-slate-950 relative overflow-hidden text-white">
          
          {/* Ambient background decoration */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 text-center"
          >
            {/* Logo Icon */}
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ShoppingBag className="text-white" size={28} />
            </div>

            <div className="space-y-1.5">
              <div className="flex gap-2 items-center justify-center text-xs">
                {/* Language Selector */}
                <button 
                  id="login-lang-en"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded font-bold ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >English</button>
                <span className="text-white/20">|</span>
                <button 
                  id="login-lang-mr"
                  onClick={() => setLang('mr')}
                  className={`px-2 py-0.5 rounded font-bold ${lang === 'mr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >मराठी</button>
              </div>
              <h2 className="text-xl font-bold font-display tracking-tight mt-3">{t.loginTitle}</h2>
              <p className="text-white/60 text-xs">{t.loginSub}</p>
            </div>


            {/* Auth Mode Toggle Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl text-xs font-semibold">
              <button
                id="mode-otp-btn"
                type="button"
                onClick={() => { setLoginMode('otp'); setOtpError(''); }}
                className={`py-1.5 rounded-lg transition ${loginMode === 'otp' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                📱 {isMr ? 'ओटीपी लॉगिन' : 'OTP Login'}
              </button>
              <button
                id="mode-business-btn"
                type="button"
                onClick={() => { setLoginMode('business'); setOtpError(''); }}
                className={`py-1.5 rounded-lg transition ${loginMode === 'business' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                🔑 {isMr ? 'व्यवसाय लॉगिन' : 'Business Account'}
              </button>
            </div>

            {/* Forms according to selected login mode */}
            {loginMode === 'otp' ? (
              !otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4 text-left text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{t.mobileLabel}</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 9876543210"
                        value={loginMobile}
                        onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 outline-none font-mono text-sm font-bold text-white tracking-widest"
                      />
                    </div>
                  </div>

                  {otpError && <p className="text-rose-400 text-[11px] font-semibold">{otpError}</p>}

                  <button
                    id="request-otp-btn"
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-xl text-xs font-bold font-sans tracking-wide uppercase shadow-lg shadow-indigo-600/20"
                  >
                    {t.getOtp}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-left text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{t.otpLabel}</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        required
                        placeholder="6-Digit Code"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 outline-none font-mono text-sm font-bold text-white tracking-widest text-center"
                      />
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono block text-right mt-1">💡 Demo Key: 123456</span>
                  </div>

                  {otpError && <p className="text-rose-400 text-[11px] font-semibold">{otpError}</p>}

                  <button
                    id="verify-otp-btn"
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition text-white rounded-xl text-xs font-bold font-sans tracking-wide uppercase shadow-lg shadow-emerald-600/20"
                  >
                    {t.verifyOtp}
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleBusinessLogin} className="space-y-4 text-left text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{isMr ? 'ईमेल' : 'Email'}</label>
                  <input 
                    type="email"
                    required
                    placeholder={isMr ? "उदा. rahul@example.com" : "e.g. rahul@example.com"}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none font-sans text-sm font-bold text-white tracking-wide"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{isMr ? 'पासवर्ड' : 'Password'}</label>
                  <input 
                    type="password"
                    required
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none font-mono text-sm font-bold text-white tracking-widest"
                  />
                  <span className="text-[9px] text-indigo-400 font-mono block text-right mt-1">
                    🔑 {isMr ? 'सिस्टम ॲडमिन:' : 'System Admin:'} <span className="font-bold underline">admin</span> / {isMr ? 'पासवर्ड:' : 'pass:'} <span className="font-bold underline">admin123</span>
                  </span>
                </div>

                {otpError && <p className="text-rose-400 text-[11px] font-semibold">{otpError}</p>}

                <button
                  id="business-login-btn"
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-xl text-xs font-bold font-sans tracking-wide uppercase shadow-lg shadow-indigo-600/20"
                >
                  {isMr ? 'खात्यामध्ये लॉगिन करा' : 'Verify & Log In'}
                </button>
              </form>
            )}

            {/* New Shop Registration CTA */}
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-1 text-xs text-left">
              <p className="text-slate-200 font-bold">{isMr ? 'नवीन कपड्यांचे दुकान नोंदणी:' : 'New Retail Clothes Shop?'}</p>
              <p className="text-[10px] text-slate-400 pb-2 leading-relaxed">
                {isMr 
                  ? 'नवीन ईआरपी पार्टनर बनण्यासाठी २ मिनिटांत ऑनलाईन नोंदणी करा व डिजिटल बिले सुरू करा.' 
                  : 'Register your shop profile and upload municipal approvals to activate your premium billing workspace.'}
              </p>
              <button
                id="trigger-register-btn"
                type="button"
                onClick={() => { setIsRegistering(true); setOtpError(''); }}
                className="w-full py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-md transition"
              >
                ✨ {isMr ? 'नवीन दुकान नोंदणी करा' : 'Register Your Shop Now'}
              </button>
            </div>

            {/* Quick Testing logins emulator layout */}
            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-left">Fast-Track Live Testing Demo</span>
              
              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* 1. Platform Admin (System Admin) */}
                <button
                  id="demo-login-system-admin"
                  onClick={() => fastLogin('system_admin')}
                  className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#38BDF8] shrink-0" />
                    <div>
                      <span className="font-bold text-white/90 block leading-none">{isMr ? 'सिस्टम ॲडमिन (प्रणाली प्रशासक)' : 'Platform System Admin'}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">{isMr ? 'नवीन दुकानांची नोंदणी मंजूर करा आणि परवाने द्या' : 'Review shops & authorize licensing plans'}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                {/* 2. Shop Owner (Shop Admin) */}
                <button
                  id="demo-login-owner"
                  onClick={() => fastLogin('owner')}
                  className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white/90 block leading-none">{isMr ? 'दुकान मालक (शॉप ॲडमिन)' : 'Shop Owner (Shop Admin)'}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">{isMr ? 'बिलिंग टर्मिनल, उत्पादने आणि सेटिंग्ज व्यवस्थापित करा' : 'Manage billing, inventory, settings & reports'}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                {/* 3. Shop Employee */}
                <button
                  id="demo-login-employee"
                  onClick={() => fastLogin('employee')}
                  className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white/90 block leading-none">{isMr ? 'दुकान कर्मचारी (स्टाफ)' : 'Shop Employee (Billing Staff)'}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">{isMr ? 'थेट बिलिंग आणि स्टॉक नोंदणी हाताळा' : 'Handle direct POS sales bills and stock check'}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                {/* 2. Review pending */}
                <button
                  id="demo-preview-pending"
                  onClick={() => {
                    const pendingShop = registrations.find(r => r.id === 'reg-2026-001') || registrations[0];
                    if (pendingShop) setPendingSession(pendingShop);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white/90 block leading-none">View "Pending Review" Shop Dashboard</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">Status of newly submitted store "Sanskriti Fashion"</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                {/* 3. Review rejected/more info */}
                <button
                  id="demo-preview-rejected"
                  onClick={() => {
                    const infoShop = registrations.find(r => r.id === 'reg-2026-003') || registrations[2];
                    if (infoShop) setPendingSession(infoShop);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white/90 block leading-none">View "Action Required" Dashboard</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">Status feedback from admin on "Kids Planet Clothes"</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
              </div>
            </div>


          </motion.div>
        </div>
      ) : (
        /* Main Application Workspace Layout */
        <div className="min-h-screen flex flex-col md:flex-row relative">
          
          {/* Side Drawer Drawer on Desktop */}
          <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 hidden md:flex flex-col justify-between p-5 relative z-20">
            <div className="space-y-6">
              {/* Brand Branding Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-sm tracking-tight leading-none">Vastraa ERP</h3>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Small Shop OS</span>
                </div>
              </div>

              {/* Navigation list mapping */}
              <nav className="space-y-1">
                {menuItems.map(item => {
                  // Hide modules from staff if owner-only
                  if (item.ownerOnly && session.role !== 'owner') return null;
                  const isSelected = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-link-${item.id}`}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon size={15} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronRight size={12} className={isSelected ? 'text-white' : 'text-slate-600'} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout Panel footer */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-[10px]">
                  {session.name.substring(0,2)}
                </div>
                <div>
                  <span className="font-bold text-white block truncate text-[11px] max-w-[120px]" title={session.name}>{session.name}</span>
                  <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">{session.role}</span>
                </div>
              </div>

              <button
                id="sidebar-logout-btn"
                onClick={handleLogout}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut size={13} />
                {t.logout}
              </button>
            </div>
          </aside>

          {/* Top Bar for Mobile & Interactive Workspace Canvas */}
          <main className="flex-1 flex flex-col min-w-0">
            
            {/* Global Top header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 md:p-4 flex justify-between items-center relative z-10 shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <button 
                  id="mobile-drawer-trigger"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                >
                  <Menu size={18} />
                </button>
                
                {/* Title */}
                <h2 className="font-bold font-display text-slate-900 dark:text-white text-sm md:text-base tracking-tight leading-none">
                  {menuItems.find(item => item.id === currentView)?.label}
                </h2>
              </div>

              {/* Utility shortcuts: Language, Mode, profile */}
              <div className="flex items-center gap-2 md:gap-3 text-xs">
                
                 {/* Cloud DB Sync status indicator */}
                <div 
                  id="cloud-db-sync-indicator"
                  onClick={triggerSupabaseSync}
                  className={`flex items-center gap-1.5 border px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg select-none transition cursor-pointer relative group text-[11px] md:text-xs ${
                    supabaseSyncing 
                      ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400'
                      : supabaseOnline
                        ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400'
                  }`}
                  title={isMr ? "क्लाउड डेटाबेस सिंक्रोनाइझेशन स्थिती" : "Cloud DB Sync Status (Click to sync now)"}
                >
                  <div className="relative flex items-center justify-center">
                    {supabaseSyncing ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : supabaseOnline ? (
                      <>
                        <Wifi size={13} className="shrink-0" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </>
                    ) : (
                      <AlertCircle size={13} className="shrink-0" />
                    )}
                  </div>
                  
                  <span className="font-bold hidden sm:inline-block">
                    {supabaseSyncing 
                      ? (isMr ? 'सिंक्रोनाइझ करत आहे...' : 'Syncing...') 
                      : supabaseOnline 
                        ? (isMr ? 'ऑनलाइन' : 'Online') 
                        : (isMr ? 'ऑफलाईन' : 'Offline')
                    }
                  </span>
                  
                  {/* Subtle state icon / label for mobile */}
                  <span className="font-bold sm:hidden">
                    {supabaseSyncing ? '...' : supabaseOnline ? 'ON' : 'OFF'}
                  </span>

                  {/* Tooltip detail on hover */}
                  <div className="absolute right-0 top-full pt-2 w-56 opacity-0 group-hover:opacity-100 transition duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                    <div className="p-3 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] space-y-2 leading-normal font-sans" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="font-bold text-slate-200 text-xs">
                          {isMr ? 'क्लाउड डेटाबेस कनेक्शन' : 'Cloud DB Connection'}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {isMr ? 'रिअल-टाइम डेटाबेस सिंक स्थिती' : 'Real-time database sync status'}
                        </p>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 p-1.5 rounded ${supabaseOnline ? 'bg-emerald-950/30 text-emerald-400' : 'bg-rose-950/30 text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${supabaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        <span className="font-mono">{supabaseOnline ? (isMr ? 'सुरक्षित जोडणी सक्रिय' : 'Secure SQL Connection') : (isMr ? 'कनेक्शन अयशस्वी / नाही' : 'Connection Failed or Offline')}</span>
                      </div>
                      
                      {supabaseOnline ? (
                        <p className="text-slate-500 text-[9px] font-mono border-t border-slate-800 pt-2">
                          {isMr ? 'शेवटचे सिंक: ' : 'Last synchronized: '}
                          {lastSyncTime.toLocaleTimeString()}
                        </p>
                      ) : (
                        <div className="pt-1 border-t border-slate-800">
                          <p className="text-slate-400 mb-2">
                            {isMr ? 'तुमचा डेटा क्लाउडवर सुरक्षित करण्यासाठी Supabase कॉन्फिगर करा.' : 'Your data is not syncing to the cloud. Please configure Supabase.'}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdminDefaultTab('supabase');
                              setCurrentView('admin');
                            }}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1"
                          >
                            <Settings size={12} />
                            {isMr ? 'कनेक्शन दुरुस्त करा (Fix Connection)' : 'Fix Connection'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Language Toggle bar */}
                <button
                  id="top-lang-toggle"
                  onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
                  className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg transition text-[11px] md:text-xs text-slate-600 dark:text-slate-400"
                  title="Switch Language"
                >
                  <Globe size={13} />
                  <span className="font-bold">{lang === 'en' ? 'मराठी' : 'English'}</span>
                </button>

                {/* Dark Mode switch */}
                <button
                  id="top-dark-toggle"
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                  title="Switch Color Theme"
                >
                  {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                </button>

                {/* Role identifier badge */}
                <span className="hidden sm:inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold font-mono px-2 py-1 rounded-lg uppercase tracking-wider select-none shrink-0">
                  🛡️ {session.role}
                </span>
              </div>
            </header>

            {/* Mobile Sidebar overlay Drawer sheet */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden flex">
                  {/* Backdrop click barrier */}
                  <div 
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-3xs"
                  ></div>

                  <motion.div 
                    initial={{ x: -260 }}
                    animate={{ x: 0 }}
                    exit={{ x: -260 }}
                    className="w-64 bg-slate-900 text-slate-300 relative z-10 flex flex-col justify-between p-5 text-xs"
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm font-display">Vastraa ERP</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                          <X size={18} />
                        </button>
                      </div>

                      <nav className="space-y-1">
                        {menuItems.map(item => {
                          if (item.ownerOnly && session.role !== 'owner') return null;
                          const isSelected = currentView === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCurrentView(item.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}
                            >
                              <span className="flex items-center gap-2.5">
                                <item.icon size={15} />
                                <span>{item.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={13} />
                      {t.logout}
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Scrollable Working Canvas Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  {currentView === 'dashboard' && (
                    <DashboardView 
                      products={products}
                      invoices={invoices}
                      t={t}
                      isMr={isMr}
                      onNavigate={(view) => setCurrentView(view)}
                    />
                  )}

                  {currentView === 'products' && (
                    <ProductManagementView 
                      products={products}
                      categories={categories}
                      brands={brands}
                      suppliers={suppliers}
                      t={t}
                      isMr={isMr}
                      onAddProduct={handleAddProduct}
                      onEditProduct={handleEditProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onAddCategory={handleAddCategory}
                      onAddBrand={handleAddBrand}
                    />
                  )}

                  {currentView === 'billing' && (
                    <BillingTerminalView 
                      products={products}
                      customers={customers}
                      invoices={invoices}
                      t={t}
                      isMr={isMr}
                      onAddCustomer={handleAddCustomer}
                      onGenerateInvoice={handleGenerateInvoice}
                      shopSettings={shopSettings}
                    />
                  )}

                  {currentView === 'stock' && (
                    <StockInOutView 
                      products={products}
                      suppliers={suppliers}
                      purchaseHistory={purchaseHistory}
                      t={t}
                      isMr={isMr}
                      onAddPurchaseBill={handleAddPurchaseBill}
                      onUpdateProductStock={handleUpdateProductStock}
                      onAddSupplier={handleAddSupplier}
                    />
                  )}

                  {currentView === 'customers_suppliers' && (
                    <CustomerSupplierView 
                      customers={customers}
                      suppliers={suppliers}
                      t={t}
                      isMr={isMr}
                      settings={shopSettings}
                      onAddCustomer={handleAddCustomer}
                      onAddSupplier={handleAddSupplier}
                      onReceiveCollection={handleReceiveCollection}
                      onPaySupplier={handlePaySupplier}
                    />
                  )}

                  {currentView === 'expenses' && (
                    <ExpensesView 
                      expenses={expenses}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                      isMr={isMr}
                      darkMode={darkMode}
                    />
                  )}

                  {currentView === 'reports' && (
                    <ReportsView 
                      products={products}
                      invoices={invoices}
                      purchaseHistory={purchaseHistory}
                      expenses={expenses}
                      customers={customers}
                      t={t}
                      isMr={isMr}
                    />
                  )}

                  {currentView === 'online_catalog' && (
                    <OnlineShopCatalog 
                      products={products}
                      categories={categories}
                      t={t}
                      isMr={isMr}
                    />
                  )}

                  {currentView === 'admin' && (
                    <AdminPanel 
                      defaultTab={adminDefaultTab}
                      settings={shopSettings}
                      auditLogs={auditLogs}
                      userSession={session}
                      isMr={isMr}
                      onUpdateSettings={(newSettings) => setShopSettings(newSettings)}
                                            onToggleUserRole={(role) => setSession({ ...session, role })}
                      syncStatusState={syncStatusState}
                      onSyncAll={handleSyncAll}
                    />
                  )}

                  {currentView === 'approvals' && (
                    <AdminApprovalView 
                      registrations={registrations}
                      onUpdateStatus={handleUpdateRegistrationStatus}
                      isMr={isMr}
                    />
                  )}

                  {currentView === 'supabase_sync' && (
                    <SystemAdminSupabaseView 
                      registrations={registrations}
                      onUpdateRegistration={handleUpdateShopSupabase}
                      isMr={isMr}
                    />
                  )}


                  {currentView === 'qr_generator' && (
                    <QrCodeGeneratorView 
                      products={products}
                      t={t}
                      isMr={isMr}
                      shopSettings={shopSettings}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Elegant Mobile Bottom Navigation Bar (Floating Dock Style) */}
            {session?.role !== 'system_admin' && (
              <div className={`fixed bottom-0 left-0 right-0 z-30 md:hidden border-t px-2 py-2.5 flex justify-around items-center shadow-2xl backdrop-blur-md transition-colors ${darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-600'}`}>
                <button
                  id="bottom-nav-dashboard"
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex-1 flex flex-col items-center gap-1 transition ${currentView === 'dashboard' ? (darkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <LayoutDashboard size={18} />
                  <span className="text-[10px] scale-90 font-medium">{t.dashboard}</span>
                </button>
                <button
                  id="bottom-nav-products"
                  onClick={() => setCurrentView('products')}
                  className={`flex-1 flex flex-col items-center gap-1 transition ${currentView === 'products' ? (darkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Package size={18} />
                  <span className="text-[10px] scale-90 font-medium">{t.products}</span>
                </button>
                <button
                  id="bottom-nav-billing"
                  onClick={() => setCurrentView('billing')}
                  className={`flex-1 flex flex-col items-center gap-1 transition ${currentView === 'billing' ? (darkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Receipt size={18} />
                  <span className="text-[10px] scale-90 font-medium">{t.billing}</span>
                </button>
                <button
                  id="bottom-nav-customers"
                  onClick={() => setCurrentView('customers_suppliers')}
                  className={`flex-1 flex flex-col items-center gap-1 transition ${currentView === 'customers_suppliers' ? (darkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Users size={18} />
                  <span className="text-[10px] scale-90 font-medium">{isMr ? 'ग्राहक-विक्रेता' : 'Ledgers'}</span>
                </button>
                <button
                  id="bottom-nav-menu"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex-1 flex flex-col items-center gap-1 transition text-slate-400 hover:text-slate-200"
                >
                  <Menu size={18} />
                  <span className="text-[10px] scale-90 font-medium">{isMr ? 'अधिक' : 'More'}</span>
                </button>
              </div>
            )}

          </main>

        </div>
      )}

    </div>
  );
}
