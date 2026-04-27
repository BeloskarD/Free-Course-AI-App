'use client';
import { motion } from 'framer-motion';

/**
 * PageTransition - Phase 5 (Aesthetic Overhaul)
 * Provides a "subtle & sleek" entry/exit animation for pages.
 * Duration: 350ms
 * Easing: Quartic Out (Fast start, smooth settle)
 */
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1] // Quartic Out
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
