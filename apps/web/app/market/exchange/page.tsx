'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, X, Plus, ShoppingCart, ArrowRight, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog';
import { Badge } from '@workspace/ui/components/badge';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';

// 模拟用户库存数据
const MOCK_INVENTORY = [
  {
    id: '101',
    name: '火焰剑',
    image: '/assets/images/items/fire_sword.png',
    rarity: 'legendary',
    wear: 0.03,
    category: 'weapon',
  },
  {
    id: '102',
    name: '寒冰护甲',
    image: '/assets/images/items/ice_armor.png',
    rarity: 'epic',
    wear: 0.12,
    category: 'armor',
  },
  {
    id: '103',
    name: '闪电法杖',
    image: '/assets/images/items/lightning_staff.png',
    rarity: 'rare',
    wear: 0.25,
    category: 'weapon',
  },
  {
    id: '104',
    name: '风之靴',
    image: '/assets/images/items/wind_boots.png',
    rarity: 'uncommon',
    wear: 0.45,
    category: 'accessory',
  },
  {
    id: '105',
    name: '生命药水',
    image: '/assets/images/items/health_potion.png',
    rarity: 'common',
    wear: 0.01,
    category: 'consumable',
    quantity: 5,
  },
];

// 模拟可交换物品数据
const MOCK_AVAILABLE_ITEMS = [
  {
    id: '201',
    name: 'Dragon Bone Sword',
    image: '/assets/images/items/dragon_sword.png',
    rarity: 'legendary',
    wear: 0.05,
    category: 'weapon',
    owner: 'Player123',
    price: 1200,
  },
  {
    id: '202',
    name: 'Magic Amulet',
    image: '/assets/images/items/magic_amulet.png',
    rarity: 'epic',
    wear: 0.08,
    category: 'accessory',
    owner: 'Player456',
    price: 850,
  },
  {
    id: '203',
    name: 'Shadow Cloak',
    image: '/assets/images/items/shadow_cloak.png',
    rarity: 'rare',
    wear: 0.15,
    category: 'armor',
    owner: 'Player789',
    price: 600,
  },
  // ... 更多物品
];

// 稀有度颜色映射
const RARITY_COLORS = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

// 主题色定义
const THEME = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-yellow-500 hover:bg-yellow-600',
  accent: 'bg-purple-600 hover:bg-purple-700',
  danger: 'bg-red-600 hover:bg-red-700',
  background: {
    dark: 'bg-[#0a0b17]',
    panel: 'bg-[#0a1525]',
    input: 'bg-[#0a0b17]'
  },
  border: {
    default: 'border-gray-800',
    light: 'border-gray-700',
    highlight: 'border-blue-500'
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400', 
    highlight: 'text-yellow-400',
    onColor: 'text-white'
  },
  status: {
    active: 'text-green-400 border-green-400',
    expired: 'text-red-400 border-red-400'
  }
};

export default function ExchangePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([]);
  const [selectedTargetItem, setSelectedTargetItem] = useState<string | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [createOrderPrice, setCreateOrderPrice] = useState('');
  const [createOrderPeriod, setCreateOrderPeriod] = useState('24');
  const [exchangeMessage, setExchangeMessage] = useState('');
  
  // 筛选库存物品
  const filteredInventory = MOCK_INVENTORY.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
      return false;
    }
    return true;
  });

  // 处理物品选择
  const handleInventoryItemSelect = (itemId: string) => {
    setSelectedInventoryItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  // 处理交换请求
  const handleExchangeRequest = () => {
    if (!selectedTargetItem || selectedInventoryItems.length === 0) {
      alert('Please select an item to exchange!');
      return;
    }

    // 这里应该调用合约的exchange_request函数
    console.log('Creating exchange request', {
      offeredItems: selectedInventoryItems,
      targetItem: selectedTargetItem,
      message: exchangeMessage
    });

    // 显示成功消息
    alert('Exchange request sent successfully!');
    
    // 重置选择
    setSelectedInventoryItems([]);
    setSelectedTargetItem(null);
    setExchangeMessage('');
    setIsExchangeDialogOpen(false);
  };

  // 处理直接购买
  const handlePurchase = () => {
    if (!selectedTargetItem) {
      alert('Please select an item to buy!');
      return;
    }

    const targetItem = MOCK_AVAILABLE_ITEMS.find(item => item.id === selectedTargetItem);
    if (!targetItem) return;

    // 这里应该调用合约的purchase函数
    console.log('Purchasing item', {
      itemId: selectedTargetItem,
      price: targetItem.price
    });

    // 显示成功消息
    alert('Purchase successful!');
    
    // 重置选择
    setSelectedTargetItem(null);
    setIsPurchaseDialogOpen(false);
  };

  // 处理创建出售订单
  const handleCreateOrder = () => {
    if (selectedInventoryItems.length === 0) {
      alert('Please select items to sell!');
      return;
    }

    if (!createOrderPrice || parseInt(createOrderPrice) <= 0) {
      alert('Please enter a valid price!');
      return;
    }

    // 这里应该调用合约的create_order函数
    console.log('Creating sell order', {
      selectedItems: selectedInventoryItems,
      price: createOrderPrice,
      period: createOrderPeriod
    });
    
    // 重置选择
    setSelectedInventoryItems([]);
    setCreateOrderPrice('');
    setCreateOrderPeriod('24');
    setIsCreateOrderOpen(false);
    
    // 显示成功消息
    alert('Order created successfully!');
  };

  const getSelectedTargetItem = () => {
    return MOCK_AVAILABLE_ITEMS.find(item => item.id === selectedTargetItem);
  };

  return (
    <div className={`${THEME.background.dark} ${THEME.text.primary} min-h-screen`}>
      {/* 顶部导航栏 */}
      <header className={`w-full py-3 px-6 flex justify-between items-center z-10 sticky top-0 ${THEME.background.panel} border-b ${THEME.border.default}`}>
        <div className="text-xl font-bold text-yellow-400">NUMERON EXCHANGE</div>
        <div className="flex items-center space-x-4">
          <Link href="/market" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            Back to Market
          </Link>
          <Link href="/market/my-orders" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            My Orders
          </Link>
          <Link href="/" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Item Exchange</h1>
          <p className={`${THEME.text.muted} text-sm mt-1`}>Select the item you want to exchange</p>
        </div>

        {/* 创建交换订单按钮 */}
        <div className="mb-6 flex justify-end">
          <Button className={`${THEME.secondary} ${THEME.text.onColor}`} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Create Sell Order
          </Button>
        </div>

        {/* 主要内容区域 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧 - 我的库存 */}
          <div className="w-full lg:w-1/2">
            <div className={`${THEME.background.panel} rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-yellow-400">My Inventory</h2>
                
                {selectedInventoryItems.length > 0 && (
                  <div className="flex space-x-2">
                    <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className={`${THEME.secondary} ${THEME.text.onColor}`}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Sell Items
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                        <DialogHeader>
                          <DialogTitle>Create Sell Order</DialogTitle>
                          <DialogDescription className={THEME.text.muted}>
                            You are selling {selectedInventoryItems.length} items. Please set the price and duration.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                              Price (Diamonds)
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              value={createOrderPrice}
                              onChange={(e) => setCreateOrderPrice(e.target.value)}
                              className={`col-span-3 ${THEME.background.input} ${THEME.border.light} text-white !text-white`}
                              style={{ color: 'white' }}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="period" className="text-right">
                              Duration (Hours)
                            </Label>
                            <Select value={createOrderPeriod} onValueChange={setCreateOrderPeriod}>
                              <SelectTrigger className={`col-span-3 ${THEME.background.input} ${THEME.border.light}`}>
                                <SelectValue placeholder="Select Duration" />
                              </SelectTrigger>
                              <SelectContent className={`${THEME.background.panel} ${THEME.border.light} text-white`}>
                                <SelectItem value="1" className="text-white">1 Hour</SelectItem>
                                <SelectItem value="6" className="text-white">6 Hours</SelectItem>
                                <SelectItem value="12" className="text-white">12 Hours</SelectItem>
                                <SelectItem value="24" className="text-white">24 Hours</SelectItem>
                                <SelectItem value="48" className="text-white">48 Hours</SelectItem>
                                <SelectItem value="72" className="text-white">72 Hours</SelectItem>
                                <SelectItem value="168" className="text-white">7 Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateOrderOpen(false)}
                            className={`${THEME.border.light} hover:bg-gray-800 mr-2`}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className={THEME.primary} 
                            onClick={handleCreateOrder}
                          >
                            Confirm Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              
              {/* 筛选器 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input 
                  placeholder="Search item..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${THEME.background.input} ${THEME.border.light}`}
                />
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className={`${THEME.background.input} ${THEME.border.light}`}>
                    <SelectValue placeholder="Item Type" />
                  </SelectTrigger>
                  <SelectContent className={`${THEME.background.panel} ${THEME.border.light} text-white`}>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="weapon">Weapon</SelectItem>
                    <SelectItem value="armor">Armor</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                    <SelectItem value="consumable">Consumable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 库存物品列表 */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredInventory.map((item) => (
                  <div 
                    key={item.id}
                    className={`${THEME.background.input} p-3 rounded-md flex items-center border ${
                      selectedInventoryItems.includes(item.id)
                        ? 'border-blue-500'
                        : THEME.border.light
                    }`}
                  >
                    <Checkbox
                      checked={selectedInventoryItems.includes(item.id)}
                      onCheckedChange={() => handleInventoryItemSelect(item.id)}
                      className="mr-3"
                    />
                    <div className="w-10 h-10 bg-gray-800 rounded-md mr-3"></div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${RARITY_COLORS[item.rarity]}`}>
                        {item.name}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        Wear: {item.wear.toFixed(2)} | {
                          {
                            'weapon': 'Weapon',
                            'armor': 'Armor',
                            'accessory': 'Accessory',
                            'consumable': 'Consumable'
                          }[item.category]
                        }
                      </div>
                    </div>
                  </div>
                ))}

                {filteredInventory.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No items found that match the criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 - 目标物品 */}
          <div className="w-full lg:w-1/2">
            <div className={`${THEME.background.panel} rounded-lg p-4`}>
              <h2 className="font-bold mb-4 text-yellow-400">Select Target Item</h2>
              
              {/* 目标物品搜索 */}
              <div className="mb-4">
                <Input 
                  placeholder="Search for item to exchange..." 
                  className={`${THEME.background.input} ${THEME.border.light}`}
                />
              </div>

              {/* 可用物品列表 */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {MOCK_AVAILABLE_ITEMS.map((item) => (
                  <div 
                    key={item.id}
                    className={`${THEME.background.input} p-3 rounded-md flex items-center border cursor-pointer ${
                      selectedTargetItem === item.id
                        ? 'border-blue-500'
                        : `${THEME.border.light} hover:border-gray-600`
                    }`}
                    onClick={() => setSelectedTargetItem(item.id)}
                  >
                    <div className="w-10 h-10 bg-gray-800 rounded-md mr-3"></div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${RARITY_COLORS[item.rarity]}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Wear: {item.wear.toFixed(2)} | {
                          {
                            'weapon': 'Weapon',
                            'armor': 'Armor',
                            'accessory': 'Accessory',
                            'consumable': 'Consumable'
                          }[item.category]
                        }
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-400">
                          Owner: {item.owner}
                        </div>
                        <div className="text-yellow-400 text-sm font-medium">
                          {item.price} Diamonds
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮区域 */}
            {selectedTargetItem && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className={THEME.primary}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> Buy Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                    <DialogHeader>
                      <DialogTitle>Confirm Purchase</DialogTitle>
                      <DialogDescription className={THEME.text.muted}>
                        You are about to purchase the following item. Please confirm payment information.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {getSelectedTargetItem() && (
                      <div className={`my-4 p-3 rounded-md ${THEME.background.input} border ${THEME.border.light}`}>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-800 rounded-md mr-3"></div>
                          <div>
                            <div className={`font-medium ${
                              RARITY_COLORS[getSelectedTargetItem()!.rarity]
                            }`}>
                              {getSelectedTargetItem()!.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              Wear: {getSelectedTargetItem()!.wear.toFixed(2)} | {
                                {
                                  'weapon': 'Weapon',
                                  'armor': 'Armor',
                                  'accessory': 'Accessory',
                                  'consumable': 'Consumable'
                                }[getSelectedTargetItem()!.category]
                              }
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Owner: {getSelectedTargetItem()!.owner}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className={`${THEME.background.input} p-3 rounded-md border ${THEME.border.light} my-4`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Payment Amount:</span>
                        <span className="text-yellow-400 font-medium text-lg">
                          {getSelectedTargetItem()?.price || 0} Diamonds
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-400">Your Balance:</span>
                        <span className="text-white">2000 Diamonds</span>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsPurchaseDialogOpen(false)}
                        className={`${THEME.border.light} hover:bg-gray-800 mr-2`}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className={THEME.primary}
                        onClick={handlePurchase}
                      >
                        <CreditCard className="mr-2 h-4 w-4" /> Confirm Payment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isExchangeDialogOpen} onOpenChange={setIsExchangeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className={`${THEME.secondary} ${THEME.text.onColor} disabled:opacity-50`}
                      disabled={selectedInventoryItems.length === 0}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" /> Initiate Exchange
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                    <DialogHeader>
                      <DialogTitle>Confirm Exchange Request</DialogTitle>
                      <DialogDescription className={THEME.text.muted}>
                        You are using {selectedInventoryItems.length} items to exchange for the following item
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="my-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2 text-gray-300">You will receive:</h3>
                        {getSelectedTargetItem() && (
                          <div className={`p-3 rounded-md ${THEME.background.input} border ${THEME.border.light}`}>
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-800 rounded-md mr-3"></div>
                              <div>
                                <div className={`font-medium ${
                                  RARITY_COLORS[getSelectedTargetItem()!.rarity]
                                }`}>
                                  {getSelectedTargetItem()!.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Wear: {getSelectedTargetItem()!.wear.toFixed(2)} | {
                                    {
                                      'weapon': 'Weapon',
                                      'armor': 'Armor',
                                      'accessory': 'Accessory',
                                      'consumable': 'Consumable'
                                    }[getSelectedTargetItem()!.category]
                                  }
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Owner: {getSelectedTargetItem()!.owner}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2 text-gray-300">You will give:</h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {selectedInventoryItems.map(itemId => {
                            const item = MOCK_INVENTORY.find(i => i.id === itemId);
                            if (!item) return null;
                            
                            return (
                              <div key={item.id} className={`p-3 rounded-md ${THEME.background.input} border ${THEME.border.light}`}>
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gray-800 rounded-md mr-3"></div>
                                  <div>
                                    <div className={`text-sm font-medium ${RARITY_COLORS[item.rarity]}`}>
                                      {item.name}
                                      {item.quantity > 1 && ` x${item.quantity}`}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Wear: {item.wear.toFixed(2)} | {
                                        {
                                          'weapon': 'Weapon',
                                          'armor': 'Armor',
                                          'accessory': 'Accessory',
                                          'consumable': 'Consumable'
                                        }[item.category]
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="exchange-message" className="text-sm font-medium text-gray-300 mb-2 block">
                          Message (optional):
                        </Label>
                        <Textarea
                          id="exchange-message"
                          placeholder="Leave a message for the other party..."
                          className={`${THEME.background.input} ${THEME.border.light} resize-none`}
                          value={exchangeMessage}
                          onChange={(e) => setExchangeMessage(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsExchangeDialogOpen(false)}
                        className={`${THEME.border.light} hover:bg-gray-800 mr-2`}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className={THEME.secondary}
                        onClick={handleExchangeRequest}
                      >
                        Confirm Exchange Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className={`w-full py-4 px-6 ${THEME.background.panel} mt-12 border-t ${THEME.border.default}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <div className="text-lg font-bold text-yellow-400">NUMERON EXCHANGE</div>
            <div className="text-xs text-gray-400 mt-1">© 2023 Numeron World Deck</div>
          </div>
          
          <div className="text-xs text-gray-400">
            Available Items: {MOCK_AVAILABLE_ITEMS.length} | My Inventory: {MOCK_INVENTORY.length}
          </div>
        </div>
      </footer>
    </div>
  );
}