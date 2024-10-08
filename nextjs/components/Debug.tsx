"use client";

import React, { useEffect, useState, useRef } from "react";

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      acc[key] = sanitizeObject(value);
    }
    return acc;
  }, Array.isArray(obj) ? [] : {});
};

export default function Debug(props) {
    const [shouldRender, setShouldRender] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const containerRef = useRef(null);
  
    const sanitizedVariable = sanitizeObject(props.variable);
  
    useEffect(() => {
      if (window.location.hostname === "localhost") {
        setShouldRender(true);
      }
    }, []);
  
    if (!shouldRender) {
      return null;
    }
  
    const toggleExpand = () => setExpanded(!expanded);
  
    return (
      <div
        ref={containerRef}
        style={{
          backgroundColor: "lightgray",
          padding: "1em",
          fontSize: "0.6em",
          maxHeight: expanded ? "none" : "50px",
          overflow: expanded ? "visible" : "hidden",
          position: "relative",
          marginTop: "1em",

        }}
      >
        <pre style={{ margin: 0 }}>
          {JSON.stringify(sanitizedVariable, null, 2)}
        </pre>
        {!expanded && (
          <button
            onClick={toggleExpand}
            style={{
              position: "absolute",
              bottom: "2em",
              right: "1em",
              backgroundColor: "white",
              border: "none",
              padding: "0.5em 1em",
              cursor: "pointer",
            }}
          >
            Expand
          </button>
        )}
        {!expanded && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "20px", // Adjust for desired fade height
              background: "linear-gradient(to bottom, rgba(211,211,211,0), lightgray)",
            }}
          />
        )}
      </div>
    );
  }