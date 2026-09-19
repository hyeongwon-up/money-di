import React from 'react';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../constants/assetConstants';
import { getCategoryTotals } from '../utils/assetSummary';

export default function CategoryTotals({ assets, fetching, fetchError, onSelect }) {
  const totals = getCategoryTotals(assets, INITIAL_CATEGORIES);
  const unavailable = fetchError && !assets.length;
  return (
    <section aria-labelledby="category-totals-title" aria-busy={fetching} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 id="category-totals-title" className="flex items-center gap-2 text-lg font-bold"><LayoutGrid size={19} className="text-blue-600" />카테고리별 총액</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">전체 등록 자산 기준 · 검색 및 차트 필터와 무관 · 부채는 차감 금액으로 표시</p>
        </div>
        <span className="text-xs text-slate-500">항목을 선택하면 상세 목록으로 이동합니다</span>
      </div>
      {fetchError && assets.length > 0 && <p className="text-sm text-amber-800 mb-4" role="status">최신 정보를 불러오지 못해 이전 조회 금액을 표시합니다.</p>}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {totals.map(({ key, label, emoji, color, isLiability, amount, count }) => (
          <button key={key} type="button" disabled={fetching || unavailable} onClick={() => onSelect(key)} aria-controls="asset-list" aria-label={`${label} ${fetching ? '불러오는 중' : unavailable ? '확인 필요' : `${amount.toLocaleString('ko-KR')}원, ${count}개 자산 상세 보기`}`} className={`group min-w-0 text-left rounded-2xl border p-3 sm:p-4 transition-colors ${isLiability ? 'bg-rose-50/50 border-rose-100 hover:border-rose-300' : 'bg-slate-50/60 border-slate-100 hover:bg-blue-50/50 hover:border-blue-200'}`}>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span aria-hidden="true">{emoji}</span>{label}<ArrowUpRight size={15} aria-hidden="true" className="ml-auto shrink-0 text-slate-400 group-hover:text-blue-600" /></span>
            <strong className={`block text-sm min-[400px]:text-base sm:text-xl font-bold tracking-tight tabular-nums mt-3 break-words ${isLiability || amount < 0 ? 'text-rose-700' : 'text-slate-900'}`}>{fetching ? '불러오는 중…' : unavailable ? '확인 필요' : `₩ ${amount.toLocaleString('ko-KR')}`}</strong>
            <span className="flex items-center gap-1.5 mt-2 text-xs text-slate-500"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />{fetching || unavailable ? '금액 확인 중' : count ? `${count}개 자산${isLiability ? ' · 차감' : ''}` : '등록된 자산 없음'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
