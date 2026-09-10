import { useMemo } from 'react';

const FIELD_COLORS = {
  mrp: { stroke: '#FF6B00', fill: 'rgba(255, 107, 0, 0.15)', label: 'MRP' },
  net_qty: { stroke: '#4A9EFF', fill: 'rgba(74, 158, 255, 0.15)', label: 'Net Qty' },
  mfg_date: { stroke: '#00D9C0', fill: 'rgba(0, 217, 192, 0.15)', label: 'Mfg Date' },
  manufacturer: { stroke: '#A78BFA', fill: 'rgba(167, 139, 250, 0.15)', label: 'Manufacturer' },
  consumer_care: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)', label: 'Consumer Care' },
};

export default function BoundingBoxOverlay({ imageUrl, fields = [], imageWidth, imageHeight }) {
  const boxes = useMemo(() => {
    return fields
      .filter(f => f.bounding_box)
      .map(f => ({
        ...f,
        color: FIELD_COLORS[f.field_type] || FIELD_COLORS.mrp,
      }));
  }, [fields]);

  if (!imageUrl) return null;

  return (
    <div className="relative inline-block w-full">
      <img
        src={imageUrl}
        alt="Scanned product label"
        className="w-full h-auto rounded-lg"
        style={{ display: 'block' }}
      />
      {/* SVG overlay for bounding boxes */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${imageWidth || 1000} ${imageHeight || 1000}`}
        preserveAspectRatio="none"
      >
        {boxes.map((box, i) => {
          const bb = box.bounding_box;
          // bb is [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
          const x_coords = bb.map(pt => pt[0]);
          const y_coords = bb.map(pt => pt[1]);
          const min_x = Math.min(...x_coords);
          const min_y = Math.min(...y_coords);
          const max_x = Math.max(...x_coords);
          const max_y = Math.max(...y_coords);
          const width = max_x - min_x;
          const height = max_y - min_y;

          return (
            <g key={i} className="animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>
              {/* Box */}
              <rect
                x={min_x}
                y={min_y}
                width={width}
                height={height}
                fill={box.color.fill}
                stroke={box.color.stroke}
                strokeWidth="2"
                rx="2"
              />
              {/* Label */}
              <rect
                x={min_x}
                y={min_y - 18}
                width={box.color.label.length * 8 + 12}
                height={18}
                fill={box.color.stroke}
                rx="2"
              />
              <text
                x={min_x + 6}
                y={min_y - 5}
                fill="white"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {box.color.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
