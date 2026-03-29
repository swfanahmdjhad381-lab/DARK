import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SubscriptionPlan } from '../types';
import { Check, CreditCard, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'plans'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default plans if none exist
        const defaultPlans = [
          { name: 'باقة الشهر', price: '100$', duration: '30 يوم', features: ['وصول كامل للفيديوهات', 'دعم فني', 'تحديثات مستمرة'] },
          { name: 'باقة 3 أشهر', price: '250$', duration: '90 يوم', features: ['وصول كامل للفيديوهات', 'دعم فني مباشر', 'تحديثات مستمرة', 'خصم 15%'] },
          { name: 'الباقة السنوية', price: '800$', duration: 'سنة كاملة', features: ['وصول كامل للفيديوهات', 'دعم فني VIP', 'تحديثات مستمرة', 'خصم 30%', 'شهادة إتمام'] },
        ];
        
        // Only seed if we are admin or if we want to show something
        // For now just show them as static if empty, or seed them
        setPlans(defaultPlans.map((p, i) => ({ id: String(i), ...p })));
      } else {
        const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
        setPlans(plansData);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900">باقات الاشتراك</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">اختر الباقة المناسبة لك وابدأ رحلة التعلم معنا اليوم. جميع الباقات تمنحك وصولاً كاملاً للمحتوى.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                <span className="text-neutral-400 text-sm">/ {plan.duration}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-neutral-600">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-blue-600" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/chat')}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تواصل للاشتراك</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg">هل لديك استفسار؟</h4>
            <p className="text-neutral-600">يمكنك التحدث مع الدعم الفني مباشرة لتحديد طريقة الدفع المناسبة لك.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/chat')}
          className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
        >
          فتح الدردشة
        </button>
      </div>
    </div>
  );
};
