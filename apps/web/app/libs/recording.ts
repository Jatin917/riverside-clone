import { getServerSession } from "next-auth";
import { uploadChunkToSupabase } from "./supabaseClient";
import { AUTH_OPTIONS } from "./auth";
import { initDB } from "./indexDB";
import { init } from "next/dist/compiled/webpack/webpack";


// Get the stream from global window (assumes it was set earlier)
// const localStream = window.localStream as MediaStream | null;
// Main function to start recording
export const recordingMedia = async (sessionToken:string, userId:string, state:boolean, previewStream:MediaStream) => {
    const localStream = previewStream;
  if (!localStream) {
    console.error('No localStream found on window.');
    return;
  }

  try {
    const recorder = new MediaRecorder(localStream, {
      mimeType: 'video/webm; codecs=vp8,opus',
      videoBitsPerSecond: 1_000_000, // 1 Mbps
      audioBitsPerSecond: 128_000,
    });
    recorder.onstart = () => {
        console.log("✅ Recording started");
      };
      
      recorder.onstop = () => {
        console.log("🛑 Recording stopped");
      };
      
      recorder.onpause = () => {
        console.log("⏸️ Recording paused");
      };
      
      recorder.onresume = () => {
        console.log("▶️ Recording resumed");
      };
      
      recorder.onerror = (e) => {
        console.error("❌ Recording error", e);
      };
    let index = 0;

    recorder.ondataavailable = async (e) => {
      const chunk = {
        index,
        blob: e.data,
        uploaded: false,
        retryCount: 0,
      };

      // Ensure 'db' is available in the current scope
      const dbInstance = await initDB();
      if (!dbInstance) {
        console.error('IndexedDB instance "db" not found on window.');
        return;
      }

      await dbInstance.put('chunks', chunk); // Save blob
      await dbInstance.put('queue', { index, uploaded: false }); // Metadata for upload queue

      index++;
    };
    if(state){
        recorder.stop();
        console.log("recording stopped");
    }
    else{
        recorder.start(10_000); // 10s per chunk
    }
    await processQueue(sessionToken, userId);

  } catch (error) {
    console.error('Failed to start recording:', error);
  }
};

export async function processQueue(sessionToken:string, userId:string) {
  // Ensure 'db' is available in the current scope
  console.log("process queue")
  const dbInstance = await initDB();
  if (!dbInstance) {
      console.error('IndexedDB instance "db" not found on window.');
      return;
    }
    
  const queue = await dbInstance.getAll('queue');
  
  console.log("process queue in queue")
  for (const meta of queue) {
    if (meta.uploaded) continue;
      const chunkRecord = await dbInstance.get('chunks', meta.index);
      if (!chunkRecord || !chunkRecord.blob) {
        console.warn(`Missing blob for chunk index ${meta.index}`);
        continue;
      }
  
      try {
        await uploadChunkToSupabase(meta.index, chunkRecord.blob, sessionToken, userId);
        console.log("process queue uploaded to supabase")
  
        // Mark uploaded
        await dbInstance.put('queue', { ...meta, uploaded: true });
        console.log(`Uploaded chunk index ${meta.index}`);
      } catch (e) {
        console.error(`Upload failed for chunk index ${meta.index}`, e);
        // Retry will happen next cycle or manually
      }
    }
  }
  