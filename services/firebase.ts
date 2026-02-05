
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * SETUP STEPS:
 * 1. Go to Firebase Console (console.firebase.google.com)
 * 2. Create a project named "Code with Gideon"
 * 3. Go to "Authentication" -> "Sign-in method" -> Enable "Email/Password"
 * 4. Create an admin user (e.g., admin@codewithgideon.com)
 * 5. Register a "Web App" in project settings and replace the config below.
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Only initialize if config is provided, otherwise we fall back to a mock/warning state
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
