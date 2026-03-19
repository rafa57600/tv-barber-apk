-- Barber Shop Booking System Database Schema
-- Run this SQL in your Firebase Console or use it as reference for Firestore collections

-- Note: This file is for documentation purposes.
-- Firebase Firestore doesn't use SQL, but these represent the collection structures.

-- ========================================
-- COLLECTION: profiles
-- ========================================
-- {
--   id: string (same as auth.uid),
--   email: string,
--   full_name: string | null,
--   phone: string | null,
--   avatar_url: string | null,
--   role: 'client' | 'admin' | 'barber',
--   created_at: timestamp,
--   updated_at: timestamp
-- }

-- ========================================
-- COLLECTION: barbers
-- ========================================
-- {
--   id: string (auto-generated),
--   profile_id: string | null (reference to profiles),
--   name: string,
--   specialties: string[],
--   avatar_url: string | null,
--   is_active: boolean,
--   created_at: timestamp
-- }

-- ========================================
-- COLLECTION: services
-- ========================================
-- {
--   id: string (auto-generated),
--   name: string,
--   description: string | null,
--   duration_minutes: number,
--   price: number,
--   is_active: boolean,
--   created_at: timestamp
-- }

-- ========================================
-- COLLECTION: barber_availability
-- ========================================
-- {
--   id: string (auto-generated),
--   barber_id: string (reference to barbers),
--   day_of_week: number (0-6, Sunday-Saturday),
--   start_time: string ('HH:mm' format),
--   end_time: string ('HH:mm' format),
--   is_available: boolean
-- }

-- ========================================
-- COLLECTION: appointments
-- ========================================
-- {
--   id: string (auto-generated),
--   client_id: string (reference to profiles),
--   barber_id: string (reference to barbers),
--   service_id: string (reference to services),
--   date: string ('YYYY-MM-DD' format),
--   start_time: string ('HH:mm' format),
--   end_time: string ('HH:mm' format),
--   status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
--   notes: string | null,
--   created_at: timestamp,
--   updated_at: timestamp
-- }

-- ========================================
-- COLLECTION: shop_closures
-- ========================================
-- {
--   id: string (auto-generated),
--   date: string ('YYYY-MM-DD' format),
--   reason: string | null,
--   created_at: timestamp
-- }

-- ========================================
-- FIRESTORE SECURITY RULES
-- ========================================
-- Copy these rules to Firestore Database > Rules

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all authenticated users
    match /barbers/{barberId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /barber_availability/{availId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /appointments/{appointmentId} {
      // Clients can read their own appointments
      allow read: if request.auth != null && 
        (resource.data.client_id == request.auth.uid || 
         get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin');
      // Clients can create appointments
      allow create: if request.auth != null;
      // Only admins can update appointments (confirm, cancel, complete)
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /profiles/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      // Users can create/update their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all profiles
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /shop_closures/{closureId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
*/
