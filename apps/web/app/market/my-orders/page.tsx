'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { Badge } from '@workspace/ui/components/badge';

// 模拟用户订单数据
const MOCK_ORDERS = [
  {
    id: '1001',
    items: [
      {
        id: '101',
        name: 'Fire Sword',
        image: '/assets/images/items/fire_sword.png',
        rarity: 'legendary',
        quantity: 1,
        wear: 0.03,
        category: 'weapon',
      }
    ],
    expectedItems: [
      {
        id: '0',
        name: 'Diamonds',
        quantity: 1200,
        category: 'currency',
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    expiredAt: Date.now() + 1000 * 60 * 60 * 19, // 19 hours later
  },
  {
    id: '1002',
    items: [
      {
        id: '102',
        name: 'Ice Armor',
        image: '/assets/images/items/ice_armor.png',
        rarity: 'epic',
        quantity: 1,
        wear: 0.12,
        category: 'armor',
      }
    ],
    expectedItems: [
      {
        id: '0',
        name: 'Diamonds',
        quantity: 850,
        category: 'currency',
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    expiredAt: Date.now() + 1000 * 60 * 60 * 24 * 5, // 5 days later
  },
  {
    id: '1003',
    items: [
      {
        id: '105',
        name: 'Health Potion',
        image: '/assets/images/items/health_potion.png',
        rarity: 'common',
        quantity: 5,
        wear: 0.01,
        category: 'consumable',
      }
    ],
    expectedItems: [
      {
        id: '0',
        name: 'Diamonds',
        quantity: 250,
        category: 'currency',
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    expiredAt: Date.now() + 1000 * 60 * 60 * 24 * 1, // 1 day later
  },
  {
    id: '1004',
    items: [
      {
        id: '103',
        name: 'Lightning Staff',
        image: '/assets/images/items/lightning_staff.png',
        rarity: 'rare',
        quantity: 1,
        wear: 0.25,
        category: 'weapon',
      },
      {
        id: '104',
        name: 'Wind Boots',
        image: '/assets/images/items/wind_boots.png',
        rarity: 'uncommon',
        quantity: 1,
        wear: 0.45,
        category: 'accessory',
      }
    ],
    expectedItems: [
      {
        id: '0',
        name: 'Diamonds',
        quantity: 880,
        category: 'currency',
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    expiredAt: Date.now() - 1000 * 60 * 60 * 12, // expired
  }
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
    onColor: 'text-white' // 在彩色背景上使用的文字颜色
  },
  status: {
    active: 'text-green-400 border-green-400',
    expired: 'text-red-400 border-red-400'
  }
};

export default function MyOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created-desc');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5; // 每页显示的订单数量

  // 筛选订单
  const filteredOrders = MOCK_ORDERS.filter(order => {
    // 搜索词筛选 (搜索物品名称)
    if (searchTerm) {
      const hasMatchingItem = order.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!hasMatchingItem) return false;
    }
    
    // 状态筛选
    const now = Date.now();
    if (selectedStatus === 'active' && order.expiredAt <= now) {
      return false;
    }
    if (selectedStatus === 'expired' && order.expiredAt > now) {
      return false;
    }
    
    return true;
  });
  
  // 排序订单
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'created-asc':
        return a.createdAt - b.createdAt;
      case 'created-desc':
        return b.createdAt - a.createdAt;
      case 'expired-asc':
        return a.expiredAt - b.expiredAt;
      case 'expired-desc':
        return b.expiredAt - a.expiredAt;
      case 'price-asc':
        return a.expectedItems[0].quantity - b.expectedItems[0].quantity;
      case 'price-desc':
        return b.expectedItems[0].quantity - a.expectedItems[0].quantity;
      default:
        return 0;
    }
  });

  const handleCancelOrder = () => {
    if (!orderToCancel) return;
    
    // 这里应该调用合约的cancel_order函数
    console.log('取消订单', orderToCancel);
    
    // 重置
    setOrderToCancel(null);
    setIsCancelDialogOpen(false);
    
    // 显示成功消息
    alert('Order cancelled!');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算剩余时间
  const getRemainingTime = (expiredAt: number) => {
    const now = Date.now();
    if (expiredAt <= now) return '已过期';
    
    const remainingMs = expiredAt - now;
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  // 计算总页数
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);
  
  // 获取当前页的订单
  const currentOrders = sortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // 页面变化处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`${THEME.background.dark} ${THEME.text.primary} min-h-screen`}>
      {/* 顶部导航栏 */}
      <header className={`w-full py-3 px-6 flex justify-between items-center z-10 sticky top-0 ${THEME.background.panel} border-b ${THEME.border.default}`}>
        <div className="text-xl font-bold text-yellow-400">NUMERON MARKET</div>
        <div className="flex items-center space-x-4">
          <Link href="/market" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            Back to Market
          </Link>
          <Link href="/market/inventory" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            My Inventory
          </Link>
          <Link href="/" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className={`${THEME.text.muted} text-sm mt-1`}>View and manage your created trade orders</p>
        </div>
        
        {/* 创建新订单按钮 */}
        <div className="mb-6 flex justify-end">
          <Link href="/market/inventory">
            <Button className={`${THEME.secondary} ${THEME.text.onColor}`}>
              <Plus className="mr-2 h-4 w-4" /> Create New Order
            </Button>
          </Link>
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左侧筛选器 */}
          <div className={`w-full md:w-64 ${THEME.background.panel} rounded-lg p-4 h-fit`}>
            <h2 className="font-bold mb-4 text-yellow-400">Filters</h2>
            
            {/* 搜索框 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Search Item</label>
              <Input 
                placeholder="Enter item name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${THEME.background.input} ${THEME.border.light}`}
              />
            </div>
            
            {/* 订单状态 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Order Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className={`${THEME.background.input} ${THEME.border.light}`}>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 排序方式 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={`${THEME.background.input} ${THEME.border.light}`}>
                  <SelectValue placeholder="Select Sort" />
                </SelectTrigger>
                <SelectContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                  <SelectItem value="created-desc">Created (Newest)</SelectItem>
                  <SelectItem value="created-asc">Created (Oldest)</SelectItem>
                  <SelectItem value="expired-asc">Expired (Earliest)</SelectItem>
                  <SelectItem value="expired-desc">Expired (Latest)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 重置筛选器 */}
            <Button 
              variant="outline" 
              className="w-full mt-2 border-gray-700 hover:bg-gray-800"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSortBy('created-desc');
              }}
            >
              Reset Filters
            </Button>
          </div>
          
          {/* 右侧订单列表 */}
          <div className="flex-1">
            {/* 统计信息 */}
            <div className={`flex justify-between items-center mb-4 ${THEME.background.panel} p-3 rounded-lg`}>
              <div className={`text-sm ${THEME.text.muted}`}>
                显示 {sortedOrders.length} 个订单 | 
                有效订单: {MOCK_ORDERS.filter(order => order.expiredAt > Date.now()).length} | 
                已过期: {MOCK_ORDERS.filter(order => order.expiredAt <= Date.now()).length}
              </div>
              
              <Link href="/market/inventory" className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
                <span className="mr-1">Create New Order</span>
                <ExternalLink size={14} />
              </Link>
            </div>
            
            {/* 订单列表 */}
            <div className="space-y-4">
              {sortedOrders.map((order) => {
                const isExpired = order.expiredAt <= Date.now();
                
                return (
                  <div 
                    key={order.id} 
                    className={`${THEME.background.panel} rounded-lg overflow-hidden border transition-all ${
                      isExpired ? THEME.border.light : `${THEME.border.default} hover:border-purple-500/30`
                    }`}
                  >
                    {/* 订单头部 */}
                    <div className={`${THEME.background.panel} p-3 border-b ${THEME.border.default} flex justify-between items-center`}>
                      <div className="flex items-center">
                        <span className={`${THEME.text.muted} text-sm mr-2`}>订单 #{order.id}</span>
                        {isExpired ? (
                          <Badge variant="outline" className={THEME.status.expired}>Expired</Badge>
                        ) : (
                          <Badge variant="outline" className={THEME.status.active}>Active</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs ${THEME.text.muted} flex items-center`}>
                          <Clock size={12} className="mr-1" />
                          {isExpired ? 'Expired' : `Remaining: ${getRemainingTime(order.expiredAt)}`}
                        </div>
                        
                        {!isExpired && (
                          <Dialog open={isCancelDialogOpen && orderToCancel === order.id} onOpenChange={(open) => {
                            setIsCancelDialogOpen(open);
                            if (!open) setOrderToCancel(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => {
                                  setOrderToCancel(order.id);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                <Trash2 size={14} className="mr-1" />
                                <span className="text-xs">Cancel</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className={`${THEME.background.panel} ${THEME.border.light}`}>
                              <DialogHeader>
                                <DialogTitle>Confirm Cancel Order</DialogTitle>
                                <DialogDescription className={THEME.text.muted}>
                                  Are you sure you want to cancel order #{order.id}? After cancellation, the items will be returned to your inventory.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <DialogFooter className="mt-4">
                                <Button 
                                  variant="outline" 
                                  className={`${THEME.border.light} hover:bg-gray-800 mr-2`}
                                  onClick={() => {
                                    setOrderToCancel(null);
                                    setIsCancelDialogOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  className={THEME.danger}
                                  onClick={handleCancelOrder}
                                >
                                  Confirm Cancel
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                    
                    {/* 订单内容 */}
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* 出售物品 */}
                        <div className="flex-1">
                          <h3 className="font-medium mb-2 text-yellow-400">Order Items</h3>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className={`${THEME.background.input} p-2 rounded-md flex items-center`}>
                                <div className="w-10 h-10 bg-gray-800 rounded-md mr-3"></div>
                                <div>
                                  <div className={`text-sm font-medium ${RARITY_COLORS[item.rarity]}`}>
                                    {item.name} {item.quantity > 1 && `x${item.quantity}`}
                                  </div>
                                  <div className={`text-xs ${THEME.text.muted}`}>
                                    磨损度: {item.wear.toFixed(2)} | {
                                      {
                                        'weapon': 'weapon',
                                        'armor': 'armor',
                                        'accessory': 'accessory',
                                        'consumable': 'consumable'
                                      }[item.category] || item.category
                                    }
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* 交换箭头 */}
                        <div className="flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full ${THEME.background.input} flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </div>
                        </div>
                        
                        {/* 期望物品 */}
                        <div className="flex-1">
                          <h3 className="font-medium mb-2 text-yellow-400">Expected Items</h3>
                          <div className="space-y-2">
                            {order.expectedItems.map((item, index) => (
                              <div key={index} className={`${THEME.background.input} p-2 rounded-md flex items-center`}>
                                {item.category === 'currency' ? (
                                  <>
                                    <div className="w-10 h-10 bg-yellow-900/30 rounded-md mr-3 flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                                        <path d="M12 18V6"></path>
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-yellow-400">
                                        {item.quantity} Diamonds
                                      </div>
                                      <div className={`text-xs ${THEME.text.muted}`}>
                                        Game currency
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-gray-800 rounded-md mr-3"></div>
                                    <div>
                                      <div className="text-sm font-medium">
                                        {item.name} {item.quantity > 1 && `x${item.quantity}`}
                                      </div>
                                      <div className={`text-xs ${THEME.text.muted}`}>
                                        {item.category}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* 订单信息 */}
                      <div className={`mt-4 pt-3 border-t ${THEME.border.default} text-xs ${THEME.text.muted} flex flex-wrap gap-x-4 gap-y-1`}>
                        <div>Created: {formatTime(order.createdAt)}</div>
                        <div>Expired: {formatTime(order.expiredAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 空状态 */}
            {sortedOrders.length === 0 && (
              <div className={`${THEME.background.panel} rounded-lg p-8 text-center`}>
                <div className={`${THEME.text.muted} mb-4`}>No orders found</div>
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    className={`${THEME.border.light} hover:bg-gray-800`}
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatus('all');
                      setSortBy('created-desc');
                    }}
                  >
                    Clear Filters
                  </Button>
                  
                  <Link href="/market/inventory">
                    <Button className={THEME.primary}>
                      Create New Order
                    </Button>
                  </Link>
                </div>
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
            Active Orders: {MOCK_ORDERS.filter(order => order.expiredAt > Date.now()).length} | Total Orders: {MOCK_ORDERS.length}
          </div>
        </div>
      </footer>
    </div>
  );
}