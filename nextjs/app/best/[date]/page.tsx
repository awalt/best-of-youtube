//File: app\best\[date]\page.tsx
import React from "react";
import { Datastore } from "@google-cloud/datastore";
//import Link from "next/link";
import Link from '@/components/Link';
import Image from "next/image";
import LogoBar from "@/components/LogoBar";
import Footer from "@/components/Footer";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import moment from "moment";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

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

export const dynamic = "force-static";
//export const revalidate = 3600 * 12; // Cache the page for 12 hours

export async function generateStaticParams() {
    const query = datastore
        .createQuery("videos_top")
        .select("dateStr")
        .order("dateStr", { descending: true })
        .limit(100);

    let [dates] = await datastore.runQuery(query);
    const uniqueDates = Array.from(new Set(dates.map((date) => date.dateStr)));

    return uniqueDates.map((date) => ({
        date: date,
    }));
}

async function getVideos(date: string) {
    "use server";
    const query = datastore
        .createQuery("videos_top")
        .filter("dateStr", "=", date)
        .order("dateStr", { descending: true })
        .limit(100);

    let [videos] = await datastore.runQuery(query);

    // Remove duplicate videos by .videoId, keeping the first found
    let videoIds: any = [];
    videos = videos.filter((video) => {
        if (videoIds.includes(video.videoId)) {
            return false;
        } else {
            videoIds.push(video.videoId);
            return true;
        }
    });

    return videos;
}

async function getPreviousAndNextDates(currentDate: string) {
    "use server";
    const query = datastore
        .createQuery("videos_top")
        .select("dateStr")
        .order("dateStr", { descending: true })
        .limit(101);

    let [dates] = await datastore.runQuery(query);
    //console.log({ dates });

    //let uniqueDates = [...new Set(dates.map((date) => date.dateStr))];
    let uniqueDates = Array.from(new Set(dates.map((date) => date.dateStr)));

    // Sort dates in descending order
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Limit to 100 dates
    const dateStrings = uniqueDates.slice(0, 100);

    const currentIndex = dateStrings.indexOf(currentDate);

    let previousDate = null;
    let nextDate = null;

    if (currentIndex > 0) {
        nextDate = dateStrings[currentIndex - 1];
    }

    if (currentIndex < dateStrings.length - 1) {
        previousDate = dateStrings[currentIndex + 1];
    }

    //console.log({ previousDate, nextDate });

    return { previousDate, nextDate };
}

export default async function BestDatePage({
    params,
}: {
    params: { date: string };
}) {
    const { date } = params;
    const friendly_date = moment(date, "YYYY-MM-DD").format(
        "dddd, MMMM Do YYYY"
    );
    const videos = await getVideos(date);
    const { previousDate, nextDate } = await getPreviousAndNextDates(date);

    //console.log({ previousDate, nextDate });

    return (
        <div className="bg-slate-200 min-h-screen">
            <LogoBar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-red-950 mb-8 text-center">
                    Best of{" "}&nbsp;
                    <span className="text-black">
                        {friendly_date}
                    </span>
                </h1>
                <div className="mb-8">
                    <Link
                        href="/best"
                        className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors duration-300">
                        <FaArrowLeft className="mr-2" />
                        Back to List of Dates
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video) => (
                        <Link
                            key={video.videoId}
                            href={`https://www.youtube.com/watch?v=${
                                video.youtubeVideoId || video.videoId
                            }`}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 ease-in-out pt-2">
                            <div className="relative h-48">
                                <ImageWithFallback video={video} />
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                                    {video.videoTitle_rewrite ||
                                        video.videoTitle}
                                </h2>
                                <p className="text-gray-600 text-sm line-clamp-3">
                                    {video.what_rewrite}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="flex justify-between mt-8">
                    {previousDate && (
                        <Link
                            href={`/best/${previousDate}`}
                            className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition-colors duration-300 flex items-center">
                            <FaArrowLeft className="mr-2" />{" "}
                            {/* Left arrow icon */}
                            Previous Day
                        </Link>
                    )}
                    {nextDate && (
                        <Link
                            href={`/best/${nextDate}`}
                            className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition-colors duration-300 flex items-center">
                            Next Day
                            <FaArrowRight className="ml-2" />{" "}
                            {/* Right arrow icon */}
                        </Link>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
