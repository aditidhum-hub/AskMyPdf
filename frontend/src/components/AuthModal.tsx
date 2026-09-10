import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Mail, ShieldCheck, LogOut, FolderPlus, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { User, Workspace } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onLoginSuccess: (user: User, token: string, workspaces: Workspace[]) => void;
  onLogout: () => void;
  onCreateWorkspace: (name: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onLoginSuccess,
  onLogout,
  onCreateWorkspace,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'signin' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication request failed.');
      }

      onLoginSuccess(data.user, data.token, data.workspaces || []);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      setLoading(true);
      await onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {currentUser ? 'Enterprise Account & Workspaces' : 'AskMyPDF Cloud Access'}
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                {currentUser ? currentUser.email : 'Sync documents, citations & private sessions'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Signed In As</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{currentUser.name}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Workspaces Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Private Workspaces
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {workspaces.length} Folders
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => onSelectWorkspace(ws.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Create Workspace Folder */}
                <form onSubmit={handleAddWorkspace} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="New workspace folder..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newWorkspaceName.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </button>
                </form>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close & Return to Document
              </button>
            </div>
          ) : (
            /* Sign In / Sign Up Tabs */
            <div>
              <div className="flex border-b border-slate-200 mb-5">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(null); }}
                  className={`flex-1 pb-3 text-xs font-bold transition-all ${
                    mode === 'signin'
                      ? 'border-b-2 border-indigo-600 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(null); }}
                  className={`flex-1 pb-3 text-xs font-bold transition-all ${
                    mode === 'signup'
                      ? 'border-b-2 border-indigo-600 text-indigo-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Eleanor Vance"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eleanor@enterprise.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Minimum 6 characters</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Guest mode is active by default. You can read, highlight, and chat without an account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
