import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  loading?: boolean;
  className?: string;
  showItemsPerPage?: boolean;
  showJumpToPage?: boolean;
  itemsPerPageOptions?: number[];
}

export const ProfessionalPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
  className = '',
  showItemsPerPage = true,
  showJumpToPage = true,
  itemsPerPageOptions = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000]
}) => {
  const [jumpToPage, setJumpToPage] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);
  const jumpInputRef = useRef<HTMLInputElement>(null);

  // Calculate display range
  const startItem = totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current page range + ellipsis + last page
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle jump to page
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
      setShowJumpInput(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showJumpInput && jumpInputRef.current === document.activeElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleJumpToPage();
        } else if (e.key === 'Escape') {
          setShowJumpInput(false);
          setJumpToPage('');
        }
      } else if (!showJumpInput) {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
          e.preventDefault();
          onPageChange(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
          e.preventDefault();
          onPageChange(currentPage + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, showJumpInput, onPageChange]);

  // Focus jump input when shown
  useEffect(() => {
    if (showJumpInput && jumpInputRef.current) {
      jumpInputRef.current.focus();
    }
  }, [showJumpInput]);

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200 ${className}`}>
      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-medium text-gray-900">{startItem.toLocaleString()}</span>
          <span>to</span>
          <span className="font-medium text-gray-900">{endItem.toLocaleString()}</span>
          <span>of</span>
          <span className="font-medium text-gray-900">{totalItems.toLocaleString()}</span>
          <span>results</span>
        </div>
        
        {/* Items per page selector */}
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              disabled={loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-gray-500">per page</span>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="h-8 w-8 p-0"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="h-8 w-8 p-0"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-sm text-gray-500">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    disabled={loading}
                    className={`h-8 w-8 p-0 ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="h-8 w-8 p-0"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="h-8 w-8 p-0"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* Jump to Page */}
          {showJumpToPage && totalPages > 10 && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              {!showJumpInput ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJumpInput(true)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Jump to page
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to:</span>
                  <Input
                    ref={jumpInputRef}
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleJumpToPage();
                      } else if (e.key === 'Escape') {
                        setShowJumpInput(false);
                        setJumpToPage('');
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowJumpInput(false);
                        setJumpToPage('');
                      }, 200);
                    }}
                    className="w-16 h-8 text-sm"
                    placeholder="Page"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJumpToPage}
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                    className="h-8 px-2 text-xs"
                  >
                    Go
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPagination;
