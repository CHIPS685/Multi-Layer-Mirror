# Multi-Layer Mirror（AI Diary / Reflection）

提出用デプロイURL
https://multi-layer-mirror-664a2.web.app

GitHub
https://github.com/CHIPS685/Multi-Layer-Mirror

## これは何？
日付単位でFragment（素材）を蓄積し、ユーザーが押したタイミングでだけAIが「捏造しない」日記を生成してimmutableに保存するアプリ。

狙いはAI日記で起きがちな「勝手な補完・それっぽい嘘」を構造で防ぎ、後から検証可能な形（versions＋promptVersion）で生成物を残すこと。

## 主要機能
writeでFragmentを追加し、dayで日付を選んで生成ボタンを押すと、dayDiaries/{dateId}/versionsに日記が追加される。
生成は上書きしない。過去のversionsは残る。

## 技術スタック
Frontend: Next.js(App Router)
Backend: Firebase Functions(Callable)
DB: Cloud Firestore
AI: Vertex AI(Gemini)

## ローカル起動
1. 依存を入れる
npm i
2. 環境変数を用意する（.env.local）
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FUNCTIONS_REGION=us-central1
3. 起動
npm run dev

## デプロイ
Firebase Hosting(Web Frameworks preview)でデプロイしている。
firebase deploy

## データ構造（要点だけ）
users/{uid}/fragments/{fragmentId}
users/{uid}/dayDiaries/{dateId}/versions/{versionId}
