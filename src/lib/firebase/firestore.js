/**
 * =============================================================================
 * FIRESTORE HELPERS — пользователи / платежи / чат
 * =============================================================================
 * Все операции с БД живут здесь. Компоненты UI только вызывают функции.
 * В DEMO-режиме (Firebase не настроен) функции возвращают mock-данные.
 * =============================================================================
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { COLLECTIONS, ROLES } from "./constants";

/* -------------------------------------------------------------------------- */
/*  ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Создаёт/обновляет документ users/{uid} при регистрации.
 * По умолчанию роль = investor, blocked = false.
 */
export async function ensureUserProfile(user, extras = {}) {
  if (!isFirebaseConfigured || !db) return null;

  const ref = doc(db, COLLECTIONS.USERS, user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: extras.displayName || user.displayName || "",
      role: extras.role || ROLES.INVESTOR,
      blocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  }

  return { id: snap.id, ...snap.data() };
}

/** Читает профиль один раз */
export async function getUserProfile(uid) {
  if (!isFirebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Список всех пользователей (для админки) */
export async function listUsers() {
  if (!isFirebaseConfigured || !db) {
    // DEMO: статичный список
    return [
      {
        id: "demo-admin",
        email: "admin@emlakhub.net",
        displayName: "Admin Demo",
        role: ROLES.ADMIN,
        blocked: false,
      },
      {
        id: "demo-investor",
        email: "investor@emlakhub.net",
        displayName: "Investor Demo",
        role: ROLES.INVESTOR,
        blocked: false,
      },
      {
        id: "demo-developer",
        email: "dev@emlakhub.net",
        displayName: "Developer Demo",
        role: ROLES.DEVELOPER,
        blocked: true,
      },
    ];
  }

  const snap = await getDocs(collection(db, COLLECTIONS.USERS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Смена роли */
export async function setUserRole(uid, role) {
  if (!isFirebaseConfigured || !db) return { ok: true, demo: true };
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    role,
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

/** Блокировка / разблокировка аккаунта */
export async function setUserBlocked(uid, blocked) {
  if (!isFirebaseConfigured || !db) return { ok: true, demo: true };
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    blocked: Boolean(blocked),
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  ПЛАТЕЖИ / ПОДПИСКИ                                                        */
/* -------------------------------------------------------------------------- */

export async function listPayments() {
  if (!isFirebaseConfigured || !db) {
    return [
      {
        id: "pay-1",
        userEmail: "investor@emlakhub.net",
        amount: 2400,
        currency: "AZN",
        status: "paid",
        plan: "Pro · квартал",
        updatedAt: "2026-09-01",
      },
      {
        id: "pay-2",
        userEmail: "capital@example.com",
        amount: 800,
        currency: "AZN",
        status: "pending",
        plan: "Pro · месяц",
        updatedAt: "2026-09-07",
      },
      {
        id: "pay-3",
        userEmail: "hold@example.com",
        amount: 2400,
        currency: "AZN",
        status: "stuck",
        plan: "Pro · квартал",
        updatedAt: "2026-09-05",
      },
    ];
  }

  const snap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updatePaymentStatus(paymentId, status) {
  if (!isFirebaseConfigured || !db) return { ok: true, demo: true };
  await updateDoc(doc(db, COLLECTIONS.PAYMENTS, paymentId), {
    status,
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  ЧАТ ПОДДЕРЖКИ                                                             */
/*  Путь: chats/{clientUid}/messages/{messageId}                              */
/* -------------------------------------------------------------------------- */

/**
 * Подписка на сообщения чата в реальном времени.
 * onChange(messages[]) вызывается при каждом обновлении.
 * Возвращает unsubscribe().
 */
export function subscribeChatMessages(clientUid, onChange) {
  if (!isFirebaseConfigured || !db) {
    // DEMO: один раз отдаём mock
    onChange([
      {
        id: "m1",
        text: "Здравствуйте. Нужна помощь по лоту AUTO-911.",
        senderId: clientUid || "demo-inv",
        senderRole: "investor",
        createdAt: Date.now() - 600000,
      },
      {
        id: "m2",
        text: "Приняли. Проверяем Vision-отчёт по дефектам.",
        senderId: "demo-admin",
        senderRole: "admin",
        createdAt: Date.now() - 300000,
      },
    ]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.CHATS, clientUid, COLLECTIONS.MESSAGES),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toMillis?.() || Date.now(),
      }))
    );
  });
}

/** Новое сообщение */
export async function sendChatMessage(clientUid, payload) {
  if (!isFirebaseConfigured || !db) {
    return { ok: true, demo: true, id: `demo-${Date.now()}` };
  }

  const ref = await addDoc(
    collection(db, COLLECTIONS.CHATS, clientUid, COLLECTIONS.MESSAGES),
    {
      text: payload.text,
      senderId: payload.senderId,
      senderRole: payload.senderRole,
      createdAt: serverTimestamp(),
      editedAt: null,
    }
  );
  return { ok: true, id: ref.id };
}

/** Админ: правка любого сообщения */
export async function editChatMessage(clientUid, messageId, text) {
  if (!isFirebaseConfigured || !db) return { ok: true, demo: true };
  await updateDoc(
    doc(db, COLLECTIONS.CHATS, clientUid, COLLECTIONS.MESSAGES, messageId),
    { text, editedAt: serverTimestamp() }
  );
  return { ok: true };
}

/** Админ: удаление любого сообщения */
export async function deleteChatMessage(clientUid, messageId) {
  if (!isFirebaseConfigured || !db) return { ok: true, demo: true };
  await deleteDoc(
    doc(db, COLLECTIONS.CHATS, clientUid, COLLECTIONS.MESSAGES, messageId)
  );
  return { ok: true };
}
