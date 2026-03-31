import { Settings } from 'lucide-react';

export default function DashboardSettings() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground italic font-body">
          Operator configuration. n8n endpoints, branding, module toggles.
        </p>
      </div>
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Settings className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-display text-sm">
            operator_config table is live. UI coming soon.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Manage org_name, enabled_modules, and branding from here.
          </p>
        </div>
      </div>
    </div>
  );
}
