import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMHAabA_jOpcjGohnTknzPySS114wOGIc",
  authDomain: "multi-layer-mirror-664a2.firebaseapp.com",
  projectId: "multi-layer-mirror-664a2",
  storageBucket: "multi-layer-mirror-664a2.firebasestorage.app",
  messagingSenderId: "1007193293658",
  appId: "1:1007193293658:web:26ccda3b1285b4a8ed6963"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
