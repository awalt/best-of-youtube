import { useEffect, useRef } from "react";
//import heart icon v2
import { HeartIcon } from "@heroicons/react/24/solid";
//Thumbsup icon
import { HandThumbUpIcon } from "@heroicons/react/24/outline";
import TimeAgo from "@/components/TimeAgo";

const formatNumber = (num) => {
    let value = 0;
    let character = "";

    if (num >= 1e9) {
        value = num / 1e9;
        character = "B"; // Billion
    } else if (num >= 1e6) {
        value = num / 1e6;
        character = "M"; // Million
    } else if (num >= 1e3) {
        value = num / 1e3;
        character = "K"; // Thousand
    } else {
        return num.toString(); // Less than 1000
    }

    if (value < 10) {
        return `${value.toFixed(1)}${character}`;
    } else {
        return `${Math.round(value)}${character}`;
    }
};

const getNestedValue = (obj, path, defaultValue) => {
    return formatNumber(
        path
            .split(".")
            .reduce(
                (acc, part) =>
                    acc && acc[part] !== undefined ? acc[part] : defaultValue,
                obj
            )
    );
};

const checkNestedValue = (obj, path) => {
    if (!obj || typeof path !== "string") return false;

    return (
        path.split(".").reduce((acc, part) => {
            if (acc && acc.hasOwnProperty(part)) {
                return acc[part];
            }
            return undefined;
        }, obj) !== undefined
    );
};

const VideoInfo = ({ video }) => {
    return (
        <div className="flex gap-2">
            {checkNestedValue(
                video,
                "youtubeInfo.gDataAll.statistics.likeCount"
            ) && (
                <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                    <span className="text-md font-bold text-gray-600">
                        {getNestedValue(
                            video,
                            "youtubeInfo.gDataAll.statistics.likeCount",
                            0
                        )}
                    </span>
                    <span className="text-xxs text-gray-500">
                        <HandThumbUpIcon className="h-4 w-4 inline-block" />
                    </span>
                </div>
            )}
            {checkNestedValue(
                video,
                "youtubeInfo.gDataAll.statistics.viewCount"
            ) && (
                <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                    <span className="text-md font-bold text-gray-600">
                        {getNestedValue(
                            video,
                            "youtubeInfo.gDataAll.statistics.viewCount",
                            0
                        )}
                    </span>
                    <span className="text-xxs text-gray-500">Views</span>
                </div>
            )}
            {checkNestedValue(
                video,
                "youtubeInfo.gDataAll.statistics.commentCount"
            ) && (
                <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                    <span className="text-md font-bold text-gray-600">
                        {getNestedValue(
                            video,
                            "youtubeInfo.gDataAll.statistics.commentCount",
                            0
                        )}
                    </span>
                    <span className="text-xxs text-gray-500">Comments</span>
                </div>
            )}
            <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                <span className="text-md font-bold text-gray-600 text-center">
                    {getNestedValue(
                        video,
                        "youtubeInfo.channelTitle",
                        "Unknown Channel"
                    )}
                </span>
                <span className="text-xxs text-gray-500">YT Channel</span>
            </div>
            <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                <span className="text-md font-bold text-gray-600">
                    <TimeAgo
                        timeAdded={getNestedValue(
                            video,
                            "youtubeInfo.gDataAll.snippet.publishedAt",
                            ""
                        )}
                    />
                </span>
                <span className="text-xxs text-gray-500">Published on YT</span>
            </div>
            {video.timeAdded && (
                <div className="flex flex-col items-center bg-gray-100 bg-opacity-30 p-2 rounded-lg">
                    <span className="text-md font-bold text-gray-600">
                        <TimeAgo timeAdded={video.timeAdded} />
                    </span>
                    <span className="text-xxs text-gray-500">
                        Added to videyo
                    </span>
                </div>
            )}
        </div>
    );
};

export default VideoInfo;
