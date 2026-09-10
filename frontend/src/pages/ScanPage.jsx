import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, Loader, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { uploadScan, getScans } from '../api/endpoints';
import { useEffect } from 'react';
import ComplianceGauge from '../components/ComplianceGauge';
import StatusBadge from '../components/StatusBadge';

export default function ScanPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [productName, setProductName] = useState('');
  const [packageArea, setPackageArea] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      const res = await getScans();
      if (Array.isArray(res.data)) {
        setRecentScans(res.data.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);
    if (productName) formData.append('product_name', productName);
    if (packageArea) formData.append('package_area_cm2', packageArea);

    try {
      const response = await uploadScan(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setProductName('');
    setPackageArea('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-accent-cyan" />;
      case 'fail': return <XCircle className="w-4 h-4 text-accent-amber" />;
      case 'not_found': return <AlertTriangle className="w-4 h-4 text-accent-red" />;
      default: return <Info className="w-4 h-4 text-accent-blue" />;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sans text-text-primary">Compliance Scanner</h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload a product label image to check Legal Metrology compliance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload Area */}
        <div className="space-y-4">
          {/* Drop zone */}
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setDragActive(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-80 card cursor-pointer transition-all duration-300 overflow-hidden ${
                dragActive ? 'border-accent-amber glow-amber' : 'hover:border-border-light'
              }`}
            >
              {/* Viewfinder corners */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent-amber" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent-amber" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent-amber" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent-amber" />

              {/* Grid pattern */}
              <div className="absolute inset-0 bg-blueprint opacity-50" />

              <div className="relative h-full flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Camera className="w-12 h-12 text-text-muted mb-4" />
                </motion.div>
                <p className="text-text-secondary font-medium mb-1">Drop product label image here</p>
                <p className="text-xs text-text-muted">or click to browse · JPG, PNG up to 10MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative card overflow-hidden">
              {/* Image preview with scan animation */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Product label"
                  className="w-full h-auto max-h-80 object-contain bg-bg-tertiary"
                />

                {/* Scan line animation when processing */}
                {scanning && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="scan-line" />
                    <div className="absolute inset-0 bg-accent-cyan/5" />
                  </div>
                )}

                {/* Remove button */}
                {!scanning && (
                  <button
                    onClick={resetScan}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-bg-primary/80 text-text-secondary hover:text-accent-red transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metadata inputs */}
          <div className="card p-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">
                Product Name (Optional)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Parle-G Gold Biscuits 200g"
                disabled={scanning}
                className="w-full transition-all focus:shadow-[0_0_15px_rgba(255,0,127,0.4)] focus:border-accent-amber bg-bg-tertiary/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">
                Package Surface Area cm² (Optional — enables font-size check)
              </label>
              <input
                type="number"
                value={packageArea}
                onChange={(e) => setPackageArea(e.target.value)}
                placeholder="e.g., 150"
                disabled={scanning}
                className="w-full transition-all focus:shadow-[0_0_15px_rgba(255,0,127,0.4)] focus:border-accent-amber bg-bg-tertiary/50"
              />
            </div>

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={!file || scanning}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B100E8] to-[#FF007F] text-white font-bold text-sm shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)]
                       hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 relative overflow-hidden"
            >
              {scanning ? (
                <>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  <Loader className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Extracting & Analyzing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Start Compliance Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-accent-red-dim border border-accent-red/20 text-accent-red text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          <AnimatePresence>
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Score */}
                <div className="card p-6 flex flex-col items-center">
                  <ComplianceGauge score={result.compliance_score} />
                  <p className="text-sm text-text-secondary mt-4 font-mono">
                    {result.product_name || 'Unknown Product'}
                  </p>
                </div>

                {/* Compliance checks */}
                <div className="card p-4">
                  <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
                    Clause-by-Clause Results
                  </h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {result.compliance_checks?.map((check, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors"
                      >
                        <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-semibold text-text-primary">
                              {check.clause_number}
                            </span>
                            <StatusBadge status={check.status} size="sm" />
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                            {check.rule_clause_text}
                          </p>
                          {check.violation_reason && check.status !== 'pass' && (
                            <p className="text-[11px] text-accent-amber mt-1 font-mono">
                              ⚠ {check.violation_reason}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Extracted Fields */}
                {result.extracted_fields?.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
                      Extracted Fields
                    </h3>
                    <div className="space-y-2">
                      {result.extracted_fields.map((field, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded bg-bg-tertiary/30">
                          <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase w-24 shrink-0">
                            {field.field_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-text-primary truncate flex-1">
                            {field.parsed_value || field.raw_text}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">
                            {field.confidence_score?.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View full report button */}
                <button
                  onClick={() => navigate(`/report/${result.scan_id}`)}
                  className="w-full py-3 rounded-lg border border-accent-cyan/30 text-accent-cyan font-semibold text-sm
                           hover:bg-accent-cyan-dim transition-all flex items-center justify-center gap-2"
                >
                  View Full Report →
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="card h-[280px] flex flex-col items-center justify-center bg-blueprint relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, var(--color-accent-cyan) 0%, transparent 70%)'}} />
                  <div className="text-center relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary/80 backdrop-blur-xl border border-border/50 flex items-center justify-center mx-auto mb-5 shadow-2xl">
                      <Camera className="w-8 h-8 text-accent-cyan" />
                    </div>
                    <p className="text-text-primary font-bold text-lg">Ready to Analyze</p>
                    <p className="text-text-secondary text-sm mt-2 max-w-[250px] mx-auto leading-relaxed">
                      Upload a label image to instantly verify legal metrology compliance.
                    </p>
                  </div>
                </div>

                {/* Recent Scans Widget */}
                {recentScans.length > 0 && (
                  <div className="card p-5">
                    <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-4">
                      Recent Scans
                    </h3>
                    <div className="space-y-3">
                      {recentScans.map((scan) => (
                        <div key={scan.id} onClick={() => navigate(`/report/${scan.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary cursor-pointer transition-colors border border-transparent hover:border-border/50">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded-md bg-bg-secondary">
                              <CheckCircle className={`w-4 h-4 ${scan.overall_status === 'compliant' ? 'text-accent-cyan' : scan.overall_status === 'non_compliant' ? 'text-accent-amber' : 'text-accent-blue'}`} />
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-text-primary truncate">{scan.product_name || `Scan #${scan.id.split('-')[0]}`}</p>
                              <p className="text-[10px] text-text-muted font-mono">{new Date(scan.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <StatusBadge status={scan.overall_status} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
