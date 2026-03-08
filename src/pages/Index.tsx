import { useState } from 'react';
import { HeroFork } from '@/components/Landing/HeroFork';
import { StoryBlock } from '@/components/Landing/StoryBlock';
import { InfrastructureBlock } from '@/components/Landing/InfrastructureBlock';
import { ReHookBlock } from '@/components/Landing/ReHookBlock';
import { ProofBlock } from '@/components/Landing/ProofBlock';
import { OfferBlock } from '@/components/Landing/OfferBlock';
import { Footer } from '@/components/Landing/Footer';

import { OptInForm } from '@/components/OptIn/OptInForm';

const Index = () => {
  const [selectedPath, setSelectedPath] = useState<'architect' | 'operator' | null>(null);

  const handleSelectPath = (path: 'architect' | 'operator') => {
    setSelectedPath(path);
    setTimeout(() => {
      document.getElementById('optin-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroFork
        onSelectPath={handleSelectPath}
        selectedPath={selectedPath}
      />

      {selectedPath ? (
        <OptInForm path={selectedPath} onBack={() => setSelectedPath(null)} />
      ) : (
        <>
          <StoryBlock />
          <InfrastructureBlock />
          <ProofBlock />
          <ReHookBlock />
          <OfferBlock />
        </>
      )}
    </div>
  );
};

export default Index;
