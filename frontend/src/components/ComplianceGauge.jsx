import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ComplianceGauge({ score = 0, size = 180, animated = true }) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, animated]);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Color transitions: red → amber → cyan
  const getColor = (s) => {
    if (s >= 80) return '#00D9C0';
    if (s >= 50) return '#FF6B00';
    return '#FF3B3B';
  };

  const getGlow = (s) => {
    if (s >= 80) return '0 0 20px rgba(0, 217, 192, 0.4)';
    if (s >= 50) return '0 0 20px rgba(255, 107, 0, 0.4)';
    return '0 0 20px rgba(255, 59, 59, 0.4)';
  };

  const color = getColor(displayScore);
  const label = score >= 80 ? 'COMPLIANT' : score >= 50 ? 'PARTIAL' : 'NON-COMPLIANT';

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(${getGlow(displayScore)})` }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1E25"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: animated ? 'none' : 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = (tick / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - 12;
          const outerR = radius - 6;
          return (
            <line
              key={tick}
              x1={size / 2 + innerR * Math.cos(rad)}
              y1={size / 2 + innerR * Math.sin(rad)}
              x2={size / 2 + outerR * Math.cos(rad)}
              y2={size / 2 + outerR * Math.sin(rad)}
              stroke="#363B44"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold font-mono"
          style={{ color }}
        >
          {displayScore}
        </span>
        <span className="text-[10px] font-mono text-text-muted tracking-widest mt-1">
          SCORE
        </span>
      </div>
      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animated ? 1.5 : 0 }}
        className="mt-3 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider"
        style={{
          color,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}
