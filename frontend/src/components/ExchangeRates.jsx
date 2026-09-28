import React from 'react';
import { rateTime } from '../utils/currency';
export default function ExchangeRates({ rates, rateLoading, rateError, refreshRates }) {
  return <section aria-label="환율 및 테더 시세" className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-lg">환율 · 테더 시세</h3><button type="button" disabled={rateLoading} onClick={refreshRates} className="text-sm text-blue-700 rounded-lg px-3 py-2 hover:bg-blue-50">{rateLoading ? '연결 중…' : '새로고침'}</button></div>
    <p className="text-xs text-slate-500 mt-2">외화 자산과 모든 합계는 원화로 환산합니다. 달러는 일별 참고 환율, 테더는 업비트 거래 시세입니다.</p>
    <div className="grid sm:grid-cols-2 gap-3 mt-4">{['USD', 'USDT'].map(currency => { const quote = rates.find(q => q.currency === currency); return <div key={currency} className="bg-slate-50 rounded-2xl p-4"><div className="flex justify-between items-center gap-2"><span className="text-sm font-semibold">{currency === 'USD' ? '미국 달러' : '테더'} · 1 {currency}</span>{quote?.stale && <span className="text-xs text-amber-700">이전 시세</span>}</div><p className="text-xl font-bold mt-2 tabular-nums">{quote?.available ? `₩ ${Number(quote.rate).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}` : rateLoading ? '불러오는 중…' : '시세 확인 필요'}</p><p className="text-xs text-slate-500 mt-2">{quote?.available ? `${quote.source} · ${rateTime(quote)}` : '환율을 확보하면 외화 자산을 등록할 수 있습니다.'}</p></div>; })}</div>
    {(rateError || rateLoading) && <p role="status" className="text-xs text-amber-800 mt-3">{rateLoading ? '서버가 쉬고 있었다면 연결에 최대 1분 정도 걸릴 수 있습니다.' : '최신 시세를 받지 못했습니다. 이전 시세가 있으면 유지하며, 1분 뒤 자동으로 다시 확인합니다.'}</p>}
  </section>;
}
