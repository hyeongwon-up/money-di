import React, { useState, useEffect } from 'react';
import { pointApi } from '../api/pointApi';
import { Wallet, PlusCircle, MinusCircle, History, User, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const PointsView = () => {
    const [points, setPoints] = useState([]);
    const [history, setHistory] = useState({ '남편네': [], '여편네': [] });
    const [loading, setLoading] = useState(true);
    const [activeOwner, setActiveOwner] = useState('남편네');
    const [form, setForm] = useState({ amount: '', description: '' });

    const fetchData = async () => {
        try {
            const [pointsRes, husbandHistory, wifeHistory] = await Promise.all([
                pointApi.getAllPoints(),
                pointApi.getHistory('남편네'),
                pointApi.getHistory('여편네')
            ]);
            setPoints(pointsRes.data);
            setHistory({
                '남편네': husbandHistory.data,
                '여편네': wifeHistory.data
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (type) => {
        if (!form.amount || !form.description) {
            alert('금액과 내용을 입력해주세요.');
            return;
        }

        try {
            if (type === 'add') {
                await pointApi.addPoints(activeOwner, { amount: Number(form.amount), description: form.description });
            } else {
                await pointApi.usePoints(activeOwner, { amount: Number(form.amount), description: form.description });
            }
            setForm({ amount: '', description: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || '처리에 실패했습니다.');
        }
    };

    const getOwnerPoint = (owner) => {
        return points.find(p => p.owner === owner)?.balance || 0;
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">포인트 정보를 불러오는 중...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {/* Header / Summary */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-lg text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black mb-2 tracking-tight">포인트 현황</h2>
                        <p className="font-medium text-indigo-100 opacity-90">부부의 포인트를 효율적으로 관리하세요.</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[160px]">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1">남편네 포인트</p>
                            <p className="text-2xl font-black">P {getOwnerPoint('남편네').toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[160px]">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1">여편네 포인트</p>
                            <p className="text-2xl font-black">P {getOwnerPoint('여편네').toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Forms */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-600" /> 포인트 관리
                        </h3>
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button 
                                onClick={() => setActiveOwner('남편네')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeOwner === '남편네' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                남편네
                            </button>
                            <button 
                                onClick={() => setActiveOwner('여편네')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeOwner === '여편네' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                여편네
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">금액 (P)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600"
                                    placeholder="0"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">내용 / 사유</label>
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    placeholder="예: 카드 적립, 마일리지 사용"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => handleAction('use')}
                                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MinusCircle className="w-5 h-5" /> 사용하기
                                </button>
                                <button 
                                    onClick={() => handleAction('add')}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
                                >
                                    <PlusCircle className="w-5 h-5" /> 적립하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: History */}
                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" /> {activeOwner} 포인트 내역
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {history[activeOwner]?.length > 0 ? (
                                history[activeOwner].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'SAVE' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {item.type === 'SAVE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{item.description}</p>
                                                <p className="text-xs text-slate-400 font-medium">{new Date(item.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-lg ${item.type === 'SAVE' ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                {item.type === 'SAVE' ? '+' : ''}{item.amount.toLocaleString()} P
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
                                    <History className="w-12 h-12 mb-3 opacity-20" />
                                    최근 내역이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointsView;
