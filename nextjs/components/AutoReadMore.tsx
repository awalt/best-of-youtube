"use client"
import { useState, useEffect } from 'react';

function AutoReadMore({ text, charLimit = 100 }) {
  const [showFullText, setShowFullText] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!text || typeof text !== 'string') return null;

  const shouldTrim = text.length > charLimit;
  let trimmedText = text.slice(0, charLimit);
  const lastSpaceIndex = trimmedText.lastIndexOf(' ');

  if (shouldTrim && lastSpaceIndex !== -1) {
    trimmedText = trimmedText.slice(0, lastSpaceIndex) + '...';
  }

  return (
    <span className="text-gray-600">
      {isLargeScreen || showFullText ? text : trimmedText}
      {!isLargeScreen && shouldTrim && !showFullText && (
        <button className="text-blue-500 hover:underline" onClick={() => setShowFullText(true)}>
          Read More
        </button>
      )}
    </span>
  );
}

export default AutoReadMore;
