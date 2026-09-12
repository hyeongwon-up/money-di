import React, { useEffect, useRef, useState } from 'react';
import { pointApi } from '../api/pointApi';
import { getErrorMessage } from '../api/errorMessage';
import { Wallet, History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

const OWNERS = ['남편네', '여편네'];
const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;

const PointsView = () => {
    const [points, setPoints] = useState([]);
    const [history, setHistory] = useState({ '남편네': [], '여편네': [] });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [notice, setNotice] = useState(null);
    const [saving, setSaving] = useState(false);
    const pending = useRef(false);
    const [activeOwner, setActiveOwner] = useState(OWNERS[0]);
    const [action, setAction] = useState('add');
    const [form, setForm] = useState({ amount: '', description: '' });
    const balance = points.find(point => point.owner === activeOwner)?.balance ?? 0;
    const amount = Number(form.amount);
    const validAmount = Number.isSafeInteger(amount) && amount > 0;
    const projectedBalance = action === 'add' ? balance + amount : balance - amount;
    const insufficient = validAmount && action === 'use' && amount > balance;
    const exceedsLimit = validAmount && action === 'add' && amount > MAX_AMOUNT - balance;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balances, ...histories] = await Promise.all([
                pointApi.getAllPoints(), ...OWNERS.map(owner => pointApi.getHistory(owner))
            ]);
            if (![balances, ...histories].every(response => Array.isArray(response.data))) throw new Error('Invalid response');
            setPoints(balances.data);
            setHistory(Object.fromEntries(OWNERS.map((owner, index) => [owner, histories[index].data])));
            setFetchError('');
        } catch (error) {
            setFetchError('포인트 정보를 불러오지 못했습니다. 연결을 확인하고 다시 불러와주세요.');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (pending.current || loading || fetchError) return;
        if (!validAmount || !form.description.trim() || insufficient || exceedsLimit) {
            setNotice({ error: true, text: insufficient ? '사용할 포인트가 잔액보다 많습니다.' : '금액과 사유를 확인해주세요.' });
            return;
        }
        pending.current = true;
        setSaving(true);
        setNotice(null);
        try {
            const payload = { amount, description: form.description.trim() };
            const response = await (action === 'add' ? pointApi.addPoints(activeOwner, payload) : pointApi.usePoints(activeOwner, payload));
            setPoints(previous => [...previous.filter(point => point.owner !== activeOwner), response.data]);
            setForm({ amount: '', description: '' });
            setNotice({ text: `${activeOwner} 포인트 ${amount.toLocaleString()} P를 ${action === 'add' ? '적립' : '사용'}했습니다.` });
            await fetchData();
        } catch (error) {
            setNotice({ error: true, text: getErrorMessage(error) });
            if (!error.response || error.response.status === 409) {
                setFetchError('처리 결과를 확인하려면 최신 잔액과 내역을 다시 불러와주세요.');
            }
        } finally { pending.current = false; setSaving(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <header className="dashboard-heading"><div><p className="eyebrow">OUR POINTS</p><h2>포인트 현황</h2><p className="text-sm text-slate-500 mt-2">누구의 포인트인지 선택하고 적립과 사용을 기록하세요.</p></div>
                <button className="flex items-center gap-2 rounded-xl bg-white border p-3 text-sm" disabled={loading || saving} onClick={fetchData}><RefreshCw size={16} />{loading ? '불러오는 중…' : '새로고침'}</button>
            </header>
            {fetchError && <div role="alert" className="feedback error">{fetchError}</div>}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="소유자별 포인트 잔액" aria-busy={loading}>
                {OWNERS.map(owner => <button key={owner} disabled={saving} aria-pressed={activeOwner === owner} onClick={() => { setActiveOwner(owner); setNotice(null); }} className={`text-left summary-card ${activeOwner === owner ? 'featured' : ''}`}>
                    <span className="summary-label"><Wallet size={18} />{owner} 포인트</span>
                    <strong>{loading ? '불러오는 중…' : fetchError ? '확인 필요' : `${(points.find(point => point.owner === owner)?.balance ?? 0).toLocaleString()} P`}</strong>
                    <p>{activeOwner === owner ? '현재 선택됨' : '선택하여 관리하기'}</p>
                </button>)}
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 self-start">
                    <h3 className="text-lg font-bold mb-5">{activeOwner} 포인트 기록</h3>
                    {notice && <div role={notice.error ? 'alert' : 'status'} className={`feedback mb-4 ${notice.error ? 'error' : 'success'}`}>{notice.text}</div>}
                    <form onSubmit={handleSubmit}>
                        <fieldset disabled={saving || loading || !!fetchError} className="space-y-4">
                            <div className="flex gap-2" role="group" aria-label="포인트 처리 방식">
                                {[['add', '적립'], ['use', '사용']].map(([value, label]) => <button key={value} type="button" aria-pressed={action === value} onClick={() => { setAction(value); setNotice(null); }} className={`flex-1 p-3 rounded-xl text-sm font-bold border ${action === value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>{label}</button>)}
                            </div>
                            <div><label htmlFor="point-amount" className="block text-sm font-medium mb-2">{action === 'add' ? '적립' : '사용'}할 포인트 (P)</label>
                                <input id="point-amount" type="number" min="1" max={action === 'use' ? balance : MAX_AMOUNT - balance} step="1" required value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} aria-describedby="point-preview" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="예: 1000" />
                            </div>
                            <div><label htmlFor="point-reason" className="block text-sm font-medium mb-2">내용 / 사유</label><input id="point-reason" required maxLength={255} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="예: 카드 적립, 마일리지 사용" /></div>
                            <p id="point-preview" aria-live="polite" className={`rounded-xl p-3 text-sm ${insufficient || exceedsLimit ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
                                {insufficient ? '잔액보다 많은 포인트를 사용할 수 없습니다.' : exceedsLimit ? '적립 가능한 최대 잔액을 초과합니다.' : validAmount ? `처리 후 예상 잔액: ${projectedBalance.toLocaleString()} P` : '1 이상의 정수 포인트를 입력해주세요.'}
                            </p>
                            <button type="submit" disabled={!validAmount || insufficient || exceedsLimit || !form.description.trim()} className="primary-action w-full">{saving ? '처리 중…' : `${activeOwner} 포인트 ${action === 'add' ? '적립하기' : '사용하기'}`}</button>
                        </fieldset>
                    </form>
                </section>
                <section className="lg:col-span-8 min-w-0 bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-5"><History size={20} />{activeOwner} 포인트 내역</h3>
                    {loading ? <div className="empty-state" role="status">내역을 불러오는 중…</div> : fetchError ? <div className="empty-state">새로고침하면 최신 내역을 확인할 수 있습니다.</div> : history[activeOwner].length ? <ul className="space-y-3">
                        {history[activeOwner].map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-3 min-w-0 flex-1"><span className={`p-2 rounded-full shrink-0 ${item.amount >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{item.amount >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</span><div className="min-w-0"><p className="font-medium">{item.description}</p><p className="text-xs text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString('ko-KR')}</p></div></div>
                            <p className={`font-bold tabular-nums ${item.amount >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} P</p>
                        </li>)}
                    </ul> : <div className="empty-state min-h-48"><History size={28} /><strong>아직 기록된 내역이 없습니다.</strong><p>첫 포인트를 적립해보세요.</p></div>}
                </section>
            </div>
        </div>
    );
};

export default PointsView;
