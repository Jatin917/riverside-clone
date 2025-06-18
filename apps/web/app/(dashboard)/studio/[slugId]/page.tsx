'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import CameraSetup from '@component/studio/studio';
import StudioSession from '@component/studio/studioSession';

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const session = useSession();

  const slugId = Array.isArray(params.slugId) ? params.slugId[0] : params.slugId;

  const [email, setEmail] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [joinedStudio, setJoinedStudio] = useState<boolean>(false);
  const [livekitToken, setLivekitToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [host, setHost] = useState<boolean>(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(''); // room token

  // ✅ Set email when session is loaded
  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session.data?.user?.email) {
      setEmail(session.data.user.email);
    }
  }, [session, router]);

  // ✅ Once email is ready, look for token in URL and fetch LiveKit token
  useEffect(() => {
    const tokenFromUrl = searchParams.get('t');
    if (tokenFromUrl && email && !joinedStudio) {
      setSessionToken(tokenFromUrl);
      setJoinedStudio(true);
      setHost(false);
      fetchToken(tokenFromUrl);
    }
  }, [searchParams, email, joinedStudio]);

  // ✅ Fetch LiveKit token from your backend
  const fetchToken = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/livekit-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          isStreamer: 'true',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      setLivekitToken(data.token);
      setWsUrl(data.wsUrl);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // ✅ Called when host joins
  const handleJoinStudio = async () => {
    try {
      if (!slugId || !email) throw new Error('Missing data');

      const sessionRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session`, {
        slugId,
      });

      const session = sessionRes.data.session;
      if (!session?.id) throw new Error('Session creation failed');

      const tokenRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session-token`, {
        slugId,
        sessionId: session.id,
      });

      const token = tokenRes.data.token;

      const studioUrl = new URL(`${window.location.origin}/studio/${slugId}`);
      studioUrl.searchParams.set('t', token);

      setSessionToken(token);
      setLink(studioUrl.toString());
      setJoinedStudio(true);
      await fetchToken(token);
    } catch (error) {
      console.error('Join Studio Failed:', error);
    }
  };

  // ✅ Render logic
  return (
    <>
      {!joinedStudio ? (
        <CameraSetup
          previewStream={previewStream}
          setPreviewStream={setPreviewStream}
          onJoinStudio={handleJoinStudio}
          hostName="Jatin Chandel"
          studioName="Jatin Chandel's Studio"
        />
      ) : (
        <StudioSession
          previewStream={previewStream}
          wsUrl={wsUrl}
          livekitToken={livekitToken}
          link={link}
          host={host}
        />
      )}
    </>
  );
}
