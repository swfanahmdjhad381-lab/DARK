import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, limit, where } from 'firebase/firestore';
import { Video, Lock, User, ShieldAlert } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setShowSetup(true);
      }
    };
    checkAdmin();
  }, []);

  const handleSetupAdmin = async () => {
    setLoading(true);
    const email = 'admin@coursedark.com';
    const pass = 'admin123';
    
    try {
      let user;
      try {
        // 1. محاولة إنشاء الحساب
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        user = userCredential.user;
      } catch (authError: any) {
        // 2. إذا كان الحساب موجوداً مسبقاً، قم بتسجيل الدخول
        if (authError.code === 'auth/email-already-in-use') {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          user = userCredential.user;
        } else {
          throw authError;
        }
      }

      // 3. إنشاء وثيقة المستخدم في Firestore
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: 'admin',
          displayName: 'المالك الرئيسي',
          role: 'admin',
          isSubscribed: true,
          createdAt: serverTimestamp(),
        });
        
        toast.success('تم إعداد حساب المسؤول بنجاح! اسم المستخدم: admin، كلمة المرور: admin123');
        setShowSetup(false);
        navigate('/');
      }
    } catch (error: any) {
      console.error("Setup error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('خطأ: يجب تفعيل Email/Password في لوحة تحكم Firebase أولاً (Authentication -> Sign-in method)');
      } else {
        toast.error('حدث خطأ أثناء إعداد الحساب: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      // Map username to a consistent email format
      const email = `${username.trim().toLowerCase()}@coursedark.com`;
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('خطأ: يجب تفعيل Email/Password في لوحة تحكم Firebase أولاً (Authentication -> Sign-in method)');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
        if (username.toLowerCase() === 'admin') {
          setShowSetup(true);
        }
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-100 p-8 md:p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Video className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">كورس دارك</h1>
          <p className="text-neutral-500">سجل دخولك لمتابعة دروسك</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 block mr-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 block mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </button>

          {showSetup && (
            <button
              type="button"
              onClick={handleSetupAdmin}
              disabled={loading}
              className="w-full mt-4 bg-neutral-900 text-white font-bold py-4 rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              <span>إعداد حساب المسؤول لأول مرة</span>
            </button>
          )}
        </form>

        <div className="mt-10 pt-6 border-t border-neutral-100 text-center">
          <p className="text-sm text-neutral-500">
            ليس لديك حساب؟ <span className="text-blue-600 font-semibold">تواصل مع المالك للاشتراك</span>
          </p>
        </div>
      </div>
    </div>
  );
};
