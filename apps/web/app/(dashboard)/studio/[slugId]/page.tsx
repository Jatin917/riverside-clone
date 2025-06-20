'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import CameraSetup from '@component/studio/studio';
import StudioSession from '@component/studio/studioSession';
import { createSessionAndToken, fetchLivekitToken, fetchOngoingSession } from '@lib/studio';
import { createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';

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
  useEffect(() => {
    if (session.status === 'loading') return; // 🚫 wait for actual status
    if (session.status === 'unauthenticated') {
      router.push('/');
      return;
    }
  
    // ✅ Authenticated user: set email
    if (session.data?.user?.email) {
      setEmail(session.data.user.email);
    }
  }, [session.status]);

  
  // jis bnde pr token url main hain wo bnda ongoing session nikal lega wahi se 
  useEffect(() => {
    if (
      session.status !== 'authenticated' || // 🚫 skip if not ready
      searchParams.get('t')
    ) return;
    const fetchOnGoingSession = async () => {
      const data = await fetchOngoingSession(slugId as string);
      if (data.session) {
        const parsedData = JSON.parse(data.session);
        // console.log("parsedData in fetchOnGoingSession is ", parsedData.roomToken);
        const link = new URL(`${window.location.origin}/studio/${slugId}?t=${parsedData.roomToken}`);
        console.log("link in fetchOnGoingSession is ", link.toString());
        if(!previewStream){
          const videoTrack = await createLocalVideoTrack();
          const audioTrack = await createLocalAudioTrack(); 
          const stream = new MediaStream([
            videoTrack.mediaStreamTrack,
            audioTrack.mediaStreamTrack,
          ]);
          setPreviewStream(stream);
        }
        setLink(link.toString());
        setJoinedStudio(true);
        setSessionToken(parsedData.roomToken);
        setHost(true);
        setLoading(false);
    };
    }
    fetchOnGoingSession();
  }, [session.status, searchParams]);
  

  // ✅ Once email is ready, look for token in URL and fetch LiveKit token
  useEffect(() => {
    const tokenFromUrl = searchParams.get('t');
    if (tokenFromUrl && email && !joinedStudio) {
      setHost(false); // when the token is present in the url means the user is not the host 
      fetchToken(email, tokenFromUrl);
    }
  }, [searchParams, email]);

  // ✅ Fetch LiveKit token from your backend
  const fetchToken = async (email: string, token: string) => {
    try {
      const {livekitToken, wsUrl} = await fetchLivekitToken(email, token);
      // console.log("livekitToken in page is ", livekitToken);
      setLivekitToken(livekitToken);
      setWsUrl(wsUrl);
      setLoading(false);
      setJoinedStudio(true);
      setSessionToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // ✅ Called when host joins
  const handleJoinStudio = async () => {
    try {
      if (!slugId || !email) throw new Error('Missing data');

     const token = await createSessionAndToken(slugId);
      const studioUrl = new URL(`${window.location.origin}/studio/${slugId}`);
      studioUrl.searchParams.set('t', token);

      setSessionToken(token);
      setLink(studioUrl.toString());
      await fetchToken(email, token);
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
