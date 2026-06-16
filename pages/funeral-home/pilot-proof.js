import { useEffect } from 'react';
import FuneralHomeSampleCase from './sample-case';

export default function LegacyFuneralHomeProofRoute() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/funeral-home/sample-case');
    }
  }, []);

  return <FuneralHomeSampleCase />;
}
