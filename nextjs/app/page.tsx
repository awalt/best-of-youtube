//File: app/page.tsx
import { notFound } from "next/navigation";
import Home from "@/components/Home";

export default function Page({ params }: { params: { page: string } }) {
    const page = parseInt(params.page, 10);

    if (!page) return <Home />;

    if (isNaN(page) || page > 10) {
        notFound();
    }

    return <Home page={page} />;
}
