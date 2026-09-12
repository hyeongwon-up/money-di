import React, { useState, useEffect, useRef } from 'react';
import { getErrorMessage } from '../api/errorMessage';
import { daysUntil, filterPlans } from '../utils/spending';
import { spendingApi } from '../api/spendingApi';
import { Calendar, PlusCircle, Trash2, Edit2, CheckCircle2, Clock } from 'lucide-react';

const SpendingPlanView = () => {
    const formRef = useRef(null);
    const pending = useRef(false);
    const [busyId, setBusyId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('unpaid');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', amount: '', dueDate: '', description: '', isPaid: false });
    const [editingId, setEditingId] = useState(null);

    const fetchPlans = async () => {
        setError('');
        try {
            const res = await spendingApi.getPlans();
            if (!Array.isArray(res.data)) throw new Error('Invalid response');
            setPlans(res.data);
        } catch (err) {
            console.error(err);
            setError('지출 계획을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || form.amount === '' || !form.dueDate) return;

        if (pending.current) return;
        pending.current = true;
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await spendingApi.updatePlan(editingId, form);
            } else {
                await spendingApi.createPlan(form);
            }
            setNotice(editingId ? '지출 계획을 수정했습니다.' : '지출 계획을 등록했습니다.');
            setForm({ title: '', amount: '', dueDate: '', description: '', isPaid: false });
            setEditingId(null);
            await fetchPlans();
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            pending.current = false;
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (pending.current || !window.confirm('정말 삭제하시겠습니까?')) return;
        pending.current = true;
        setBusyId(id);
        try {
            await spendingApi.deletePlan(id);
            setNotice('지출 계획을 삭제했습니다.');
            await fetchPlans();
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally { pending.current = false; setBusyId(null); }
    };

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setForm({
            title: plan.title,
            amount: plan.amount,
            dueDate: plan.dueDate,
            description: plan.description || '',
            isPaid: plan.paid
        });
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        formRef.current?.querySelector('input')?.focus({ preventScroll: true });
    };

    const togglePaid = async (plan) => {
        if (pending.current) return;
        pending.current = true;
        setBusyId(plan.id);
        try {
            await spendingApi.updatePlan(plan.id, {
                ...plan,
                isPaid: !plan.paid
            });
            setNotice(plan.paid ? '납부 완료를 취소했습니다.' : '납부 완료로 표시했습니다. 완료 목록에서 확인할 수 있습니다.');
            await fetchPlans();
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally { pending.current = false; setBusyId(null); }
    };

    const visiblePlans = filterPlans(plans, statusFilter, query);

    const getDDayColor = (days) => {
        if (days < 0) return 'bg-red-50 text-red-700';
        if (days === 0) return 'bg-red-100 text-red-600 animate-pulse';
        if (days <= 3) return 'bg-red-50 text-red-500';
        if (days <= 7) return 'bg-amber-50 text-amber-600';
        return 'bg-blue-50 text-blue-600';
    };

    // 지출 통계 계산
    const totalSpending = plans.reduce((sum, plan) => sum + Number(plan.amount), 0);
    const paidSpending = plans.filter(p => p.paid).reduce((sum, plan) => sum + Number(plan.amount), 0);
    const unpaidSpending = totalSpending - paidSpending;

    if (loading) {
        return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">지출 계획을 불러오는 중...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {notice && <div role="status" className="feedback success">{notice}</div>}
            {error && <div role="alert" className="feedback error"><span>{error}</span><button onClick={fetchPlans}>다시 불러오기</button></div>}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl shadow-lg text-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black mb-2 tracking-tight">지출 및 납부 계획</h2>
                        <p className="font-medium text-emerald-100 opacity-90">보험료, 적금 납부일 등 정기적이거나 예정된 지출을 관리하세요.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1">총 지출 예정</p>
                            <p className="text-xl font-black">{error && !plans.length ? '확인 필요' : `₩ ${totalSpending.toLocaleString()}`}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-emerald-300">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-white">납부 완료</p>
                            <p className="text-xl font-black">{error && !plans.length ? '확인 필요' : `₩ ${paidSpending.toLocaleString()}`}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-orange-300">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-white">미납부액</p>
                            <p className="text-xl font-black">{error && !plans.length ? '확인 필요' : `₩ ${unpaidSpending.toLocaleString()}`}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div ref={formRef} className="asset-form bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
                            {editingId ? '지출 계획 수정' : '새 지출 계획 추가'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4"><fieldset disabled={saving || busyId !== null} className="space-y-4">
                            {notice && <p className="text-sm text-emerald-700">{notice}</p>}
                            {error && <p className="text-sm text-red-700">{error}</p>}
                            <div>
                                <label htmlFor="SpendingPlanView-field-1" className="block text-xs font-bold text-slate-500 mb-1">지출 항목 명</label>
                                <input maxLength={100} id="SpendingPlanView-field-1"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    placeholder="예: 실비보험, 주택청약"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="SpendingPlanView-field-2" className="block text-xs font-bold text-slate-500 mb-1">납부/지출 예정일</label>
                                <input id="SpendingPlanView-field-2"
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    value={form.dueDate}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="SpendingPlanView-field-3" className="block text-xs font-bold text-slate-500 mb-1">금액 (원)</label>
                                <input id="SpendingPlanView-field-3"
                                    type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                                    placeholder="0"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="SpendingPlanView-field-4" className="block text-xs font-bold text-slate-500 mb-1">상세 정보 (메모)</label>
                                <textarea maxLength={255} id="SpendingPlanView-field-4"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 text-sm"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isPaid"
                                    className="w-4 h-4 rounded text-emerald-600"
                                    checked={form.isPaid}
                                    onChange={e => setForm({ ...form, isPaid: e.target.checked })}
                                />
                                <label htmlFor="isPaid" className="text-sm font-bold text-slate-600 cursor-pointer">이미 납부함</label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setForm({ title: '', amount: '', dueDate: '', description: '', isPaid: false });
                                        }}
                                        className="flex-1 bg-slate-200 p-4 rounded-xl font-bold"
                                    >
                                        취소
                                    </button>
                                )}
                                <button type="submit" disabled={saving} className={`flex-[2] p-4 rounded-xl font-bold text-white shadow-lg ${editingId ? 'bg-orange-500' : 'bg-emerald-600'}`}>
                                    {saving ? '저장 중…' : editingId ? '수정 완료' : '등록하기'}
                                </button>
                            </div>
                        </fieldset></form>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" /> 지출 예정 목록
                        </h3>

                        {notice && <p className="text-sm text-emerald-700 mb-4">{notice}</p>}
                        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
                        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="지출 상태 필터">
                            {[['unpaid', '미납'], ['overdue', '기한 경과'], ['paid', '완료'], ['all', '전체']].map(([value, label]) => <button key={value} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`px-4 py-2 rounded-xl text-sm font-bold ${statusFilter === value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}
                        </div>
                        <input type="search" aria-label="지출 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="지출 항목명, 메모 검색" className="w-full p-3 border border-slate-200 rounded-xl mb-3" />
                        <p className="text-xs text-slate-500 mb-5">{visiblePlans.length}개 · 선택 목록 합계 ₩ {visiblePlans.reduce((sum, plan) => sum + Number(plan.amount), 0).toLocaleString()}</p>
                        <div className="space-y-4">
                            {visiblePlans.length > 0 ? (
                                visiblePlans.map((plan) => {
                                    const dDay = daysUntil(plan.dueDate);
                                    return (
                                        <div key={plan.id} className={`group p-5 border rounded-2xl transition-all ${plan.paid ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'}`}>
                                            <div className="asset-row flex justify-between items-center gap-4">
                                                <div className="flex gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${plan.paid ? 'bg-emerald-50 text-emerald-700' : getDDayColor(dDay)}`}>
                                                        <span className="text-[10px] uppercase">D-Day</span>
                                                        <span className="text-lg">{plan.paid ? '완료' : dDay === 0 ? '오늘' : dDay > 0 ? `-${dDay}` : `+${Math.abs(dDay)}`}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`font-bold ${plan.paid ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{plan.title}</h4>
                                                            {plan.paid && (
                                                                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-1.5 py-0.5 rounded-md">완료</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.dueDate}</span>
                                                            {plan.description && <span>• {plan.description}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className={`text-xl font-black ${plan.paid ? 'text-slate-400' : 'text-slate-900'}`}>₩ {Number(plan.amount).toLocaleString()}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            disabled={saving || busyId !== null} aria-label={`${plan.title} ${plan.paid ? '납부 취소' : '납부 완료'}`} onClick={() => togglePaid(plan)}
                                                            className={`p-2 rounded-lg transition-colors ${plan.paid ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                            title={plan.paid ? "납부 취소" : "납부 완료"}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 inline mr-1" /><span className="text-xs">{busyId === plan.id ? '처리 중…' : plan.paid ? '납부 취소' : '납부 완료'}</span>
                                                        </button>
                                                        <button disabled={saving || busyId !== null} aria-label={`${plan.title} 수정`} onClick={() => handleEdit(plan)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button disabled={saving || busyId !== null} aria-label={`${plan.title} 삭제`} onClick={() => handleDelete(plan.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : !error ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    선택한 조건의 지출이 없습니다. 필터나 검색어를 바꿔보세요.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpendingPlanView;
