import React from 'react';
import Link from 'next/link';
import { Datastore } from "@google-cloud/datastore";
import moment from 'moment';


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

async function checkDateExists(date: string) {
    const query = datastore
        .createQuery("videos_top")
        .filter("dateStr", "=", date)
        .limit(1);

    const [results] = await datastore.runQuery(query);
    return results.length > 0;
}

async function getAvailableDates() {
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const dayBeforeYesterday = moment().subtract(2, 'days').format('YYYY-MM-DD');
    const threeDaysAgo = moment().subtract(3, 'days').format('YYYY-MM-DD');
    const fourDaysAgo = moment().subtract(4, 'days').format('YYYY-MM-DD');

    const dates = [today, yesterday, dayBeforeYesterday, threeDaysAgo, fourDaysAgo];
    const availableDates = await Promise.all(
        dates.map(async (date) => {
            const exists = await checkDateExists(date);
            return exists ? date : null;
        })
    );

    return availableDates.filter((date): date is string => date !== null);
}

const SubMenu: React.FC = async () => {
    const availableDates = await getAvailableDates();

    const getDisplayText = (date: string) => {
         if (date === moment().format('YYYY-MM-DD')) return 'Today';
         if (date === moment().subtract(1, 'days').format('YYYY-MM-DD')) return 'Yesterday';

         //Default: return day of the week
         return moment(date, 'YYYY-MM-DD').format('dddd');

         if (date === moment().subtract(2, 'days').format('YYYY-MM-DD')) return moment().subtract(2, 'days').format('dddd')
          if (date === moment().subtract(3, 'days').format('YYYY-MM-DD')) return moment().subtract(3, 'days').format('dddd')

        // if (date === moment().subtract(2, 'days').format('YYYY-MM-DD')) return moment().subtract(2, 'days').format('MMM').concat('\u00A0', moment().subtract(2, 'days').format('D'));
        // if (date === moment().subtract(3, 'days').format('YYYY-MM-DD')) return moment().subtract(3, 'days').format('MMM').concat('\u00A0', moment().subtract(3, 'days').format('D'));
        return date;
    };

    return (
        <div className="py-2 px-4  rounded-md overflow-hidden">
            <div className="container mx-auto flex items-center space-x-4 text-center justify-center">
                <span className="font-semibold text-gray-700 pl-2">Best<span className="hidden lg:inline">&nbsp;of</span>:</span>
                {availableDates.map((date) => (
                    <Link
                        key={date}
                        href={`/best/${date}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-slate-200 rounded-md px-2 py-1 hover:bg-slate-300"
                    >
                        {getDisplayText(date)}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SubMenu;