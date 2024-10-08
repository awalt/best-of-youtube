"use client";
import { useState, useEffect } from "react";
import FlipNumbers from "react-flip-numbers";

const VoteButtons = ({ itemId, initialUpvotes, initialDownvotes }) => {
    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);
    const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null); 

    //FOR CLIENT-SIDE:
    function getCurrentShortTimestamp() {
        return Date.now() - 1717292613124;
    }

    //FOR CLIENT-SIDE:
    function generateCheckDigits(timestamp) {
        // Simple checksum algorithm:
        const digits = timestamp.toString().split("");
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += parseInt(digits[i], 10);
        }
        return sum % 10000; // 4-digit checksum for a little more security
    }

    //FOR CLIENT-SIDE:
    function genSecurityKey() {
        const timestamp = getCurrentShortTimestamp();
        const checkDigits = generateCheckDigits(timestamp); // Calculate check digits
        return `${timestamp}-${checkDigits}`;
    }

    useEffect(() => {
        const storedVote = localStorage.getItem(`vote:${itemId}`);
        if (storedVote === "upvote") {
            setUpvotes(initialUpvotes + 1);
            setUserVote("upvote");
        } else if (storedVote === "downvote") {
            setDownvotes(initialDownvotes + 1);
            setUserVote("downvote");
        }
    }, [itemId, initialUpvotes, initialDownvotes]);

    const handleVote = async (voteType) => {
        if (userVote) return;

        const updatedUpvotes = voteType === "upvote" ? upvotes + 1 : upvotes;
        const updatedDownvotes =
            voteType === "downvote" ? downvotes + 1 : downvotes;

        setUpvotes(updatedUpvotes);
        setDownvotes(updatedDownvotes);
        localStorage.setItem(`vote:${itemId}`, voteType);
        setUserVote(voteType);

        try {
            const response = await fetch(
                "https://us-central1-secret-descent-94518.cloudfunctions.net/handleVote",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        siteId: "videyo",
                        itemId,
                        voteType,
                        securityKey: genSecurityKey(),
                    }),
                }
            );
            if (response.ok) {
                //router.refresh();
            } else {
                console.error("Failed to record vote: ", response.statusText);
            }
        } catch (error) {
            console.error("Error recording vote:", error);
        }
    };

    return (
        <div className="flex flex-col items-center ml-2">
            <button
                onClick={() => handleVote("upvote")}
                disabled={userVote? true : false}
                className={`w-14 h-14 rounded-lg transition-colors duration-300 relative border-green-600 border border-opacity-30 
                    ${userVote === "upvote" ? "bg-green-600  text-white" : "bg-green-100 text-gray-800"}
                    ${!userVote && 'hover:bg-green-200'} relative pb-2`}>
                <FlipNumbers
                    height={30}
                    width={20}
                    color={userVote === "upvote" ? "white" : "gray-800"}
                    background={
                        userVote === "upvote" ? "green-600" : "green-100"
                    }
                    play
                    perspective={1000}
                    numbers={`${upvotes}`}
                />
                <div className="text-xs absolute bottom-1 inset-x-0 text-center">
                    Up
                </div>
            </button>

            {/* Similar changes for downvote button */}
            <button
                onClick={() => handleVote("downvote")}
                disabled={userVote? true : false}
                className={`w-14 h-14 rounded-lg transition-colors duration-300 relative border-red-600 border border-opacity-30 
                    ${userVote === "downvote" ? "bg-red-600 text-white" : "bg-red-100 text-gray-800"}
                    ${!userVote && 'hover:bg-red-200'} relative pb-2 mt-2`}>
                <FlipNumbers
                    height={30}
                    width={20}
                    color={userVote === "downvote" ? "white" : "gray-800"}
                    background={userVote === "downvote" ? "red-600" : "red-100"}
                    play
                    perspective={1000}
                    numbers={`${downvotes}`}
                />
                <div className="text-xs absolute bottom-1 inset-x-0 text-center">
                    
                    Down
                </div>
            </button>
        </div>
    );
};

export default VoteButtons;
