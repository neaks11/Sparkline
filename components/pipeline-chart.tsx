import { LeadStatus } from '@/lib/types';

interface PipelineChartProps {
  counts: Record<LeadStatus, number>;
}

const colorMap: Record<LeadStatus, string> = {
  // SMB pipeline
  New: 'bg-slate-500',
  Ready: 'bg-brand-500',
  Contacted: 'bg-sky-500',
  Qualified: 'bg-purple-500',
  'Proposal Sent': 'bg-amber-500',
  Won: 'bg-emerald-500',
  Lost: 'bg-rose-500',
  // Senior Living / Referral pipeline
  'Relationship Building': 'bg-sky-400',
  'Partner Qualified': 'bg-purple-400',
  'Partner Established': 'bg-amber-400',
  'Active Referrals': 'bg-teal-500',
  Dormant: 'bg-slate-300',
};

export function PipelineChart({ counts }: PipelineChartProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0) || 1;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold">Pipeline Distribution</h3>
      <div className="mt-3 space-y-2">
        {(Object.keys(counts) as LeadStatus[]).map((status) => {
          const value = counts[status];
          const width = Math.round((value / total) * 100);
          return (
            <div key={status}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{status}</span>
                <span>{value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className={`h-2 rounded-full ${colorMap[status]}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
