import React from 'react';
//import Link from 'next/link';
import Link from '@/components/Link';

type PageNumber = number | '...';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages }) => {
  const getPageNumbers = (): PageNumber[] => {
    const delta = 1; // Number of pages to show on each side of the current page
    const range: PageNumber[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages !== 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="flex flex-wrap justify-center items-center space-x-1 space-y-1 mt-4 md:text-2xl">
      {currentPage > 1 && (
        <Link href={currentPage === 2 ? '/' : `/${currentPage - 1}`} className="px-3 py-1 bg-red-500 text-white rounded">
          Prev
        </Link>
      )}
      {getPageNumbers().map((pageNum, index) => (
        pageNum === "..." ? (
          <span key={index} className="px-3 py-1 text-gray-500">...</span>
        ) : (
          <Link
            key={index}
            href={pageNum === 1 ? '/' : `/${pageNum}`}
            className={`px-3 py-1 ${
              currentPage === pageNum ? 'bg-red-500 text-white' : 'bg-gray-200'
            } rounded`}
          >
            {pageNum}
          </Link>
        )
      ))}
      {currentPage < totalPages && (
        <Link href={`/${currentPage + 1}`} className="px-3 py-1 bg-red-500 text-white rounded">
          Next
        </Link>
      )}
    </div>
  );
};

export default Pagination;