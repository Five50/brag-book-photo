'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(
  () => import('@/components/editor/Editor'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    )
  }
);

export default function Home() {
  return <Editor />;
}