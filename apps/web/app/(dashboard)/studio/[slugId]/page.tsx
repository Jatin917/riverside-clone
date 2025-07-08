'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import CameraSetup from '@component/studio/studio';
import StudioSession from '@component/studio/studioSession';
import { fetchOngoingSession } from '@lib/studio';
import {createSessionAndToken, fetchLivekitToken } from '@lib/socketStudio'
import { createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';
import { toast } from 'react-toastify';

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

  
  // jis bnde pr token url main token hain wo bnda ongoing session nikal lega wahi se 
  useEffect(() => {
    if (
      session.status !== 'authenticated' || // 🚫 skip if not ready
      searchParams.get('t')
    ) return;
    const fetchOnGoingSession = async () => {
      const data = await fetchOngoingSession(slugId as string);
      if (data.roomToken) {
        const link = new URL(`${window.location.origin}/studio/${slugId}?t=${data.roomToken}`);
        const email = session.data?.user?.email as string;
        await fetchToken(email, data.roomToken);
        setLink(link.toString());
        setHost(true);
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
      const response = await fetchLivekitToken(email, token);
      if(response===null){
        toast.warn("Unable to connect to the room");
        return;
      }
      console.log("response in slug id page ", response.livekitToken, response.wsUrl)
      const {livekitToken, wsUrl} = response;
      setLivekitToken(livekitToken);
      setWsUrl(wsUrl);
      setLoading(false);
      setSessionToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // ✅ Called when host joins
  const handleJoinStudio = async () => {
    try {
      console.log("handle join studio call hua ", email, slugId);
      if(joinedStudio) return;
      if (!slugId || !email) throw new Error('Missing data');
      if(!sessionToken){
        const token = await createSessionAndToken(slugId);
        const studioUrl = new URL(`${window.location.origin}/studio/${slugId}`);
        studioUrl.searchParams.set('t', token);
        await fetchToken(email, token);
        setSessionToken(token);
        setLink(studioUrl.toString());
      }
        setJoinedStudio(true);
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
          sessionToken={sessionToken}
          email={email}
        />
      )}
    </>
  );
}
