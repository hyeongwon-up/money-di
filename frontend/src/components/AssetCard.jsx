import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, Edit2, Trash2 } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../constants/assetConstants';
import { getErrorMessage } from '../api/errorMessage';
import AssetForm from './AssetForm';

const toDraft = asset => ({
  name: asset.name, amount: asset.amount, category: asset.category === 'LOAN' ? 'DEBT' : asset.category,
  platform: asset.platform || '', description: asset.description || '', liquid: !!asset.liquid
});

export default function AssetCard({ asset, busy, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(asset));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const editButtonRef = useRef(null);
  const pending = useRef(false);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!editing && !busy && restoreFocus.current) {
      editButtonRef.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [editing, busy]);
  const category = INITIAL_CATEGORIES[asset.category];
  const finishEditing = () => {
    restoreFocus.current = true;
    setEditing(false);
  };
  const handleSubmit = async event => {
    event.preventDefault();
    if (pending.current || busy) return;
    if (!draft.name.trim() || draft.amount === '' || !Number.isSafeInteger(Number(draft.amount))) {
      setNotice({ error: true, text: '자산명과 올바른 원 단위 금액을 입력해주세요.' });
      return;
    }
    pending.current = true;
    setSaving(true);
    setNotice(null);
    try {
      await onSave(asset.id, draft);
      setNotice({ text: '변경사항을 저장했습니다.' });
      finishEditing();
    } catch (error) {
      setNotice({ error: true, text: getErrorMessage(error) });
    } finally { pending.current = false; setSaving(false); }
  };
  return (
    <article aria-label={`${asset.name} 자산 카드`} className={`p-4 sm:p-5 rounded-2xl border transition-colors ${editing ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-slate-200'}`}>
      <div className="asset-row flex justify-between items-center gap-4">
        <div className="flex gap-3 min-w-0">
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${category?.isLiability ? 'bg-red-50' : 'bg-slate-50'}`}>{category?.emoji}</div>
          <div className="min-w-0"><span className="text-xs text-slate-500">{asset.platform || '기타'}</span><h4 className="font-bold text-slate-800">{asset.name}</h4>
            {asset.liquid && <span className="inline-flex items-center gap-1 text-xs text-emerald-700 mt-1"><DollarSign size={12} />현금화 가능</span>}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className={`text-xl font-bold tabular-nums ${Number(asset.amount) < 0 ? 'text-red-600' : 'text-slate-900'}`}>₩ {Number(asset.amount).toLocaleString()}</p>
          {asset.previousAmount > 0 && Number(asset.amount) !== Number(asset.previousAmount) && <span className="text-xs text-slate-500 mt-1">이전 대비 {Number(asset.amount) > Number(asset.previousAmount) ? '+' : '-'}{Math.abs((asset.amount - asset.previousAmount) / asset.previousAmount * 100).toFixed(1)}%</span>}
          <div className="flex gap-2 mt-2">
            <button ref={editButtonRef} type="button" disabled={busy} aria-label={`${asset.name} 수정`} aria-expanded={editing} aria-controls={`asset-editor-${asset.id}`} onClick={() => { if (!editing) { setDraft(toDraft(asset)); setNotice(null); setEditing(true); } }} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${editing ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}><Edit2 size={15} />{editing ? '수정 중' : '수정'}</button>
            {!editing && <button type="button" disabled={busy} aria-label={`${asset.name} 삭제`} onClick={() => onDelete(asset.id)} className="px-2 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
          </div>
        </div>
      </div>
      {notice && <p role={notice.error ? 'alert' : 'status'} className={`text-sm mt-4 rounded-lg p-3 ${notice.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{notice.text}</p>}
      <div id={`asset-editor-${asset.id}`}>
        {editing ? <div className="border-t border-blue-100 mt-4 pt-5"><h5 className="text-sm font-bold text-blue-800 mb-4">이 카드에서 자산 수정</h5><AssetForm id={`asset-edit-${asset.id}`} value={draft} onChange={setDraft} onSubmit={handleSubmit} onCancel={() => { setNotice(null); finishEditing(); }} editing disabled={busy || saving} saving={saving} /></div> : asset.description && <p className="text-sm text-slate-500 whitespace-pre-wrap mt-3">{asset.description}</p>}
      </div>
    </article>
  );
}
