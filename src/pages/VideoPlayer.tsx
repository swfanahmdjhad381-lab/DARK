import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Video as VideoType } from '../types';
import { useAuth } from '../components/AuthContext';
import { Play, ChevronLeft, Clock, Calendar, User, Share2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isSubscribed, isModerator } = useAuth();
  const [video, setVideo] = useState<VideoType | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'videos', id));
        if (docSnap.exists()) {
          setVideo({ id: docSnap.id, ...docSnap.data() } as VideoType);
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();

    // Fetch related videos
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VideoType))
        .filter(v => v.id !== id);
      setRelatedVideos(videosData);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mb-6">
          <Play className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-4">الفيديو غير موجود</h2>
        <Link to="/videos" className="text-blue-600 font-bold hover:underline flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          العودة لمكتبة الفيديوهات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link to="/videos" className="hover:text-blue-600 transition-colors">الفيديوهات</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-neutral-900 font-semibold truncate">{video.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-200 relative group">
            <video 
              src={video.videoURL} 
              controls 
              className="w-full h-full"
              poster={video.thumbnailURL}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-neutral-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 leading-tight">{video.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{video.createdAt?.toDate().toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>بواسطة المالك</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-6 py-3 rounded-2xl font-bold transition-all">
                <Share2 className="w-5 h-5" />
                <span>مشاركة</span>
              </button>
            </div>

            <div className="prose prose-neutral max-w-none">
              <h3 className="text-xl font-bold mb-4">عن هذا الدرس</h3>
              <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {video.description || 'لا يوجد وصف متاح لهذا الدرس حالياً.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar: Related Videos */}
        <div className="lg:col-span-1 space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Play className="w-6 h-6 text-blue-600" />
            <span>دروس مقترحة</span>
          </h3>
          <div className="space-y-4">
            {relatedVideos.map((v) => (
              <Link 
                key={v.id} 
                to={`/videos/${v.id}`}
                className="flex gap-4 group"
              >
                <div className="w-32 h-20 bg-neutral-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                  {v.thumbnailURL ? (
                    <img src={v.thumbnailURL} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <Play className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{v.title}</h4>
                  <p className="text-xs text-neutral-400">{v.createdAt?.toDate().toLocaleDateString('ar-EG')}</p>
                </div>
              </Link>
            ))}
            {relatedVideos.length === 0 && (
              <p className="text-neutral-400 text-sm text-center py-10">لا توجد دروس أخرى متاحة</p>
            )}
          </div>

          {/* Support Card */}
          <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl shadow-blue-600/20">
            <h4 className="font-bold text-lg mb-2">هل تحتاج لمساعدة؟</h4>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">إذا واجهتك أي مشكلة في تشغيل الفيديو أو لديك استفسار، لا تتردد في مراسلتنا.</p>
            <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all">
              تواصل مع الدعم الفني
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
