import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';
import { UserPlus, Search, Shield, ShieldCheck, UserX, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { cn } from '../lib/utils';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [subscriptionDays, setSubscriptionDays] = useState('30');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !displayName) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setCreating(true);
    const secondaryAppName = `secondary-${Date.now()}`;
    let secondaryApp;
    
    try {
      // Initialize a secondary app to create user without logging out admin
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const email = `${username.trim().toLowerCase()}@coursedark.com`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(subscriptionDays));

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        role: role,
        isSubscribed: role === 'admin' || role === 'moderator' || parseInt(subscriptionDays) > 0,
        subscriptionExpiresAt: role === 'admin' || role === 'moderator' ? null : expiresAt,
        createdAt: serverTimestamp(),
      });

      // Sign out from secondary app
      await signOut(secondaryAuth);
      
      toast.success('تم إنشاء المستخدم بنجاح');
      setUsername('');
      setPassword('');
      setDisplayName('');
      setRole('student');
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('اسم المستخدم موجود مسبقاً');
      } else {
        toast.error('حدث خطأ أثناء إنشاء المستخدم');
      }
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setCreating(false);
    }
  };

  const toggleSubscription = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSubscribed: !currentStatus
      });
      toast.success(currentStatus ? 'تم إلغاء الاشتراك' : 'تم تفعيل الاشتراك');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الاشتراك');
    }
  };

  const changeRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        // Auto subscribe admins and moderators
        isSubscribed: newRole === 'admin' || newRole === 'moderator' ? true : undefined
      });
      toast.success('تم تحديث الرتبة');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الرتبة');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة الأعضاء</h1>
          <p className="text-neutral-500">تحكم في المشتركين، الرتب (مشرفين أو طلاب)، والاشتراكات</p>
        </div>
      </div>

      {/* Create User Form */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <span>إضافة عضو جديد</span>
        </h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">الاسم الكامل (بالعربية)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="مثال: محمد أحمد"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="مثال: mohamed123"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">الرتبة</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="student">مشترك (طالب)</option>
              <option value="moderator">مشرف فيديو</option>
              <option value="admin">مالك (مسؤول)</option>
            </select>
          </div>
          {role === 'student' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">مدة الاشتراك (بالأيام)</label>
              <input
                type="number"
                value={subscriptionDays}
                onChange={(e) => setSubscriptionDays(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="مثال: 30"
                min="0"
              />
            </div>
          )}
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white font-bold py-3 px-10 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {creating ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">قائمة الأعضاء</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-2 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="بحث عن عضو..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm">
                <th className="px-6 py-4 font-semibold">العضو</th>
                <th className="px-6 py-4 font-semibold">اسم المستخدم</th>
                <th className="px-6 py-4 font-semibold">الرتبة</th>
                <th className="px-6 py-4 font-semibold">الاشتراك</th>
                <th className="px-6 py-4 font-semibold">تاريخ الانتهاء</th>
                <th className="px-6 py-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => {
                const isExpired = u.subscriptionExpiresAt && (u.subscriptionExpiresAt.toDate ? u.subscriptionExpiresAt.toDate() : new Date(u.subscriptionExpiresAt)) < new Date();
                const remainingDays = u.subscriptionExpiresAt ? Math.ceil(((u.subscriptionExpiresAt.toDate ? u.subscriptionExpiresAt.toDate() : new Date(u.subscriptionExpiresAt)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

                return (
                  <tr key={u.uid} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold overflow-hidden">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                          ) : (
                            u.displayName.charAt(0)
                          )}
                        </div>
                        <span className="font-semibold">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        u.role === 'admin' ? "bg-red-100 text-red-600" :
                        u.role === 'moderator' ? "bg-blue-100 text-blue-600" :
                        "bg-green-100 text-green-600"
                      )}>
                        {u.role === 'admin' ? 'مالك' : u.role === 'moderator' ? 'مشرف' : 'مشترك'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.isSubscribed && !isExpired ? (
                          <span className="text-green-600 flex items-center gap-1 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            مفعل
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1 text-sm">
                            <XCircle className="w-4 h-4" />
                            {isExpired ? 'منتهي' : 'ملغي'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {u.role === 'student' && u.subscriptionExpiresAt ? (
                        <div className="flex flex-col">
                          <span className={cn(isExpired ? "text-red-500" : "text-neutral-600")}>
                            {(u.subscriptionExpiresAt.toDate ? u.subscriptionExpiresAt.toDate() : new Date(u.subscriptionExpiresAt)).toLocaleDateString('ar-EG')}
                          </span>
                          {!isExpired && <span className="text-[10px] text-neutral-400">باقي {remainingDays} يوم</span>}
                        </div>
                      ) : u.role === 'student' ? (
                        <span className="text-neutral-400">لا يوجد</span>
                      ) : (
                        <span className="text-neutral-400">دائم</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubscription(u.uid, u.isSubscribed)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            u.isSubscribed ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                          )}
                          title={u.isSubscribed ? "إلغاء الاشتراك" : "تفعيل الاشتراك"}
                        >
                          {u.isSubscribed ? <UserX className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                        
                        {u.role === 'student' && (
                          <button
                            onClick={() => {
                              const days = prompt('أدخل عدد الأيام لإضافتها للاشتراك:', '30');
                              if (days) {
                                const d = parseInt(days);
                                if (!isNaN(d)) {
                                  const currentExpires = u.subscriptionExpiresAt ? (u.subscriptionExpiresAt.toDate ? u.subscriptionExpiresAt.toDate() : new Date(u.subscriptionExpiresAt)) : new Date();
                                  const baseDate = currentExpires > new Date() ? currentExpires : new Date();
                                  const newExpires = new Date(baseDate);
                                  newExpires.setDate(newExpires.getDate() + d);
                                  updateDoc(doc(db, 'users', u.uid), {
                                    subscriptionExpiresAt: newExpires,
                                    isSubscribed: true
                                  }).then(() => toast.success('تم تحديث مدة الاشتراك'));
                                }
                              }
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="تجديد الاشتراك"
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </button>
                        )}

                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.uid, e.target.value as UserRole)}
                          className="text-xs bg-neutral-100 border-none rounded-lg py-1 px-2 focus:ring-0"
                        >
                          <option value="student">مشترك</option>
                          <option value="moderator">مشرف</option>
                          <option value="admin">مالك</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
