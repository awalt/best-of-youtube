//File:  app\boyt\page.tsx
import React from "react";
//import dynamic from "next/dynamic";
import "./VideoComponent.css";

//const LiteYouTubeEmbedWrap = dynamic(() => import('@/components/YouTube'), { ssr: false });
import LiteYouTubeEmbedWrap from "@/components/YouTube";

import LogoBar from "@/components/LogoBar";
import Footer from "@/components/Footer";



import { Datastore } from "@google-cloud/datastore";

if (!process.env.GOOGLE_PRIVATE_KEY_ID || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error(
        "Missing required environment variables for Google Cloud credentials"
    );
}

//force static
export const dynamic = "force-static";

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

async function getVideos() {
    "use server";
    const query = datastore
        .createQuery("videos_top")
        .order("dateStr", { descending: true })
        .limit(100);

    let [videos] = await datastore.runQuery(query);
    console.log("Got from datastore");

    //remove duplicate videos by .videoId. Keep the first found only.

    let videoIds:any = [];
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



const VideoComponent = async () => {
    const videos = await getVideos();

    //console.log("videos", videos);

    let lastDate = "";

    return (
        <div>
            {/* <LogoBar /> */}
        <div className="p-4 bg-white">
            <h1 className="text-2xl font-bold pb-3 text-center">
                Top daily videos from videyo, in the style of <a href="https://bestofyoutube.com">bestofyoutube.com</a>
            </h1>
            
        <div className="max-w-3xl mx-auto p-4">
            <div className="videos-container">
                {videos.map((video, index) => {
                    const isNewDate = lastDate !== video.dateStr;
                    if (isNewDate) {
                        lastDate = video.dateStr;
                    }
                    return (
                        <div key={video.videoId + "_" + index}>
                            {isNewDate && (
                                <div>
                                    <h2 className="font-bold font-xl pt-10">
                                        Videos for {video.dateStr}:
                                    </h2>
                                </div>
                            )}
                            <div className="outer-div">
                                <div className="vote-div">
                                    <div className="vote-text">Vote</div>
                                    <div className="up-vote">
                                        <span
                                            className="vote-link">
                                            XX
                                            <div style={{ fontSize: "14px" }}>
                                                up
                                            </div>
                                        </span>
                                    </div>
                                    <div className="down-vote">
                                        <span
                                            
                                            className="vote-link">
                                            X
                                            <div style={{ fontSize: "14px" }}>
                                                down
                                            </div>
                                        </span>
                                    </div>
                                    <div className="empty-div"></div>
                                    <div className="report-div">
                                        <span
                                            className="report-link">
                                            report video
                                        </span>
                                    </div>
                                    <div className="post-div"></div>
                                    <div className="post-div"></div>
                                </div>
                                <div className="content-div">
                                    <div className="title-div">
                                        <span
                                            className="title-link">
                                            {video.videoTitle_rewrite ||
                                                video.videoTitle}
                                        </span>
                                    </div>
                                    <div className="description-div">
                                        {video.what_rewrite}
                                    </div>

                                    <div className="youtube-embed">
                                        {/* <iframe
                                            width="560"
                                            height="315"
                                            src={`https://www.youtube.com/embed/${video.videoId}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen></iframe> */}
                                            <LiteYouTubeEmbedWrap id={video.videoId} title={video.videoTitle} />
                                    </div>

                                    <div className="meta-div pt-2">
                                        Posted N ago by{" "}
                                        <a
                                            href={`https://videyo.com`}
                                            target="_blank"
                                            className="author-link videyo-link bg-slate-200 hover:bg-slate-300"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                border: "1px solid rgb(220, 38, 38)",
                                                borderRadius: "5px",
                                                verticalAlign: "middle",
                                                padding: "1px 3px",
                                                fontFamily:
                                                    "Inter,ui-sans-serif,system-ui,'Helvetica Neue',sans-serif",
                                            }}>
                                            <img
                                                src="videyo.svg"
                                                alt=""
                                                style={{
                                                    height: "1.2em",
                                                    width: "1em",
                                                    marginRight: "2px",
                                                }}
                                            />
                                            Videyo
                                        </a>{" "}
                                        in category:{" "}
                                        <i>
                                            {" "}
                                            <span
                                                className="category-link">
                                                Misc
                                            </span>
                                        </i>{" "}
                                        <span
                                            className="comments-link">
                                            Comments (
                                            <strong className="comments-count">
                                                0
                                            </strong>
                                            )
                                        </span>
                                    </div>
                                    <div className="addthis-div"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        </div>
        <Footer />
        </div>
    );
};

export default VideoComponent;
