"use client"
import React, {useRef, useEffect} from "react";
import {RemoteTrack} from 'livekit-client'

export const Track = ({track}:{track:RemoteTrack}) => {
    console.log("track is there in remote track ", track)
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    useEffect(()=>{
        console.log("track is there in remote track ", track)
        if(track && remoteVideoRef.current){
            track.attach(remoteVideoRef.current);
        }
    },[track])
  return (
    <>
      <h2 className="text-white mb-2">Remote Video</h2>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full aspect-video bg-black rounded-lg"
      />
    </>
  );
};

