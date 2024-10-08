"use client"
import { useRef, useEffect } from 'react';

const ScrollableTags = ({ children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Specify the type of the ref

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return; // Guard clause to handle null case

        let isDown = false;
        let startX = 0; // Initialize startX to 0
        let scrollLeft = 0; // Initialize scrollLeft to 0

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - scrollContainer.offsetLeft; // Access offsetLeft safely
            scrollLeft = scrollContainer.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
        };

        const handleMouseUp = () => {
            isDown = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft; // Access offsetLeft safely
            const walk = (x - startX) * 1;
            scrollContainer.scrollLeft = scrollLeft - walk;
        };

        scrollContainer.addEventListener('mousedown', handleMouseDown);
        scrollContainer.addEventListener('mouseleave', handleMouseLeave);
        scrollContainer.addEventListener('mouseup', handleMouseUp);
        scrollContainer.addEventListener('mousemove', handleMouseMove);

        return () => {
            scrollContainer.removeEventListener('mousedown', handleMouseDown);
            scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
            scrollContainer.removeEventListener('mouseup', handleMouseUp);
            scrollContainer.removeEventListener('mousemove', handleMouseMove);
        };
    }, []); // Empty dependency array ensures useEffect runs only once

    return (
        <div className="relative">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto whitespace-nowrap mt-2 pr-6 touch-pan-x custom-scrollbar"
            >
                {children}
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white pointer-events-none"></div>

            <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-l from-white pointer-events-none"></div>
            
        </div>
    );
};

export default ScrollableTags;
