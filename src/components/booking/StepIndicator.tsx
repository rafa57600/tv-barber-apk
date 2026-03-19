'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
    currentStep: number
    steps: { label: string; number: number }[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-0 md:gap-4 mb-8">
            {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                    {/* Step Circle */}
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <motion.div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                                currentStep > step.number
                                    ? "bg-primary text-primary-foreground"
                                    : currentStep === step.number
                                        ? "bg-primary text-primary-foreground shadow-gold"
                                        : "bg-muted text-muted-foreground"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AnimatePresence mode="wait">
                                {currentStep > step.number ? (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Check className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="number"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        {step.number}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        <span
                            className={cn(
                                "mt-2 text-xs font-medium transition-colors",
                                currentStep >= step.number
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            {step.label}
                        </span>
                    </motion.div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div className="w-16 md:w-24 h-[2px] mx-2 md:mx-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-muted" />
                            <motion.div
                                className="absolute inset-0 bg-primary origin-left"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: currentStep > step.number ? 1 : 0 }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
