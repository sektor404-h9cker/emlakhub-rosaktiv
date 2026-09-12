/**
 * =============================================================================
 * FIREBASE CONFIG — единственная точка инициализации SDK
 * =============================================================================
 * Где лежит: src/lib/firebase/config.js
 * Что делает: создаёт app / auth / firestore один раз (singleton).
 *
 * Если .env.local пустой → isFirebaseConfigured = false → DEMO-режим
 * (см. AuthContext): UI терминала можно смотреть без Firebase-проекта.
 * =============================================================================
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/** Читаем публичные ключи Next.js (только NEXT_PUBLIC_* попадают в браузер) */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** true только если заполнены обязательные поля */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  // Не создаём второй app при hot-reload в Next.js
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
