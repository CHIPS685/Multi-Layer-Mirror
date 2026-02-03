import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";


// サービスアカウントキーを読み込む
const serviceAccount = JSON.parse(
  fs.readFileSync("multi-layer-mirror-664a2-firebase-adminsdk-fbsvc-732e48b0f7.json", "utf8")
);

// Firebase Admin 初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const UID = "DqWHywOrvQOaovlcPFBdJz3c9O43"; // 自分のuid
const INPUT_PATH = path.join(process.cwd(), "chatgpt_logs.json");

async function runMigration() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const days = JSON.parse(raw);

  for (const day of days) {
    const baseDate = new Date(day.date);

    for (let i = 0; i < day.messages.length; i++) {
      const text = day.messages[i];

      const createdAt = new Date(baseDate);
      createdAt.setMinutes(createdAt.getMinutes() + i * 10);

      await db
        .collection("users")
        .doc(UID)
        .collection("fragments")
        .add({
          text,
          createdAt: admin.firestore.Timestamp.fromDate(createdAt),
          source: "chatgpt_migration",
        });
    }
  }

  console.log("migration completed");
}

runMigration().catch(console.error);
