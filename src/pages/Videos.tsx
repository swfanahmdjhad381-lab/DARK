import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Video as VideoType } from '../types';
import { useAuth } from '../components/AuthContext';
import { Play, Search, Clock, Lock, ShieldAlert, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Videos: React.FC = () => {
  const { isSubscribed, isModerator } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType));
      setVideos(videosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setSearchParams({ q: searchTerm }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [searchTerm, setSearchParams]);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSubscribed && !isModerator) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md bg-white p-10 rounded-3xl shadow-xl border border-neutral-100">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">محتوى مقيد</h2>
          <p className="text-neutral-500 mb-8">تحتاج إلى اشتراك مفعل للوصول إلى مكتبة الفيديوهات. يرجى التواصل مع المالك لتفعيل حسابك.</p>
          <Link 
            to="/"
            className="block w-full bg-neutral-900 text-white font-bold py-4 rounded-2xl hover:bg-neutral-800 transition-all"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">مكتبة الدروس</h1>
          <p className="text-neutral-500">استكشف جميع الدروس والشروحات المتاحة</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-2xl py-3 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
            placeholder="بحث عن درس..."
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center gap-2 text-neutral-500 mb-4 animate-in fade-in slide-in-from-top-1">
          <span className="text-sm">نتائج البحث عن:</span>
          <span className="font-bold text-blue-600">"{searchTerm}"</span>
          <span className="text-xs bg-neutral-100 px-2 py-1 rounded-lg">({filteredVideos.length} نتيجة)</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredVideos.map((v) => (
          <Link 
            key={v.id} 
            to={`/videos/${v.id}`}
            className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="aspect-video bg-neutral-100 relative">
              {v.thumbnailURL ? (
                <img src={v.thumbnailURL} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Play className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-7 h-7 fill-current" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                {v.createdAt?.toDate().toLocaleDateString('ar-EG')}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2 truncate group-hover:text-blue-600 transition-colors">{v.title}</h3>
              <p className="text-neutral-500 text-sm line-clamp-2 mb-4 leading-relaxed">{v.description || 'لا يوجد وصف متاح لهذا الدرس حالياً.'}</p>
              <div className="pt-4 border-t border-neutral-50 flex items-center justify-between">
                <span className="text-blue-600 text-sm font-bold flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  مشاهدة الآن
                </span>
                <Clock className="w-4 h-4 text-neutral-300" />
              </div>
            </div>
          </Link>
        ))}
        {filteredVideos.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-neutral-200">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
              <Search className="w-10 h-10" />
            </div>
            <p className="text-neutral-400 text-lg">لم يتم العثور على فيديوهات تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
};
