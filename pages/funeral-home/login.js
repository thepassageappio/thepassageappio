import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FuneralHomeLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/funeral-home/dashboard?partner=1');
  }, [router]);

  return null;
}
