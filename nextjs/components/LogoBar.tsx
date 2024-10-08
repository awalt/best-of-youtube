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
//import Link from "next/link";
import Link from '@/components/Link';
import SubMenu from "./SubMenu";

export default function LogoBar() {
    return (
        <div className="my-4">
            <Link href="/" className="flex items-center justify-center">
                <FaYoutube className="text-5xl md:text-6xl text-red-600 mr-2" />{" "}
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
                    Videyo
                </h1>
            </Link>
            <SubMenu />
        </div>
    );
}
