import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link, Type, HelpCircle, Film, Headphones, FileText, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { detectInputType, processingMenus, riaMessages, type InputType } from '@/config/primerConfig';
import { TemplateSelector } from './TemplateSelector';
import { useToast } from '@/hooks/use-toast';

interface ContentIntakeProps {
  userId: string;
  onJobCreated: () => void;
}

const ACCEPTED_EXTENSIONS = '.mp4,.mov,.webm,.mp3,.wav,.m4a,.pdf,.docx,.md,.txt';

export function ContentIntake({ userId, onJobCreated }: ContentIntakeProps) {
  const [dragOver, setDragOver] = useState(false);
  const [inputType, setInputType] = useState<InputType | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDetect = useCallback((f?: File, text?: string) => {
    const detected = detectInputType(f, text);
    setInputType(detected);
    setSelectedOptions([]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setInputText('');
      handleDetect(f);
    }
  }, [handleDetect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setInputText('');
      handleDetect(f);
    }
  }, [handleDetect]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    setFile(null);
    if (val.trim().length > 2) {
      handleDetect(undefined, val);
    } else {
      setInputType(null);
    }
  }, [handleDetect]);

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);
  };

  const handleForceType = (type: InputType) => {
    setInputType(type);
    setSelectedOptions([]);
  };

  const handleTemplateApply = (options: string[]) => {
    setSelectedOptions(options);
  };

  const createJob = async () => {
    if (!inputType || selectedOptions.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        user_id: userId,
        input_type: inputType,
        input_url: !file ? inputText.trim() : null,
        input_file: file?.name || null,
        selected_options: selectedOptions,
        status: 'queued',
      });
      if (error) throw error;
      toast({ title: 'Job created', description: riaMessages.jobStatus.queued });
      setInputType(null);
      setSelectedOptions([]);
      setInputText('');
      setFile(null);
      onJobCreated();
    } catch {
      toast({ title: 'Error', description: 'Failed to create job.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const options = inputType && inputType !== 'unknown' ? processingMenus[inputType] || [] : [];

  const inputTypeIcon: Record<string, typeof Film> = {
    video: Film,
    audio: Headphones,
    document: FileText,
    text: Type,
    url: Link,
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground">Content Intake</h2>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all min-h-[160px] flex flex-col items-center justify-center gap-4 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
        }`}
      >
        <Upload className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-body max-w-md">
          {riaMessages.emptyIntake}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 text-xs font-display border border-border rounded-lg hover:border-primary/40 text-foreground transition-colors cursor-pointer min-h-[44px]"
          >
            Browse Files
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Text/URL paste */}
      <textarea
        value={inputText}
        onChange={handleTextChange}
        placeholder="Paste a URL or raw text here…"
        rows={3}
        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
      />

      {/* Detected input display */}
      <AnimatePresence mode="wait">
        {inputType && (
          <motion.div
            key={inputType}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {inputType === 'unknown' ? (
              /* WTF State */
              <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-coral mx-auto" />
                <h3 className="font-display font-semibold text-foreground">{riaMessages.wtfTitle}</h3>
                <p className="text-sm text-muted-foreground">{riaMessages.wtfSubtitle}</p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {(['video', 'document', 'text'] as InputType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleForceType(t)}
                      className="px-4 py-2 text-xs font-display border border-border rounded-lg hover:border-primary/40 text-foreground transition-colors cursor-pointer min-h-[44px] capitalize"
                    >
                      Treat as {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Type badge */}
                <div className="flex items-center gap-2">
                  {inputTypeIcon[inputType] && (() => {
                    const Icon = inputTypeIcon[inputType];
                    return <Icon className="w-4 h-4 text-primary" />;
                  })()}
                  <span className="text-xs font-display tracking-wider uppercase text-primary">
                    {inputType} detected
                  </span>
                  {file && (
                    <span className="text-xs text-muted-foreground ml-2 truncate max-w-[200px]">
                      — {file.name}
                    </span>
                  )}
                </div>

                {/* Template selector */}
                <TemplateSelector
                  userId={userId}
                  inputType={inputType}
                  onApply={handleTemplateApply}
                  currentOptions={selectedOptions}
                />

                {/* Processing options */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 bg-card cursor-pointer transition-colors min-h-[44px]"
                    >
                      <Checkbox
                        checked={selectedOptions.includes(opt.id)}
                        onCheckedChange={() => toggleOption(opt.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-display text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Create job */}
                <button
                  onClick={createJob}
                  disabled={submitting || selectedOptions.length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-display text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer min-h-[44px] flex items-center gap-2 justify-center"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Job
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
