import { useState, useRef, useEffect } from "react";
import { BarChart3 } from "lucide-react";

interface RelevanceScoreChartProps {
  score: number;
  breakdown?: Record<string, number>;
}

const barColors: Record<string, string> = {
  "First Name": "bg-blue-500",
  "Last Name": "bg-indigo-500",
  "Full Name": "bg-violet-500",
  "Middle Name": "bg-purple-400",
  "First + Last Name": "bg-fuchsia-500",
  "Email": "bg-emerald-500",
  "Address": "bg-amber-500",
  "City": "bg-orange-400",
  "Zip Code": "bg-teal-500",
  "SSN": "bg-rose-500",
  "Phone": "bg-cyan-500",
  "Name + Zip": "bg-lime-500",
  "Name + Location": "bg-yellow-500",
  "Name + Phone": "bg-pink-500",
};

const defaultColor = "bg-gray-400";

const RelevanceScoreChart = ({ score, breakdown }: RelevanceScoreChartProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Position the popover so it doesn't overflow the viewport
  useEffect(() => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 420; // approximate max height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        // Show above
        setPopoverStyle({ bottom: '100%', marginBottom: '8px', top: 'auto' });
      } else {
        // Show below (default)
        setPopoverStyle({ top: '100%', marginTop: '8px', bottom: 'auto' });
      }
    }
  }, [isHovered]);

  const entries = breakdown
    ? Object.entries(breakdown).sort(([, a], [, b]) => b - a)
    : [];

  const matchedEntries = entries.filter(([, s]) => s > 0);
  const unmatchedEntries = entries.filter(([, s]) => s === 0);

  const hasMatches = matchedEntries.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon trigger — always visible for customer rows */}
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <span className="text-sm text-gray-400">
          {score}/100
        </span>
        <BarChart3
          className={`h-4 w-4 transition-colors ${
            hasMatches
              ? "text-blue-400 group-hover:text-blue-600"
              : "text-gray-300 group-hover:text-gray-500"
          }`}
        />
      </div>

      {/* Hover popover */}
      {isHovered && entries.length > 0 && (
        <div
          className="absolute right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[300px]"
          style={popoverStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">
              Relevance Breakdown
            </h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              score > 60 ? "bg-green-50 text-green-700" :
              score > 30 ? "bg-blue-50 text-blue-700" :
              score > 0  ? "bg-amber-50 text-amber-700" :
                           "bg-gray-100 text-gray-500"
            }`}>
              {score}%
            </span>
          </div>

          {/* Matched fields */}
          {matchedEntries.length > 0 && (
            <div className="space-y-2 mb-2">
              {matchedEntries.map(([field, fieldScore]) => (
                <div key={field} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate mr-2">
                      {field}
                    </span>
                    <span className={`font-mono tabular-nums font-semibold ${
                      fieldScore >= 80 ? "text-green-600" :
                      fieldScore >= 50 ? "text-blue-600" :
                      fieldScore >= 30 ? "text-amber-600" :
                                         "text-gray-500"
                    }`}>
                      {fieldScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColors[field] || defaultColor}`}
                      style={{ width: `${Math.max(fieldScore, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Separator between matched and unmatched */}
          {matchedEntries.length > 0 && unmatchedEntries.length > 0 && (
            <div className="border-t border-gray-100 my-2" />
          )}

          {/* Unmatched fields — collapsed summary */}
          {unmatchedEntries.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                No match ({unmatchedEntries.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {unmatchedEntries.map(([field]) => (
                  <span
                    key={field}
                    className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No matches at all */}
          {!hasMatches && (
            <p className="text-xs text-gray-400 text-center py-2">
              No field-level matches for this search term
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              Match quality: exact(100) → starts-with(85) → contains(65) → prefix(40) → fuzzy(10-35)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelevanceScoreChart;
