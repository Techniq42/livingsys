import { Rocket, Users, BookOpen, Gamepad2, Flower2, MessageSquare, Wrench, Globe, Mic } from 'lucide-react';

export const portalTiles = [
  {
    id: 'ghl',
    label: 'GoHighLevel',
    icon: Rocket,
    url: 'https://app.gohighlevel.com',
    riaHover: 'Plug into your GHL brain.',
    color: 'primary' as const,
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    url: '#',
    riaHover: 'Your people are in there. Go say hi.',
    color: 'secondary' as const,
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    url: '#',
    riaHover: 'Level up. You know you want to.',
    color: 'primary' as const,
  },
  {
    id: 'games',
    label: 'Games',
    icon: Gamepad2,
    url: '#',
    riaHover: 'Play is a regenerative act. Seriously.',
    color: 'coral' as const,
  },
  {
    id: 'bloom',
    label: 'Bloom Network',
    icon: Flower2,
    url: '#',
    riaHover: 'The mycelial layer. Connect everything.',
    color: 'magenta' as const,
  },
];

export const iNeedToOptions = [
  { label: 'Post in the community', target: '#', icon: MessageSquare },
  { label: 'Work on my course', target: '#', icon: BookOpen },
  { label: 'Check my website', target: '#', icon: Globe },
  { label: 'Record something', target: '#', icon: Mic },
  { label: 'Fix something broken', target: '#', icon: Wrench },
];

export type InputType = 'video' | 'audio' | 'document' | 'text' | 'url' | 'unknown';

export interface ProcessingOption {
  id: string;
  label: string;
  description: string;
}

export const processingMenus: Record<string, ProcessingOption[]> = {
  video: [
    { id: 'TRANSCRIBE', label: 'Transcribe', description: 'Generate full transcript' },
    { id: 'SUBTITLES', label: 'Subtitles', description: 'Burn subtitles into video' },
    { id: 'CLIPS', label: 'Clips', description: 'Extract short-form clips' },
    { id: 'COMPLIANCE', label: 'Compliance', description: 'Ad compliance check' },
    { id: 'SPEAKER_FOCUS', label: 'Speaker Focus', description: 'Speaker-focused vertical crop' },
    { id: 'BLOG_POST', label: 'Blog Post', description: 'Convert to long-form written content' },
    { id: 'YT_METADATA', label: 'YT Metadata', description: 'YouTube description + tags' },
    { id: 'DISTRIBUTE', label: 'Distribute', description: 'Platform distribution package' },
  ],
  audio: [
    { id: 'TRANSCRIBE', label: 'Transcribe', description: 'Generate full transcript' },
    { id: 'BLOG_POST', label: 'Blog Post', description: 'Convert to long-form written content' },
    { id: 'EPISODE_DESC', label: 'Episode Notes', description: 'Podcast show notes' },
    { id: 'QUOTES', label: 'Quotes', description: 'Extract key quotes' },
    { id: 'SUMMARY', label: 'Summary', description: 'Quick summary' },
  ],
  document: [
    { id: 'SUMMARY', label: 'Summary', description: 'Quick summary' },
    { id: 'SOCIAL_POSTS', label: 'Social Posts', description: 'Extract insights per platform' },
    { id: 'DISPATCH', label: 'Dispatch', description: 'Format as dispatch page' },
    { id: 'VIDEO_SCRIPT', label: 'Video Script', description: 'Teleprompter-ready script' },
    { id: 'SPLIT_SECTIONS', label: 'Split Sections', description: 'Break into sections' },
  ],
  text: [
    { id: 'SUMMARY', label: 'Summary', description: 'Quick summary' },
    { id: 'SOCIAL_POSTS', label: 'Social Posts', description: 'Extract insights per platform' },
    { id: 'DISPATCH', label: 'Dispatch', description: 'Format as dispatch page' },
    { id: 'BLOG_POST', label: 'Blog Post', description: 'Convert to long-form content' },
  ],
  url: [
    { id: 'SUMMARY', label: 'Summary', description: 'Quick summary' },
    { id: 'SOCIAL_POSTS', label: 'Social Posts', description: 'Extract insights per platform' },
    { id: 'DISPATCH', label: 'Dispatch', description: 'Format as dispatch page' },
    { id: 'BLOG_POST', label: 'Blog Post', description: 'Convert to long-form content' },
  ],
};

export const defaultTemplates = [
  { name: 'My Whole Deal', inputType: 'video', options: ['TRANSCRIBE', 'CLIPS', 'BLOG_POST', 'DISTRIBUTE', 'YT_METADATA'] },
  { name: 'Clips First, No Notes', inputType: 'video', options: ['CLIPS', 'DISTRIBUTE'] },
  { name: 'Long Form Or Nothing', inputType: 'document', options: ['BLOG_POST', 'SUMMARY'] },
  { name: 'The Full Chaos Package', inputType: 'video', options: ['TRANSCRIBE', 'SUBTITLES', 'CLIPS', 'COMPLIANCE', 'SPEAKER_FOCUS', 'BLOG_POST', 'YT_METADATA', 'DISTRIBUTE'] },
];

export const riaMessages = {
  jobStatus: {
    queued: 'In the queue.',
    processing: 'On it.',
    complete: "Done. You're welcome.",
    failed: 'Welp.',
  },
  health: {
    green: "Everything's vibing.",
    yellow: "Something's sus.",
    red: 'Oh no. Oh no no no.',
  },
  templateSaved: "Cool, I'll remember that. Same vibe next time?",
  emptyJobs: "Nothing here yet. Drop something in and let's make some magic.",
  emptyIntake: "Drop a file, paste a URL, or just type something. I'll figure it out.",
  wtfTitle: 'WTF is this?',
  wtfSubtitle: "I don't know either, but I can try. What were you hoping to do with it?",
} as const;

export function detectInputType(file?: File, text?: string): InputType {
  if (file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
    if (['pdf', 'docx', 'md', 'txt'].includes(ext)) return 'document';
    return 'unknown';
  }
  if (text) {
    const trimmed = text.trim();
    if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed)) return 'video';
    if (/^https?:\/\//i.test(trimmed)) return 'url';
    return 'text';
  }
  return 'unknown';
}
