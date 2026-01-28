import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

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

    const observationRef = admin
      .firestore()
      .doc(`users/${uid}/observations/${fragmentId}`);

    // Phase1-2 ではダミー Observation を作る
    await observationRef.set({
      fragmentId: fragmentId,
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
        action: "v1",
        obstacle: "v1",
        evaluation: "v1",
        control: "v1",
      },
    });
  }
);
