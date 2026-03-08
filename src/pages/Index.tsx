import { useState } from 'react';
import { HeroFork } from '@/components/Landing/HeroFork';
import { StoryBlock } from '@/components/Landing/StoryBlock';
import { ReHookBlock } from '@/components/Landing/ReHookBlock';
import { OfferBlock } from '@/components/Landing/OfferBlock';
import { OptInForm } from '@/components/OptIn/OptInForm';

const Index = () => {
  const [selectedPath, setSelectedPath] = useState<'architect' | 'operator' | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <HeroFork
        onSelectPath={setSelectedPath}
        selectedPath={selectedPath}
      />

      {selectedPath ? (
        <OptInForm path={selectedPath} onBack={() => setSelectedPath(null)} />
      ) : (
        <>
          <StoryBlock />
          <ReHookBlock />
          <OfferBlock />
        </>
      )}
    </div>
  );
};

export default Index;
