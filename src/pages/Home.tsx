import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Video as VideoType } from '../types';
import { useAuth } from '../components/AuthContext';
import { Play, Clock, Shield, Star, BookOpen, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Home: React.FC = () => {
  const { profile, isSubscribed, isAdmin, isModerator } = useAuth();
  const [latestVideos, setLatestVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(4));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType));
      setLatestVideos(videosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-12 font-sans" dir="rtl">
      {/* Hero Section */}
      <section className="relative bg-neutral-900 text-white rounded-[2.5rem] p-10 md:p-16 overflow-hidden shadow-2xl shadow-blue-600/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-blue-600/30">
            <Star className="w-4 h-4 fill-current" />
            <span>مرحباً بك في كورس دارك</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            تعلم البرمجة <br /> 
            <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">بأفضل الطرق</span> الممكنة
          </h1>
          <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
            منصة تعليمية متخصصة تقدم لك شروحات وافية ومبسطة في مختلف مجالات البرمجة، مع دعم فني مستمر ومحتوى متجدد.
          </p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const search = formData.get('search');
              window.location.href = `/videos?q=${search}`;
            }}
            className="relative max-w-md mb-10 group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              name="search"
              type="text" 
              placeholder="ابحث عن درس معين..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all text-white placeholder:text-neutral-500"
            />
          </form>

          <div className="flex flex-wrap gap-4">
            <Link 
              to="/videos" 
              className="bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              ابدأ التعلم الآن
            </Link>
            {isAdmin && (
              <Link 
                to="/admin/users" 
                className="bg-white/10 text-white font-bold py-4 px-10 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10"
              >
                لوحة التحكم
              </Link>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute right-20 top-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'فيديو تعليمي', value: '50+', icon: Play, color: 'bg-blue-100 text-blue-600' },
          { label: 'ساعة من المحتوى', value: '120+', icon: Clock, color: 'bg-blue-100 text-blue-600' },
          { label: 'طالب مشترك', value: '1000+', icon: User, color: 'bg-green-100 text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
              <p className="text-neutral-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Latest Videos */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <span>آخر الدروس المضافة</span>
          </h2>
          <Link to="/videos" className="text-blue-600 font-bold hover:underline">عرض الكل</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestVideos.map((v) => (
            <Link 
              key={v.id} 
              to={`/videos/${v.id}`}
              className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="aspect-video bg-neutral-100 relative">
                {v.thumbnailURL ? (
                  <img src={v.thumbnailURL} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Play className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-lg">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">{v.title}</h3>
                <p className="text-neutral-500 text-sm line-clamp-2">{v.description || 'لا يوجد وصف'}</p>
              </div>
            </Link>
          ))}
          {latestVideos.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
              <p className="text-neutral-400">لا توجد فيديوهات مضافة حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Status Card */}
      {!isAdmin && !isModerator && (
        <section className={cn(
          "p-8 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-8",
          isSubscribed ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
        )}>
          <div className="flex items-center gap-6 text-center md:text-right">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
              isSubscribed ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">حالة الاشتراك</h3>
              <p className={cn("font-medium", isSubscribed ? "text-green-700" : "text-red-700")}>
                {isSubscribed ? 'اشتراكك مفعل - استمتع بمشاهدة الدروس' : 'اشتراكك غير مفعل - تواصل مع الإدارة للتفعيل'}
              </p>
            </div>
          </div>
          {!isSubscribed && (
            <button 
              onClick={() => window.open('https://wa.me/yournumber', '_blank')}
              className="bg-neutral-900 text-white font-bold py-4 px-10 rounded-2xl hover:bg-neutral-800 transition-all shadow-lg"
            >
              تواصل مع المالك
            </button>
          )}
        </section>
      )}
    </div>
  );
};
