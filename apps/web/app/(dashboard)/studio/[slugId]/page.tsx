'use client';
import CameraSetup from '@component/studio/studio';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import StudioSession from '@component/studio/studioSession';
import { useSession } from 'next-auth/react';

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const slugId = Array.isArray(params.slugId) ? params.slugId[0] : params.slugId;
  const session = useSession();
  const [email, setEmail] = useState<string | null>();
  useEffect(()=>{
    console.log("session is ", session);
    if(session && session.data && session.data.user){
      setEmail(session.data.user.email);
      // // user is not authenticated ask him to authenticate
      // router.push('/login');
      return;
    }
  },[router, session])
  const [link, setLink] = useState<string | null>(null);
  const [joinedStudio, setJoinedStudio] = useState<boolean>(false);
  const [livekitToken, setLivekitToken] = useState<string>('')
  const [roomToken, setRoomToken] = useState<string>('')
  const [wsUrl, setWsUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  

  const fetchToken = async (token:string) => {
    try {
      const response = await fetch('http://localhost:3001/api/livekit-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          isStreamer:'true',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      console.log("data from token", data);
      setLivekitToken(data.token);
      setWsUrl(data.wsUrl);
      setLoading(false);
      setJoinedStudio(true); // set studio as joined after link generated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleJoinStudio = async () => {
    try {
      if (!slugId) throw new Error("Slug ID is missing");

      const sessionRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session`, {
        slugId,
      });
      const session = sessionRes.data.session;
      console.log("session is ", session, session.id)
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
      setRoomToken(token);
      setLink(url.toString());
      await fetchToken(token);
    } catch (error) {
      console.error('Join Studio Failed:', error);
    }
  };

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
        <StudioSession previewStream={previewStream} wsUrl={wsUrl}  livekitToken={livekitToken} link={link} />
      )}
    </>
  );
}
