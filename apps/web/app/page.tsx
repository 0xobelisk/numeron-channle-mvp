'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { IPropsPhaserGame, IRefPhaserGame } from '@/game/phaser-game';

const PhaserGame = dynamic<IPropsPhaserGame>(() => import('@/game/phaser-game'), {
  ssr: false,
  // width/height copied from game config in main.ts
  loading: () => <div style={{ width: 1024, height: 768 }}></div>,
});

function Page() {
  // The sprite can only be moved in the MainMenu Scene
  const [, setCanMoveSprite] = useState(false);
  // References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  return (
    <div id="app" className="flex justify-center items-center min-h-screen">
      <PhaserGame ref={phaserRef} setCanMoveSprite={setCanMoveSprite} />
    </div>
  );
}

export default Page;
