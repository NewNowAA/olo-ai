import { motion, Variants } from 'framer-motion';
import React from 'react';

type PresetType = 'blur' | 'shake' | 'scale' | 'fade' | 'slide';

type TextEffectProps = {
  children: string;
  per?: 'word' | 'char' | 'line';
  as?: keyof JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetType;
  delay?: number; // Delay before animation starts
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

const presetVariants: Record<
  PresetType,
  { container: Variants; item: Variants }
> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)', y: -20 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.4 } },
    },
  },
  shake: {
    container: defaultContainerVariants,
    item: {
      hidden: { x: 0 },
      visible: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.5 } },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
};

const AnimationComponent: React.FC<TextEffectProps> = ({
  children,
  per = 'word',
  as = 'div',
  variants,
  className,
  preset,
  delay = 0,
}) => {
  const words = children.split(/(\s+)/);
  const chars = children.split('');

  const MotionTag = motion[as as keyof typeof motion] as any;
  
  const selectedVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };
    
  const container = variants?.container || selectedVariants.container;
  const item = variants?.item || selectedVariants.item;

  // Add delay to container
  const containerWithDelay = {
    ...container,
    visible: {
      ...container.visible,
      transition: {
        ...(container.visible as any).transition,
        delayChildren: delay,
      }
    }
  };

  if (per === 'word') {
    return (
      <MotionTag
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerWithDelay}
        className={className}
      >
        {words.map((word, index) => (
          <motion.span
            aria-hidden="true"
            key={index}
            variants={item}
            className="inline-block whitespace-pre"
          >
            {word}
          </motion.span>
        ))}
      </MotionTag>
    );
  }

  if (per === 'char') {
    return (
      <MotionTag
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerWithDelay}
        className={className}
      >
        {chars.map((char, index) => (
          <motion.span
            aria-hidden="true"
            key={index}
            variants={item}
            className="inline-block whitespace-pre"
          >
            {char}
          </motion.span>
        ))}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
        viewport={{ once: true }}
      variants={containerWithDelay}
      className={className}
    >
      <motion.span variants={item}>{children}</motion.span>
    </MotionTag>
  );
};

export const TextEffect = AnimationComponent;
