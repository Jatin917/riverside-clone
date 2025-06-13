import { useSession } from "next-auth/react";
import { useEffect } from "react";

const Page = () =>{
  const detail = useSession();
  return <>studio</>
}

export default Page;