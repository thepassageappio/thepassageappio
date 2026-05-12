import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FuneralHomeStaffLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/funeral-home/dashboard?staff=1');
  }, [router]);

  return null;
}
