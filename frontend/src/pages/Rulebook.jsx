import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Scale, FileCheck } from 'lucide-react';
import { getRules } from '../api/endpoints';

const FIELD_TYPE_LABELS = {
  mrp: { label: 'MRP', color: 'text-accent-amber', bg: 'bg-accent-amber-dim' },
  net_qty: { label: 'Net Quantity', color: 'text-accent-blue', bg: 'bg-accent-blue-dim' },
  mfg_date: { label: 'Mfg Date', color: 'text-accent-cyan', bg: 'bg-accent-cyan-dim' },
  manufacturer: { label: 'Manufacturer', color: 'text-[#A78BFA]', bg: 'bg-[rgba(167,139,250,0.15)]' },
  consumer_care: { label: 'Consumer Care', color: 'text-[#F59E0B]', bg: 'bg-[rgba(245,158,11,0.15)]' },
};

const VALIDATION_TYPE_LABELS = {
  field_present: 'Presence Check',
  regex_match: 'Pattern Match',
  mrp_format_check: 'MRP Format Validation',
  net_qty_format: 'Quantity Format Validation',
  date_format_valid: 'Date Format Validation',
  consumer_care_check: 'Contact Info Validation',
  address_completeness: 'Address Completeness',
  font_size_minimum: 'Font Size (Rule 9)',
};

export default function Rulebook() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await getRules();
      setRules(response.data.rules || []);
    } catch (err) {
      console.error('Failed to load rules', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = rules.filter(r =>
    !search ||
    r.clause_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.clause_text?.toLowerCase().includes(search.toLowerCase()) ||
    r.field_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sans text-text-primary flex items-center gap-2">
          <Scale className="w-6 h-6 text-accent-amber" />
          Legal Metrology Rulebook
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Legal Metrology (Packaged Commodities) Rules, 2011 — {rules.length} enforceable clauses
        </p>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-4 border-l-2 border-l-accent-amber">
        <div className="flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary font-medium">Traceability Reference</p>
            <p className="text-xs text-text-secondary mt-1">
              Each compliance check performed by MetroCheck maps directly to a clause below.
              When a scan reports a violation, the clause number and exact text are cited in the report,
              ensuring full traceability between the automated assessment and the statutory rule.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clauses by number, text, or field type..."
          className="pl-9 w-full"
        />
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {filtered.map((rule, i) => {
          const ft = FIELD_TYPE_LABELS[rule.field_type] || { label: rule.field_type, color: 'text-text-secondary', bg: 'bg-bg-tertiary' };
          const vt = VALIDATION_TYPE_LABELS[rule.validation_type] || rule.validation_type;

          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                {/* Clause number */}
                <div className="shrink-0 w-24 text-center mt-1">
                  <div className="inline-block px-3 py-1 rounded bg-accent-amber/10 border border-accent-amber/20 shadow-[0_0_10px_rgba(255,0,127,0.1)]">
                    <span className="text-[11px] font-mono font-bold text-accent-amber whitespace-nowrap">
                      {rule.clause_number.startsWith('Rule') ? rule.clause_number : `Rule ${rule.clause_number}`}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-text-primary leading-relaxed mb-3">
                    {rule.clause_text}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Field type badge */}
                    <span className={`inline-flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${ft.bg} ${ft.color}`}>
                      {ft.label}
                    </span>

                    {/* Validation type */}
                    <span className="text-[10px] font-mono text-text-muted">
                      Validator: <span className="text-text-secondary">{vt}</span>
                    </span>

                    {/* Has params */}
                    {rule.validation_params && (
                      <span className="text-[10px] font-mono text-text-muted">
                        · Has config params
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card h-40 flex items-center justify-center bg-blueprint">
          <p className="text-text-muted text-sm">No matching clauses found</p>
        </div>
      )}
    </div>
  );
}
