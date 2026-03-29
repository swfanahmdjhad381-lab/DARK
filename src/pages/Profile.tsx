import React, { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { User, Camera, Lock, Save, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { cn } from '../lib/utils';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        username: username.trim()
      });

      // Update Auth Profile
      await updateProfile(user, {
        displayName: displayName.trim()
      });

      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newPassword) {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(user, newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Password change error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('يرجى تسجيل الخروج والدخول مرة أخرى لتغيير كلمة المرور');
      } else {
        toast.error('حدث خطأ أثناء تغيير كلمة المرور');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const photoRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL
      });

      // Update Auth Profile
      await updateProfile(user, {
        photoURL
      });

      toast.success('تم تحديث الصورة الشخصية');
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">الملف الشخصي</h1>
          <p className="text-neutral-500">إدارة معلوماتك الشخصية وكلمة المرور</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {uploadingPhoto ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.username?.charAt(0)
                )}
              </div>
              <label className="absolute bottom-0 left-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-all">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile?.displayName || profile?.username}</h2>
            <p className="text-neutral-500 mb-6">@{profile?.username}</p>
            
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold",
              profile?.isSubscribed && (!profile?.subscriptionExpiresAt || (profile.subscriptionExpiresAt.toDate ? profile.subscriptionExpiresAt.toDate() : new Date(profile.subscriptionExpiresAt)) > new Date()) ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {profile?.isSubscribed && (!profile?.subscriptionExpiresAt || (profile.subscriptionExpiresAt.toDate ? profile.subscriptionExpiresAt.toDate() : new Date(profile.subscriptionExpiresAt)) > new Date()) ? <CheckCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              <span>{profile?.isSubscribed && (!profile?.subscriptionExpiresAt || (profile.subscriptionExpiresAt.toDate ? profile.subscriptionExpiresAt.toDate() : new Date(profile.subscriptionExpiresAt)) > new Date()) ? 'مشترك مفعل' : 'اشتراك غير مفعل'}</span>
            </div>
            {profile?.subscriptionExpiresAt && profile.role === 'student' && (
              <p className="mt-4 text-xs text-neutral-400">
                ينتهي الاشتراك في: {(profile.subscriptionExpiresAt.toDate ? profile.subscriptionExpiresAt.toDate() : new Date(profile.subscriptionExpiresAt)).toLocaleDateString('ar-EG')}
              </p>
            )}
          </div>

          <div className="bg-neutral-900 text-white p-8 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>معلومات الحساب</span>
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">الرتبة</span>
                <span className="font-bold">{profile?.role === 'admin' ? 'المالك' : profile?.role === 'moderator' ? 'مشرف' : 'مشترك'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-neutral-400">تاريخ الانضمام</span>
                <span className="font-bold">{profile?.createdAt?.toDate().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <span>المعلومات الشخصية</span>
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">الاسم الكامل (بالعربية)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">اسم المستخدم (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 text-white font-bold py-3 px-10 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              <span>تغيير كلمة المرور</span>
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-neutral-900 text-white font-bold py-3 px-10 rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  <span>تحديث كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
