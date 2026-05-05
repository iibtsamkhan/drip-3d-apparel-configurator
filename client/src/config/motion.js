export const transition = {
  type: "spring",
  mass: 0.8,
  damping: 20,
  stiffness: 190,
};

export const slideAnimation = (direction) => {
  const offset = 72;

  return {
    initial: {
      x: direction === "left" ? -offset : direction === "right" ? offset : 0,
      y: direction === "up" ? offset : direction === "down" ? -offset : 0,
      opacity: 0,
      transition: { ...transition, delay: 0.24 },
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { ...transition, delay: 0.02 },
    },
    exit: {
      x: direction === "left" ? -offset : direction === "right" ? offset : 0,
      y: direction === "up" ? offset : direction === "down" ? -offset : 0,
      opacity: 0,
      transition: { ...transition, delay: 0 },
    },
  };
};

export const fadeAnimation = {
  initial: {
    opacity: 0,
    y: 8,
    transition: { ...transition, delay: 0.22 },
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...transition, delay: 0 },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { ...transition, delay: 0 },
  },
};

export const headTextAnimation = {
  initial: { y: 28, opacity: 0, scale: 0.98 },
  animate: { y: 0, opacity: 1, scale: 1 },
  transition: {
    ...transition,
    damping: 18,
    stiffness: 170,
  },
};

export const headContentAnimation = {
  initial: { y: 48, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: {
    ...transition,
    damping: 16,
    stiffness: 140,
    delay: 0.12,
    delayChildren: 0.1,
    staggerChildren: 0.06,
  },
};

export const headContainerAnimation = {
  initial: { x: -72, opacity: 0, transition: { ...transition, delay: 0.24 } },
  animate: { x: 0, opacity: 1, transition: { ...transition, delay: 0.02 } },
  exit: { x: -72, opacity: 0, transition: { ...transition, delay: 0 } },
};
