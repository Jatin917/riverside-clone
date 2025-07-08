import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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
  