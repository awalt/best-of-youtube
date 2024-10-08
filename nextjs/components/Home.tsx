// components/Home.tsx
import { Suspense } from "react";
//date-fns
import { formatDistanceToNow } from "date-fns";
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import {
    FaYoutube,
    FaPlay,
    FaYoutubeSquare,
    FaVideoSlash,
    FaExternalLinkAlt,
    FaExternalLinkSquareAlt,
    FaThumbsUp,
    FaEye,
    FaComment,
    FaUser,
    FaCalendarAlt,
} from "react-icons/fa";
import { PlayIcon } from "@heroicons/react/24/solid";
import { FaFilm, FaTv } from "react-icons/fa"; // Foot icon

import { ImageWithFallback } from "@/components/ImageWithFallback";
import AutoReadMore from "@/components/AutoReadMore";
import { CheckIcon } from "@heroicons/react/24/solid";
import TimeAgo from "@/components/TimeAgo";
import Debug from "@/components/Debug";
import VoteButtons from "@/components/VoteButtons";

// app/api/latest-videos.js
import { Datastore } from "@google-cloud/datastore";
import ScrollableTags from "@/components/ScrollableTags";
import ScrollableContent from "@/components/ScrollableContent";
import Tags from "@/components/Tags";
import VideoInfo from "@/components/VideoInfo";

import LogoBar from "@/components/LogoBar";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";

if (!process.env.GOOGLE_PRIVATE_KEY_ID || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error(
        "Missing required environment variables for Google Cloud credentials"
    );
}

const datastore = new Datastore({
    projectId: "secret-descent-94518",
    credentials: {
        type: "service_account",
        project_id: "secret-descent-94518",
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,        client_id: "",
        universe_domain: "googleapis.com",
    },
});

function getRandomInt(min, max, seed) {
    // Simple hash function for consistent results
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    // Generate a random number based on the hash
    const random = Math.abs(Math.sin(hash++)); // Use hash for randomness

    // Scale and shift the random number to fit within the desired range
    return Math.floor(random * (max - min + 1)) + min;
}

async function getVideos(page = 1) {
    "use server";
    const itemsPerPage = 30;
    const query = datastore
        .createQuery("videos")
        .order("time", { descending: true })
        .limit(itemsPerPage)
        .offset((page - 1) * itemsPerPage);

    let [videos] = await datastore.runQuery(query);
    console.log("Got from datastore");

    //Remove videos with a .videoImportanceScore of 2 or lower
    videos = videos.filter((video) => {
        if (video.videoImportanceScore < 0.3) return false;
        return true;
    });

    //Remove videos where video.format contains "live event" "trailer" or "music video"
    videos = videos.filter((video) => {
        if (
            video.format &&
            (video.format.includes("live music") ||
                video.format.includes("trailer") ||
                video.format.includes("music video") ||
                video.format.includes("gameplay") ||
                video.format.includes("video gameplay"))
        )
            return false;
        return true;
    });

    //for each video, and video.read=Date.now()
    videos = videos.map((video) => {
        const timeAdded = new Date(video.timeAdded);
        const now = new Date();

        const baseNumberOfVotes = getRandomInt(5, 8, video.videoTitle);

        const hoursElapsed =
            (now.getTime() - timeAdded.getTime()) / (1000 * 60 * 60);

        const videoScore = parseInt(video.videoImportanceScore) || 0.6;

        // Apply multiplier with some randomness
        const importanceMultiplier = Math.max(
            1,
            Math.min(3, Math.max(1, (hoursElapsed - 3) * 0.03))
        );

        //console.log({ importanceMultiplier });

        video.upvotes =
            Math.round(baseNumberOfVotes * videoScore * importanceMultiplier) +
            getRandomInt(0, 2, video.videoTitle);

        video.downvotes = Math.round(
            baseNumberOfVotes * (1 - videoScore) * importanceMultiplier * 0.7
        );

        if (hoursElapsed < 2) {
            video.upvotes = 0;
            video.downvotes = 0;
        } else if (hoursElapsed < 4) {
            video.upvotes = Math.floor(video.upvotes * 0.3);
            video.downvotes = Math.floor(video.downvotes * 0.3);
        } else if (hoursElapsed < 6) {
            video.upvotes = Math.floor(video.upvotes * 0.5);
            video.downvotes = Math.floor(video.downvotes * 0.5);
        } else if (hoursElapsed < 10) {
            video.upvotes = Math.floor(video.upvotes * 0.7);
            video.downvotes = Math.floor(video.downvotes * 0.7);
        }
        return video;
    });

    return videos;
}

function cleanRuntime(time) {
    if (!time) return "";

    if (/^\d+$/.test(time)) {
        time = "0:" + time;
    }
    time = time
        .replace(/^0+/, "")
        .replace(/^:/, "0:")
        .replace("h", ":")
        .replace("m", ":")
        .replace("s", "")
        .replace("nil", "")
        .replace("null", "");

    return time;
}

export default async function Home({ page = 1 }) {
    const videos = await getVideos(page);
    const totalPages = 10;

    //console.log({ videos });

    /* Example video item:
    {
       videoTitle: "University Students Launch Two-Stage Rocket to Record Altitude",
       what: "A team of engineering students from the University of Sheffield embarks on an ambitious project to break the UK amateur rocketry altitude record. They build a two-stage rocket, Karman Alpha, aiming to reach an altitude of 100,000 feet. The documentary follows their journey, from preparation and launch in the Mojave Desert to the aftermath of the launch and recovery efforts.",
       why: "This documentary offers a captivating behind-the-scenes look at the dedication, challenges, and triumphs of a student-led aerospace engineering project. It showcases the teamwork, problem-solving skills, and perseverance required to tackle such a complex endeavor. The video is educational, inspirational, and a testament to the ingenuity of young minds.",
       youtubeVideoId: "6ZUuVvpgoCU",
       thumbnailUrl: "https://i.ytimg.com/vi/6ZUuVvpgoCU/maxresdefault.jpg",
       thumbnailWidth: 1280,
       thumbnailHeight: 720
}
    */

    return (
        <div>
            <div className="container mx-auto">
                <LogoBar />
                <div className="grid grid-cols-1 gap-8">
                    {" "}
                    {/* Adjusted grid */}
                    {videos.map((video, index) => (
                        <div
                            key={video.youtubeVideoId + "" + index}
                            className="flex flex-col md:flex-row bg-white md:rounded-lg shadow-md overflow-hidden" // Flexbox for layout
                        >
                            <div className="md:w-1/3 relative bg-black">
                                {" "}
                                <div className="relative">
                                    <Link
                                        href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}>
                                        <ImageWithFallback video={video} />
                                    </Link>
                                    {/* Runtime Overlay */}
                                    {video.runtime && (
                                        <div className="absolute bottom-0 right-0 inset-x-auto inset-y-auto bg-black bg-opacity-70 text-white rounded-md px-2 py-1 text-xs">
                                            {/* remove leading 0 */}
                                            {cleanRuntime(video.runtime)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:w-2/3">
                                <div className="pt-4 pr-4 pl-4">
                                    <div className="float-right">
                                        <VoteButtons
                                            itemId={video.videoId}
                                            initialUpvotes={video.upvotes}
                                            initialDownvotes={video.downvotes}
                                        />
                                    </div>{" "}
                                    {/* Adjust width for responsiveness */}
                                    <Link
                                        href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                                        className="block text-lg font-bold hover:text-blue-500 mb-2 lg:text-4xl">
                                        {video.videoTitle}
                                    </Link>
                                    {/* Styled h3 tags with consistent spacing */}
                                    <div className="flex flex-col space-y-2 mb-2">
                                        {" "}
                                        {/* Add flex-col for vertical alignment */}
                                        {/* <div className="flex">
                                        <h2 className="text-md font-medium text-gray-700 min-w-[3em] max-sm:hidden mr-1">
                                            What?
                                        </h2>
                                        <p className="text-gray-600">
                                            <AutoReadMore
                                                text={video.what}
                                                charLimit={50}
                                            />
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <h2 className="text-md font-medium text-gray-700 min-w-[3em] max-sm:hidden mr-1">
                                            Why?
                                        </h2>
                                        <p className="text-gray-600">
                                            <AutoReadMore
                                                text={video.why}
                                                charLimit={50}
                                            />
                                        </p>
                                    </div> */}
                                        <p className="text-gray-600 lg:text-lg">
                                            <AutoReadMore
                                                text={video.what}
                                                charLimit={300}
                                            />
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 lg:text-2xl">
                                            <PlayIcon className="h-5 w-5 mr-2" />{" "}
                                            Watch
                                        </Link>
                                        {/* {video.timeAdded && (
                                        <TimeAgo timeAdded={video.timeAdded} />
                                    )} */}
                                        {/* {video.source && (
                                        <div>
                                            <Link
                                                href={video.source}
                                                target="_blank"
                                                className="flex items-center text-sm text-blue-400">
                                                <FaExternalLinkAlt className="mr-1" />
                                                Source
                                            </Link>
                                        </div>
                                    )} */}
                                        {/* <div className="flex items-center">
                                        <span className="text-gray-600 mr-2 max-md:hidden">
                                            Score:{" "}
                                            {(
                                                video.videoImportanceScore * 10
                                            ).toFixed(0)}
                                            /10
                                        </span>
                                        <div className="w-12 md:w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${
                                                    video.videoImportanceScore <=
                                                    0.3
                                                        ? "bg-red-500"
                                                        : video.videoImportanceScore <
                                                          0.7
                                                        ? "bg-yellow-500"
                                                        : "bg-green-500"
                                                }`}
                                                style={{
                                                    width: `${
                                                        video.videoImportanceScore *
                                                        100
                                                    }%`,
                                                }}></div>
                                        </div>
                                    </div> */}
                                    </div>
                                </div>
                                <div style={{ clear: "both" }}></div>
                                <div className="pt-4">
                                    <ScrollableContent>
                                        <Tags video={video} />
                                    </ScrollableContent>
                                </div>
                                <div className="pt-0">
                                    <ScrollableContent>
                                        <VideoInfo video={video} />
                                    </ScrollableContent>
                                </div>
                                <Debug variable={video} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} />

            {/* Footer */}
            <Footer />
        </div>
    );
}
