const admin = require('firebase-admin');

// Ensure you have these environment variables set in your .env or Vercel/Railway dashboard
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

try {
    if (!admin.apps.length) {
        const fs = require('fs');
        const path = require('path');
        const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

        // Option 1: Using local serviceAccountKey.json file (easier for development)
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin connected using local serviceAccountKey.json');
        }
        // Option 2: Using env vars (good for hosting like Vercel/Railway)
        else if (process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Handle newline characters in the private key
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin connected via Environment Variables');
        }
        // Option 3: Local Application Default Credentials or standard init
        else {
            admin.initializeApp();
            console.log('✅ Firebase Admin connected (Default Init)');
        }
    }
} catch (error) {
    console.error('❌ Firebase connection error:', error);
}

const db = admin.firestore();

// Optional test connection
db.collection('users').limit(1).get()
    .then(() => console.log('✅ Firestore database is responsive'))
    .catch((err) => console.error('⚠️ Firestore connection error:', err.message));

module.exports = { admin, db };
