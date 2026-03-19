import admin from 'firebase-admin'
import { getApps, ServiceAccount } from 'firebase-admin/app'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function tryParseServiceAccount(input: string): ServiceAccount | null {
    try {
        return JSON.parse(input) as ServiceAccount
    } catch {
        return null
    }
}

// Initialize Firebase Admin SDK
function initializeAdmin() {
    if (getApps().length > 0) {
        return admin
    }

    try {
        // Try multiple ways to get credentials
        const envCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
        const envFirebaseCredentials = process.env.FIREBASE_SERVICE_ACCOUNT

        let credentials: ServiceAccount | null = null

        // Option 1: FIREBASE_SERVICE_ACCOUNT as JSON string
        if (envFirebaseCredentials && envFirebaseCredentials.startsWith('{')) {
            credentials = tryParseServiceAccount(envFirebaseCredentials)
            if (credentials) {
                console.log('Firebase Admin: Using FIREBASE_SERVICE_ACCOUNT env var')
            }
        }
        // Option 2: GOOGLE_APPLICATION_CREDENTIALS as JSON string
        if (!credentials && envCredentials && envCredentials.startsWith('{')) {
            credentials = tryParseServiceAccount(envCredentials)
            if (credentials) {
                console.log('Firebase Admin: Using GOOGLE_APPLICATION_CREDENTIALS as JSON')
            }
        }
        // Option 3: GOOGLE_APPLICATION_CREDENTIALS as file path
        if (!credentials && envCredentials && existsSync(envCredentials)) {
            const fileContent = readFileSync(envCredentials, 'utf8')
            credentials = tryParseServiceAccount(fileContent)
            if (credentials) {
                console.log('Firebase Admin: Loaded from file path')
            }
        }
        // Option 4: Try local service-account.json
        if (!credentials) {
            const localPath = join(process.cwd(), 'service-account.json')
            if (existsSync(localPath)) {
                const fileContent = readFileSync(localPath, 'utf8')
                credentials = tryParseServiceAccount(fileContent)
                if (credentials) {
                    console.log('Firebase Admin: Loaded from local service-account.json')
                }
            }
        }

        if (!credentials) {
            console.warn('Firebase Admin: No service account credentials found')
            return admin
        }

        admin.initializeApp({
            credential: admin.credential.cert(credentials)
        })

        console.log('Firebase Admin initialized successfully')
        return admin
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error)
        return admin
    }
}

const adminApp = initializeAdmin()

export { adminApp }
export default admin
