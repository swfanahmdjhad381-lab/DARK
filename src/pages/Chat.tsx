import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage, UserProfile } from '../types';
import { Send, User, Shield, Loader2, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const Chat: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch admin profile for students
  useEffect(() => {
    if (!isAdmin) {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'), limit(1));
      getDocs(q).then(snapshot => {
        if (!snapshot.empty) {
          setAdminProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any);
        }
      });
    } else {
      // Fetch users who have messages for admin
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });
    }
  }, [isAdmin]);

  // Fetch messages
  useEffect(() => {
    if (!user) return;

    let q;
    if (isAdmin) {
      if (!selectedUserId) {
        setLoading(false);
        return;
      }
      // Admin sees messages between them and selected user
      q = query(
        collection(db, 'chats'),
        where('senderId', 'in', [user.uid, selectedUserId]),
        where('receiverId', 'in', [user.uid, selectedUserId]),
        orderBy('createdAt', 'asc')
      );
    } else {
      // Student sees messages between them and admin
      if (!adminProfile) {
        setLoading(false);
        return;
      }
      q = query(
        collection(db, 'chats'),
        where('senderId', 'in', [user.uid, adminProfile.uid]),
        where('receiverId', 'in', [user.uid, adminProfile.uid]),
        orderBy('createdAt', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, selectedUserId, adminProfile]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const receiverId = isAdmin ? selectedUserId : adminProfile?.uid;
    if (!receiverId) return;

    try {
      await addDoc(collection(db, 'chats'), {
        text: newMessage,
        senderId: user.uid,
        receiverId: receiverId,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden font-sans" dir="rtl">
      <div className="flex flex-1 overflow-hidden">
        {/* Users List (Admin Only) */}
        {isAdmin && (
          <div className="w-full md:w-80 border-l border-neutral-100 flex flex-col bg-neutral-50/50">
            <div className="p-6 border-b border-neutral-100 bg-white">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>المحادثات</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {users.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => setSelectedUserId(u.uid)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-right",
                    selectedUserId === u.uid 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white hover:bg-neutral-100 border border-neutral-100"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", selectedUserId === u.uid ? "bg-white/20" : "bg-blue-100 text-blue-600")}>
                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full object-cover" /> : u.displayName?.charAt(0) || u.username?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.displayName || u.username}</p>
                    <p className={cn("text-xs truncate", selectedUserId === u.uid ? "text-blue-100" : "text-neutral-400")}>طالب</p>
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <div className="text-center p-10 text-neutral-400">
                  <p>لا يوجد طلاب متاحين للدردشة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isAdmin && !selectedUserId ? (
                <h2 className="font-bold text-lg text-neutral-400">اختر محادثة للبدء</h2>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    {isAdmin ? <User className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">
                      {isAdmin 
                        ? users.find(u => u.uid === selectedUserId)?.displayName || 'محادثة الطالب'
                        : 'الدعم الفني (المالك)'}
                    </h2>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      متصل الآن
                    </p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 md:hidden"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%] md:max-w-[70%]",
                  msg.senderId === user?.uid ? "mr-auto items-start" : "ml-auto items-end text-right"
                )}
              >
                <div
                  className={cn(
                    "px-6 py-4 rounded-3xl text-sm shadow-sm",
                    msg.senderId === user?.uid 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-neutral-800 rounded-tl-none border border-neutral-100"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-2 px-2">
                  {msg.createdAt?.toDate().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {messages.length === 0 && (isAdmin && selectedUserId || !isAdmin) && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p>ابدأ المحادثة الآن...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {(isAdmin && selectedUserId || !isAdmin) && (
            <form onSubmit={handleSendMessage} className="p-6 border-t border-neutral-100 bg-white">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-200"
                >
                  <Send className="w-6 h-6 rotate-180" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
