import { randomUUID } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import admin from '@/lib/firebase/admin'

const TV_SETUP_COLLECTION = 'tv_setup_sessions'
const TV_SETUP_TTL_MINUTES = 20

function getAdminDb() {
    if (!admin.apps?.length) {
        throw new Error('Firebase Admin is not initialized')
    }
    return admin.firestore()
}

function toIsoString(value: unknown): string {
    if (value && typeof value === 'object' && 'toDate' in value) {
        const maybeTimestamp = value as { toDate?: () => Date }
        if (typeof maybeTimestamp.toDate === 'function') {
            return maybeTimestamp.toDate().toISOString()
        }
    }
    if (value instanceof Date) {
        return value.toISOString()
    }
    return new Date().toISOString()
}

export async function POST() {
    try {
        const db = getAdminDb()

        const sessionId = randomUUID()
        const now = admin.firestore.Timestamp.now()
        const expiresAt = admin.firestore.Timestamp.fromMillis(
            Date.now() + TV_SETUP_TTL_MINUTES * 60 * 1000
        )

        await db.collection(TV_SETUP_COLLECTION).doc(sessionId).set({
            status: 'pending',
            created_at: now,
            updated_at: now,
            expires_at: expiresAt,
            approved_at: null,
            approved_by: null,
        }, { merge: true })

        return NextResponse.json({
            success: true,
            session_id: sessionId,
            expires_at: expiresAt.toDate().toISOString(),
        })
    } catch (error) {
        console.error('Failed to create TV setup session:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create TV setup session' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('session')?.trim()
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'session is required' },
                { status: 400 }
            )
        }

        const db = getAdminDb()
        const docRef = db.collection(TV_SETUP_COLLECTION).doc(sessionId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            )
        }

        const data = docSnap.data() || {}

        return NextResponse.json({
            success: true,
            status: data.status === 'approved' ? 'approved' : 'pending',
            expires_at: toIsoString(data.expires_at),
            approved_at: data.approved_at ? toIsoString(data.approved_at) : null,
            approved_by: typeof data.approved_by === 'string' ? data.approved_by : null,
        })
    } catch (error) {
        console.error('Failed to fetch TV setup session:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch TV setup session' },
            { status: 500 }
        )
    }
}
