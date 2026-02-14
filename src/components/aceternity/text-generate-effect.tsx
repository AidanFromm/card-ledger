"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  startOnView?: boolean;
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.1,
  startOnView = true,
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true, margin: "-100px" });
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (!startOnView || isInView) {
      animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration,
          delay: stagger(staggerDelay),
        }
      );
    }
  }, [scope, animate, filter, duration, staggerDelay, startOnView, isInView]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="opacity-0"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="leading-snug tracking-wide">{renderWords()}</div>
      </div>
    </div>
  );
}

// Typewriter effect - types out one character at a time
interface TypewriterEffectProps {
  words: {
    text: string;
    className?: string;
  }[];
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  loop?: boolean;
}

export function TypewriterEffect({
  words,
  className,
  cursorClassName,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 1500,
  loop = true,
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const type = useCallback(() => {
    const currentWord = words[currentWordIndex].text;

    if (isDeleting) {
      setCurrentText(currentWord.substring(0, currentText.length - 1));
    } else {
      setCurrentText(currentWord.substring(0, currentText.length + 1));
    }
  }, [currentText, currentWordIndex, isDeleting, words]);

  useEffect(() => {
    const currentWord = words[currentWordIndex].text;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentText === currentWord) {
      // Finished typing
      if (loop || currentWordIndex < words.length - 1) {
        timeout = setTimeout(() => setIsDeleting(true), delayBetweenWords);
      }
    } else if (isDeleting && currentText === "") {
      // Finished deleting
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    } else {
      // Still typing or deleting
      timeout = setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [
    currentText,
    currentWordIndex,
    delayBetweenWords,
    deletingSpeed,
    isDeleting,
    loop,
    type,
    typingSpeed,
    words,
  ]);

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <span className={words[currentWordIndex].className}>{currentText}</span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className={cn(
          "inline-block h-[1em] w-[4px] bg-[#627d98] rounded-full",
          cursorClassName
        )}
      />
    </div>
  );
}

// Smooth reveal effect for text
interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  characterDelay?: number;
}

export function TextReveal({
  children,
  className,
  delay = 0,
  characterDelay = 0.03,
}: TextRevealProps) {
  const characters = children.split("");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn("inline-block", className)}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                delay: delay + index * characterDelay,
                duration: 0.4,
                ease: [0.2, 0.65, 0.3, 0.9],
              },
            },
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
