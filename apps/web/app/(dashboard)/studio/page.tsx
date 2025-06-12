// app/studio/page.tsx
"use client"
import CameraSetup from '@component/studio/studio';

export default function StudioPage() {
  const handleJoinStudio = () => {
    // Handle studio join logic here
    console.log('Joining studio...');
    // You can redirect to the actual studio room or call an API
  };

  return (
    <CameraSetup 
      onJoinStudio={handleJoinStudio}
      hostName="Jatin Chandel"
      studioName="Jatin Chandel's Studio"
    />
  );
}
