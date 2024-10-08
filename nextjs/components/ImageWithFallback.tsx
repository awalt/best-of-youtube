import React from "react";
import Image from "next/image";

async function getWorkingImageUrl(urls) {
    for (const url of urls) {
        try {
            const res = await fetch(url, { method: "HEAD" });
            if (res.ok) {
                return url;
            }
        } catch (error) {
            console.error(`Error checking URL ${url}:`, error);
        }
    }
    return null; // Return null if no working URL is found
}

export async function ImageWithFallback({ video }) {
    const videoId = video.youtubeVideoId || video.videoId;
    const possibleUrls = [
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        ...(video.thumbnailUrl ? [video.thumbnailUrl] : []),
        ...(video.thumbnail ? [video.thumbnail] : []),
        `https://i.ytimg.com/vi/${videoId}/hqdefault.webp`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    ];

    const workingUrl = await getWorkingImageUrl(possibleUrls);

    return (
        <Image
            src={workingUrl || "/video_player_placeholder.gif"} // Provide a default image path
            alt={video.videoTitle}
            width={video.thumbnailWidth || 200}
            height={video.thumbnailHeight || 100}
            className="w-full h-full object-contain"
            unoptimized={true}
        />
    );
}

export default ImageWithFallback;
