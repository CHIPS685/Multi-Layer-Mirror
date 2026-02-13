import * as admin from "firebase-admin";
import { callGenerateDayDiary } from "./phase9/diary/callGenerateDayDiary";

admin.initializeApp();

export { callGenerateDayDiary };
