"use client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

function TimeAgo({ timeAdded }) {
  const [time, setTime] = useState<string | null>(null); // Union type: string or null

  useEffect(() => {
    const formattedTime = formatDistanceToNow(new Date(timeAdded), {
      addSuffix: true,
    }).replace("about ", "");

    setTime(formattedTime);

    const interval = setInterval(() => {
      const formattedTime = formatDistanceToNow(new Date(timeAdded), {
        addSuffix: true,
      }).replace("about ", "");

      setTime(formattedTime);
    }, 5000);

    return () => clearInterval(interval); 
  }, [timeAdded]);

  if (!time) return null; 

  return <div className="">{time}</div>;
}

export default TimeAgo;
