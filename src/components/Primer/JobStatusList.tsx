import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Loader2, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { riaMessages } from '@/config/primerConfig';

interface Job {
  id: string;
  input_type: string;
  created_at: string;
  status: string;
  outputs: unknown[];
  error_message: string | null;
  selected_options: string[];
  distribution_status: Record<string, string>;
}

interface JobStatusListProps {
  userId: string;
  refreshKey: number;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  queued: { icon: Clock, color: 'text-muted-foreground' },
  processing: { icon: Loader2, color: 'text-warning' },
  complete: { icon: CheckCircle2, color: 'text-primary' },
  failed: { icon: AlertTriangle, color: 'text-destructive' },
};

export function JobStatusList({ userId, refreshKey }: JobStatusListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [userId, refreshKey]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setJobs((data as unknown as Job[]) || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" /></div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground italic font-body">{riaMessages.emptyJobs}</p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-display font-semibold text-foreground">Recent Jobs</h2>
      <div className="space-y-2">
        {jobs.map((job, i) => {
          const cfg = statusConfig[job.status] || statusConfig.queued;
          const Icon = cfg.icon;
          const riaStatus = riaMessages.jobStatus[job.status as keyof typeof riaMessages.jobStatus] || job.status;
          const outputs = Array.isArray(job.outputs) ? job.outputs : [];

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
            >
              <Icon className={`w-5 h-5 mt-0.5 ${cfg.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-display tracking-wider uppercase text-primary">{job.input_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm font-body mt-1 ${cfg.color} italic`}>
                  {riaStatus}
                  {job.status === 'failed' && job.error_message && (
                    <span className="not-italic text-destructive/70 ml-1">— {job.error_message}</span>
                  )}
                </p>
                {job.selected_options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.selected_options.map((opt) => (
                      <span key={opt} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
                {outputs.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {outputs.map((out, idx) => (
                      <a
                        key={idx}
                        href={String(out)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3 h-3" /> Output {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
