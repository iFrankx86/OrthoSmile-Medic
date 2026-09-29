import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import firebaseConfig from '../../firebase-applet-config.json'

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Initialize Firestore with specific database ID if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)')

// Initialize Auth
export const auth = getAuth(app)

// Validate connection to Firestore on boot as per guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] The client is offline or cannot reach Firestore servers.')
    }
    return false
  }
}

testFirestoreConnection().catch(() => {})

export default app
