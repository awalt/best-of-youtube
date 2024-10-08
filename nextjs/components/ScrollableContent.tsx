"use client"
import { useRef, useEffect, useState } from 'react';

const ScrollableContent = ({ children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (isMobile || !(scrollContainer instanceof HTMLDivElement)) return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        };

        const handleMouseLeave = () => { isDown = false; };
        const handleMouseUp = () => { isDown = false; };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
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
    }, [isMobile]);
//${isMobile ? '' : 'custom-scrollbar'}
    return (
        <div className="relative">
            <style jsx>{`
                .alex-scrollbar {
                    user-select: none;
                    cursor: grab;


                    scrollbar-width: none;  /* Firefox */
                    -ms-overflow-style: none;  /* Internet Explorer 10+ */
                }
                .alex-scrollbar::-webkit-scrollbar {
                    display: none;  /* WebKit */
                }
            `}</style>

            <div
                ref={scrollContainerRef}
                className={`flex overflow-x-auto whitespace-nowrap pr-8 pl-4 alex-scrollbar `}
                style={isMobile ? { WebkitOverflowScrolling: 'touch' } : {}}
            >
                {children}
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white pointer-events-none"></div>
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-white pointer-events-none"></div>

            
        </div>
    );
};

export default ScrollableContent;