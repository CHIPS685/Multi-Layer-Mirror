import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { computeWeeklyObservationForUser } from "./phase2/weekly";
import { computeWeeklyCrystalForUser } from "./phase2/crystal";
import { computeWeeklyOverlayForUser } from "./phase3/overlay";
import { analyzeFragmentWithGemini } from "./phase4/gemini";
import { defineString } from "firebase-functions/params";

import * as admin from "firebase-admin";

admin.initializeApp();

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const GEMINI_API_KEY = defineString("GEMINI_API_KEY");


/**
 * Phase1-2: Fragment 作成 → 自動で Observation を生成する
 * - Fragment は絶対に書き換えない
 * - Observation は 1 Fragment : 1 Observation
 */

export const onFragmentCreate = onDocumentCreated(
  "users/{uid}/fragments/{fragmentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { uid, fragmentId } = event.params;

    // Fragment本文を取得
    const fragment = snap.data() as { content?: string };
    const content = fragment.content;
    if (!content || typeof content !== "string") return;

    const observationRef = admin
      .firestore()
      .doc(`users/${uid}/observations/${fragmentId}`);

    //  Phase4 Analyzer
    // Phase4 Analyzer
    const analyzed = await analyzeFragmentWithGemini(content);

    if (!analyzed) {
      console.log("Gemini failed, fallback to dummy");

      await observationRef.set({
        fragmentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        axisScores: {
          action: 0.5,
          obstacle: 0.5,
          evaluation: 0.5,
          control: 0.5,
        },
        axisEvidence: {
          action: [],
          obstacle: [],
          evaluation: [],
          control: [],
        },
        axisVersionMap: {
          action: "dummy_v1",
          obstacle: "dummy_v1",
          evaluation: "dummy_v1",
          control: "dummy_v1",
        },
      });

      return;
    }

    // Gemini 成功時だけここに来る
    await observationRef.set({
      fragmentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      axisScores: analyzed.axisScores,
      axisEvidence: analyzed.axisEvidence,
      axisVersionMap: analyzed.axisVersionMap,
    });

  }
);


export const phase2WeeklySchedule = onSchedule(
  "every day 01:10",
  async () => {
    const db = admin.firestore();

    const usersSnap = await db.collection("users").get();

    const tasks = usersSnap.docs.map(async (doc) => {
      const uid = doc.id;

      // 今週の weekId を計算
      const now = new Date();
      const d = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));
      const day = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - day + 3);
      const isoYear = d.getUTCFullYear();
      const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
      const firstDay = (firstThursday.getUTCDay() + 6) % 7;
      firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
      const week =
        Math.round(
          (d.getTime() - firstThursday.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1;
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const weekId = `${isoYear}-${pad2(week)}`;

      await computeWeeklyObservationForUser(uid, weekId);
    });

    await Promise.all(tasks);
  }
);

export const phase2CrystalSchedule = onSchedule(
  "every day 01:20",
  async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    const tasks = usersSnap.docs.map(async (doc) => {
      const uid = doc.id;

      // weeklyと同じweekId算出ロジック(UTC,ISO週)
      const now = new Date();
      const d = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));
      const day = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - day + 3);
      const isoYear = d.getUTCFullYear();
      const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
      const firstDay = (firstThursday.getUTCDay() + 6) % 7;
      firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
      const week =
        Math.round(
          (d.getTime() - firstThursday.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1;
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const weekId = `${isoYear}-${pad2(week)}`;

      // 今週だけだと週またぎ直後の生成漏れが出ることがあるから、前週も一回見る
      // prevWeekId計算は週番号が1の時に年跨ぎが絡むので、安全にweekly側のisoWeekを使うのが理想だけど、
      // 今は最小で「今週と前週」を両方試す実装にする(前週が存在しなければ内部でreturnする)
      await computeWeeklyCrystalForUser(uid, weekId);

      const prevWeek = week - 1;
      if (prevWeek >= 1) {
        const prevWeekId = `${isoYear}-${pad2(prevWeek)}`;
        await computeWeeklyCrystalForUser(uid, prevWeekId);
      }
    });

    await Promise.all(tasks);
  }
);

export const phase3OverlaySchedule = onSchedule(
  "every day 01:30",
  async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    const tasks = usersSnap.docs.map(async (doc) => {
      const uid = doc.id;

      // weekly / crystal と同一の weekId 算出ロジック（UTC / ISO週）
      const now = new Date();
      const d = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));
      const day = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - day + 3);
      const isoYear = d.getUTCFullYear();
      const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
      const firstDay = (firstThursday.getUTCDay() + 6) % 7;
      firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
      const week =
        Math.round(
          (d.getTime() - firstThursday.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1;
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const weekId = `${isoYear}-${pad2(week)}`;

      // 今週
      await computeWeeklyOverlayForUser(uid, weekId);

      // 前週（Crystal 生成遅延対策）
      const prevWeek = week - 1;
      if (prevWeek >= 1) {
        const prevWeekId = `${isoYear}-${pad2(prevWeek)}`;
        await computeWeeklyOverlayForUser(uid, prevWeekId);
      }
    });

    await Promise.all(tasks);
  }
);
