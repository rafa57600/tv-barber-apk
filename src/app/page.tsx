'use client'

import { motion } from 'framer-motion'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { ThemeToggle } from '@/components/theme-toggle'
import { WebViewGuard } from '@/components/WebViewGuard'

export default function HomePage() {
  return (
    <WebViewGuard>
      <div className="min-h-screen bg-background">
        {/* Theme Toggle - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Header with Title */}
        <section className="py-8 md:py-12 pt-16">
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-primary">Barber</span> SHOP
            </motion.h1>
          </div>
        </section>

        {/* Booking Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <BookingWizard />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>
              <a href="https://barbershoprdv.fsp57.com/admin/dashboard" className="hover:text-primary transition-colors">
                ©
              </a>{" "}
              {new Date().getFullYear()} BARBER SHOP. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>
    </WebViewGuard>
  )
}

