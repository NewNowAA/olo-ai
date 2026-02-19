import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextRotatorProps {
  words: string[];
  className?: string;
  interval?: number;
}

export const TextRotator = ({
  words,
  className = "",
  interval = 3000,
}: TextRotatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  const letterVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: (i: number) => ({
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }),
    exit: (i: number) => ({
      opacity: 0, y: -15, filter: "blur(8px)",
      transition: { delay: i * 0.02, duration: 0.3 }
    })
  };

  return (
    <span className={`relative inline-flex min-h-[1.2em] ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className="flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {words[currentIndex].split('').map((letter, i) => (
            <motion.span
              key={`${currentIndex}-${i}`}
              custom={i}
              variants={letterVariants}
              className={`inline-block ${letter === ' ' ? 'ml-[0.3em]' : ''}`}
              style={{ color: 'inherit' }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
      {/* Invisible spacer para manter largura */}
      <span className="invisible">{words.reduce((a, b) => a.length > b.length ? a : b)}</span>
    </span>
  );
};
