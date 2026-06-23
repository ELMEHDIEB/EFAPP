import React, { useState, useEffect } from "react";

export function Typewriter({
  text,
  speed = 70,
  className = "",
  waitTime = 1500,
  deleteSpeed = 40,
  cursorChar = "_",
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const strings = Array.isArray(text) ? text : [text];
  const currentString = strings[currentIndex % strings.length];

  useEffect(() => {
    let timeout;

    if (!isDeleting && displayText.length < currentString.length) {
      // Typing
      timeout = setTimeout(() => {
        setDisplayText(currentString.slice(0, displayText.length + 1));
      }, speed);
    } else if (!isDeleting && displayText.length === currentString.length) {
      // Wait before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, waitTime);
    } else if (isDeleting && displayText.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayText(currentString.slice(0, displayText.length - 1));
      }, deleteSpeed);
    } else if (isDeleting && displayText.length === 0) {
      // Done deleting, move to next string
      setIsDeleting(false);
      setCurrentIndex((prev) => prev + 1);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentString, speed, waitTime, deleteSpeed]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      {displayText}
      <span className="animate-pulse ml-1">{cursorChar}</span>
    </span>
  );
}
