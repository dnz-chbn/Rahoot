import admin from "firebase-admin"

let db: FirebaseFirestore.Firestore | null = null

const envJson = process.env.FIREBASE_SERVICE_ACCOUNT

if (envJson) {
  try {
    const serviceAccount = JSON.parse(envJson)

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })

    db = admin.firestore()
    console.log("Firestore initialized")
  } catch (error) {
    console.error("Failed to initialize Firestore:", error)
  }
} else {
  console.log("FIREBASE_SERVICE_ACCOUNT not set, using file-based storage")
}

export default db
