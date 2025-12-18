import React, { useState } from 'react';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { loginAdmin } from '../services/api';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      await loginAdmin(password);
      onSuccess();
    } catch (err: any) {
      if (err?.status === 401) {
        setError('비밀번호가 올바르지 않습니다.');
      } else {
        setError(err?.message || '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center p-8 bg-white">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin</p>
            <h1 className="text-2xl font-black text-gray-900">관리자 로그인</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-4 h-4" /> 비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ADMIN_PASSWORD와 동일"
            className="w-full p-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition-all font-medium placeholder:text-gray-300"
          />
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || password.length < 4}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
              loading || password.length < 4
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-yellow-400 text-black active:scale-95 shadow-md'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '로그인'}
          </button>
        </form>

        <p className="text-xs text-gray-400 font-bold leading-relaxed">
          기본 비밀번호는 환경 변수 <span className="font-black text-gray-700">ADMIN_PASSWORD</span> (미지정 시 changeme123) 입니다.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
