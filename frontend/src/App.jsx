import React, { useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from 'recharts';
import { Wallet, TrendingUp, PieChart as PieChartIcon, PlusCircle, Info, Building2, LayoutGrid, Lock, Lightbulb, Calendar, DollarSign, Search, ArrowRight, RefreshCw } from 'lucide-react';
import ThoughtsView from './components/ThoughtsView';
import SpendingPlanView from './components/SpendingPlanView';
import PointsView from './components/PointsView';
import AssetForm, { emptyAssetForm } from './components/AssetForm';
import AssetCard from './components/AssetCard';
import { useAssets } from './hooks/useAssets';
import { getErrorMessage } from './api/errorMessage';
import { assetApi } from './api/assetApi';
import { COLORS, INITIAL_CATEGORIES, APP_PASSWORD } from './constants/assetConstants';

const App = () => {
  const {
    assets,
    setAssets,
    history,
    loading,
    setLoading,
    isServerOnline,
    refreshAssets,
    fetching,
    fetchError
  } = useAssets();

  const formRef = useRef(null);
  const changeTab = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0 }); };
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.querySelector('[data-asset-name]')?.focus({ preventScroll: true });
  };

  const [form, setForm] = useState(emptyAssetForm);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'thoughts' | 'spending' | 'points'

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // 이력 수정 핸들러
  const handleHistoryUpdate = async (historyItem) => {
    historyItem = history.find(item => item.id === historyItem.id) || historyItem;
    const newAmount = prompt(
      `${historyItem.recordedDate}의 순 자산 금액을 수정하시겠습니까?\n(현재: ₩${historyItem.totalAmount.toLocaleString()})`, 
      historyItem.totalAmount
    );
    
    if (newAmount === null) return;
    if (!newAmount.trim() || !Number.isSafeInteger(Number(newAmount))) {
      setNotice({ error: true, text: '원 단위의 올바른 정수 금액을 입력해주세요.' });
      return;
    }

    try {
      setLoading(true);
      await assetApi.updateHistory(historyItem.id, {
        ...historyItem,
        totalAmount: parseInt(newAmount, 10)
      });
      await refreshAssets();
      setNotice({ text: '자산 이력을 수정했습니다.' });
    } catch (error) {
      console.error('Failed to update history', error);
      setNotice({ error: true, text: getErrorMessage(error) });
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

  // 차트용 history 보정 (부동산/부채 제외 시 현재 부동산+부채 순가치를 차감하여 유동자산 추이 파악)
  const realEstateAndDebtTotal = assets
    .filter(a => a.category === 'REAL_ESTATE' || a.category === 'DEBT' || a.category === 'LOAN')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const chartHistory = history.map(h => {
    if (!includeRealEstate) {
      return { ...h, totalAmount: h.totalAmount - realEstateAndDebtTotal };
    }
    return h;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.name.trim() || form.amount === '' || !Number.isSafeInteger(Number(form.amount))) {
      setNotice({ scope: 'create', error: true, text: '자산명과 올바른 원 단위 금액을 입력해주세요.' });
      return;
    }
    setNotice(null);
    setLoading(true);
    try {
      const response = await assetApi.saveAsset(form);
      setAssets(previous => [...previous, response.data]);
      setForm(emptyAssetForm());
      setNotice({ scope: 'create', text: '새 자산을 등록했습니다.' });
      await refreshAssets();
    } catch (error) { setNotice({ scope: 'create', error: true, text: getErrorMessage(error) }); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      await assetApi.deleteAsset(id);
      setNotice({ text: '자산을 삭제했습니다.' });
      await refreshAssets();
    } catch (error) { setNotice({ error: true, text: getErrorMessage(error) }); }
    finally { setLoading(false); }
  };

  const handleUpdateAsset = async (id, values) => {
    setLoading(true);
    try {
      const response = await assetApi.updateAsset(id, values);
      setAssets(previous => previous.map(asset => asset.id === id ? response.data : asset));
      setNotice({ text: `${response.data.name} 자산 정보를 수정했습니다.` });
      await refreshAssets();
    } finally { setLoading(false); }
  };

  // 부동산/대출 필터링된 현재 자산 목록
  const activeAssets = includeRealEstate
    ? assets
    : assets.filter(a => a.category !== 'REAL_ESTATE' && a.category !== 'DEBT' && a.category !== 'LOAN');

  // 총 순자산 계산 (DB에 부채가 이미 ─음수로 저장되어 있으므로 단순히 합산)
  const totalAmount = activeAssets.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // 현금성 자산 총액 계산
  const liquidTotal = assets.filter(a => a.liquid).reduce((acc, curr) => acc + Number(curr.amount), 0);

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

  const matchingAssets = assets.filter(a =>
    (selectedListCategory === 'TOTAL' || a.category === selectedListCategory) &&
    `${a.name} ${a.platform || ''} ${a.description || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );

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
                aria-label="비밀번호" autoComplete="current-password" aria-invalid={loginError} aria-describedby={loginError ? "login-error" : undefined} type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호"
                className={`w-full p-4 bg-slate-50 border rounded-xl text-center text-lg tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${loginError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`}
                autoFocus
              />
              {loginError && <p id="login-error" role="alert" className="text-red-500 text-xs font-bold mt-2">비밀번호가 올바르지 않습니다.</p>}
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
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <nav className="app-nav" aria-label="주 메뉴">
        <div className="nav-inner">
          <a href="#" className="brand" onClick={e => { e.preventDefault(); changeTab('dashboard'); }}>
            <span className="brand-icon"><Wallet size={22} /></span><span>MONEY DI<span className="brand-caption">나의 자산을 한눈에</span></span>
          </a>
          <div className="nav-tabs">
            {[['dashboard', TrendingUp, '자산 현황'], ['thoughts', Lightbulb, '생각 정리'], ['spending', Calendar, '지출 계획'], ['points', Wallet, '포인트 현황']].map(([key, Icon, label]) => (
              <button key={key} aria-current={activeTab === key ? 'page' : undefined} onClick={() => changeTab(key)} className={activeTab === key ? 'active' : ''}><Icon size={17} />{label}</button>
            ))}
          </div>
          <span className="connection-status"><span className={`status-dot ${isServerOnline ? 'online' : ''}`} />{isServerOnline ? '서버 연결됨' : '연결 확인 필요'}</span>
        </div>
      </nav>
      <div id="main-content" tabIndex={-1}>
      {activeTab === 'thoughts' ? (
        <div className="pt-8 px-6">
          <ThoughtsView />
        </div>
      ) : activeTab === 'spending' ? (
        <div className="pt-8 px-6">
          <SpendingPlanView />
        </div>
      ) : activeTab === 'points' ? (
        <div className="pt-8 px-6">
          <PointsView />
        </div>
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
          <header className="dashboard-heading">
            <div><p className="eyebrow">MY FINANCIAL OVERVIEW</p><h2>내 자산 한눈에 보기</h2><p className="text-slate-500 text-sm mt-2">흩어진 자산을 모아보고, 다음 계획을 세워보세요.</p></div>
            <button className="primary-action" onClick={focusForm}><PlusCircle size={18} /> 자산 등록 <ArrowRight size={16} /></button>
          </header>
          {fetchError && <div role="alert" className="feedback error"><div><strong>자산 정보를 불러오지 못했습니다.</strong><p>연결을 확인해주세요. 이전에 불러온 데이터가 있다면 그대로 표시합니다.</p></div><button disabled={fetching} onClick={refreshAssets}><RefreshCw size={16} /> {fetching ? '확인 중' : '다시 시도'}</button></div>}
          {notice && <div role={notice.error ? 'alert' : 'status'} className={`feedback ${notice.error ? 'error' : 'success'}`}><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="알림 닫기">닫기</button></div>}
          <section className="summary-grid" aria-label="자산 요약" aria-busy={fetching}>
            <article className="summary-card featured"><span className="summary-label"><Wallet size={18} />{includeRealEstate ? '총 순자산' : '부동산·대출 제외 순자산'}</span><strong>{fetching ? '불러오는 중…' : fetchError && !assets.length ? '확인 필요' : `₩ ${totalAmount.toLocaleString()}`}</strong><p>{includeRealEstate ? '보유 자산에서 부채를 반영한 금액' : '부동산과 대출을 제외한 현재 금액'}</p></article>
            <article className="summary-card"><span className="summary-label"><DollarSign size={18} />현금화 가능 자산</span><strong>{fetching ? '불러오는 중…' : fetchError && !assets.length ? '확인 필요' : `₩ ${liquidTotal.toLocaleString()}`}</strong><p>현금화 가능으로 표시한 전체 자산 합계</p></article>
            <article className="summary-card"><span className="summary-label"><LayoutGrid size={18} />관리 중인 자산</span><strong>{fetching ? '불러오는 중…' : fetchError && !assets.length ? '확인 필요' : `${assets.length}개`}</strong><p>자산을 등록해 나만의 현황을 완성하세요</p></article>
          </section>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /><h3 className="text-xl font-bold">순 자산 변화 추이</h3></div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded cursor-pointer" checked={includeRealEstate} onChange={(e) => setIncludeRealEstate(e.target.checked)} />
                <span className="text-sm font-bold text-slate-700">부동산/대출 포함 여부</span>
              </label>
            </div>
            {!includeRealEstate && <p className="text-xs text-amber-700 mb-4">현재 부동산·대출 금액을 과거 기록에서 뺀 참고용 추이이며, 당시의 실제 금액과 다를 수 있습니다.</p>}
            <div className="h-[200px] w-full">
              {fetching || !chartHistory.length ? <div className="empty-state"><TrendingUp size={30} /><strong>{fetching ? '자산 기록을 불러오는 중입니다' : fetchError ? '연결 후 자산 추이를 확인할 수 있습니다' : '자산의 변화를 차곡차곡 기록해요'}</strong><p>자산을 등록하면 날짜별 순자산 추이가 표시됩니다.</p></div> : <>
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
              </ResponsiveContainer></> }
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-blue-600" /> 카테고리 비중</h3>
              <p className="text-xs text-slate-500 mb-2">부채를 포함한 금액의 절댓값 기준</p><div className="h-[250px]">
                {!categorySummary.length ? <div className="empty-state"><PieChartIcon size={30} /><p>{fetching ? '불러오는 중…' : fetchError ? '연결 후 비중을 확인할 수 있습니다.' : '자산을 등록하면 비중을 확인할 수 있어요.'}</p></div> : <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorySummary} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {categorySummary.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `₩${Number(val).toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer></>}
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> 플랫폼별 상세 분포</h3>
                  <p className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                    선택 합계 (절댓값): ₩ {categoryTotalForChart.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0">
                  <button aria-pressed={selectedChartCategory === 'TOTAL'} onClick={() => setSelectedChartCategory('TOTAL')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedChartCategory === 'TOTAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체</button>
                  {Object.entries(INITIAL_CATEGORIES).map(([key, { label }]) => (
                    <button key={key} aria-pressed={selectedChartCategory === key} onClick={() => setSelectedChartCategory(key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedChartCategory === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{label}</button>
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
                          formatter={(val) => `${val}%`}
                          style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                    <LayoutGrid className="w-10 h-10 mb-2 opacity-20" />
                    {fetching ? '불러오는 중…' : fetchError ? '연결 상태를 확인하고 다시 시도해주세요.' : '표시할 자산이 없습니다. 자산을 등록하거나 필터를 바꿔보세요.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div ref={formRef} className="asset-form bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-blue-600" />새 자산 등록</h3>
                {notice?.scope === 'create' && <p className={`text-sm mb-4 ${notice.error ? 'text-red-700' : 'text-emerald-700'}`}>{notice.text}</p>}
                <AssetForm id="asset-create" value={form} onChange={setForm} onSubmit={handleSubmit} disabled={loading} saving={loading} />
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /><h3 className="text-xl font-bold">상세 자산 현황</h3></div>
                  <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button aria-pressed={selectedListCategory === 'TOTAL'} onClick={() => setSelectedListCategory('TOTAL')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedListCategory === 'TOTAL' ? 'bg-blue-600 text-white shadow-md cursor-default' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체 보기</button>
                    {Object.entries(INITIAL_CATEGORIES).map(([key, { label, emoji }]) => (
                      <button key={key} aria-pressed={selectedListCategory === key} onClick={() => setSelectedListCategory(key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedListCategory === key ? 'bg-blue-600 text-white shadow-md cursor-default' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{emoji} {label}</button>
                    ))}
                  </div>
                </div>

                <label className="asset-search"><Search size={18} /><input type="search" aria-label="자산 검색" placeholder="자산명, 금융사, 메모 검색" value={search} onChange={e => setSearch(e.target.value)} /><span>{matchingAssets.length}개</span></label>
                <div className="space-y-8">
                  {Object.entries(INITIAL_CATEGORIES)
                    .filter(([catKey, _]) => selectedListCategory === 'TOTAL' || selectedListCategory === catKey)
                    .map(([catKey, catInfo]) => {
                      const catAssets = matchingAssets.filter(a => a.category === catKey);
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
                            {catAssets.map(asset => <AssetCard key={asset.id} asset={asset} busy={loading} onSave={handleUpdateAsset} onDelete={handleDelete} />)}
                          </div>
                        </div>
                      );
                    })}

                  {matchingAssets.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 italic">
                      <LayoutGrid className="w-10 h-10 mb-2 opacity-20" />
                      {fetching ? '불러오는 중…' : fetchError ? '연결 상태를 확인하고 다시 시도해주세요.' : '표시할 자산이 없습니다. 자산을 등록하거나 필터를 바꿔보세요.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
      </div>
    </div>
  );
};

export default App;
