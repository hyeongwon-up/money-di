import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from 'recharts';
import { Wallet, TrendingUp, PieChart as PieChartIcon, PlusCircle, History, Trash2, Edit2, Info, Building2, AlertCircle, LayoutGrid, Lock, Lightbulb, Calendar } from 'lucide-react';
import ThoughtsView from './components/ThoughtsView';
import SpendingPlanView from './components/SpendingPlanView';

// API Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_URL;

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '0153';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const INITIAL_CATEGORIES = {
  SAVINGS: { label: '예금', emoji: '💰', color: '#3b82f6' },
  INSTALLMENT: { label: '적금', emoji: '🏦', color: '#10b981' },
  STOCK: { label: '주식', emoji: '📈', color: '#f59e0b' },
  CRYPTO: { label: '암호화폐', emoji: '🪙', color: '#ef4444' },
  REAL_ESTATE: { label: '부동산', emoji: '🏠', color: '#8b5cf6' },
  DEBT: { label: '대출/부채', emoji: '💸', color: '#ef4444', isLiability: true },
  OTHER: { label: '기타', emoji: '⚙️', color: '#64748b' }
};

const App = () => {
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', category: 'SAVINGS', platform: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'thoughts' | 'spending'

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // 이력 수정 핸들러 추가
  const handleHistoryUpdate = async (historyItem) => {
    const newAmount = prompt(`${historyItem.recordedDate}의 순 자산 금액을 수정하시겠습니까? (현재: ₩${historyItem.totalAmount.toLocaleString()})`, historyItem.totalAmount);
    if (newAmount === null || isNaN(newAmount)) return;

    try {
      setLoading(true);
      await axios.put(`/api/assets/history/${historyItem.id}`, {
        ...historyItem,
        totalAmount: parseInt(newAmount, 10)
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to update history', error);
      alert('이력 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 부동산/대출 포함 여부 플래그
  const [includeRealEstate, setIncludeRealEstate] = useState(true);

  // 플랫폼 분포 그래프용 카테고리 필터 상태
  const [selectedChartCategory, setSelectedChartCategory] = useState('TOTAL');

  // 상세 자산 현황 리스트 카테고리 필터 상태
  const [selectedListCategory, setSelectedListCategory] = useState('TOTAL');

  // 차트용 history 보정 (부동산 제외시 현재 기준 부동산+부채 총합을 과거 12/25 이후 데이터에서 차감하여 유동자산 추이 파악)
  const realEstateAndDebtTotal = assets
    .filter(a => a.category === 'REAL_ESTATE' || a.category === 'DEBT')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const chartHistory = history.map(h => {
    if (!includeRealEstate && new Date(h.recordedDate) >= new Date('2025-12-25')) {
      return { ...h, totalAmount: h.totalAmount - realEstateAndDebtTotal };
    }
    return h;
  });

  const fetchData = async () => {
    try {
      const [assetRes, historyRes] = await Promise.all([
        axios.get('/api/assets'),
        axios.get('/api/assets/history')
      ]);
      setAssets(assetRes.data);
      setHistory(historyRes.data.sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate)));
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Health check polling
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/api/health', { timeout: 5000 });
        setIsServerOnline(true);
      } catch (error) {
        setIsServerOnline(false);
      }
    };
    checkHealth(); // Initial check
    const interval = setInterval(checkHealth, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    setLoading(true);
    try {
      if (editingId) await axios.put(`/api/assets/${editingId}`, form);
      else await axios.post('/api/assets', form);
      setForm({ name: '', amount: '', category: 'SAVINGS', platform: '', description: '' });
      setEditingId(null);
      await fetchData();
    } catch (error) { console.error('Failed to save asset', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/assets/${id}`);
      await fetchData();
    } catch (error) { console.error('Failed to delete asset', error); }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.id);
    setForm({ name: asset.name, amount: asset.amount, category: asset.category, platform: asset.platform || '', description: asset.description || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 부동산/대출 필터링된 현재 자산 목록
  const activeAssets = includeRealEstate
    ? assets
    : assets.filter(a => a.category !== 'REAL_ESTATE' && a.category !== 'DEBT');

  // 총 순자산 계산 (DB에 부채가 이미 ─음수로 저장되어 있으므로 단순히 합산)
  const totalAmount = activeAssets.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // 카테고리별 비중 데이터
  const categorySummary = Object.keys(INITIAL_CATEGORIES).map(key => {
    const total = activeAssets.filter(a => a.category === key).reduce((sum, a) => sum + Number(a.amount), 0);
    return { name: INITIAL_CATEGORIES[key].label, value: Math.abs(total), fill: INITIAL_CATEGORIES[key].color };
  }).filter(item => item.value > 0);

  // 플랫폼별 분포 데이터 (선택된 카테고리에 따라 필터링)
  const filteredAssetsForChart = selectedChartCategory === 'TOTAL'
    ? activeAssets
    : activeAssets.filter(a => a.category === selectedChartCategory);

  const categoryTotalForChart = filteredAssetsForChart.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  const platformSummary = filteredAssetsForChart.reduce((acc, curr) => {
    const p = curr.platform || '기타';
    const amt = Math.abs(Number(curr.amount));
    const existing = acc.find(item => item.name === p);
    if (existing) existing.value += amt;
    else acc.push({ name: p, value: amt });
    return acc;
  }, []).map(item => ({
    ...item,
    percent: categoryTotalForChart > 0 ? ((item.value / categoryTotalForChart) * 100).toFixed(1) : 0
  })).sort((a, b) => b.value - a.value);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === APP_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasswordInput('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">MONEY DI</h1>
          <p className="text-slate-500 mb-8 font-bold text-sm">자산 관리 시스템에 접속하려면 비밀번호를 입력하세요</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호"
                className={`w-full p-4 bg-slate-50 border rounded-xl text-center text-lg tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${loginError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                autoFocus
              />
              {loginError && <p className="text-red-500 text-xs font-bold mt-2">비밀번호가 올바르지 않습니다.</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <nav className="bg-white border-b px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg"><Wallet className="text-white w-6 h-6" /></div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight">MONEY DI</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 px-2 sm:px-3 py-1 rounded-full border border-slate-200" title={isServerOnline ? '서버 정상 연결 중' : '서버 연결 실패'}>
              <span className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600 hidden sm:inline">{isServerOnline ? 'API 연동됨' : '연결 끊김'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl font-bold text-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <TrendingUp className="w-4 h-4" /> 자산 현황
              </button>
              <button
                onClick={() => setActiveTab('thoughts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'thoughts' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Lightbulb className="w-4 h-4" /> 생각 정리
              </button>
              <button
                onClick={() => setActiveTab('spending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'spending' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Calendar className="w-4 h-4" /> 지출 계획
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-slate-100 ${totalAmount >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                순 자산: ₩ {totalAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 탭 내용 라우팅 */}
      {activeTab === 'thoughts' ? (
        <div className="pt-8 px-6">
          <ThoughtsView />
        </div>
      ) : activeTab === 'spending' ? (
        <div className="pt-8 px-6">
          <SpendingPlanView />
        </div>
      ) : (
        <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
          {/* 상단 그래프 생략 (동일) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /><h3 className="text-xl font-bold">순 자산 변화 추이</h3></div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded cursor-pointer" checked={includeRealEstate} onChange={(e) => setIncludeRealEstate(e.target.checked)} />
                <span className="text-sm font-bold text-slate-700">부동산/대출 포함 여부</span>
              </label>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="recordedDate" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `₩${(val / 100000000).toFixed(1)}억`} />
                  <Tooltip formatter={(val) => `₩${Number(val).toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 6, stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                    activeDot={{ r: 8, stroke: '#2563eb', strokeWidth: 2, onClick: (e, payload) => handleHistoryUpdate(payload.payload) }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 중단: 시각화 분석 (수정된 섹션) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-blue-600" /> 카테고리 비중</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorySummary} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {categorySummary.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `₩${Number(val).toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> 플랫폼별 상세 분포</h3>
                {/* 카테고리 선택 필터 */}
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0">
                  <button onClick={() => setSelectedChartCategory('TOTAL')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedChartCategory === 'TOTAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체</button>
                  {Object.entries(INITIAL_CATEGORIES).map(([key, { label }]) => (
                    <button key={key} onClick={() => setSelectedChartCategory(key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedChartCategory === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="h-[300px]">
                {platformSummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformSummary} layout="vertical" margin={{ left: 20, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
                                <p className="font-bold text-slate-800 mb-1">{payload[0].payload.name}</p>
                                <p className="text-blue-600 font-black">₩ {Number(payload[0].value).toLocaleString()}</p>
                                <p className="text-slate-400">비중: {payload[0].payload.percent}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={25}>
                        {platformSummary.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        <LabelList
                          dataKey="percent"
                          position="right"
                          formatter={(val) => `${val}% (₩${(platformSummary.find(p => p.percent === val)?.value / 10000).toLocaleString()}만)`}
                          style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                    <LayoutGrid className="w-10 h-10 mb-2 opacity-20" />
                    해당 카테고리에 등록된 자산이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 관리 도구 생략 (동일) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">{editingId ? <Edit2 className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-blue-600" />}{editingId ? '자산 정보 수정' : '새 자산 등록'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">카테고리</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.entries(INITIAL_CATEGORIES).map(([key, { label, emoji }]) => <option key={key} value={key}>{emoji} {label}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">플랫폼/금융사</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="예: 국민은행, 미래에셋" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} /></div>
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">자산 명</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="예: 적금, 삼성전자" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">금액 (원)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">상세 정보 (메모)</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="flex gap-2 pt-2">{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', amount: '', category: 'SAVINGS', platform: '', description: '' }) }} className="flex-1 bg-slate-200 p-4 rounded-xl font-bold">취소</button>}<button disabled={loading} className={`flex-[2] p-4 rounded-xl font-bold text-white shadow-lg ${editingId ? 'bg-orange-500' : 'bg-blue-600'}`}>{loading ? '처리 중...' : editingId ? '수정 완료' : '등록하기'}</button></div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /><h3 className="text-xl font-bold">상세 자산 현황</h3></div>

                  {/* 리스트 카테고리 필터 (Pill 버튼 형태) */}
                  <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button onClick={() => setSelectedListCategory('TOTAL')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedListCategory === 'TOTAL' ? 'bg-blue-600 text-white shadow-md cursor-default' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체 보기</button>
                    {Object.entries(INITIAL_CATEGORIES).map(([key, { label, emoji }]) => (
                      <button key={key} onClick={() => setSelectedListCategory(key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedListCategory === key ? 'bg-blue-600 text-white shadow-md cursor-default' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{emoji} {label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  {Object.entries(INITIAL_CATEGORIES)
                    .filter(([catKey, _]) => selectedListCategory === 'TOTAL' || selectedListCategory === catKey)
                    .map(([catKey, catInfo]) => {
                      const catAssets = assets.filter(a => a.category === catKey);
                      if (catAssets.length === 0) return null;
                      return (
                        <div key={catKey}>
                          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-slate-100 border-b pb-2">
                            <span className="text-xl">{catInfo.emoji}</span> {catInfo.label}
                            <span className="text-xs font-bold text-slate-400 ml-auto bg-slate-100 px-2 py-1 rounded-full">
                              합계: ₩ {catAssets.reduce((sum, a) => sum + Number(a.amount), 0).toLocaleString()}
                            </span>
                          </h4>
                          <div className="space-y-4">
                            {catAssets.map((asset) => (
                              <div key={asset.id} className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center">
                                  <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${INITIAL_CATEGORIES[asset.category]?.isLiability ? 'bg-red-50' : 'bg-slate-50'}`}>{INITIAL_CATEGORIES[asset.category]?.emoji}</div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${INITIAL_CATEGORIES[asset.category]?.isLiability ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{asset.platform || '기타'}</span>
                                        <h4 className="font-bold text-slate-800">{asset.name}</h4>
                                        {asset.previousAmount > 0 && asset.amount !== asset.previousAmount && (
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${asset.amount > asset.previousAmount ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {asset.amount > asset.previousAmount ? '▲' : '▼'} {Math.abs(((asset.amount - asset.previousAmount) / asset.previousAmount) * 100).toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-400 mt-1">{asset.description || '상세 정보 없음'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    <p className={`text-xl font-black ${Number(asset.amount) < 0 ? 'text-red-600' : 'text-slate-900'}`}>₩ {Number(asset.amount).toLocaleString()}</p>
                                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(asset)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                  {selectedListCategory !== 'TOTAL' && assets.filter(a => a.category === selectedListCategory).length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 italic">
                      <LayoutGrid className="w-10 h-10 mb-2 opacity-20" />
                      해당 카테고리에 등록된 자산이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
