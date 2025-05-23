'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { dataManager } from '@/game/utils/data-manager';
import { InventoryItem, ITEM_EFFECT, ItemCategory } from '@/game/types/typedef';
import { Dubhe, loadMetadata, Transaction } from '@0xobelisk/sui-client';
import { NETWORK, PACKAGE_ID, SCHEMA_ID } from 'contracts/deployment';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { DubheService } from '@/contexts/DubheService';

// 模拟用户库存数据
const MOCK_INVENTORY = [
  {
    id: '101',
    name: '火焰剑',
    image: '/assets/images/items/fire_sword.png',
    rarity: 'legendary',
    quantity: 1,
    wear: 0.03,
    category: 'weapon',
  },
  {
    id: '102',
    name: '寒冰护甲',
    image: '/assets/images/items/ice_armor.png',
    rarity: 'epic',
    quantity: 2,
    wear: 0.12,
    category: 'armor',
  },
  {
    id: '103',
    name: '闪电法杖',
    image: '/assets/images/items/lightning_staff.png',
    rarity: 'rare',
    quantity: 1,
    wear: 0.25,
    category: 'weapon',
  },
  {
    id: '104',
    name: '风之靴',
    image: '/assets/images/items/wind_boots.png',
    rarity: 'uncommon',
    quantity: 3,
    wear: 0.45,
    category: 'accessory',
  },
  {
    id: '105',
    name: '生命药水',
    image: '/assets/images/items/health_potion.png',
    rarity: 'common',
    quantity: 10,
    wear: 0.01,
    category: 'consumable',
  },
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
    input: 'bg-[#0a0b17]',
  },
  border: {
    default: 'border-gray-800',
    light: 'border-gray-700',
    highlight: 'border-blue-500',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    highlight: 'text-yellow-400',
    onColor: 'text-white', // 在彩色背景上使用的文字颜色
  },
};

// 移除这里的 useEffect 调用

// Add type definition for selected items
interface SelectedItem {
  id: string;
  quantity: number;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [createOrderPrice, setCreateOrderPrice] = useState('');
  const [createOrderPeriod, setCreateOrderPeriod] = useState('24');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 每页显示的物品数量
  // 添加库存数据状态
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    isConnected,
    // isUsingEnoki,
    address,
    // jwt,
    // emailAddress,
    // getAddressSeed,
  } = useCustomWallet();

  const getOwnedItems = async (): Promise<InventoryItem[]> => {
    const pageSize = 10;
    // const metadata = await loadMetadata(NETWORK, PACKAGE_ID);
    // 直接使用环境变量获取私钥
    // let PRIVATEKEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    let currentAddress: string | undefined;

    // const dubhe = new Dubhe({
    //   networkType: NETWORK,
    //   packageId: PACKAGE_ID,
    //   metadata: metadata,
    //   secretKey: NETWORK === 'localnet' ? PRIVATEKEY : undefined,
    // });
    const dubheService = new DubheService();

    currentAddress = dubheService.getWalletAddress();

    let balance = await dubheService.dubhe.getStorage({
      name: 'balance',
      key1: currentAddress,
      is_removed: false,
      first: pageSize,
    });

    let allBalanceData = [...balance.data];

    while (balance.pageInfo.hasNextPage) {
      const nextPage = await dubheService.dubhe.getStorage({
        name: 'balance',
        key1: currentAddress,
        is_removed: false,
        first: pageSize,
        after: balance.pageInfo.endCursor,
      });

      allBalanceData = [...allBalanceData, ...nextPage.data];
      balance = nextPage;
    }

    if (allBalanceData.length === 0) {
      return [];
    }
    console.log('allBalanceData', allBalanceData);
    const items: InventoryItem[] = await Promise.all(
      allBalanceData.map(async (balanceSchema: any) => {
        const item = await dubheService.dubhe.getStorageItem({
          name: 'item_metadata',
          key1: balanceSchema.key2.toString(),
        });
        console.log('balanceSchema', balanceSchema);
        console.log('item', item);
        return {
          item: {
            id: Number(balanceSchema.key2),
            name: item.value.name,
            description: item.value.description,
            isTransferable: item.value.is_transferable,
            category: Object.keys(item.value.item_type)[0] as ItemCategory,
            effect: ITEM_EFFECT.DEFAULT, // TODO: add effect
          },
          quantity: Number(balanceSchema.value),
        };
      }),
    );

    items.sort((a, b) => a.item.id - b.item.id);

    return items;
  };

  // 确保页面可以滚动 - 移动到组件内部
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // 获取真实库存数据
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const items = await getOwnedItems();

        // 在 useEffect 中修改数据转换逻辑
        const formattedItems = items.map(item => {
          return {
            id: item.item.id.toString(),
            name: item.item.name,
            image: `/assets/images/items/placeholder.png`,
            category: item.item.category.toLowerCase(),
            quantity: item.quantity,
            description: item.item.description,
            isTransferable: item.item.isTransferable,
          };
        });

        setInventory(formattedItems);
      } catch (error) {
        console.error('获取库存数据失败:', error);
        // 如果API调用失败，可以使用空数组或保留旧数据
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // 筛选物品 - 使用真实数据
  const filteredItems = inventory.filter(item => {
    // 搜索词筛选
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 类别筛选
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // 稀有度筛选
    if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
      return false;
    }

    return true;
  });

  // 排序物品
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'quantity-asc':
        return a.quantity - b.quantity;
      case 'quantity-desc':
        return b.quantity - a.quantity;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  // 计算总页数
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // 获取当前页的物品
  const currentItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 页面变化处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemSelect = (itemId: string) => {
    const existingItem = selectedItems.find(item => item.id === itemId);
    if (existingItem) {
      setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    } else {
      setSelectedItems([...selectedItems, { id: itemId, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  // 移除 MOCK_INVENTORY 和 RARITY_COLORS

  // 添加物品类型颜色映射
  // 修改物品类型颜色映射，增加对比度
  const ITEM_TYPE_COLORS = {
    currency: 'text-yellow-500',
    medicine: 'text-green-500',
    scroll: 'text-blue-500',
    ball: 'text-purple-500',
    treasure_chest: 'text-red-500',
    material: 'text-gray-300',
  };

  // 类型映射
  const CATEGORY_NAMES = {
    currency: 'Currency',
    medicine: 'Medicine',
    scroll: 'Scroll',
    ball: 'Ball',
    treasure_chest: 'Treasure Chest',
    material: 'Material',
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to sell!');
      return;
    }

    if (!createOrderPrice || parseInt(createOrderPrice) <= 0) {
      alert('Please enter a valid price!');
      return;
    }

    // Prepare parameters for create_trade_order
    const itemIds = selectedItems.map(item => BigInt(item.id));
    const itemQuantities = selectedItems.map(item => BigInt(item.quantity));
    const price = BigInt(createOrderPrice);
    const period = BigInt(parseInt(createOrderPeriod) * 60 * 60 * 1000); // Convert hours to milliseconds

    try {
      // TODO: Call the contract
      // const result = await createTradeOrder({
      //   itemIds,
      //   itemQuantities,
      //   price,
      //   period
      // });


      // const tx = new Transaction();
      // const dubheService = new DubheService();
      // const clock = tx.object("0x6");
      // const response = await dubheService.dubhe.tx.market_system.create_trade_order({
      //   tx,
      //   params: [
      //     SCHEMA_ID,
      //     SCHEMA_ID,
      //     itemIds,         // vector<u256>
      //     itemQuantities,  // vector<u256>
      //     price,           // u256
      //     clock,
      //     period,  
      //   ],
      //   isRaw: false, // optional, defaults to false
      //   onSuccess: async (result) => {
      //     // Handle successful transaction
      //     console.log("Transaction succeeded:", result.digest);
      //     await dubhe.waitForTransaction(result.digest);
      //   },
      //   onError: (error) => {
      //     // Handle transaction error
      //     console.error("Transaction failed:", error);
      //   },
      // });
      console.log('Creating order with parameters:', {
        itemIds: itemIds.map(id => id.toString()),
        itemQuantities: itemQuantities.map(qty => qty.toString()),
        price: price.toString(),
        period: period.toString(),
      });

      setSelectedItems([]);
      setCreateOrderPrice('');
      setCreateOrderPeriod('24');
      setIsCreateOrderOpen(false);

      alert('Order created successfully!');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  return (
    <div className={`${THEME.background.dark} ${THEME.text.primary} min-h-screen`}>
      {/* 顶部导航栏 */}
      <header
        className={`w-full py-3 px-6 flex justify-between items-center z-10 sticky top-0 ${THEME.background.panel} border-b ${THEME.border.default}`}
      >
        <div className="text-xl font-bold text-yellow-400">NUMERON MARKET</div>
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
        {/* 库存标题 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Inventory</h1>
            <p className={`${THEME.text.muted} text-sm mt-1`}>View and manage your in-game items</p>
          </div>

          {selectedItems.length > 0 && (
            <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
              <DialogTrigger asChild>
                <Button className={`${THEME.secondary} ${THEME.text.onColor}`}>
                  <Plus className="mr-2 h-4 w-4 text-white" /> Create Sell Order
                </Button>
              </DialogTrigger>
              <DialogContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                <DialogHeader>
                  <DialogTitle>Create Sell Order</DialogTitle>
                  <DialogDescription className={THEME.text.muted}>
                    You have selected {selectedItems.length} items to sell. Please set the price and duration.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right text-white">
                      Price (Diamonds)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={createOrderPrice}
                      onChange={e => setCreateOrderPrice(e.target.value)}
                      className={`col-span-3 ${THEME.background.input} ${THEME.border.light} text-white`}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="period" className="text-right text-white">
                      Duration (Hours)
                    </Label>
                    <Select value={createOrderPeriod} onValueChange={setCreateOrderPeriod}>
                      <SelectTrigger
                        className={`col-span-3 ${THEME.background.input} ${THEME.border.light} text-white`}
                      >
                        <SelectValue placeholder="Select Duration" />
                      </SelectTrigger>
                      <SelectContent className={`${THEME.background.panel} ${THEME.border.light} text-white`}>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                        <SelectItem value="72">72 hours</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 选择的物品预览 */}
                  <div className="mt-2">
                    <Label className="text-sm text-white font-medium mb-2 block">selected items:</Label>
                    <div
                      className={`max-h-[150px] overflow-y-auto space-y-2 mt-2 ${THEME.background.input} p-3 rounded-md border ${THEME.border.light}`}
                    >
                      {selectedItems.map(selectedItem => {
                        const inventoryItem = inventory.find(i => i.id === selectedItem.id);
                        if (!inventoryItem) return null;
                        
                        return (
                          <div key={selectedItem.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <div className="flex items-center">
                              <img 
                                src={inventoryItem.image} 
                                alt={inventoryItem.name} 
                                className="w-8 h-8 rounded mr-2"
                              />
                              <span>{inventoryItem.name}</span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={selectedItem.quantity}
                              onChange={(e) => handleQuantityChange(selectedItem.id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-gray-700 rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
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
                  <Button className={`${THEME.primary} text-white font-medium`} onClick={handleCreateOrder}>
                    Confirm Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 主要内容区域 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className={`w-full md:w-64 ${THEME.background.panel} rounded-lg p-4 h-fit`}>
            <h2 className="font-bold mb-4 text-yellow-400">Filters</h2>

            {/* 搜索框 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Search Item</label>
              <Input
                placeholder="输入物品名称..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`${THEME.background.input} ${THEME.border.light}`}
              />
            </div>

            {/* 物品类别 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className={`${THEME.background.input} ${THEME.border.light}`}>
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent className={`${THEME.background.panel} ${THEME.border.light} text-white`}>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="ball">Ball</SelectItem>
                  <SelectItem value="treasure_chest">Treasure Chest</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 重置筛选器 */}
            <Button
              variant="outline"
              className={`w-full mt-2 ${THEME.border.light} bg-gray-800`}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </Button>
          </div>

          {/* 右侧物品列表 */}
          <div className="flex-1">
            {/* 排序和视图控制 */}
            <div className={`flex justify-between items-center mb-4 ${THEME.background.panel} p-3 rounded-lg`}>
              <div className="flex items-center">
                <span className="text-sm mr-2">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={`${THEME.background.input} ${THEME.border.light} w-40`}>
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                    <SelectItem value="quantity-asc">数量 (低到高)</SelectItem>
                    <SelectItem value="quantity-desc">数量 (高到低)</SelectItem>
                    <SelectItem value="name-asc">名称 (A-Z)</SelectItem>
                    <SelectItem value="name-desc">名称 (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={`text-sm ${THEME.text.muted}`}>
                Showing {sortedItems.length} items | Selected {selectedItems.length}
              </div>
            </div>

            {/* 物品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentItems.map(item => {
                const isSelected = selectedItems.some(sel => sel.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative ${THEME.background.panel} rounded-lg overflow-hidden border transition-all cursor-pointer
                      ${isSelected ? 'border-blue-500 bg-blue-900/20' : `${THEME.border.default} hover:border-purple-500/30`}`}
                    onClick={() => handleItemSelect(item.id)}
                  >
                    {/* 物品图片 */}
                    <div className="h-40 bg-[#0a2040] relative flex items-center justify-center p-4">
                      <div className="w-24 h-24 bg-gray-800 rounded-md"></div>
                      {/* 勾选标记 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* 物品信息 */}
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-medium ${ITEM_TYPE_COLORS[item.category]}`}>{item.name}</h3>
                        <span className={THEME.text.muted + ' font-medium'}>x{item.quantity}</span>
                      </div>
                      <div className="flex flex-col space-y-1 text-xs text-gray-300">
                        <div className="truncate" title={item.description}>
                          Description: {item.description}
                        </div>
                        <div>Category: {CATEGORY_NAMES[item.category] || item.category}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`${THEME.border.light} hover:bg-gray-800 h-8 w-8 p-0`}
                  >
                    &lt;
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`h-8 w-8 p-0 ${
                        currentPage === page ? THEME.primary : `${THEME.border.light} hover:bg-gray-800`
                      }`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`${THEME.border.light} hover:bg-gray-800 h-8 w-8 p-0`}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {sortedItems.length === 0 && (
              <div className={`${THEME.background.panel} rounded-lg p-8 text-center`}>
                <div className={`${THEME.text.muted} mb-2`}>No items found</div>
                <Button
                  variant="outline"
                  className={`${THEME.border.light} hover:bg-gray-800`}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedRarity('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className={`w-full py-4 px-6 ${THEME.background.panel} mt-12 border-t ${THEME.border.default}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <div className="text-lg font-bold text-yellow-400">NUMERON MARKET</div>
            <div className="text-xs text-gray-400 mt-1">© 2023 Numeron World Deck</div>
          </div>

          <div className="text-xs text-gray-400">
            库存物品总数: {MOCK_INVENTORY.reduce((sum, item) => sum + item.quantity, 0)} | 稀有物品:{' '}
            {MOCK_INVENTORY.filter(item => item.rarity === 'legendary' || item.rarity === 'epic').length}
          </div>
        </div>
      </footer>
    </div>
  );
}
