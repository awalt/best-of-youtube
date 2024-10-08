import { notFound } from "next/navigation";
import Home from "@/components/Home";

export function generateStaticParams() {
    const pages = Array.from({ length: 9 }, (_, i) => i + 2);
    return pages.map((page) => ({
        page: page.toString(),
    }));
}

export default function Page({ params }: { params: { page: string } }) {
    const page = parseInt(params.page, 10);

    if (isNaN(page) || page < 2 || page > 10) {
        notFound();
    }

    return <Home page={page} />;
}
