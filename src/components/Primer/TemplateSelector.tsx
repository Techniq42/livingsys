import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, ChevronDown } from 'lucide-react';
import { defaultTemplates, riaMessages } from '@/config/primerConfig';
import { useToast } from '@/hooks/use-toast';

interface TemplateSelectorProps {
  userId: string;
  inputType: string;
  onApply: (options: string[]) => void;
  currentOptions: string[];
}

interface Template {
  id?: string;
  name: string;
  input_type: string;
  selected_options: string[];
  isDefault?: boolean;
}

export function TemplateSelector({ userId, inputType, onApply, currentOptions }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [userId, inputType]);

  const loadTemplates = async () => {
    const defaults: Template[] = defaultTemplates
      .filter((t) => t.inputType === inputType)
      .map((t) => ({ name: t.name, input_type: t.inputType, selected_options: t.options, isDefault: true }));

    const { data } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('input_type', inputType)
      .order('created_at', { ascending: false });

    const userTemplates: Template[] = (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      input_type: t.input_type,
      selected_options: t.selected_options as string[],
    }));

    setTemplates([...userTemplates, ...defaults]);
  };

  const saveTemplate = async () => {
    if (!saveName.trim() || currentOptions.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_templates').insert({
        user_id: userId,
        name: saveName.trim(),
        input_type: inputType,
        selected_options: currentOptions,
      });
      if (error) throw error;
      toast({ title: 'Template saved', description: riaMessages.templateSaved });
      setSaveName('');
      loadTemplates();
    } catch {
      toast({ title: 'Error', description: 'Failed to save template.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Template dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs font-display text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors cursor-pointer min-h-[44px]"
        >
          Apply Template
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            {templates.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground italic">No templates for this type yet.</p>
            ) : (
              templates.map((t, i) => (
                <button
                  key={t.id || `default-${i}`}
                  onClick={() => { onApply(t.selected_options); setOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors min-h-[44px]"
                >
                  <span className="flex-1">{t.name}</span>
                  {t.isDefault && (
                    <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      default
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Save current as template */}
      {currentOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Template name…"
            className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none min-h-[44px] w-40"
          />
          <button
            onClick={saveTemplate}
            disabled={saving || !saveName.trim()}
            className="p-2 rounded-lg border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
