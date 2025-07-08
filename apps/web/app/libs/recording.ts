import { uploadChunkToSupabase } from "./supabaseClient";
import { initDB } from "./indexDB";

let recorder: MediaRecorder | null = null;
// Remove incorrect type annotation and initialization for dbInstance
let dbInstance:any;
let uploadInterval: ReturnType<typeof setInterval> | null = null;
let chunkIdx = 0;

// Get the stream from global window (assumes it was set earlier)
// const localStream = window.localStream as MediaStream | null;
// Main function to start recording
export const startRecordingMedia = async (
  sessionToken: string,
  userId: string,
  previewStream: MediaStream
) => {
  const localStream = previewStream;
  if (!localStream) {
    console.error('No localStream found on window.');
    return;
  }

  try {
    if(!recorder){
      const recorderVar = new MediaRecorder(localStream, {
        mimeType: 'video/webm; codecs=vp8,opus',
        videoBitsPerSecond: 1_000_000, // 1 Mbps
        audioBitsPerSecond: 128_000,
      });
      recorder = recorderVar;
    }
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

    recorder.ondataavailable = async (e) => {
      const chunk = {
        chunkIdx,
        blob: e.data,
        uploaded: false,
        retryCount: 0,
      };

      // Ensure 'db' is available in the current scope
      const dbInstance = await initDB();
      if (!dbInstance) {
        console.error('chunkIdxedDB instance "db" not found on window.');
        return {recordingState:false};
      }

      await dbInstance.put('chunks', chunk); // Save blob
      await dbInstance.put('queue', { chunkIdx, uploaded: false }); // Metadata for upload queue

      chunkIdx++;
    };
    recorder.start(10_000); // 10s per chunk
    if (!uploadInterval) {
      uploadInterval = setInterval(() => {
        processQueue(sessionToken, userId);
      }, 10_000);
    }
  } catch (error) {
    console.error('Failed to start recording:', error);
  }
};

export const stopRecordingMedia = async (sessionToken:string, userId:string) => {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
    await processQueue(sessionToken, userId);
  }
  if (uploadInterval) {
    clearInterval(uploadInterval);
    uploadInterval = null;
    console.log("⛔ Upload interval cleared");
  }
};


let isUploading = false;
export async function processQueue(sessionToken: string, userId: string) {
  if (isUploading) return;
  isUploading = true;

  try {
    if (!dbInstance) {
      dbInstance = await initDB();
    }
    if (!dbInstance) {
      console.error('chunkIdxedDB instance "db" not found on window.');
      return;
    }

    const queue = await dbInstance.getAll('queue');
    for (const meta of queue) {
      if (meta.uploaded) continue;

      const chunkRecord = await dbInstance.get('chunks', meta.chunkIdx);
      if (!chunkRecord?.blob) {
        console.warn(`Missing blob for chunk chunkIdx ${meta.chunkIdx}`);
        continue;
      }

      try {
        await uploadChunkToSupabase(meta.chunkIdx, chunkRecord.blob, sessionToken, userId);
        await dbInstance.delete('queue',  meta.chunkIdx);
        console.log(`✅ Uploaded chunk chunkIdx ${meta.chunkIdx}`);
      } catch (e) {
        console.error(`❌ Upload failed for chunk chunkIdx ${meta.chunkIdx}`, e);
        await dbInstance.put('queue', { ...meta, uploaded: false });
        // Retry logic as you described is fine
      }
    }
  } finally {
    isUploading = false; // ✅ Runs once after entire processing
  }
}
