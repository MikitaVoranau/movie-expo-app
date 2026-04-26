import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCXA447rqjVeG0kOjXZ3Jwee_uQ0KHxGQ8',
  authDomain: 'fsafw-2220e.firebaseapp.com',
  projectId: 'fsafw-2220e',
  storageBucket: 'fsafw-2220e.firebasestorage.app',
  messagingSenderId: '618773682818',
  appId: '1:618773682818:web:d64735d034de8aa05bf29b',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
