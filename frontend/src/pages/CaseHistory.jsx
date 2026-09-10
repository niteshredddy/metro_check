import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { getScans } from '../api/endpoints';
import StatusBadge from '../components/StatusBadge';

export default function CaseHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const navigate = useNavigate();

  const loadScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (districtFilter) params.district = districtFilter;

      const response = await getScans(params);
      setScans(response.data.scans || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 1);
    } catch (err) {
      console.error('Failed to load scans', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, districtFilter]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchDebounced);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDebounced]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sans text-text-primary">Case History</h1>
        <p className="text-sm text-text-secondary mt-1">
          Browse and search all compliance scans · {total} records
        </p>
      </div>

      {/* Filters bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchDebounced}
              onChange={(e) => setSearchDebounced(e.target.value)}
              placeholder="Search product name or district..."
              className="pl-9 w-full"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-44"
          >
            <option value="">All Statuses</option>
            <option value="compliant">Compliant</option>
            <option value="partial">Partial</option>
            <option value="non_compliant">Non-Compliant</option>
          </select>

          {/* District filter */}
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            className="w-40"
          >
            <option value="">All Districts</option>
            {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Results count */}
          <span className="text-xs font-mono text-text-muted ml-auto">
            {total} results
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full" />
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-blueprint">
            <Search className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-text-secondary text-sm">No scans found</p>
            <p className="text-text-muted text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Scan ID</th>
                <th>Product</th>
                <th>District</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <>
                  <tr
                    key={scan.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === scan.id ? null : scan.id)}
                  >
                    <td>
                      <ChevronRight
                        className={`w-4 h-4 text-text-muted transition-transform ${
                          expandedRow === scan.id ? 'rotate-90' : ''
                        }`}
                      />
                    </td>
                    <td>
                      <span className="font-mono text-xs text-accent-amber">
                        {scan.id?.slice(0, 8)?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-text-primary font-medium">
                      {scan.product_name || 'Unknown'}
                    </td>
                    <td className="text-text-secondary">{scan.district || '—'}</td>
                    <td>
                      <span className={`font-mono font-bold ${
                        (scan.compliance_score || 0) >= 80 ? 'text-accent-cyan' :
                        (scan.compliance_score || 0) >= 50 ? 'text-accent-amber' :
                        'text-accent-red'
                      }`}>
                        {scan.compliance_score?.toFixed(0) || 0}%
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={scan.overall_status} size="sm" />
                    </td>
                    <td className="text-text-muted text-xs font-mono">
                      {scan.uploaded_at ? new Date(scan.uploaded_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short'
                      }) : '—'}
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/report/${scan.id}`); }}
                        className="text-text-muted hover:text-accent-amber transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedRow === scan.id && (
                    <tr key={`${scan.id}-expanded`}>
                      <td colSpan={8} className="!p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-bg-tertiary/30 px-6 py-4 border-t border-border"
                        >
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-text-muted uppercase tracking-wider font-mono mb-1">Product</p>
                              <p className="text-text-primary">{scan.product_name || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-text-muted uppercase tracking-wider font-mono mb-1">District</p>
                              <p className="text-text-primary">{scan.district || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-text-muted uppercase tracking-wider font-mono mb-1">Compliance Score</p>
                              <p className="text-text-primary font-bold">{scan.compliance_score?.toFixed(1)}%</p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/report/${scan.id}`)}
                            className="mt-3 text-xs text-accent-amber hover:text-accent-amber-light font-medium transition-colors"
                          >
                            View Full Report →
                          </button>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted font-mono">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded border border-border text-text-secondary
                         hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs rounded border border-border text-text-secondary
                         hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
