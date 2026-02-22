import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, CornerDownRight, MessageSquare, ChevronRight, ChevronDown } from 'lucide-react';

// Single recursive thought node component
const ThoughtNode = ({ thought, onReply, onDelete, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(thought.content);

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        try {
            await onUpdate(thought.id, editContent);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative group">
            {/* 꼬리 연결선 (자식이 있을 경우 들여쓰기 선) */}
            <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-slate-100 group-hover:bg-slate-200 transition-colors z-0" />

            <div className="flex gap-3 relative z-10 pt-4">
                {/* 아바타/아이콘 영역 */}
                <div
                    className="w-10 h-10 shrink-0 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {thought.subThoughts && thought.subThoughts.length > 0 ? (
                        isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />
                    ) : (
                        <MessageSquare className="w-4 h-4 text-slate-300" />
                    )}
                </div>

                {/* 생각 내용 영역 */}
                <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(thought.content);
                                    }}
                                    className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {thought.content}
                        </p>
                    )}

                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                {new Date(thought.createdAt).toLocaleString()}
                            </span>
                            <button
                                onClick={() => onReply(thought.id)}
                                className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                            >
                                <CornerDownRight className="w-3 h-3" />
                                꼬리 무기 (답글)
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100 ml-auto"
                            >
                                수정
                            </button>
                            <button
                                onClick={() => onDelete(thought.id)}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 자식 노드들 렌더링 (재귀) */}
            {isExpanded && thought.subThoughts && thought.subThoughts.length > 0 && (
                <div className="pl-12">
                    {thought.subThoughts.map(child => (
                        <ThoughtNode
                            key={child.id}
                            thought={child}
                            onReply={onReply}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ThoughtsView = () => {
    const [thoughts, setThoughts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // parent thought ID
    const [newContent, setNewContent] = useState('');

    const fetchThoughts = async () => {
        try {
            // 캐시 방지를 위해 타임스탬프 추가
            const res = await axios.get(`/api/thoughts?t=${new Date().getTime()}`);
            setThoughts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThoughts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        try {
            await axios.post('/api/thoughts', {
                content: newContent,
                parentId: replyingTo
            });
            setNewContent('');
            setReplyingTo(null);
            await fetchThoughts();
        } catch (err) {
            console.error(err);
            alert('생각 저장에 실패했습니다.');
        }
    };

    const handleUpdate = async (id, content) => {
        try {
            await axios.put(`/api/thoughts/${id}`, { content });
            await fetchThoughts();
        } catch (err) {
            console.error(err);
            alert('수정에 실패했습니다.');
            throw err;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('이 생각과 꼬리를 문 하위 모든 생각들이 삭제됩니다. 계속하시겠습니까?')) return;
        try {
            await axios.delete(`/api/thoughts/${id}`);
            await fetchThoughts();
        } catch (err) {
            console.error(err);
            alert('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">생각들을 불러오는 중...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg text-white">
                <h2 className="text-2xl font-black mb-2 tracking-tight">생각 정리 공간</h2>
                <p className="font-medium text-blue-100 opacity-90">자산이나 투자 아이디어를 꼬리에 꼬리를 무는 형태로 정리해보세요.</p>
            </div>

            <div className="space-y-2">
                {thoughts.map(thought => (
                    <ThoughtNode
                        key={thought.id}
                        thought={thought}
                        onReply={setReplyingTo}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                    />
                ))}

                {thoughts.length === 0 && (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold">아직 작성된 생각이 없습니다.<br />첫 번째 아이디어를 기록해보세요!</p>
                    </div>
                )}
            </div>

            {/* 새 글 작성 폼 (고정 바닥 또는 인라인) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-4xl mx-auto">
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-4 py-2 rounded-t-xl text-xs font-bold border-b border-blue-100">
                            <span className="flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3" /> 특정 생각에 꼬리를 무는 중...
                            </span>
                            <button onClick={() => setReplyingTo(null)} className="hover:text-red-500">취소 (새로운 메인 생각 쓰기)</button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-2 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder={replyingTo ? "이 생각에 이어질 내용은..." : "새로운 주제의 생각 쓰기..."}
                            className="flex-1 p-3 bg-transparent border-none resize-none focus:outline-none focus:ring-0 max-h-32 text-sm"
                            rows={2}
                            autoFocus={!!replyingTo}
                        />
                        <button
                            type="submit"
                            disabled={!newContent.trim()}
                            className="bg-blue-600 text-white p-4 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[100px]"
                        >
                            기록하기
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ThoughtsView;
