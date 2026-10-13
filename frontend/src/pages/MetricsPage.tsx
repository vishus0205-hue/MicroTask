import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  Clock,
  Bug,
  RotateCcw,
  Users,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardMetrics, MetricDefinition } from '../types';

export const MetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [definitions, setDefinitions] = useState<MetricDefinition[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        api.getDashboardMetrics(startDate || undefined, endDate || undefined),
        api.getMetricDefinitions(),
      ]);
      setMetrics(mRes);
      setDefinitions(dRes.definitions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const s = metrics?.summary;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group definitions into the 4 requested analytical sections
  const deliveryDefs = definitions.filter((d) => ['completion_rate', 'throughput'].includes(d.id));
  const efficiencyDefs = definitions.filter((d) => ['cycle_time', 'overdue_count'].includes(d.id));
  const qualityDefs = definitions.filter((d) => ['defect_rate', 'rework_rate'].includes(d.id));
  const teamDefs = definitions.filter((d) => ['workload_distribution'].includes(d.id));

  const getLiveValue = (id: string) => {
    if (!s) return '—';
    switch (id) {
      case 'completion_rate':
        return `${s.completion_rate}%`;
      case 'throughput':
        return `${s.throughput} tasks`;
      case 'cycle_time':
        return `${s.avg_cycle_time_hours} hours`;
      case 'overdue_count':
        return `${s.overdue_count} tasks`;
      case 'defect_rate':
        return `${s.defect_rate}%`;
      case 'rework_rate':
        return `${s.rework_rate}%`;
      case 'workload_distribution':
        return `${metrics?.workload_distribution.reduce((acc, u) => acc + u.active_tasks, 0) || 0} active`;
      default:
        return '—';
    }
  };

  const renderMetricCard = (def: MetricDefinition) => {
    const isExpanded = expandedId === def.id;
    return (
      <div
        key={def.id}
        className="glass-card rounded-2xl p-5 space-y-3 transition-all duration-200 border border-black/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{def.name}</h4>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{def.description}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl font-bold text-slate-900 tabular-nums block">
              {getLiveValue(def.id)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Live Value
            </span>
          </div>
        </div>

        {/* Mathematical Formula Preview */}
        <div className="p-3 bg-slate-900/90 text-blue-300 font-mono text-[11px] rounded-xl border border-slate-800 shadow-inner flex items-center justify-between">
          <span className="truncate mr-2 font-medium text-slate-200">{def.formula}</span>
          <span className="text-[10px] text-slate-400 font-sans uppercase shrink-0">{def.unit}</span>
        </div>

        {/* Expandable Disclosure for Academic Formulation */}
        <div>
          <button
            onClick={() => toggleExpand(def.id)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors pt-1"
          >
            <span>{isExpanded ? 'Hide mathematical treatment' : 'View treatment & interpretation'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3.5 bg-black/[0.02] rounded-xl text-[11px] text-slate-600 space-y-2 border border-black/[0.03] animate-in fade-in duration-150">
              <div>
                <strong className="text-slate-800 block mb-0.5">Data Treatment Rules:</strong>
                <p className="text-slate-500 leading-relaxed">{def.treatment}</p>
              </div>
              <div>
                <strong className="text-slate-800 block mb-0.5">Engineering Interpretation:</strong>
                <p className="text-slate-500 leading-relaxed">{def.interpretation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <div className="text-[13px] font-medium text-slate-400 mb-1">Analytical Telemetry</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Software Metrics Engine
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            Formal mathematical formulas and live calculations grounded in relational database records.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-black/[0.06] text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[12px] font-medium text-slate-800 focus:outline-hidden"
            />
            <span className="text-slate-300">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[12px] font-medium text-slate-800 focus:outline-hidden"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Measurement Principle Notice */}
      <div className="p-4 rounded-2xl glass-card-subtle text-[12px] text-slate-600 leading-relaxed flex items-start gap-3 border border-black/[0.04]">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          <strong>Software Engineering Measurement Principle:</strong> These process indicators evaluate workflow velocity, bottleneck frequency, and deliverable quality across sprint iterations. They handle zero-division edge cases safely and treat cancelled tasks as de-scoped items.
        </p>
      </div>

      {/* SECTION 1: Delivery Performance */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Delivery Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveryDefs.map(renderMetricCard)}
        </div>
      </div>

      {/* SECTION 2: Workflow Efficiency */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Workflow Efficiency</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {efficiencyDefs.map(renderMetricCard)}
        </div>
      </div>

      {/* SECTION 3: Quality & Rework */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-orange-600" />
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Quality & Rework</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualityDefs.map(renderMetricCard)}
        </div>
      </div>

      {/* SECTION 4: Team Workload */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Team Workload Balance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamDefs.map(renderMetricCard)}
        </div>
      </div>
    </div>
  );
};
