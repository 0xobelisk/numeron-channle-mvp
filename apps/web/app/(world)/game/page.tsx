'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { IPropsPhaserGame, IRefPhaserGame } from '@/game/phaser-game';
// import { useConnectWallet, useWallets } from '@mysten/dapp-kit';
// import { isEnokiWallet, AuthProvider, type EnokiWallet } from '@mysten/enoki';
// import { Transaction } from '@mysten/sui/transactions';
import { redirect } from 'next/navigation';
import { useCustomWallet } from '@/contexts/CustomWallet';

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
  const {
    isConnected,
    // isUsingEnoki,
    address,
    // jwt,
    // emailAddress,
    // getAddressSeed,
    // executeTransactionBlockWithoutSponsorship,
    // logout,
    // redirectToAuthUrl,
  } = useCustomWallet();
  console.log('isConnected', isConnected);
  console.log('address', address);
  useEffect(() => {
    // 如果没有连接钱包，重定向到根目录
    console.log('isConnected', isConnected);
    console.log('address', address);
    if (!isConnected || !address) {
      console.log('redirecting to root');
      redirect('/');
    }
  }, [isConnected, address]);

  return (
    <div id="app" className="flex justify-center items-center min-h-screen">
      <PhaserGame ref={phaserRef} setCanMoveSprite={setCanMoveSprite} />
    </div>
  );
}

export default Page;
