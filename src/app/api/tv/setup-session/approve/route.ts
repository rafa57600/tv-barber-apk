import { NextRequest, NextResponse } from 'next/server'

import admin from '@/lib/firebase/admin'

const TV_SETUP_COLLECTION = 'tv_setup_sessions'

function getAdminDb() {
    if (!admin.apps?.length) {
        throw new Error('Firebase Admin is not initialized')
    }
    return admin.firestore()
}

function getBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    return authHeader.slice(7).trim() || null
}

export async function POST(request: NextRequest) {
    try {
        const token = getBearerToken(request)
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!admin.apps?.length) {
            return NextResponse.json(
                { success: false, error: 'Server not configured' },
                { status: 500 }
            )
        }

        const decoded = await admin.auth().verifyIdToken(token)
        const db = getAdminDb()

        const profileSnap = await db.collection('profiles').doc(decoded.uid).get()
        const role = profileSnap.data()?.role
        if (role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const body = await request.json() as { session_id?: string }
        const sessionId = body.session_id?.trim()
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'session_id is required' },
                { status: 400 }
            )
        }

        const sessionRef = db.collection(TV_SETUP_COLLECTION).doc(sessionId)
        const sessionSnap = await sessionRef.get()
        if (!sessionSnap.exists) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            )
        }

        const sessionData = sessionSnap.data() || {}
        const expiresAt = sessionData.expires_at?.toDate?.() as Date | undefined
        if (expiresAt && expiresAt.getTime() <= Date.now()) {
            return NextResponse.json(
                { success: false, error: 'Session expired' },
                { status: 410 }
            )
        }

        await sessionRef.set({
            status: 'approved',
            updated_at: admin.firestore.Timestamp.now(),
            approved_at: admin.firestore.Timestamp.now(),
            approved_by: decoded.uid,
        }, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to approve TV setup session:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to approve TV setup session' },
            { status: 500 }
        )
    }
}
