import React, { useEffect, useRef } from 'react';
import { CURRENCIES, rateTime, convertToWon } from '../utils/currency';
import { INITIAL_CATEGORIES } from '../constants/assetConstants';

export const emptyAssetForm = () => ({ name: '', currency: 'KRW', amount: '', category: 'SAVINGS', platform: '', description: '', liquid: true });

export default function AssetForm({ id, value, onChange, onSubmit, onCancel, disabled, editing = false, saving = false, rates = [] }) {
  const currency = value.currency || 'KRW';
  const quote = rates.find(q => q.currency === currency && q.available);
  const amountRef = useRef(null);
  useEffect(() => {
    if (editing) {
      amountRef.current?.focus({ preventScroll: true });
      amountRef.current?.select();
      amountRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }, [editing]);
  const update = event => onChange({ ...value, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
  const fieldClass = 'w-full p-3 bg-white border border-slate-200 rounded-xl';
  return (
    <form aria-label={editing ? `${value.name} 수정 양식` : '새 자산 등록 양식'} onSubmit={onSubmit}>
      <fieldset disabled={disabled} className="space-y-4">
        <div><label htmlFor={`${id}-currency`} className="block text-sm font-medium mb-2">입력 통화</label><select id={`${id}-currency`} name="currency" value={currency} onChange={update} className={fieldClass}>{Object.entries(CURRENCIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><p className="text-xs text-slate-500 mt-2">통화를 바꾸면 입력한 숫자를 해당 통화의 금액으로 해석합니다.</p></div>
        <div>
          <label htmlFor={`${id}-amount`} className="block text-sm font-medium mb-2">{currency === 'KRW' ? '금액 (원)' : `보유 금액 / 수량 (${currency})`}</label>
          <input ref={amountRef} id={`${id}-amount`} name="amount" type="number" required step={currency === 'KRW' ? '1' : '0.00000001'} min={currency === 'KRW' ? -Number.MAX_SAFE_INTEGER : 0} max={currency === 'KRW' ? Number.MAX_SAFE_INTEGER : 1e12} value={value.amount} onChange={update} aria-describedby={`${id}-amount-hint`} className={`${fieldClass} font-bold text-blue-700 scroll-mt-44 scroll-mb-6`} placeholder="예: 1000000" />
          <p id={`${id}-amount-hint`} className="text-xs text-slate-500 mt-2">{currency === 'KRW' ? '원 단위로 입력해주세요.' : '소수점 8자리까지 입력할 수 있습니다.'} 대출·부채는 자동으로 차감됩니다.</p>
        </div>
        {currency !== 'KRW' && <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900" aria-live="polite">{quote ? <><strong>원화 예상액 ₩ {convertToWon(value.amount || 0, quote.rate).toLocaleString()}</strong><p className="text-xs mt-1">1 {currency} = ₩ {Number(quote.rate).toLocaleString()} · {rateTime(quote)}{quote.stale ? ' · 이전 시세' : ''}</p><p className="text-xs mt-1">저장 시 서버의 적용 시세에 따라 달라질 수 있습니다.</p></> : '적용할 환율이 없습니다. 시세를 불러온 뒤 저장해주세요.'}</div>}
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium mb-2">자산명</label>
          <input id={`${id}-name`} name="name" data-asset-name required maxLength={100} value={value.name} onChange={update} className={fieldClass} placeholder="예: 적금, 삼성전자" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor={`${id}-category`} className="block text-sm font-medium mb-2">카테고리</label><select id={`${id}-category`} name="category" value={value.category} onChange={update} className={fieldClass}>{Object.entries(INITIAL_CATEGORIES).map(([key, { label, emoji }]) => <option key={key} value={key}>{emoji} {label}</option>)}</select></div>
          <div><label htmlFor={`${id}-platform`} className="block text-sm font-medium mb-2">플랫폼/금융사</label><input id={`${id}-platform`} name="platform" maxLength={255} value={value.platform} onChange={update} className={fieldClass} placeholder="예: 국민은행" /></div>
        </div>
        <div><label htmlFor={`${id}-description`} className="block text-sm font-medium mb-2">상세 정보 (메모)</label><textarea id={`${id}-description`} name="description" maxLength={255} rows={3} value={value.description} onChange={update} className={fieldClass} /></div>
        <label htmlFor={`${id}-liquid`} className="flex items-center gap-2 text-sm text-slate-600"><input id={`${id}-liquid`} name="liquid" type="checkbox" checked={value.liquid} onChange={update} className="w-4 h-4" />현금화 가능 자산</label>
        <div className="flex gap-2 pt-2">
          {onCancel && <button type="button" onClick={onCancel} className="px-5 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm">취소</button>}
          <button disabled={currency !== 'KRW' && !quote} type="submit" className="primary-action flex-1">{saving ? '저장 중…' : editing ? '변경사항 저장' : '등록하기'}</button>
        </div>
      </fieldset>
    </form>
  );
}
