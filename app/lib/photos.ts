import { storage, db } from "./firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { normalizeDateId } from "./date";

export type PhotoDoc = {
  dateId: string;
  createdAt: any;
  storagePath: string;
  downloadUrl: string;
  caption: string;
  contentType?: string;
  sizeBytes?: number;
  originalFilename?: string;
  width?: number;
  height?: number;
};

export async function uploadPhotoForDay(params: {
  uid: string;
  dateId: string;
  file: File;
  caption?: string;
}): Promise<{ photoId: string }> {
  const safeDateId = normalizeDateId(params.dateId);
  if (!safeDateId) throw new Error("invalid dateId");

  const caption = (params.caption ?? "").slice(0, 120);

  const photosCol = collection(db, "users", params.uid, "days", safeDateId, "photos");
  const photoRef = doc(photosCol);
  const photoId = photoRef.id;

  const ext = guessExt(params.file.type);
  const storagePath = `users/${params.uid}/days/${safeDateId}/photos/${photoId}${ext}`;

  const storageRef = ref(storage, storagePath);
  const snap = await uploadBytes(storageRef, params.file, {
    contentType: params.file.type || "application/octet-stream",
  });

  const downloadUrl = await getDownloadURL(snap.ref);

  const payload: PhotoDoc = {
    dateId: safeDateId,
    createdAt: serverTimestamp(),
    storagePath,
    downloadUrl,
    caption,
    contentType: params.file.type || undefined,
    sizeBytes: params.file.size || undefined,
    originalFilename: params.file.name || undefined,
  };

  await setDoc(photoRef, payload);

  await upsertDayMetaOnAddPhoto({ uid: params.uid, dateId: safeDateId });

  return { photoId };
}

async function upsertDayMetaOnAddPhoto(params: { uid: string; dateId: string }) {
  const dayRef = doc(db, "users", params.uid, "days", params.dateId);
  const exists = await getDoc(dayRef);

  if (!exists.exists()) {
    await setDoc(
      dayRef,
      {
        dateId: params.dateId,
        photoCount: 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  await updateDoc(dayRef, {
    photoCount: increment(1),
    updatedAt: serverTimestamp(),
    dateId: params.dateId,
  });
}

function guessExt(contentType: string): string {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  return "";
}
