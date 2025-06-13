'use client';
import CameraSetup from '@component/studio/studio';
import { useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import StudioSession from '@component/studio/studioSession';

export default function StudioPage() {
  const params = useParams();
  const slugId = Array.isArray(params.slugId) ? params.slugId[0] : params.slugId;

  const [link, setLink] = useState<string | null>(null);
  const [joinedStudio, setJoinedStudio] = useState<boolean>(false);

  const handleJoinStudio = async () => {
    try {
      if (!slugId) throw new Error("Slug ID is missing");

      const sessionRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session`, {
        slugId,
      });

      const session = sessionRes.data;
      if (!session || !session.id) {
        throw new Error("Session creation failed");
      }

      const tokenRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session-token`, {
        slugId,
        sessionId: session.id,
      });

      const token = tokenRes.data;
      const currentUrl = window.location.origin + `/studio/${slugId}`;
      const url = new URL(currentUrl);
      url.searchParams.set('t', token);

      setLink(url.toString());
      setJoinedStudio(true); // set studio as joined after link generated

    } catch (error) {
      console.error('Join Studio Failed:', error);
    }
  };

  return (
    <>
      {!joinedStudio ? (
        <CameraSetup
          onJoinStudio={handleJoinStudio}
          hostName="Jatin Chandel"
          studioName="Jatin Chandel's Studio"
        />
      ) : (
        <StudioSession link={link} />
      )}
    </>
  );
}
