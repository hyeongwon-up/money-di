import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { buildTrend } from '../utils/assetTrend';
import { INITIAL_CATEGORIES } from '../constants/assetConstants';
const won = value => `₩ ${Number(value).toLocaleString('ko-KR')}`;
const signed = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${won(Math.abs(value))}`;
const percent = value => value === null ? '비교율 없음' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
const tone = value => value > 0 ? 'text-emerald-700' : value < 0 ? 'text-rose-700' : 'text-slate-600';
const compact = value => Math.abs(value) >= 1e8 ? `${(value / 1e8).toFixed(2)}억` : Math.abs(value) >= 1e4 ? `${(value / 1e4).toFixed(0)}만` : Number(value).toLocaleString();
function TrendTooltip({ active, payload, before }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-sm"><p className="text-slate-500">{point.label}</p><strong>{won(point.value)}</strong>{before !== null && <p className={tone(point.value - before)}>기준 대비 {signed(point.value - before)}</p>}</div>;
}
export default function AssetTrend({ history, assets, itemHistory, itemHistoryError, fetching, fetchError, onEditHistory, onSelectAsset }) {
  const [days, setDays] = useState(30);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all');
  const [zeroAxis, setZeroAxis] = useState(false);
  const data = useMemo(() => buildTrend(history, assets, itemHistory, days), [history, assets, itemHistory, days]);
  const rows = data.changes.filter(a => filter === 'all' || (filter === 'up' ? a.delta > 0 : filter === 'down' ? a.delta < 0 : a.delta === null));
  const visible = showAll ? rows : rows.slice(0, 5);
  const missing = itemHistoryError || !data.baseline;
  const comparisonLabel = data.baseline ? `${data.baseline.recordedDate} 기록 → 현재` : '비교할 과거 기록이 없습니다';
  return <section aria-labelledby="asset-trend-title" className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 space-y-5">
    <div className="flex flex-wrap justify-between gap-4"><div><h3 id="asset-trend-title" className="flex items-center gap-2 text-xl font-bold"><TrendingUp size={21} className="text-blue-600" />순자산 변화 추이</h3><p className="text-sm text-slate-500 mt-2">얼마나 달라졌고, 어떤 자산이 변화를 만들었는지 확인하세요.</p></div><div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-start" aria-label="자산 비교 기간">{[[30, '1개월'], [90, '3개월'], [365, '1년'], [0, '전체']].map(([value, label]) => <button key={value} aria-pressed={days === value} onClick={() => { setDays(value); setShowAll(false); }} className={`px-3 py-2 rounded-lg text-sm font-semibold ${days === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>{label}</button>)}</div></div>
    <p className="text-xs text-slate-500">전체 순자산 기준 · 부동산·부채 포함 · 입출금·등록·삭제·환율 변동도 반영된 증감이며 투자 수익률은 아닙니다.</p>
    {fetchError && <p role="status" className="text-sm text-amber-800">최신 자산을 불러오지 못했습니다. 마지막 조회 데이터 기준으로 표시합니다.</p>}
    {fetching && !history.length ? <p role="status" className="py-10 text-center text-slate-500">자산 기록을 불러오는 중입니다…</p> : fetchError && !assets.length ? <p className="py-10 text-center text-slate-500">서버에 연결한 후 자산 추이를 확인할 수 있습니다.</p> : <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white rounded-2xl p-4"><p className="text-sm text-slate-300">현재 순자산</p><p className="text-2xl font-bold tabular-nums mt-2">{won(data.current)}</p><p className="text-xs text-slate-300 mt-2">보유 자산 − 부채 · 외화는 적용 시세 기준</p></div>
        <div className="bg-slate-50 rounded-2xl p-4"><p className="text-sm text-slate-500">기간 증감액</p><p className={`text-base sm:text-2xl font-bold tabular-nums mt-2 ${tone(data.delta)}`}>{data.delta === null ? '기록 필요' : signed(data.delta)}</p><p className="text-xs text-slate-500 mt-2">{comparisonLabel}</p></div>
        <div className="bg-slate-50 rounded-2xl p-4"><p className="text-sm text-slate-500">순자산 변화율</p><p className={`text-2xl font-bold tabular-nums mt-2 ${tone(data.delta)}`}>{percent(data.percent)}</p><p className="text-xs text-slate-500 mt-2">{data.before === null ? '과거 기록이 쌓이면 비교할 수 있어요.' : data.before <= 0 ? '기준 순자산이 0 이하이면 변화율을 계산하지 않습니다.' : `기준 순자산 ${won(data.before)}`}</p></div>
      </div>
      {(data.shorter || data.older) && <p className="text-xs text-amber-800">{data.shorter ? '기간 시작일 이전 기록이 없어 첫 기록부터 비교합니다.' : '기간 시작일에 기록이 없어 그 이전의 가장 가까운 기록과 비교합니다.'} 실제 비교 기준: {data.baseline.recordedDate}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>저장된 날짜의 기록과 현재 평가액 · 기록 사이의 값은 연결선입니다.</span><label className="flex items-center gap-2"><input type="checkbox" checked={zeroAxis} onChange={e => setZeroAxis(e.target.checked)} />세로축에 0 포함</label></div>
      <div className="h-[280px] sm:h-[320px] min-w-0" role="img" aria-label={`순자산 그래프. ${comparisonLabel}. 현재 ${won(data.current)}${data.delta === null ? '' : `, 증감 ${signed(data.delta)}`}`}>
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.points} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}><defs><linearGradient id="asset-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })} minTickGap={38} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis width={72} domain={zeroAxis ? [min => Math.min(0, min), max => Math.max(0, max)] : ['auto', 'auto']} tickFormatter={compact} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip content={<TrendTooltip before={data.before} />} />{data.before !== null && <ReferenceLine y={data.before} stroke="#94a3b8" strokeDasharray="4 4" />}<Area type="linear" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#asset-trend-fill)" dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm"><p className="bg-slate-50 rounded-xl p-3"><span className="block text-xs text-slate-500 mb-1">기간 내 기록 최고</span><strong>{won(data.high.value)}</strong><span className="block text-xs text-slate-500 mt-1">{data.high.label}</span></p><p className="bg-slate-50 rounded-xl p-3"><span className="block text-xs text-slate-500 mb-1">기간 내 기록 최저</span><strong>{won(data.low.value)}</strong><span className="block text-xs text-slate-500 mt-1">{data.low.label}</span></p></div>
      <div className="border-t border-slate-100 pt-5"><h4 className="font-bold">자산별 변화</h4><p className="text-xs text-slate-500 mt-2">{comparisonLabel} · 현재 보유 자산을 변동액 크기순으로 표시합니다. 부채 감소는 순자산 증가로 표시됩니다.</p>
        {missing ? <p className="bg-amber-50 text-amber-800 rounded-xl p-4 mt-3 text-sm">{itemHistoryError ? '개별 자산 이력을 불러오지 못했습니다. 서버 연결 또는 백엔드 배포 상태를 확인한 뒤 다시 조회해주세요.' : '비교할 총자산 기록이 쌓이면 개별 자산 변화도 확인할 수 있습니다.'}</p> : <>
          <div className="flex flex-wrap gap-2 my-4">{[['all', '전체'], ['up', '순자산 증가'], ['down', '순자산 감소'], ['unknown', '비교 기록 없음']].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setShowAll(false); }} className={`px-3 py-2 text-xs font-semibold rounded-lg ${filter === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div>
          <p className="text-xs text-slate-500 mb-3">현재 {assets.length}개 중 {data.coverage}개 비교 가능 · 기준일 이하의 마지막 개별 기록을 사용합니다.</p>
          <div className="space-y-2">{visible.map(asset => <button key={asset.id} onClick={() => onSelectAsset(asset)} className="w-full text-left rounded-xl border border-slate-200 p-3 sm:p-4 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-600"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-sm">{INITIAL_CATEGORIES[asset.category]?.emoji} {asset.name}</span><span className={`font-bold tabular-nums ${tone(asset.delta)}`}>{asset.delta === null ? '비교 기록 없음' : signed(asset.delta)}</span></div><div className="flex flex-wrap justify-between gap-2 mt-2 text-xs text-slate-500"><span>{asset.before === null ? `현재 ${won(asset.after)}` : `${won(asset.before)} → ${won(asset.after)}`}</span><span>{asset.before === null ? '등록·과거 기록 부족' : asset.before < 0 ? '부채 증감 · 변화율 제외' : percent(asset.percent)}</span></div>{asset.baselineDate && <p className="text-xs text-slate-400 mt-1">개별 기준일 {asset.baselineDate} · 선택하면 자산 목록으로 이동</p>}</button>)}</div>
          {!rows.length && <p className="text-sm text-slate-500 py-5">해당하는 자산이 없습니다.</p>}
          {rows.length > 5 && <button className="w-full py-3 mt-2 text-sm font-semibold text-blue-700" onClick={() => setShowAll(!showAll)}>{showAll ? '접기' : `${rows.length}개 자산 모두 보기`}</button>}
          {data.residual !== 0 && <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl mt-3">전체 증감과 비교 가능한 개별 증감 합계의 차이: {signed(data.residual)}. 등록·삭제, 개별 기록 누락, 총액 기록 수정 등의 영향이 포함될 수 있습니다.</p>}
        </>}
      </div>
      <details className="border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">계산 기준 및 저장 기록 보기</summary><p className="text-xs text-slate-500 my-3">자산 등록·수정·삭제 시 기록된 총액입니다. 매일 자동으로 생성된 잔액은 아니며, 현재 금액에는 최신 적용 환율이 반영됩니다. 과거 개별 기록의 합계와 직접 수정한 총액은 다를 수 있습니다.</p><div className="max-h-60 overflow-auto space-y-1">{data.points.filter(p => !p.current).slice().reverse().map(p => <div key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span>{p.recordedDate}</span><span className="ml-auto tabular-nums">{won(p.value)}</span><button className="text-blue-700 px-2 py-1" onClick={() => onEditHistory(p)} aria-label={`${p.recordedDate} 총액 기록 수정`}>수정</button></div>)}</div></details>
    </>}
  </section>;
}
