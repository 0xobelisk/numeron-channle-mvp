'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { ArrowLeft, Box, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import confetti from 'canvas-confetti';

// Mock box data (all English)
const BOXES = [
  {
    id: 'box1',
    name: 'Normal Box',
    description: 'Contains common items, with a small chance to get rare items',
    price: 100,
    image: '/assets/images/boxes/normal_box.png',
    backgroundColor: '#3b82f6',
  },
  {
    id: 'box2',
    name: 'Rare Box',
    description: 'Contains rare items, with a small chance to get epic items',
    price: 300,
    image: '/assets/images/boxes/rare_box.png',
    backgroundColor: '#8b5cf6',
  },
  {
    id: 'box3',
    name: 'Legendary Box',
    description: 'Contains epic items, with a small chance to get legendary items',
    price: 800,
    image: '/assets/images/boxes/legendary_box.png',
    backgroundColor: '#f59e0b',
  },
];

// Mock item data (all English)
const ITEMS = [
  {
    id: '101',
    name: 'AK-47 | Neon Revolution',
    image:
      'https://igstatic.igxe.cn/steam/image/730/19cfb9de8d87b53a024570838e277473.png?x-oss-process=image/format,webp',
    rarity: 'legendary',
    wear: 0.03,
    category: 'weapon',
    dropRate: 0.01, // 1%
  },
  {
    id: '102',
    name: 'M4A1-S | Cyber Hunter',
    image:
      'https://igstatic.igxe.cn/steam/image/730/4d3cd4149cc360c079bd99e265dc2a92.png?x-oss-process=image/format,webp',
    rarity: 'epic',
    wear: 0.12,
    category: 'weapon',
    dropRate: 0.05, // 5%
  },
  {
    id: '103',
    name: 'AWP | Dragon King',
    image:
      'https://igstatic.igxe.cn/steam/image/730/361282da9b526356602d8d9c3a606fb0.png?x-oss-process=image/format,webp',
    rarity: 'rare',
    wear: 0.25,
    category: 'weapon',
    dropRate: 0.1, // 10%
  },
  {
    id: '104',
    name: 'P90 | Rapid Rush',
    image:
      'https://igstatic.igxe.cn/steam/image/730/63daa5e9736f07e62222d76d28c87c78.png?x-oss-process=image/format,webp',
    rarity: 'uncommon',
    wear: 0.45,
    category: 'weapon',
    dropRate: 0.2, // 20%
  },
  {
    id: '105',
    name: 'R8 Revolver | Marble Fade',
    image:
      'https://igstatic.igxe.cn/steam/image/730/5e181311c5f449e33deb289f0fa9c5db.png?x-oss-process=image/format,webp',
    rarity: 'common',
    wear: 0.01,
    category: 'weapon',
    dropRate: 0.64, // 64%
  },
];

// 稀有度颜色映射
const RARITY_COLORS = {
  common: 'bg-gray-600 text-gray-300',
  uncommon: 'bg-green-800 text-green-400',
  rare: 'bg-blue-800 text-blue-400',
  epic: 'bg-purple-800 text-purple-400',
  legendary: 'bg-yellow-800 text-yellow-400',
};

// 稀有度边框映射
const RARITY_BORDERS = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

// 在BoxPage组件中修改开箱动画区域相关代码
export default function BoxPage() {
  // Add canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinItems, setSpinItems] = useState<typeof ITEMS>([]);
  const [wonItem, setWonItem] = useState<(typeof ITEMS)[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance] = useState(1000); // 用户余额

  // 生成开箱物品池
  const generateSpinItems = () => {
    // 创建一个包含物品的数组
    const pool: typeof ITEMS = [];

    // 为了让动画看起来更随机，我们生成30个随机物品
    for (let i = 0; i < 30; i++) {
      // 随机选择一个物品
      const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      pool.push(randomItem);
    }

    // 确保最后一个物品是根据掉落率随机选择的
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    let selectedItem = ITEMS[0];

    for (const item of ITEMS) {
      cumulativeProbability += item.dropRate;
      if (randomValue <= cumulativeProbability) {
        selectedItem = item;
        break;
      }
    }

    // 将选中的物品放在特定位置，确保它会被选中
    // 修改为中心位置，确保指针准确指向
    const winningPosition = 25; // 这个位置会在动画结束时居中
    pool[winningPosition] = selectedItem;

    setWonItem(selectedItem);
    return pool;
  };

  // Add helper function for rarity colors
  const getRarityBackgroundColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#4b5563',
      uncommon: '#166534',
      rare: '#1e40af',
      epic: '#6b21a8',
      legendary: '#854d0e',
    };
    return colors[rarity] || colors.common;
  };

  // 添加获取边框颜色的辅助函数
  const getRarityBorderColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#4b5563',
      uncommon: '#16a34a',
      rare: '#2563eb',
      epic: '#9333ea',
      legendary: '#eab308',
    };
    return colors[rarity] || colors.common;
  };

  // Add animation cleanup effect inside the component
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Modify startBoxOpening to use canvas animation
  const startBoxOpening = () => {
    if (isOpening) return;

    const box = BOXES.find(b => b.id === selectedBox);
    if (!box) return;

    if (balance < box.price) {
      alert('Insufficient balance to open the box!');
      return;
    }

    setBalance(prev => prev - box.price);
    setIsOpening(true);
    const items = generateSpinItems();
    setSpinItems(items);

    setTimeout(() => {
      setIsSpinning(true);
      const startTime = Date.now();

      const animate = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // 确保canvas尺寸与容器匹配
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        }

        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const duration = 8000;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数让动画更自然
        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

        // 应用缓动效果
        const easedProgress = easeOutQuart(progress);

        // Clear canvas with semi-transparent background
        ctx.fillStyle = 'rgba(10, 11, 23, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制背景渐变
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, 'rgba(10, 21, 37, 0.7)');
        bgGradient.addColorStop(1, 'rgba(10, 11, 23, 0.7)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 计算物品位置 - 增加物品尺寸
        const itemWidth = Math.min(180, canvas.width / 5);
        const itemHeight = itemWidth;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 修改这里的计算逻辑，确保动画结束时获奖物品正好在中心
        const winningPosition = 25; // 与generateSpinItems中的值保持一致

        // 计算总移动距离，确保获奖物品停在中心位置
        // 修改这里的计算方式
        const totalItems = items.length;
        const totalDistance = (totalItems - winningPosition) * itemWidth;
        const currentPosition = easedProgress * totalDistance;

        // 指针位置固定在中心
        const pointerX = centerX;

        // Draw items
        items.forEach((item, index) => {
          const baseX = centerX + index * itemWidth - currentPosition;
          const distanceFromCenter = Math.abs(baseX - pointerX);

          // 计算缩放和透明度 - 距离中心越近，越大越清晰
          const maxDistance = canvas.width / 2;
          const scale = 1 - Math.min(distanceFromCenter / maxDistance, 0.5);
          const alpha = Math.max(0.3, 1 - distanceFromCenter / maxDistance);

          // 计算实际绘制位置和大小
          const scaledWidth = itemWidth * scale;
          const scaledHeight = itemHeight * scale;
          const x = baseX - (scaledWidth - itemWidth) / 2;
          const y = centerY - scaledHeight / 2;

          // 高亮显示中心物品
          const isCenter = Math.abs(baseX - centerX) < itemWidth / 4;

          // 绘制物品卡片背景
          ctx.globalAlpha = alpha;

          // 绘制物品卡片边框 - 如果是中心物品则加粗边框
          const borderColor = getRarityBorderColor(item.rarity);
          ctx.fillStyle = borderColor;
          const borderWidth = isCenter ? 4 : 2;
          ctx.fillRect(x - borderWidth, y - borderWidth, scaledWidth + borderWidth * 2, scaledHeight + borderWidth * 2);

          // 绘制物品卡片
          ctx.fillStyle = getRarityBackgroundColor(item.rarity);
          ctx.fillRect(x, y, scaledWidth, scaledHeight);

          // 尝试加载并绘制图片
          const img = new Image();
          img.src = item.image;
          const iconSize = scaledWidth * 0.7;
          const iconX = x + (scaledWidth - iconSize) / 2;
          const iconY = y + 10 * scale;

          if (img.complete) {
            // 如果图片已加载完成，直接绘制
            ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
          } else {
            // 如果图片未加载完成，绘制占位符
            ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);

            // 添加图片加载事件
            img.onload = () => {
              if (animationRef.current) {
                // 图片加载完成后重新请求动画帧
                requestAnimationFrame(animate);
              }
            };
          }

          // 绘制物品名称
          ctx.fillStyle = '#ffffff';
          ctx.font = `${14 * scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(item.name, x + scaledWidth / 2, y + scaledHeight - 20 * scale);

          // 重置透明度
          ctx.globalAlpha = 1.0;
        });

        // 添加中央指示器 - 黄金分割线
        ctx.beginPath();
        ctx.moveTo(pointerX, 0);
        ctx.lineTo(pointerX, canvas.height);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 添加发光效果
        const gradient = ctx.createLinearGradient(pointerX - 20, 0, pointerX + 20, 0);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(pointerX - 20, 0, 40, canvas.height);

        // 添加更明显的指针标记
        // 顶部三角形
        ctx.beginPath();
        ctx.moveTo(pointerX, 10);
        ctx.lineTo(pointerX - 10, 30);
        ctx.lineTo(pointerX + 10, 30);
        ctx.closePath();
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // 底部三角形
        ctx.beginPath();
        ctx.moveTo(pointerX, canvas.height - 10);
        ctx.lineTo(pointerX - 10, canvas.height - 30);
        ctx.lineTo(pointerX + 10, canvas.height - 30);
        ctx.closePath();
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // 添加放大镜效果
        ctx.beginPath();
        ctx.arc(pointerX, centerY, 70, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 添加十字准星
        ctx.beginPath();
        ctx.moveTo(pointerX - 10, centerY);
        ctx.lineTo(pointerX + 10, centerY);
        ctx.moveTo(pointerX, centerY - 10);
        ctx.lineTo(pointerX, centerY + 10);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // 动画结束时，再次绘制一次，确保获奖物品居中并添加特效
          setTimeout(() => {
            if (canvas && ctx) {
              // 清空画布
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // 重新绘制背景
              ctx.fillStyle = 'rgba(10, 11, 23, 0.9)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // 只绘制获奖物品
              if (wonItem) {
                const x = centerX - itemWidth / 2;
                const y = centerY - itemHeight / 2;

                // 绘制发光效果
                ctx.shadowColor = getRarityBorderColor(wonItem.rarity);
                ctx.shadowBlur = 20;

                // 绘制边框
                ctx.fillStyle = getRarityBorderColor(wonItem.rarity);
                ctx.fillRect(x - 6, y - 6, itemWidth + 12, itemHeight + 12);

                // 绘制背景
                ctx.fillStyle = getRarityBackgroundColor(wonItem.rarity);
                ctx.fillRect(x, y, itemWidth, itemHeight);

                // 绘制图片
                const img = new Image();
                img.src = wonItem.image;
                const iconSize = itemWidth * 0.7;
                const iconX = x + (itemWidth - iconSize) / 2;
                const iconY = y + 10;

                if (img.complete) {
                  ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
                }

                // 绘制名称
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(wonItem.name, x + itemWidth / 2, y + itemHeight - 20);
              }
            }

            // 显示结果弹窗
            setIsSpinning(false);
            setShowResult(true);
            if (wonItem && (wonItem.rarity === 'epic' || wonItem.rarity === 'legendary')) {
              triggerConfetti();
            }
          }, 500);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, 500);
  };

  // 重置开箱状态
  const resetBoxOpening = () => {
    setIsOpening(false);
    setIsSpinning(false);
    setSpinItems([]);
    setWonItem(null);
    setShowResult(false);
  };

  // 播放获得稀有物品的特效
  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000; // 持续3秒

    // 在窗口中间位置发射彩带
    const colors =
      wonItem?.rarity === 'legendary'
        ? ['#FFD700', '#FFA500', '#FFFF00'] // 金色系
        : ['#800080', '#9370DB', '#BA55D3']; // 紫色系

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0.3, y: 0.5 },
        colors: colors,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 0.7, y: 0.5 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  return (
    <div className="bg-[#0a0b17] text-gray-200 min-h-screen">
      {/* 顶部导航栏 */}
      <header className="w-full py-3 px-6 flex justify-between items-center z-10 sticky top-0 bg-[#0a1525] border-b border-gray-800">
        <div className="text-xl font-bold text-yellow-300">NUMERON BOX</div>
        <div className="flex items-center space-x-4">
          <div className="text-yellow-400 font-medium">Balance: {balance} Diamonds</div>
          <Link href="/" className="text-gray-300 text-sm hover:text-yellow-300">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Open Weapon Box</h1>
          <p className="text-gray-400 text-sm mt-1">Try your luck! Open weapon boxes to get rare skins.</p>
        </div>

        {/* 主要内容区域 */}
        {!isOpening ? (
          <div>
            {/* 添加可能获得的物品展示 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Possible Items</h3>
              <div className="grid grid-cols-5 gap-2">
                {ITEMS.map(item => (
                  <div key={item.id} className="relative">
                    <div
                      className={`w-full aspect-[4/3] rounded-t-md ${RARITY_COLORS[item.rarity].split(' ')[0]} overflow-hidden`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {/* 添加图片 */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div
                      className={`w-full py-2 px-1 text-center text-xs ${
                        item.rarity === 'legendary'
                          ? 'bg-yellow-600'
                          : item.rarity === 'epic'
                            ? 'bg-purple-600'
                            : item.rarity === 'rare'
                              ? 'bg-blue-600'
                              : item.rarity === 'uncommon'
                                ? 'bg-green-600'
                                : 'bg-gray-600'
                      }`}
                    >
                      {item.name.split(' | ')[0]}
                      <div className="text-[10px] opacity-80">{item.name.split(' | ')[1] || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 箱子选择 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BOXES.map(box => (
                <div
                  key={box.id}
                  className={`bg-[#0a1525] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedBox === box.id
                      ? 'border-yellow-500 transform scale-105'
                      : 'border-gray-800 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedBox(box.id)}
                >
                  {/* 箱子图片 */}
                  <div
                    className="h-48 flex items-center justify-center p-4"
                    style={{ background: `linear-gradient(to bottom, ${box.backgroundColor}22, #0a1525)` }}
                  >
                    <div className="w-32 h-32 bg-gray-800 rounded-md flex items-center justify-center">
                      <Box size={64} className="text-gray-600" />
                    </div>
                  </div>

                  {/* 箱子信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1">{box.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{box.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold">{box.price} Diamonds</span>
                      <Button
                        className={`${
                          selectedBox === box.id
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedBox(box.id);
                          startBoxOpening();
                        }}
                        disabled={balance < box.price}
                      >
                        Open Box
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* 返回按钮 */}
            {!isSpinning && !showResult && (
              <Button
                variant="outline"
                className="mb-4 self-start border-gray-700 hover:bg-gray-800"
                onClick={resetBoxOpening}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Selection
              </Button>
            )}

            {/* 箱子名称 */}
            <h2 className="text-xl font-bold mb-6">{BOXES.find(b => b.id === selectedBox)?.name || 'Weapon Box'}</h2>

            {/* 开箱动画区域 - 增加高度和宽度 */}
            <div className="relative w-full max-w-5xl overflow-hidden rounded-md border border-gray-700">
              <canvas ref={canvasRef} width={1200} height={300} className="w-full h-[300px]" />
            </div>

            {/* 开箱按钮 */}
            {!isSpinning && !showResult && (
              <Button
                className="mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-2 text-lg"
                onClick={() => startBoxOpening()}
                disabled={isSpinning}
              >
                <span className="mr-2">🔑</span> Open
              </Button>
            )}

            {/* 开箱结果弹窗 - 修改结果展示 */}
            <Dialog open={showResult} onOpenChange={setShowResult}>
              <DialogContent className="bg-[#0a1525] border-gray-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="sr-only">Open Box Result</DialogTitle>
                </DialogHeader>
                <div className="absolute top-0 left-0 w-full h-12 bg-teal-500 flex items-center justify-center text-white font-bold">
                  You Won
                </div>

                {wonItem && (
                  <div className="flex flex-col items-center pt-12 pb-4">
                    <div
                      className={`w-full h-64 ${
                        wonItem.rarity === 'legendary'
                          ? 'bg-yellow-900/30'
                          : wonItem.rarity === 'epic'
                            ? 'bg-purple-900/30'
                            : wonItem.rarity === 'rare'
                              ? 'bg-blue-900/30'
                              : wonItem.rarity === 'uncommon'
                                ? 'bg-green-900/30'
                                : 'bg-gray-900/30'
                      } flex items-center justify-center`}
                    >
                      {/* 武器图片 */}
                      <img src={wonItem.image} alt={wonItem.name} className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="w-full text-center mt-4 text-2xl font-bold">
                      {wonItem.name.split(' | ')[0]} |{' '}
                      <span className="text-yellow-400">{wonItem.name.split(' | ')[1] || ''}</span>
                    </div>

                    <div className="mt-2 text-gray-400">
                      Reference Price: <span className="text-yellow-400">¥ {(Math.random() * 100).toFixed(2)}</span>
                    </div>

                    <div className="mt-4 flex space-x-4">
                      <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                        View on IGXE
                      </Button>
                      <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => setShowResult(false)}>
                        OK
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
