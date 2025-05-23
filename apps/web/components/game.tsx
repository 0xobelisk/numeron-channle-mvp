'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IRefPhaserGame } from '../game/phaser-game';

// 动态导入Phaser游戏组件
const PhaserGame = dynamic(() => import('../game/phaser-game'), {
  ssr: false,
});

export default function Game() {
  const gameRef = useRef<IRefPhaserGame>({ game: null, scene: null });
  const [,setCanMoveSprite] = useState(false);

  return (
    <div className="game-wrapper w-full h-screen flex justify-center items-center bg-gray-900">
      <div className="game-container w-full h-full max-w-[1024px] max-h-[576px] overflow-hidden">
        <PhaserGame ref={gameRef} setCanMoveSprite={setCanMoveSprite} />
      </div>
    </div>
  );
}
