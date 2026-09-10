import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
  ScanLine, AlertTriangle, CheckCircle, TrendingUp,
  Activity, Shield, Target
} from 'lucide-react';
import { getStats } from '../api/endpoints';

const CHART_COLORS = {
  cyan: '#00D9C0',
  amber: '#FF6B00',
  red: '#FF3B3B',
  blue: '#4A9EFF',
  purple: '#A78BFA',
};

const PIE_COLORS = ['#00D9C0', '#FF6B00', '#FF3B3B'];

function KpiCard({ icon: Icon, label, value, subtext, color = 'amber', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5 relative overflow-hidden group"
    >
      {/* Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-accent-${color}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className={`text-3xl font-bold font-mono text-accent-${color}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-text-secondary mt-1">{subtext}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg bg-accent-${color}-dim`}>
          <Icon className={`w-5 h-5 text-accent-${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-bg-secondary/90 border border-border/50 p-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <p className="text-xs font-mono text-text-muted mb-2 pb-2 border-b border-border/50 uppercase tracking-widest">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-text-secondary">{entry.name}</span>
            <span className="text-sm font-mono font-bold" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-text-secondary">Failed to load dashboard data.</div>;
  }

  // Format trend data
  const trendData = (stats.daily_trend || []).map(t => ({
    ...t,
    date: t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
  }));

  // Format violations by field
  const fieldData = (stats.violations_by_field || []).map(v => ({
    name: v.field_type?.replace('_', ' ')?.toUpperCase() || 'Unknown',
    count: v.count,
  }));

  // District data
  const districtData = (stats.scans_by_district || []).map(s => ({
    name: s.district || 'Unknown',
    count: s.count,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-text-primary flex items-center gap-3">
          <div className="p-2.5 bg-accent-amber/10 rounded-xl">
            <Activity className="w-7 h-7 text-accent-amber" />
          </div>
          Enforcement Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-2 max-w-xl leading-relaxed">
          Real-time compliance monitoring across all districts. AI-driven metrics and automated violation tracking.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={ScanLine}
          label="Total Scans"
          value={stats.total_scans}
          subtext="All time"
          color="amber"
          delay={0}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Violation Rate"
          value={`${stats.violation_rate}%`}
          subtext={`${stats.non_compliant_count + stats.partial_count} non-compliant`}
          color="red"
          delay={0.1}
        />
        <KpiCard
          icon={Target}
          label="Avg Score"
          value={`${stats.avg_compliance_score}%`}
          subtext="Across all scans"
          color="cyan"
          delay={0.2}
        />
        <KpiCard
          icon={CheckCircle}
          label="Compliant"
          value={stats.compliant_count}
          subtext={`${stats.total_scans ? ((stats.compliant_count / stats.total_scans) * 100).toFixed(0) : 0}% of total`}
          color="cyan"
          delay={0.3}
        />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-amber" />
            30-Day Scan Trend
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1E25" />
                <XAxis dataKey="date" tick={{ fill: '#555962', fontSize: 10 }} />
                <YAxis tick={{ fill: '#555962', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.amber} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="compliant" name="Compliant" stroke={CHART_COLORS.cyan} fillOpacity={1} fill="url(#colorCompliant)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-muted text-sm bg-blueprint rounded-lg">
              No trend data available
            </div>
          )}
        </motion.div>

        {/* Violations by field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-red" />
            Violations by Field Type
          </h3>
          {fieldData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fieldData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1E25" />
                <XAxis type="number" tick={{ fill: '#555962', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#8B8F97', fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Violations" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-muted text-sm bg-blueprint rounded-lg">
              No violation data
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-cyan" />
            Status Distribution
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={stats.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="count"
                  nameKey="status"
                >
                  {(stats.status_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {(stats.status_distribution || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-text-secondary capitalize">{item.status?.replace('_', ' ')}</span>
                  <span className="text-sm font-mono font-bold text-text-primary ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scans by district */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-blue" />
            Scans by District
          </h3>
          {districtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={districtData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1E25" />
                <XAxis type="number" tick={{ fill: '#555962', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#8B8F97', fontSize: 10 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Scans" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-muted text-sm bg-blueprint rounded-lg">
              No district data
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
