import { Timestamp } from "firebase-admin/firestore";

export type WeeklyDoc = {
  weekId: string;
};

export type CrystalDoc = {
  weekId: string;
};

export type ContextDoc = {
  label: string;
  startAt: Timestamp;
  endAt: Timestamp;
};

export type OverlayDoc = {
  weekId: string;
  contextId: string;
  createdAt: Timestamp;
};
