export default function StatusBadge({ status, size = 'md' }) {
  const config = {
    pass: {
      label: 'PASS',
      bg: 'bg-accent-cyan-dim',
      text: 'text-accent-cyan',
      border: 'border-accent-cyan/20',
    },
    fail: {
      label: 'FAIL',
      bg: 'bg-accent-amber-dim',
      text: 'text-accent-amber',
      border: 'border-accent-amber/20',
    },
    not_found: {
      label: 'MISSING',
      bg: 'bg-accent-red-dim',
      text: 'text-accent-red',
      border: 'border-accent-red/20',
    },
    insufficient_data: {
      label: 'SKIPPED',
      bg: 'bg-accent-blue-dim',
      text: 'text-accent-blue',
      border: 'border-accent-blue/20',
    },
    compliant: {
      label: 'COMPLIANT',
      bg: 'bg-accent-cyan-dim',
      text: 'text-accent-cyan',
      border: 'border-accent-cyan/20',
    },
    non_compliant: {
      label: 'NON-COMPLIANT',
      bg: 'bg-accent-red-dim',
      text: 'text-accent-red',
      border: 'border-accent-red/20',
    },
    partial: {
      label: 'PARTIAL',
      bg: 'bg-accent-amber-dim',
      text: 'text-accent-amber',
      border: 'border-accent-amber/20',
    },
  };

  const c = config[status] || config.fail;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses} status-pop`}
    >
      {c.label}
    </span>
  );
}
