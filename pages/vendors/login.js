import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function VendorLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendors/request');
  }, [router]);

  return null;
}
