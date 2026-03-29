export type UserRole = 'admin' | 'moderator' | 'student';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  role: UserRole;
  isSubscribed: boolean;
  subscriptionExpiresAt?: any;
  photoURL?: string;
  createdAt: any;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoURL: string;
  thumbnailURL?: string;
  uploadedBy: string;
  createdAt: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
}
