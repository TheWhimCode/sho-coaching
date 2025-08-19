// app/checkout/success/page.tsx  (SERVER)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuccessClient />
    </Suspense>
  );
}
