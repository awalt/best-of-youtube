"use server";
import { NextResponse } from "next/server";

// app/api/latest-videos.js
const { Datastore } = require("@google-cloud/datastore");

const TABLE_PROMPTS = "prompts";
const TABLE_VIDEOS = "videos";

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

export async function GET(request: Request) {
    try {
        const query = datastore
            .createQuery(TABLE_VIDEOS)
            .order("time", { descending: true })
            .limit(10);

        const [videos] = await datastore.runQuery(query);

        return NextResponse.json(videos);
    } catch (error) {
        console.error("Error fetching latest videos:", error);
        return NextResponse.json(error);
    }
}
