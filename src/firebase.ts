import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Para obtener estos valores:
// 1. Ir a https://console.firebase.google.com
// 2. Crear proyecto → Agregar app web
// 3. Copiar el objeto firebaseConfig que aparece

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
