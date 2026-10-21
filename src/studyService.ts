import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

// -------------------- TYPES --------------------

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  createdAt?: unknown;
}

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  createdAt?: unknown;
}

// -------------------- NOTES --------------------

export async function addNote(
  userId: string,
  title: string,
  content: string,
  subject: string
) {
  return addDoc(collection(db, "notes"), {
    userId,
    title,
    content,
    subject,
    createdAt: serverTimestamp(),
  });
}

export function listenToNotes(
  userId: string,
  callback: (notes: StudyNote[]) => void,
  onError?: (error: Error) => void
) {
  const notesQuery = query(
    collection(db, "notes"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      const notes = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as StudyNote[];

      notes.sort((a, b) => {
        const timeA = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
        const timeB = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
        return timeB - timeA;
      });

      callback(notes);
    },
    (error) => onError?.(error)
  );
}

export async function removeNote(noteId: string) {
  return deleteDoc(doc(db, "notes", noteId));
}

// -------------------- ASSIGNMENTS --------------------

export async function addAssignment(
  userId: string,
  title: string,
  subject: string,
  dueDate: string
) {
  return addDoc(collection(db, "assignments"), {
    userId,
    title,
    subject,
    dueDate,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export function listenToAssignments(
  userId: string,
  callback: (assignments: Assignment[]) => void,
  onError?: (error: Error) => void
) {
  const assignmentsQuery = query(
    collection(db, "assignments"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      const assignments = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Assignment[];

      assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      callback(assignments);
    },
    (error) => onError?.(error)
  );
}

export async function toggleAssignment(
  assignmentId: string,
  completed: boolean
) {
  return updateDoc(doc(db, "assignments", assignmentId), {
    completed,
  });
}

export async function removeAssignment(assignmentId: string) {
  return deleteDoc(doc(db, "assignments", assignmentId));
}