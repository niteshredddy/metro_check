import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, CheckCircle, XCircle, AlertTriangle, Info, FileText } from 'lucide-react';
import { getScan, downloadReport, getImageUrl } from '../api/endpoints';
import ComplianceGauge from '../components/ComplianceGauge';
import StatusBadge from '../components/StatusBadge';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';

export default function ReportPage() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadScan();
  }, [id]);

  const loadScan = async () => {
    try {
      const response = await getScan(id);
      setScan(response.data);
    } catch (err) {
      console.error('Failed to load scan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrocheck_report_${id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-accent-cyan" />;
      case 'fail': return <XCircle className="w-5 h-5 text-accent-amber" />;
      case 'not_found': return <AlertTriangle className="w-5 h-5 text-accent-red" />;
      default: return <Info className="w-5 h-5 text-accent-blue" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-20 text-text-secondary">
        Scan not found.
      </div>
    );
  }

  const passCount = scan.compliance_checks?.filter(c => c.status === 'pass').length || 0;
  const failCount = scan.compliance_checks?.filter(c => c.status === 'fail' || c.status === 'not_found').length || 0;
  const skipCount = scan.compliance_checks?.filter(c => c.status === 'insufficient_data').length || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-sans text-text-primary">Compliance Report</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-text-muted">
              SCAN#{id?.slice(0, 8)?.toUpperCase()}
            </span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-secondary">
              {scan.uploaded_at ? new Date(scan.uploaded_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'N/A'}
            </span>
            <span className="text-xs text-text-muted">·</span>
            <StatusBadge status={scan.overall_status} />
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-amber text-text-inverse font-semibold text-sm
                   hover:bg-accent-amber-light transition-colors disabled:opacity-50"
        >
          {downloading ? (
            <div className="animate-spin w-4 h-4 border-2 border-text-inverse border-t-transparent rounded-full" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Score + Image */}
        <div className="space-y-4">
          {/* Score card */}
          <div className="card p-6 flex flex-col items-center">
            <ComplianceGauge score={scan.compliance_score || 0} />
            <p className="text-sm text-text-secondary mt-4 font-medium">
              {scan.product_name || 'Unknown Product'}
            </p>
            <p className="text-xs text-text-muted font-mono mt-1">
              {scan.district || 'N/A'}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-lg font-bold font-mono text-accent-cyan">{passCount}</p>
              <p className="text-[10px] font-mono text-text-muted uppercase">Passed</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-bold font-mono text-accent-red">{failCount}</p>
              <p className="text-[10px] font-mono text-text-muted uppercase">Failed</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-bold font-mono text-accent-blue">{skipCount}</p>
              <p className="text-[10px] font-mono text-text-muted uppercase">Skipped</p>
            </div>
          </div>

          {/* Image with bounding boxes */}
          {scan.image_path && (
            <div className="card p-3">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
                Detected Fields
              </p>
              <BoundingBoxOverlay
                imageUrl={getImageUrl(scan.image_path)}
                fields={scan.extracted_fields || []}
                imageWidth={1000}
                imageHeight={1000}
              />
            </div>
          )}
        </div>

        {/* Right column: Compliance checks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Clause-by-clause results */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-accent-amber" />
              <h3 className="text-sm font-semibold text-text-primary">
                Clause-by-Clause Compliance Check
              </h3>
            </div>

            <div className="space-y-3">
              {scan.compliance_checks?.map((check, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-lg bg-bg-tertiary/50 border border-border hover:border-border-light transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-mono font-bold text-text-primary">
                          {check.clause_number}
                        </span>
                        <StatusBadge status={check.status} size="sm" />
                        <span className="text-[10px] font-mono text-text-muted uppercase ml-auto">
                          {check.field_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {check.rule_clause_text}
                      </p>
                      {check.violation_reason && (
                        <div className={`mt-2 p-2 rounded text-xs font-mono ${
                          check.status === 'pass'
                            ? 'bg-accent-cyan-dim text-accent-cyan'
                            : check.status === 'insufficient_data'
                            ? 'bg-accent-blue-dim text-accent-blue'
                            : 'bg-accent-amber-dim text-accent-amber'
                        }`}>
                          {check.violation_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Extracted fields table */}
          {scan.extracted_fields?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Extracted Fields</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field Type</th>
                    <th>Extracted Text</th>
                    <th>Parsed Value</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.extracted_fields.map((field, i) => (
                    <tr key={i}>
                      <td>
                        <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase">
                          {field.field_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-text-secondary max-w-xs truncate">{field.raw_text}</td>
                      <td className="font-mono text-text-primary">{field.parsed_value}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent-cyan"
                              style={{ width: `${field.confidence_score || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-text-muted">
                            {field.confidence_score?.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
