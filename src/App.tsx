/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, User, FileText, CheckSquare, ShieldCheck, MapPin, 
  Sparkles, Lock, LogIn, ChevronRight, Bell, FileSpreadsheet, 
  LogOut, Layers, CreditCard, PlayCircle, HelpCircle, ArrowUpRight, 
  AlertCircle, CloudUpload, Download, CheckCircle2, Clock, Check, X,
  RefreshCw, Calendar, Eye, Landmark
} from 'lucide-react';

import AIExplanationAssistant from './components/AIExplanationAssistant';
import ConstructionGallery from './components/ConstructionGallery';
import AdminPortal from './components/AdminPortal';
import { User as UserType, Property, Document, Payment, Invoice, Notification, MediaType } from './types';

export default function App() {
  // Authentication & session state
  const [token, setToken] = useState<string | null>(localStorage.getItem('trust_portal_jwt'));
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Workspace layout tab
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PROPERTY' | 'DOCUMENTS' | 'PAYMENTS' | 'GALLERY' | 'AI_CHAT' | 'ADMIN'>('DASHBOARD');

  // Customer business data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Helper alerts
  const [alert, setAlert] = useState<{ title: string; text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Drag-and-drop document upload simulation state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('Sale Deed Agreement (Re-release)');

  // Alerts helper
  const triggerAlert = (title: string, text: string, type: 'success' | 'info' | 'error') => {
    setAlert({ title, text, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Pre-populate logins for frictionless testing
  const applyDemoLogin = (role: 'CUSTOMER' | 'ADMIN') => {
    if (role === 'ADMIN') {
      setAuthEmail('admin@elitehomes.com');
      setAuthPassword('admin123');
    } else {
      setAuthEmail('john.doe@gmail.com');
      setAuthPassword('john123');
    }
    triggerAlert('Credentials Pre-filled', `Painless credentials supplied for ${role}. Click Sign In!`, 'info');
  };

  // Auth fetch user profile
  const fetchProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        // Direct admins to Admin Cockpit by default, and customers to their Customer Dashboard
        if (data.user.role === 'ADMIN') {
          setActiveTab('ADMIN');
        } else {
          setActiveTab('DASHBOARD');
        }
      } else {
        // Token was invalid / expired
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  // Load customer or admin dashboards core business details
  const loadBusinessData = async () => {
    if (!token) return;
    setGlobalLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [propRes, docRes, payRes, invRes, notifRes, medRes] = await Promise.all([
        fetch('/api/properties', { headers }),
        fetch('/api/documents', { headers }),
        fetch('/api/payments', { headers }),
        fetch('/api/payments/invoices', { headers }),
        fetch('/api/notifications', { headers }),
        fetch('/api/media', { headers })
      ]);

      if (propRes.ok) setProperties(await propRes.ok ? await propRes.json() : []);
      if (docRes.ok) setDocuments(await docRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (medRes.ok) setMediaItems(await medRes.json());
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      loadBusinessData();
    }
  }, [currentUser, activeTab]);

  // Auth submit handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      triggerAlert('Inputs Required', 'Please enter both your email address and password.', 'error');
      return;
    }

    setAuthLoading(true);
    const url = isSignup ? '/api/auth/register' : '/api/auth/login';
    const payload = isSignup 
      ? { email: authEmail, password: authPassword, name: authName, phone: authPhone }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('trust_portal_jwt', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      triggerAlert(
        isSignup ? 'Account Created' : 'Access Approved', 
        `Welcome to Elite Homes Trust Workspace, ${data.user.name}!`, 
        'success'
      );
      
      // Clear forms
      setAuthPassword('');
      setAuthEmail('');
      setAuthName('');
      setAuthPhone('');
    } catch (err: any) {
      triggerAlert('Authentication Denied', err.message || 'Verification rejected.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('trust_portal_jwt');
    setToken(null);
    setCurrentUser(null);
    setProperties([]);
    setDocuments([]);
    setPayments([]);
    setInvoices([]);
    setNotifications([]);
    setMediaItems([]);
    triggerAlert('Session Closed', 'Your secure session has been terminated safely.', 'info');
  };

  // Standard payment clearing mockup
  const handlePayInstallment = async (id: string, number: number, amount: number) => {
    try {
      const res = await fetch(`/api/payments/${id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Payment gateway connection failed');
      }

      triggerAlert(
        'Payment Settled', 
        `Installment #${number} of INR ${amount.toLocaleString()} was settled successfully in the ledger. Receipt registered: ${data.invoice.invoiceNum}`, 
        'success'
      );
      
      // Refresh business indicators
      loadBusinessData();
    } catch (err: any) {
      triggerAlert('Transaction Failed', err.message || 'Gateway offline', 'error');
    }
  };

  // Mock File Drag Handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file.name);
    }
  };

  const handleManualFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0].name);
    }
  };

  const handleFileSelected = (fileName: string) => {
    setUploadProgress(10);
    // Simulate real upload speed increments
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(async () => {
            await finalizeDocumentUpload(fileName);
            setUploadProgress(null);
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const finalizeDocumentUpload = async (fileName: string) => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${uploadDocName} - ${fileName.split('.').slice(0, -1).join('.')}`,
          type: fileName.split('.').pop()?.toUpperCase() + ' Link',
          fileUrl: `https://elitehomes.com/vault/uploads/${Date.now()}_${encodeURIComponent(fileName)}`,
          remarks: 'Applicant drag-uploaded files directly from customer dashboard.'
        })
      });

      if (res.ok) {
        triggerAlert('Document Submitted', `Successfully registered file "${fileName}" in validation review queue!`, 'success');
        loadBusinessData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
    } catch (err: any) {
      triggerAlert('Upload Failed', err.message || 'System was unable to register file metadata.', 'error');
    }
  };

  // Notification mark as read
  const handleMarkNotifRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Common real estate calculations
  const totalCost = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remainingDue = totalCost - totalPaid;
  const paymentPercent = totalCost > 0 ? Math.round((totalPaid / totalCost) * 100) : 0;
  
  const pendingDocumentsCount = documents.filter(d => d.status !== 'APPROVED').length;
  const approvedDocumentsCount = documents.filter(d => d.status === 'APPROVED').length;

  const activeProperty = properties[0]; // standard primary plot selection

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 font-sans flex flex-col relative selection:bg-indigo-600 selection:text-white">
      
      {/* GLOBAL POP ALERT ALERT BOX */}
      {alert && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl border shadow-2xl flex gap-3 max-w-sm animate-bounce ${
          alert.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : alert.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            : 'bg-slate-900/95 border-indigo-500/40 text-slate-200'
        }`} id="pop-alert">
          {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">{alert.title}</h4>
            <p className="text-xs mt-0.5 leading-relaxed">{alert.text}</p>
          </div>
        </div>
      )}

      {/* --- NOT LOGGED IN LAYOUT --- */}
      {!token ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen overflow-hidden">
          
          {/* Brand Presentation Panel */}
          <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 md:p-16 flex flex-col justify-between border-r border-slate-900 relative">
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Logo */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-600/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-slate-100">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 tracking-tight">ELITE HOMES</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Customer Workspace</p>
              </div>
            </div>

            {/* Slogan */}
            <div className="my-12 relative z-10 space-y-4">
              <span className="text-[11px] font-bold tracking-widest text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase">
                Enterprise Integrity Portal
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Honoring Trust Through Absolute <span className="bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">Transparency</span>.
              </h2>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Welcome to your unified real estate dashboard. Statefully track construction progress, view verified documents, settle installments, and consult our compliance AI.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-900 text-xs">
                <div>
                  <h4 className="text-slate-200 font-bold">🛠️ Real-time Galleries</h4>
                  <p className="text-slate-500 mt-1">Verifiable drone walkthroughs & photo logs directly from site engineers.</p>
                </div>
                <div>
                  <h4 className="text-slate-200 font-bold">🤖 Gemini Support AI</h4>
                  <p className="text-slate-500 mt-1">Instantly explain dry legal titles or retrieve schedule figures.</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono relative z-10 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> 256-bit Secure TLS Data Encryption Layer
            </div>
          </div>

          {/* Form Credentials Verification Panel */}
          <div className="w-full lg:w-[480px] bg-slate-950 p-8 md:p-12 flex flex-col justify-center border-l border-slate-900/60 relative">
            <div className="max-w-sm w-full mx-auto space-y-6">
              
              <div className="space-y-1.5 p-1 bg-slate-900/40 border border-slate-900 rounded-xl">
                <div className="text-[10px] uppercase tracking-wider font-semibold font-mono text-indigo-500 text-center py-1">Quick Evaluation Accounts Pre-filler</div>
                <div className="grid grid-cols-2 gap-1 pb-1">
                  <button
                    onClick={() => applyDemoLogin('CUSTOMER')}
                    className="p-2 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded font-semibold transition flex items-center justify-center gap-1"
                  >
                    👤 Customer Doe
                  </button>
                  <button
                    onClick={() => applyDemoLogin('ADMIN')}
                    className="p-2 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded font-semibold transition flex items-center justify-center gap-1"
                  >
                    💼 Admin Eleanor
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100">{isSignup ? 'Create Secure Workspace' : 'Portal Secure Clearance'}</h3>
                <p className="text-xs text-slate-500 mt-1">Unlock property coordinates & legal status trackers</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {isSignup && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold uppercase">Legal Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold uppercase">Official Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (415) 555-0100"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Registered Email Coordinates</label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 hover:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Vault Password Key</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 hover:border-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-650/15 text-white bg-indigo text-slate-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {isSignup ? "Sign Up Workspace" : "Enter Dashboard Workspace"}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold font-mono"
                >
                  {isSignup ? "Existing Client? Login here" : "New Plots Buyer? Create Account"}
                </button>
              </div>

            </div>
          </div>

        </div>
      ) : (
        
        // --- LOGGED IN WORKSPACE ROOT ---
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-900 p-5 flex flex-col justify-between shrink-0">
            <div className="space-y-8">
              {/* Logo block */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5">
                  <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xs font-bold text-slate-100 leading-none">ELITE HOMES</h1>
                  <span className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-500">TRUST PORTAL</span>
                </div>
              </div>

              {/* User Profiling details */}
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-indigo-500/10 text-indigo-400 text-[8px] font-mono font-bold uppercase rounded-bl">
                  {currentUser.role}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-505/10 bg-indigo-950 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name[0]}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-200 truncate leading-none">{currentUser.name}</h3>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Tabs list links */}
              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-3 md:pb-0 scrollbar-none font-sans">
                {currentUser.role === 'ADMIN' ? (
                  <button
                    onClick={() => setActiveTab('ADMIN')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                      activeTab === 'ADMIN'
                        ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Administrative Cockpit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('DASHBOARD')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                        activeTab === 'DASHBOARD'
                          ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <Layers className="w-4 h-4" /> Overview Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('PROPERTY')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                        activeTab === 'PROPERTY'
                          ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Property Layout Details
                    </button>
                    <button
                      onClick={() => setActiveTab('DOCUMENTS')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                        activeTab === 'DOCUMENTS'
                          ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <FileText className="w-4 h-4" /> Document Steppers
                    </button>
                    <button
                      onClick={() => setActiveTab('PAYMENTS')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                        activeTab === 'PAYMENTS'
                          ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Payment Ledger Milestones
                    </button>
                    <button
                      onClick={() => setActiveTab('GALLERY')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left ${
                        activeTab === 'GALLERY'
                          ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" /> Live Visual Media Logs
                    </button>
                    <button
                      onClick={() => setActiveTab('AI_CHAT')}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer w-full text-left border relative ${
                        activeTab === 'AI_CHAT'
                          ? 'bg-indigo-600/15 border-indigo-500/25 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'border-slate-800/10 text-slate-400 hover:bg-slate-900/60 hover:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Consult Gemini AI
                      <span className="absolute -top-1.5 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none opacity-90 animate-pulse font-mono border border-slate-950">AI Support</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Logout block */}
            <div className="pt-6 border-t border-slate-900/80 mt-6 md:mt-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-slate-500 hover:text-indigo-450 hover:text-indigo-400 text-xs font-bold py-2 px-3 hover:bg-slate-900/40 rounded-xl transition cursor-pointer w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Terminate Session
              </button>
              <div className="text-[9px] text-slate-600 font-mono mt-3 px-3">
                UTC: {new Date().toISOString().substring(11, 16)} • EliteHomes Tech
              </div>
            </div>
          </aside>

          {/* Unified Central Content Board */}
          <main className="flex-1 bg-slate-950/20 p-4 md:p-8 overflow-y-auto space-y-6">
            
            {/* Top Workspace status Navbar */}
            <header className="flex items-center justify-between border-b border-slate-900 pb-5 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
                  {activeTab === 'DASHBOARD' && 'Property Trust Dashboard'}
                  {activeTab === 'PROPERTY' && 'Plot Allocation & Approvals'}
                  {activeTab === 'DOCUMENTS' && 'Legal Vault & Steppers'}
                  {activeTab === 'PAYMENTS' && 'Financial Ledger Milestones'}
                  {activeTab === 'GALLERY' && 'Live Progress Gallery'}
                  {activeTab === 'AI_CHAT' && 'Gemini AI Assistant'}
                  {activeTab === 'ADMIN' && 'Administrative cockpit control'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Logged in safely as <strong className="text-slate-350">{currentUser.name}</strong> ({currentUser.email})
                </p>
              </div>

              {/* Utility Panel (Notification bells) */}
              <div className="flex items-center gap-3 shrink-0 relative">
                <button
                  onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850/80 hover:text-indigo-400 transition text-slate-400 relative"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center font-mono border border-slate-950">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>

                {/* Drawers: active notifications logs dropdown */}
                {notifDrawerOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3" id="notif-drawer">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-extrabold text-slate-200">System Notification Alerts</h4>
                      <button onClick={() => setNotifDrawerOpen(false)} className="text-[10px] text-slate-500 hover:text-slate-300">Close</button>
                    </div>
                    
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-4">No incoming alerts logged.</p>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkNotifRead(n.id)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                              n.isRead 
                                ? 'bg-slate-950/40 border-slate-900/60 opacity-60' 
                                : 'bg-slate-950/90 border-slate-800 hover:border-indigo-500/40'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-slate-250 leading-tight">{n.title}</h5>
                              {!n.isRead && <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full shrink-0 mt-1 animate-pulse" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-snug">{n.message}</p>
                            <span className="text-[9px] font-mono text-slate-650 block text-right mt-1.5">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* --- ADMIN ACCESS PANEL --- */}
            {activeTab === 'ADMIN' && currentUser.role === 'ADMIN' && (
              <AdminPortal token={token} onSendAlert={triggerAlert} />
            )}

            {/* --- CUSTOMER DASHBOARD OVERVIEW --- */}
            {activeTab === 'DASHBOARD' && currentUser.role === 'CUSTOMER' && (
              <div className="space-y-6">
                
                {/* 1. Welcoming Hero Panel */}
                <div className="p-6 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">Verified Real Estate Owner Member</span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-white">Welcome back, {currentUser.name}!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                        At **Elite Homes**, we publish every concrete pour weight log, municipal tax ledger entry, and compliance check directly. Monitor your plot particulars below.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setActiveTab('AI_CHAT')}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer self-start md:self-auto transition"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" /> Ask Compliance AI
                    </button>
                  </div>
                </div>

                {/* 2. Key Metrics dashboard grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Metric 1 */}
                  <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium font-sans">Allocated Property</span>
                      <Building2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">{activeProperty ? activeProperty.plotNumber : 'N/A Pending'}</h4>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{activeProperty ? activeProperty.location.split(',')[0] : 'Contact Eleanor Vance'}</p>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium font-sans">Payment Completion %</span>
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">{paymentPercent}% Settled</h4>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850 mt-1">
                        <div className="bg-emerald-500 h-full rounded" style={{ width: `${paymentPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Verified Documents</span>
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">{approvedDocumentsCount} Approved</h4>
                      <p className="text-[10px] text-amber-500 font-mono">{pendingDocumentsCount} files in review pipeline</p>
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Construction Progress</span>
                      <Layers className="w-4 h-4 text-indigo-450 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">{activeProperty ? activeProperty.constructionStatus : 0}% Complete</h4>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850 mt-1">
                        <div className="bg-indigo-505 bg-indigo-500 h-full rounded" style={{ width: `${activeProperty ? activeProperty.constructionStatus : 0}%` }} />
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. Splitting: stepper workflow summary + payments overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Quick stepper review panel card */}
                  <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" /> Essential Verification steppers
                      </h3>
                      <button
                        onClick={() => setActiveTab('DOCUMENTS')}
                        className="text-xs text-indigo-450 text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        Vault Space <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {documents.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <strong className="text-xs text-slate-200">{doc.name}</strong>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                              doc.status === 'APPROVED' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : doc.status === 'UNDER_REVIEW'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-505/10 bg-indigo-950/40 border border-indigo-500/20 text-indigo-400'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          
                          {/* visual timeline indicator */}
                          <div className="flex items-center gap-1">
                            <div className={`h-1.5 flex-1 rounded ${doc.status === 'APPROVED' || doc.status === 'VERIFIED' || doc.status === 'UNDER_REVIEW' || doc.status === 'UPLOADED' ? 'bg-indigo-500/80' : 'bg-slate-800'}`} />
                            <div className={`h-1.5 flex-1 rounded ${doc.status === 'APPROVED' || doc.status === 'VERIFIED' || doc.status === 'UNDER_REVIEW' ? 'bg-indigo-450 bg-indigo-500/60' : 'bg-slate-800'}`} />
                            <div className={`h-1.5 flex-1 rounded ${doc.status === 'APPROVED' || doc.status === 'VERIFIED' ? 'bg-indigo-500/40' : 'bg-slate-800'}`} />
                            <div className={`h-1.5 flex-1 rounded ${doc.status === 'APPROVED' ? 'bg-emerald-500/80' : 'bg-slate-800'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billings Summary card */}
                  <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4.5 h-4.5 text-indigo-400" /> Settle Pending Milestones
                      </h3>
                      <button
                        onClick={() => setActiveTab('PAYMENTS')}
                        className="text-xs text-indigo-450 text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        All Milestones <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {payments.filter(p => p.status !== 'PAID').slice(0, 2).map((p) => (
                        <div key={p.id} className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-mono text-indigo-400 font-bold">Installment Milestones #{p.installmentNumber}</span>
                            <h4 className="text-sm font-extrabold text-slate-100 mt-0.5">INR {(p.amountDue).toLocaleString()}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Due date limit: {new Date(p.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePayInstallment(p.id, p.installmentNumber, p.amountDue)}
                            className="bg-emerald-650 hover:bg-emerald-600 bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/10 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                          >
                            Pay Milestone
                          </button>
                        </div>
                      ))}
                      {payments.filter(p => p.status !== 'PAID').length === 0 && (
                        <div className="text-center py-6 text-xs text-slate-550 border border-dashed border-slate-800 rounded-xl">
                          🎉 Beautiful job! All outstanding milestones paid and settled.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* --- CUSTOMER PROPERTY INFORMATION DETAILS --- */}
            {activeTab === 'PROPERTY' && (
              <div className="space-y-6">
                {activeProperty ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Columns 1 & 2: Detailed ground statistics */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Property stats detail core */}
                      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
                        <div className="border-b border-slate-800 pb-4">
                          <h3 className="text-base font-extrabold text-slate-100">{activeProperty.plotNumber} - Core Plot specifications</h3>
                          <p className="text-xs text-slate-400 mt-1">{activeProperty.location}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium block">Owner Allocation Entity</span>
                            <strong className="text-slate-200 mt-1 block">{currentUser.name}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Plot Area Parameters</span>
                            <strong className="text-slate-200 mt-1 block">{activeProperty.plotSize}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Current construction Stage</span>
                            <strong className="text-indigo-400 mt-1 block">{activeProperty.projectPhase}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Municipal legal titles Audit</span>
                            <strong className="text-emerald-400 mt-1 block flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Title Clear Certificate
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Engineering Structural verification</span>
                            <strong className="text-emerald-400 mt-1 block">Soil Bearing Tested OK</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Developer coordinates registration</span>
                            <strong className="text-slate-400 mt-1 block font-mono">EHMD-{activeProperty.id.substring(0,8).toUpperCase()}</strong>
                          </div>
                        </div>

                        {/* Maps Grounding container */}
                        <div className="border-t border-slate-800 pt-5 space-y-3">
                          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin className="text-indigo-400 w-4 h-4" /> Integrated Plot GPS coordinates
                          </h4>
                          <div className="w-full aspect-[21/9] bg-slate-950 rounded-xl border border-slate-850 overflow-hidden relative">
                            {/* Simple simulated maps vector */}
                            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-10 flex items-center justify-center p-6 text-center">
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-sm space-y-2 text-slate-300">
                                <MapPin className="text-indigo-400 w-7 h-7 mx-auto animate-bounce" />
                                <strong className="text-xs text-slate-100 block">Elite Meadows Development Phase 2</strong>
                                <p className="text-[10px] text-slate-500">Official geographical layout: Latitude 12.91414, Longitude 77.71212. Grounded securely with real estate registry coordinates.</p>
                                <a 
                                  href={activeProperty.googleMapsUrl || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-slate-800 border border-indigo-500 text-white rounded px-2 py-1 text-[10px] font-mono select-none"
                                >
                                  Open Google Maps satellite <ArrowUpRight className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                            <div className="w-full h-full opacity-40 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] bg-indigo-950" />
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Column 3: Amenities and downloadable assets */}
                    <div className="space-y-6">
                      
                      {/* Amenities checklist */}
                      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                          🎁 Allocated Layout Amenities
                        </h4>
                        <div className="space-y-2.5">
                          {activeProperty.amenities.map((am, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{am}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Download brochure */}
                      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3.5">
                        <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                        <div>
                          <strong className="text-xs text-slate-200 block">Download official structural blueprints</strong>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Revision Level: MEAD-2.4 (PDF size: 12.4 MB)</span>
                        </div>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); triggerAlert('Brochure Downloaded', 'The high-resolution architectural layout PDF was saved.', 'success'); }}
                          className="w-full py-2 bg-slate-950 hover:bg-indigo-650 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-350 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" /> Save Official Brochure
                        </a>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                    No allocated layout plot registered yet of your customer profile.
                  </div>
                )}
              </div>
            )}

            {/* --- LEGAL SYSTEM STEPPERS & DOCUMENT ARCHIVES --- */}
            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-6">
                
                {/* steppers dashboard overview */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" /> Title Deed & Soil Mechanics Verification steppers
                      </h3>
                      <p className="text-xs text-slate-500">Every legal file undergoes a strict 4-step compliance audit process before stamp registration.</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono rounded-lg">
                      {approvedDocumentsCount}/{documents.length} approved
                    </span>
                  </div>

                  {/* Complete 4 step master timeline map */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                    
                    <div className="p-4 bg-slate-950/60 border border-indigo-500/10 rounded-xl space-y-2 relative">
                      <div className="text-[10px] uppercase font-mono font-bold text-indigo-400 flex items-center gap-1">
                        <span className="h-4 w-4 bg-indigo-600 text-slate-100 rounded-full flex items-center justify-center text-[8px]">1</span> 
                        Uploaded File
                      </div>
                      <p className="text-[10px] text-slate-500">Client commits PDF receipts or draft contracts to vault space.</p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-indigo-500/15 rounded-xl space-y-2">
                      <div className="text-[10px] uppercase font-mono font-bold text-amber-500 flex items-center gap-1">
                        <span className="h-4 w-4 bg-amber-600 text-slate-100 rounded-full flex items-center justify-center text-[8px]">2</span> 
                        Under Review
                      </div>
                      <p className="text-[10px] text-slate-500">Expert on-site builder architects evaluate material load metrics.</p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-indigo-500/10 rounded-xl space-y-2">
                      <div className="text-[10px] uppercase font-mono font-bold text-indigo-450 text-indigo-400 flex items-center gap-1">
                        <span className="h-4 w-4 bg-indigo-500 text-slate-100 rounded-full flex items-center justify-center text-[8px]">3</span> 
                        Verified Log
                      </div>
                      <p className="text-[10px] text-slate-500">Notary audits municipal tax records against zoning codes.</p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-indigo-500/10 rounded-xl space-y-2">
                      <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <span className="h-4 w-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px]">4</span> 
                        Approved Stamp
                      </div>
                      <p className="text-[10px] text-slate-500">Legal clearance sealed and registered in local municipal sub-portal.</p>
                    </div>

                  </div>
                </div>

                {/* Grid: Document uploading + active list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Upload Simulator Container box */}
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                          <CloudUpload className="text-indigo-400 w-4.5 h-4.5" /> Submit Compliance files
                        </h4>
                        <p className="text-[11px] text-slate-500">Post municipal tax papers, title clear contracts, or drafts.</p>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Document category Name</label>
                          <select
                            value={uploadDocName}
                            onChange={(e) => setUploadDocName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Sale Deed Draft">Sale Deed Agreement</option>
                            <option value="Municipal Tax receipt">Tax Documents</option>
                            <option value="Soil Mechanics report">Soil Report</option>
                            <option value="Registration Copy Draft">Registration Copy</option>
                            <option value="Legal clearance contract">Legal Clearance</option>
                          </select>
                        </div>

                        {/* Interactive Drag Drop Grid boxes */}
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('drag-input')?.click()}
                          className={`aspect-video rounded-xl border border-dashed text-center flex flex-col items-center justify-center p-4 cursor-pointer transition relative overflow-hidden ${
                            dragActive 
                              ? 'bg-indigo-650/15 border-indigo-500' 
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700/60'
                          }`}
                        >
                          <input
                            type="file"
                            id="drag-input"
                            className="hidden"
                            onChange={handleManualFileInput}
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                          {uploadProgress !== null ? (
                            <div className="space-y-2">
                              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                              <strong className="text-[11px] tracking-wide text-slate-400 block font-bold uppercase font-mono">Uploading: {uploadProgress}%</strong>
                              <div className="w-24 bg-slate-900 border border-slate-800 h-1.5 rounded-full mx-auto overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-slate-400">
                              <CloudUpload className="w-7 h-7 mx-auto text-slate-500 animate-pulse" />
                              <strong className="text-[11px] block text-slate-200 font-semibold">Drag file here</strong>
                              <span className="text-[10px] text-slate-550 block font-mono">Accepts PDF, JPG (Limit: 5MB)</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* File List Columns */}
                  <div className="lg:col-span-2 space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="p-1 px-2.5 bg-slate-950 text-slate-400 font-mono text-[9px] border border-slate-850 rounded uppercase font-semibold">
                              {doc.type}
                            </span>
                            
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                              doc.status === 'APPROVED' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : doc.status === 'UNDER_REVIEW'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : doc.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-450 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-950 border border-slate-800 text-slate-400'
                            }`}>
                              ● {doc.status}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-100">{doc.name}</h4>
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4">
                            <span>Uploaded: <strong className="text-slate-440 text-slate-400 font-mono">{new Date(doc.uploadedAt).toLocaleDateString()}</strong></span>
                            {doc.remarks && <span className="text-slate-400 italic">Auditor remark: "{doc.remarks}"</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2shrink-0 justify-end mt-2 md:mt-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:text-indigo-400 text-slate-350 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 animate-pulse" /> Read Document
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            )}

            {/* --- INVOICES AND PAYMENTS --- */}
            {activeTab === 'PAYMENTS' && (
              <div className="space-y-6">
                
                {/* Visual funding indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium font-sans">Total Plots Cost (Blueprints)</span>
                      <strong className="text-xl font-extrabold text-slate-100 mt-1 block font-mono">INR {totalCost.toLocaleString()}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-450 text-indigo-400 flex items-center justify-center">
                      <Landmark className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium font-sans">Milestone Funds Settled</span>
                      <strong className="text-xl font-extrabold text-emerald-400 mt-1 block font-mono">INR {totalPaid.toLocaleString()}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium font-sans">Residual Outstanding due</span>
                      <strong className="text-xl font-extrabold text-amber-500 mt-1 block font-mono">INR {remainingDue.toLocaleString()}</strong>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-505/10 bg-amber-950 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                  </div>

                </div>

                {/* Complete Transaction installment grid layout */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  
                  <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-sm font-bold uppercase text-slate-100 tracking-wide">Historical Milestone Installments</h3>
                    <span className="text-xs text-slate-500 font-medium">Verify structural milestones triggered by builders below</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-mono font-bold uppercase border-b border-slate-800">
                          <th className="p-4">Installment Milestone</th>
                          <th className="p-4">Project Construction Milestone</th>
                          <th className="p-4 text-right">Required valuation</th>
                          <th className="p-4 text-right">Settled Amount</th>
                          <th className="p-4 text-center">Status badge</th>
                          <th className="p-4 text-center">Receipts Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-350 bg-slate-900/10">
                        {payments.map((p, idx) => {
                          const paymentInvoice = invoices.find(inv => inv.paymentId === p.id);
                          return (
                            <tr key={p.id || idx} className="hover:bg-slate-900/40 transition">
                              <td className="p-4">
                                <div className="font-extrabold text-slate-100 uppercase tracking-widest font-mono text-xs">Milestone #{p.installmentNumber}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="w-3.5 h-3.5" /> Due: {new Date(p.dueDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-4 text-slate-300">
                                {p.installmentNumber === 1 && 'Land Booking & Plots Reservation Clearances'}
                                {p.installmentNumber === 2 && 'Geotechnical footing digging, soil stabilization & steel castings'}
                                {p.installmentNumber === 3 && 'Ground level concrete core castings, pillar structures'}
                                {p.installmentNumber === 4 && 'Brick partitions skeleton work, electrical optical pipeline integration'}
                                {p.installmentNumber === 5 && 'Plastering, interior woodwork, smart sewage clearances'}
                                {p.installmentNumber > 5 && 'Subsequent structural layout completions'}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-slate-150">
                                INR {(p.amountDue).toLocaleString()}
                              </td>
                              <td className="p-4 text-right font-mono text-emerald-450 font-bold text-emerald-400">
                                INR {(p.amountPaid).toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full inline-block ${
                                  p.status === 'PAID' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : p.status === 'OVERDUE'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-505/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {p.status === 'PAID' ? (
                                  paymentInvoice ? (
                                    <button
                                      onClick={() => { triggerAlert('Receipt Downloaded', `Invoice ledger ${paymentInvoice.invoiceNum} saved locally as physical record.`, 'success'); }}
                                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded text-[10px] text-slate-400 hover:text-slate-200 transition font-mono inline-flex items-center gap-1 font-semibold"
                                    >
                                      <Download className="w-3 h-3 text-indigo-400" /> {paymentInvoice.invoiceNum.substring(0, 12)}...
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => { triggerAlert('Generating Invoice...', 'Verifying block confirmations. Safe download link triggered within workspace.', 'info'); }}
                                      className="px-2.5 py-1 bg-slate-950 text-slate-500 rounded text-[10px] inline-block font-mono"
                                    >
                                      📄 Generating Inv...
                                    </button>
                                  )
                                ) : (
                                  <button
                                    onClick={() => handlePayInstallment(p.id, p.installmentNumber, p.amountDue)}
                                    className="px-3 py-1 bg-emerald-650 hover:bg-emerald-600 bg-emerald-600 hover:shadow-lg text-white text-[10px] rounded font-bold transition inline-block uppercase"
                                  >
                                    Settle due
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            )}

            {/* --- LIVE GALLERY PROGRESS LOGS --- */}
            {activeTab === 'GALLERY' && (
              <ConstructionGallery mediaItems={mediaItems} />
            )}

            {/* --- SMART AI COMPLIANCE CHATBOT ASSISTANT --- */}
            {activeTab === 'AI_CHAT' && (
              <AIExplanationAssistant token={token} onSendAlert={triggerAlert} />
            )}

          </main>
        </div>

      )}

    </div>
  );
}
