import { useState } from 'react';
import { HookBlock } from '@/components/Landing/HookBlock';
import { StoryBlock } from '@/components/Landing/StoryBlock';
import { ReHookBlock } from '@/components/Landing/ReHookBlock';
import { OfferBlock } from '@/components/Landing/OfferBlock';
import { ForkSection } from '@/components/Fork/ForkSection';
import { OptInForm } from '@/components/OptIn/OptInForm';

const Index = () => {
  const [selectedPath, setSelectedPath] = useState<'architect' | 'operator' | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <HookBlock />
      <StoryBlock />
      <ReHookBlock />
      <OfferBlock />

      {!selectedPath ? (
        <ForkSection onSelectPath={setSelectedPath} />
      ) : (
        <OptInForm path={selectedPath} onBack={() => setSelectedPath(null)} />
      )}
    </div>
  );
};

export default Index;
