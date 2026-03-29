import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Video as VideoType } from '../types';
import { Upload, Trash2, Play, FileVideo, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { formatBytes } from '../lib/utils';

export const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType));
      setVideos(videosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoFile) {
      toast.error('يرجى إدخال العنوان واختيار ملف الفيديو');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Upload Video
      const videoRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
      const videoUploadTask = uploadBytesResumable(videoRef, videoFile);

      videoUploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error("Video upload error:", error);
          toast.error('فشل رفع الفيديو');
          setUploading(false);
        },
        async () => {
          const videoURL = await getDownloadURL(videoUploadTask.snapshot.ref);

          // 2. Upload Thumbnail (optional)
          let thumbnailURL = '';
          if (thumbnailFile) {
            const thumbRef = ref(storage, `thumbnails/${Date.now()}_${thumbnailFile.name}`);
            const thumbSnapshot = await uploadBytesResumable(thumbRef, thumbnailFile);
            thumbnailURL = await getDownloadURL(thumbSnapshot.ref);
          }

          // 3. Save to Firestore
          await addDoc(collection(db, 'videos'), {
            title,
            description,
            videoURL,
            thumbnailURL,
            uploadedBy: auth.currentUser?.uid,
            createdAt: serverTimestamp(),
          });

          toast.success('تم رفع الفيديو بنجاح');
          setTitle('');
          setDescription('');
          setVideoFile(null);
          setThumbnailFile(null);
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('حدث خطأ أثناء الرفع');
      setUploading(false);
    }
  };

  const handleDelete = async (video: VideoType) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'videos', video.id));
      
      // Delete from Storage (optional, but good practice)
      try {
        const videoRef = ref(storage, video.videoURL);
        await deleteObject(videoRef);
        if (video.thumbnailURL) {
          const thumbRef = ref(storage, video.thumbnailURL);
          await deleteObject(thumbRef);
        }
      } catch (storageError) {
        console.warn("Storage deletion error (might be external URL):", storageError);
      }
      
      toast.success('تم حذف الفيديو');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة الفيديوهات</h1>
          <p className="text-neutral-500">ارفع دروساً جديدة وتحكم في المحتوى</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          <span>رفع فيديو جديد</span>
        </h2>
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">عنوان الفيديو</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="مثال: الدرس الأول - مقدمة في البرمجة"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">وصف الفيديو (اختياري)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="وصف مختصر لمحتوى الفيديو"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">ملف الفيديو</label>
              <div className="relative border-2 border-dashed border-neutral-200 rounded-2xl p-6 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2">
                <FileVideo className="w-8 h-8 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {videoFile ? `${videoFile.name} (${formatBytes(videoFile.size)})` : 'اسحب ملف الفيديو هنا أو انقر للاختيار'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">صورة مصغرة (اختياري)</label>
              <div className="relative border-2 border-dashed border-neutral-200 rounded-2xl p-6 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2">
                <Upload className="w-8 h-8 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {thumbnailFile ? thumbnailFile.name : 'اسحب صورة هنا أو انقر للاختيار'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>جاري الرفع...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white font-bold py-3 px-10 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span>{uploading ? 'جاري الرفع...' : 'رفع الفيديو'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Videos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((v) => (
          <div key={v.id} className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden group">
            <div className="aspect-video bg-neutral-100 relative">
              {v.thumbnailURL ? (
                <img src={v.thumbnailURL} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Play className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={() => window.open(v.videoURL, '_blank')}
                  className="p-3 bg-white rounded-full text-neutral-900 hover:scale-110 transition-transform"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={() => handleDelete(v)}
                  className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-1 truncate">{v.title}</h3>
              <p className="text-neutral-500 text-sm line-clamp-2 mb-4">{v.description || 'لا يوجد وصف'}</p>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{v.createdAt?.toDate().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
