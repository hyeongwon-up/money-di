import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, PlusCircle, Trash2, Edit2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const SpendingPlanView = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', amount: '', dueDate: '', description: '', isPaid: false });
    const [editingId, setEditingId] = useState(null);

    const fetchPlans = async () => {
        try {
            const res = await axios.get('/api/spending-plans');
            setPlans(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.amount || !form.dueDate) return;

        try {
            if (editingId) {
                await axios.put(`/api/spending-plans/${editingId}`, form);
            } else {
                await axios.post('/api/spending-plans', form);
            }
            setForm({ title: '', amount: '', dueDate: '', description: '', isPaid: false });
            setEditingId(null);
            fetchPlans();
        } catch (err) {
            console.error(err);
            alert('지출 계획 저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`/api/spending-plans/${id}`);
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const togglePaid = async (plan) => {
        try {
            await axios.put(`/api/spending-plans/${plan.id}`, {
                ...plan,
                isPaid: !plan.paid
            });
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
    };

    const calculateDDay = (dueDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = due - today;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const getDDayColor = (days) => {
        if (days < 0) return 'bg-slate-100 text-slate-400';
        if (days === 0) return 'bg-red-100 text-red-600 animate-pulse';
        if (days <= 3) return 'bg-red-50 text-red-500';
        if (days <= 7) return 'bg-amber-50 text-amber-600';
        return 'bg-blue-50 text-blue-600';
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">지출 계획을 불러오는 중...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl shadow-lg text-white">
                <h2 className="text-2xl font-black mb-2 tracking-tight">지출 및 납부 계획</h2>
                <p className="font-medium text-emerald-100 opacity-90">보험료, 적금 납부일 등 정기적이거나 예정된 지출을 관리하세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 입력 폼 */}
                <div className="lg:col-span-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
                            {editingId ? '지출 계획 수정' : '새 지출 계획 추가'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">지출 항목 명</label>
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    placeholder="예: 실비보험, 주택청약"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">납부/지출 예정일</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    value={form.dueDate}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">금액 (원)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                                    placeholder="0"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">상세 정보 (메모)</label>
                                <textarea
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
                                <button className={`flex-[2] p-4 rounded-xl font-bold text-white shadow-lg ${editingId ? 'bg-orange-500' : 'bg-emerald-600'}`}>
                                    {editingId ? '수정 완료' : '등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 목록 */}
                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" /> 지출 예정 목록
                        </h3>

                        <div className="space-y-4">
                            {plans.length > 0 ? (
                                plans.map((plan) => {
                                    const dDay = calculateDDay(plan.dueDate);
                                    return (
                                        <div key={plan.id} className={`group p-5 border rounded-2xl transition-all ${plan.paid ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'}`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${getDDayColor(dDay)}`}>
                                                        <span className="text-[10px] uppercase">D-Day</span>
                                                        <span className="text-lg">{dDay === 0 ? 'Day' : dDay > 0 ? `-${dDay}` : `+${Math.abs(dDay)}`}</span>
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
                                                            onClick={() => togglePaid(plan)}
                                                            className={`p-2 rounded-lg transition-colors ${plan.paid ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                            title={plan.paid ? "납부 취소" : "납부 완료"}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleEdit(plan)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    등록된 지출 계획이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpendingPlanView;
