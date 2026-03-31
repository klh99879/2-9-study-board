import { useState, useMemo, useEffect, useRef, FormEvent } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  parseISO,
  getDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  BookOpen, 
  ClipboardCheck, 
  Sparkles,
  Plus,
  Clock,
  Tag,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Save,
  MessageCircle,
  Send,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { api } from './api';
import { 
  INITIAL_EVENTS,
  INITIAL_EXAM_SCOPES,
  INITIAL_ASSESSMENTS,
  INITIAL_ACTIVITIES
} from './constants';
import { 
  CalendarEvent, 
  Category, 
  Announcement,
  ExamScope,
  Assessment,
  StudentActivity
} from './types';

type ModalType = 'event' | 'announcement' | 'examScope' | 'assessment' | 'activity' | null;

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Data States
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [examScopes, setExamScopes] = useState<ExamScope[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activities, setActivities] = useState<StudentActivity[]>([]);

  // Fetch Data Effect
  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data from API...", window.location.origin);
      try {
        const [evts, anns, scopes, assts, acts] = await Promise.all([
          api.getCollection('events'),
          api.getCollection('announcements'),
          api.getCollection('examScopes'),
          api.getCollection('assessments'),
          api.getCollection('activities')
        ]);
        console.log("Data fetched successfully:", { 
          evts: evts.length, 
          anns: anns.length,
          scopes: scopes.length,
          assts: assts.length,
          acts: acts.length
        });
        setEvents(evts || []);
        setAnnouncements(anns || []);
        setExamScopes(scopes || []);
        setAssessments(assts || []);
        setActivities(acts || []);
      } catch (err: any) {
        console.error("Fetch error:", err);
        let message = "데이터를 불러오는 중 오류가 발생했습니다.";
        try {
          const errData = JSON.parse(err.message);
          message = `오류: ${errData.error}`;
        } catch (e) {
          message = `오류: ${err.message}`;
        }
        setToast({ message, type: 'error' });
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const allEvents = useMemo(() => events, [events]);
  const allAnnouncements = useMemo(() => announcements, [announcements]);

  // Modal States
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // AI Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context from current state
      const context = {
        events: events.map(e => ({ title: e.title, date: e.date, category: e.category })),
        announcements: announcements.map(a => ({ title: a.title, content: a.content, date: a.date })),
        examScopes: examScopes.map(s => ({ subject: s.subject, range: s.range, date: s.date })),
        assessments: assessments.map(a => ({ subject: a.subject, title: a.title, date: a.date })),
        activities: activities.map(a => ({ title: a.title, date: a.date, description: a.description }))
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `현재 학급 정보: ${JSON.stringify(context)}\n\n질문: ${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: `당신은 고등학교 2학년 9반의 학급 도우미 AI입니다. 
학생들의 질문에 친절하고 활기차게 답변해주세요. 
제공된 '현재 학급 정보'를 바탕으로 정확하게 답변해야 합니다.

**답변 가이드라인:**
1. 마크다운(Markdown) 형식을 사용하여 답변을 구조화하세요.
2. 중요한 내용은 **굵게** 표시하세요.
3. 목록이 필요한 경우 불렛 포인트나 번호를 사용하세요.
4. 가독성을 위해 적절한 줄바꿈을 사용하세요.
5. 답변은 항상 친절한 말투(~해요, ~입니다)를 유지하세요.`
        }
      });
      
      const aiText = response.text || "죄송합니다. 답변을 생성하는 중에 문제가 발생했습니다.";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "오류가 발생했습니다. 나중에 다시 시도해주세요." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.adminLogin(adminPassword);
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setAdminPassword("");
      setToast({ message: "관리자 모드로 전환되었습니다.", type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "비밀번호가 틀렸습니다.", type: 'error' });
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setToast({ message: "관리자 모드가 해제되었습니다.", type: 'success' });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const seedInitialData = async (silent = false) => {
    if (!isAdmin) return;
    
    const performSeed = async () => {
      setIsAuthLoading(true);
      try {
        // ONLY restore calendar events as requested by the user.
        // Other sections (examScopes, assessments, activities) are preserved.
        await Promise.all(INITIAL_EVENTS.map(e => api.saveItem('events', e)));
        
        const evts = await api.getCollection('events');
        setEvents(evts || []);
        
        if (!silent) setToast({ message: '달력 데이터가 복구되었습니다.', type: 'success' });
      } catch (err) {
        console.error("Seed error:", err);
        if (!silent) setToast({ message: '데이터 복구에 실패했습니다.', type: 'error' });
      } finally {
        setIsAuthLoading(false);
      }
    };

    if (silent) {
      performSeed();
    } else {
      setConfirmation({
        isOpen: true,
        title: '달력 데이터 복구',
        message: '기본 달력 일정만 복구하시겠습니까? 시험 범위, 수행평가, 생기부 활동 내용은 그대로 유지됩니다.',
        onConfirm: performSeed
      });
    }
  };

  // Auto-seed effect removed to ensure deleted items stay deleted.

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const selectedDateEvents = useMemo(() => {
    return allEvents.filter(event => isSameDay(parseISO(event.date), selectedDate));
  }, [allEvents, selectedDate]);

  const getCategoryColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    if (event.isHoliday) return 'bg-red-500';
    switch (event.category) {
      case 'schedule': return 'bg-blue-500';
      case 'exam': return 'bg-blue-600';
      case 'assessment': return 'bg-emerald-500';
      case 'activity': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: '이미지 크기는 2MB 이하여야 합니다.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (modalType) {
      setTempImageUrl(editingItem?.imageUrl || null);
    } else {
      setTempImageUrl(null);
    }
  }, [modalType, editingItem]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const id = editingItem?.id || Math.random().toString(36).substr(2, 9);
    const imageUrl = tempImageUrl || undefined;

    try {
      if (modalType === 'event') {
        const newEvent: CalendarEvent = {
          id,
          title: data.title as string,
          date: data.date as string,
          category: data.category as Category,
          description: data.description as string,
          isHoliday: data.isHoliday === 'on',
          color: data.color as string,
        };
        await api.saveItem('events', newEvent);
        setEvents(prev => {
          const idx = prev.findIndex(e => e.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newEvent;
            return next;
          }
          return [...prev, newEvent];
        });
      } else if (modalType === 'announcement') {
        const newAnnouncement: Announcement = {
          id,
          title: data.title as string,
          content: data.content as string,
          date: data.date as string,
          isImportant: data.isImportant === 'on',
          imageUrl,
        };
        await api.saveItem('announcements', newAnnouncement);
        setAnnouncements(prev => {
          const idx = prev.findIndex(a => a.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newAnnouncement;
            return next;
          }
          return [...prev, newAnnouncement];
        });
      } else if (modalType === 'examScope') {
        const newScope: ExamScope = {
          id,
          subject: data.subject as string,
          range: data.range as string,
          date: data.date as string,
          imageUrl,
        };
        await api.saveItem('examScopes', newScope);
        setExamScopes(prev => {
          const idx = prev.findIndex(s => s.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newScope;
            return next;
          }
          return [...prev, newScope];
        });
      } else if (modalType === 'assessment') {
        const newAssessment: Assessment = {
          id,
          subject: data.subject as string,
          title: data.title as string,
          date: data.date as string,
          description: data.description as string,
          imageUrl,
        };
        await api.saveItem('assessments', newAssessment);
        setAssessments(prev => {
          const idx = prev.findIndex(a => a.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newAssessment;
            return next;
          }
          return [...prev, newAssessment];
        });
      } else if (modalType === 'activity') {
        const newActivity: StudentActivity = {
          id,
          title: data.title as string,
          date: data.date as string,
          description: data.description as string,
          imageUrl,
        };
        await api.saveItem('activities', newActivity);
        setActivities(prev => {
          const idx = prev.findIndex(a => a.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newActivity;
            return next;
          }
          return [...prev, newActivity];
        });
      }
      setModalType(null);
      setEditingItem(null);
      setToast({ message: '저장되었습니다.', type: 'success' });
    } catch (err) {
      console.error("Save error:", err);
      setToast({ message: '저장에 실패했습니다.', type: 'error' });
    }
  };

  const handleDelete = async (id: string, type: ModalType) => {
    if (!isAdmin) return;
    
    setConfirmation({
      isOpen: true,
      title: '삭제 확인',
      message: '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      onConfirm: async () => {
        try {
          const collectionMap: Record<string, string> = {
            'event': 'events',
            'announcement': 'announcements',
            'examScope': 'examScopes',
            'assessment': 'assessments',
            'activity': 'activities'
          };
          const collectionName = collectionMap[type as string];
          await api.deleteItem(collectionName, id);
          
          if (type === 'event') setEvents(prev => prev.filter(e => e.id !== id));
          else if (type === 'announcement') setAnnouncements(prev => prev.filter(a => a.id !== id));
          else if (type === 'examScope') setExamScopes(prev => prev.filter(s => s.id !== id));
          else if (type === 'assessment') setAssessments(prev => prev.filter(a => a.id !== id));
          else if (type === 'activity') setActivities(prev => prev.filter(a => a.id !== id));

          setToast({ message: '삭제되었습니다.', type: 'success' });
        } catch (err) {
          console.error("Delete error:", err);
          setToast({ message: '삭제에 실패했습니다.', type: 'error' });
        }
      }
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <CalendarIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">2-9반 학급 일정표</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Class Dashboard v2.0</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => seedInitialData()}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all text-xs"
                title="달력 데이터 복구"
              >
                <RefreshCw className="w-4 h-4" />
                달력 데이터 복구
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => { setModalType('event'); setEditingItem(null); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              {isAdmin ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold">관리자 모드</p>
                    <p className="text-[10px] text-blue-500">수정 가능</p>
                  </div>
                  <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  관리자 로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Admin Login Modal */}
        <AnimatePresence>
          {isAdminLoginOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdminLoginOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-4">
                    <LogIn className="text-white w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">관리자 로그인</h3>
                  <p className="text-xs text-gray-500 mt-1">비밀번호를 입력하여 관리자 모드로 전환하세요.</p>
                </div>
                
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="비밀번호"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsAdminLoginOpen(false)}
                      className="flex-1 px-4 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      취-소
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      로그인
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Left Column: Calendar (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-2xl font-bold">
                {format(currentDate, 'yyyy년 MMMM', { locale: ko })}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold hover:bg-gray-100 rounded-xl transition-colors">
                  오늘
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={day} className={cn(
                  "py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-400",
                  i === 0 && "text-red-400",
                  i === 6 && "text-blue-400"
                )}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayEvents = allEvents.filter(e => isSameDay(parseISO(e.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isHoliday = dayEvents.some(e => e.isHoliday);

                return (
                  <div 
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] p-2 border-b border-r border-gray-50 cursor-pointer transition-all hover:bg-gray-50 group relative",
                      !isCurrentMonth && "opacity-30",
                      isSelected && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                        isToday && "bg-blue-600 text-white shadow-md shadow-blue-200",
                        !isToday && isSelected && "bg-blue-100 text-blue-600",
                        !isToday && !isSelected && (
                          (isHoliday || getDay(day) === 0) ? "text-red-500" : 
                          getDay(day) === 6 ? "text-blue-500" : 
                          "text-gray-700 group-hover:text-blue-600"
                        )
                      )}>
                        {format(day, 'd')}
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day);
                            setModalType('event');
                            setEditingItem(null);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-all"
                          title="일정 추가"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-md text-white font-medium truncate",
                            getCategoryColor(event)
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-gray-400 font-bold pl-1">
                          + {dayEvents.length - 3} 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDate.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })} 일정
                </h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {selectedDateEvents.length} Events
                </span>
              </div>
              
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-blue-200 transition-colors">
                      <div className={cn("w-3 h-3 rounded-full shrink-0", getCategoryColor(event))} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{event.title}</p>
                        {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setModalType('event'); setEditingItem(event); }}
                              className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(event.id, 'event'); }}
                              className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <span className={cn(
                          "text-[10px] font-bold text-white uppercase tracking-tighter px-2 py-1 rounded-lg",
                          getCategoryColor(event)
                        )}>
                          {event.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm font-medium">일정이 없습니다.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Right Column: Info Panels (5 cols) */}
        <aside className="lg:col-span-5 space-y-6">
          
          {/* 1. 공지사항 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                공지사항
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => { setModalType('announcement'); setEditingItem(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {allAnnouncements.length > 0 ? (
                allAnnouncements.map(ann => (
                  <div key={ann.id} className={cn(
                    "p-4 rounded-2xl border transition-all group relative",
                    ann.isImportant ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {ann.isImportant && <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">중요</span>}
                        <span className="text-[10px] font-bold text-gray-400">{ann.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => { setModalType('announcement'); setEditingItem(ann); }}
                              className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDelete(ann.id, 'announcement')}
                              className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{ann.title}</h4>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap mb-2">{ann.content}</p>
                    {ann.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                        <img src={ann.imageUrl} alt={ann.title} className="w-full h-auto object-cover max-h-48" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">등록된 공지사항이 없습니다.</div>
              )}
            </div>
          </section>

          {/* 2. 시험 범위 알림 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                시험 범위 알림
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => { setModalType('examScope'); setEditingItem(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {examScopes.length > 0 ? (
                examScopes.map(scope => (
                  <div key={scope.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-lg">{scope.subject}</span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button onClick={() => { setModalType('examScope'); setEditingItem(scope); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(scope.id, 'examScope')} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed mb-2">{scope.range}</p>
                    {scope.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                        <img src={scope.imageUrl} alt={scope.subject} className="w-full h-auto object-cover max-h-48" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">등록된 시험 범위가 없습니다.</div>
              )}
            </div>
          </section>

          {/* 3. 수행평가 알림 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                수행평가 알림
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => { setModalType('assessment'); setEditingItem(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-emerald-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {assessments.length > 0 ? (
                assessments.map(asst => (
                  <div key={asst.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-lg">{asst.subject}</span>
                        <span className="text-[10px] font-bold text-gray-400">{asst.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button onClick={() => { setModalType('assessment'); setEditingItem(asst); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-emerald-500 transition-all">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(asst.id, 'assessment')} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{asst.title}</h4>
                    {asst.description && <p className="text-xs text-gray-600 mb-2">{asst.description}</p>}
                    {asst.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                        <img src={asst.imageUrl} alt={asst.title} className="w-full h-auto object-cover max-h-48" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">등록된 수행평가가 없습니다.</div>
              )}
            </div>
          </section>

          {/* 4. 생기부 활동 공지 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                생기부 활동 공지
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => { setModalType('activity'); setEditingItem(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-purple-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map(act => (
                  <div key={act.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400">{act.date}</span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button onClick={() => { setModalType('activity'); setEditingItem(act); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-500 transition-all">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(act.id, 'activity')} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{act.title}</h4>
                    {act.description && <p className="text-xs text-gray-600 mb-2">{act.description}</p>}
                    {act.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                        <img src={act.imageUrl} alt={act.title} className="w-full h-auto object-cover max-h-48" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">등록된 활동 공지가 없습니다.</div>
              )}
            </div>
          </section>

          {/* 5. AI Q&A */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                궁금한 내용 질문
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">학교 생활이나 일정에 대해<br />무엇이든 물어보세요!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:my-0">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-indigo-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">답변을 생각 중이에요...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative shrink-0">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>

        </aside>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-lg">
                  {editingItem ? '수정하기' : '새로 만들기'} - {
                    modalType === 'event' ? '일정' : 
                    modalType === 'announcement' ? '공지사항' :
                    modalType === 'examScope' ? '시험 범위' :
                    modalType === 'assessment' ? '수행평가' : '생기부 활동'
                  }
                </h3>
                <button onClick={() => setModalType(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {modalType === 'event' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">제목</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="일정 제목을 입력하세요" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">날짜</label>
                        <input name="date" type="date" defaultValue={editingItem?.date || format(selectedDate, 'yyyy-MM-dd')} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">카테고리</label>
                        <select name="category" defaultValue={editingItem?.category || 'schedule'} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                          <option value="schedule">일반 일정</option>
                          <option value="exam">시험</option>
                          <option value="assessment">수행평가</option>
                          <option value="activity">생기부 활동</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">설명 (선택)</label>
                      <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-24 resize-none" placeholder="상세 내용을 입력하세요" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">색상 지정</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: '기본', value: '' },
                          { name: '빨강', value: 'bg-red-500' },
                          { name: '파랑', value: 'bg-blue-500' },
                          { name: '초록', value: 'bg-emerald-500' },
                          { name: '주황', value: 'bg-orange-500' },
                          { name: '보라', value: 'bg-purple-500' },
                          { name: '핑크', value: 'bg-pink-500' },
                          { name: '노랑', value: 'bg-yellow-500' },
                        ].map((color) => (
                          <label key={color.name} className="relative cursor-pointer group">
                            <input 
                              type="radio" 
                              name="color" 
                              value={color.value} 
                              defaultChecked={editingItem?.color === color.value || (!editingItem?.color && color.value === '')}
                              className="peer sr-only" 
                            />
                            <div className={cn(
                              "w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-blue-600 transition-all",
                              color.value || "bg-gray-200"
                            )} />
                            <div className={cn(
                              "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none",
                              color.value || "bg-gray-400"
                            )}>
                              {color.name}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <input 
                        type="checkbox" 
                        name="isHoliday" 
                        id="isHoliday"
                        defaultChecked={editingItem?.isHoliday}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" 
                      />
                      <label htmlFor="isHoliday" className="text-xs font-bold text-gray-600">공휴일(빨간날)로 지정</label>
                    </div>
                  </>
                )}

                {modalType === 'announcement' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">공지 제목</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="공지 제목을 입력하세요" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">날짜</label>
                      <input name="date" type="date" defaultValue={editingItem?.date || format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">공지 내용</label>
                      <textarea name="content" defaultValue={editingItem?.content} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-32 resize-none" placeholder="공지 내용을 입력하세요" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">사진 첨부</label>
                      <div className="flex items-center gap-4">
                        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                          {tempImageUrl ? (
                            <img src={tempImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold">추가</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setTempImageUrl)} />
                        </label>
                        {tempImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setTempImageUrl(null)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            사진 삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <input 
                        type="checkbox" 
                        name="isImportant" 
                        id="isImportant"
                        defaultChecked={editingItem?.isImportant}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <label htmlFor="isImportant" className="text-xs font-bold text-gray-600">중요 공지로 지정</label>
                    </div>
                  </>
                )}

                {modalType === 'examScope' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">과목</label>
                      <input name="subject" defaultValue={editingItem?.subject} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="과목명을 입력하세요 (예: 국어)" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">시험 날짜</label>
                      <input name="date" type="date" defaultValue={editingItem?.date || format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">시험 범위</label>
                      <textarea name="range" defaultValue={editingItem?.range} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-32 resize-none" placeholder="시험 범위를 입력하세요" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">사진 첨부</label>
                      <div className="flex items-center gap-4">
                        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                          {tempImageUrl ? (
                            <img src={tempImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold">추가</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setTempImageUrl)} />
                        </label>
                        {tempImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setTempImageUrl(null)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            사진 삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'assessment' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">과목</label>
                      <input name="subject" defaultValue={editingItem?.subject} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="과목명을 입력하세요" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">평가 제목</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="수행평가 제목을 입력하세요" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">마감 날짜</label>
                      <input name="date" type="date" defaultValue={editingItem?.date || format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">상세 설명</label>
                      <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-24 resize-none" placeholder="상세 내용을 입력하세요" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">사진 첨부</label>
                      <div className="flex items-center gap-4">
                        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                          {tempImageUrl ? (
                            <img src={tempImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold">추가</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setTempImageUrl)} />
                        </label>
                        {tempImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setTempImageUrl(null)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            사진 삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'activity' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">활동 제목</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="활동 제목을 입력하세요" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">활동 날짜</label>
                      <input name="date" type="date" defaultValue={editingItem?.date || format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">상세 설명</label>
                      <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-24 resize-none" placeholder="상세 내용을 입력하세요" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">사진 첨부</label>
                      <div className="flex items-center gap-4">
                        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                          {tempImageUrl ? (
                            <img src={tempImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[10px] font-bold">추가</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setTempImageUrl)} />
                        </label>
                        {tempImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setTempImageUrl(null)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            사진 삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 px-4 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                    취소
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-gray-100"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2 text-gray-900">{confirmation.title}</h3>
              <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                {confirmation.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    confirmation.onConfirm();
                    setConfirmation(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[110] px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2",
              toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tighter uppercase">Class Schedule Dashboard</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">© 2026 High School Class Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
