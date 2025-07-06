import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://owrbvokdfbnyrgqhlpss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cmJ2b2tkZmJueXJncWhscHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMTU4ODAsImV4cCI6MjA1ODU5MTg4MH0.x4IspthgR_4UGFSGZgeym9d8qC4g7RyLVDZjhqTBkYE'
);
export async function uploadChunkToSupabase(index: number, blob: Blob, sessionToken: string, userId:string) {
    const filePath = `sessions/${sessionToken}/${userId}/chunk-${index}.webm`;
  
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(filePath, blob, {
        contentType: 'video/webm',
        upsert: true, // overwrite if retrying
      });
  
    if (error) throw error;
  
    return data?.path; // this is your uploaded file path
  }
  