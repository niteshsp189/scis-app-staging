import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollLoaderProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function InfiniteScrollLoader({
  hasMore,
  loading,
  onLoadMore,
  threshold = 100,
}: InfiniteScrollLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [threshold]);

  useEffect(() => {
    if (isVisible && hasMore && !loading) {
      onLoadMore();
    }
  }, [isVisible, hasMore, loading, onLoadMore]);

  if (!hasMore) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No more customers to load</p>
      </div>
    );
  }

  return (
    <div
      ref={loaderRef}
      className="flex items-center justify-center py-8"
    >
      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading more customers...</span>
        </div>
      ) : (
        <div className="text-gray-400">
          <span>Scroll to load more</span>
        </div>
      )}
    </div>
  );
}