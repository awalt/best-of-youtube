//File: app\boyt\page.tsx
import React from "react";
import { Datastore } from "@google-cloud/datastore";
//import Link from "next/link";
import Link from '@/components/Link';
import LogoBar from "@/components/LogoBar";
import Footer  from "@/components/Footer";


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
//export const revalidate = 3600*12;

async function getDates() {
    "use server";
    
    const query = datastore.createQuery("videos_top").select("dateStr");
    const [dates] = await datastore.runQuery(query);

    // Extract unique date values
    let uniqueDates = Array.from(new Set(dates.map((date) => date.dateStr)));

    // Sort dates in descending order
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Limit to 100 dates
    const limitedDates = uniqueDates.slice(0, 100);

    return limitedDates;
}


const BestPage = async () => {
    const dates = await getDates();

    return (
        <div className="bg-slate-200 min-h-screen">
            <LogoBar />
        <div className="bg-gray-300 min-h-screen p-8">
            <h1 className="text-5xl font-bold text-red-500 my-8 text-center">
                Best videos by date
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {dates.map((date) => (
                    <div
                        key={date}
                        className="bg-white rounded-lg shadow-md p-6 hover:bg-red-500 hover:text-white transition duration-300 ease-in-out cursor-pointer">
                        <Link href={`/best/${date}`}>
                            <h2 className="text-2xl font-bold">{date}</h2>
                        </Link>
                    </div>
                ))}
            </div>
            </div>
            <Footer />
        </div>
    );
};

export default BestPage;