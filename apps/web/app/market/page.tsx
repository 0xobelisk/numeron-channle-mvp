'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Slider } from '@workspace/ui/components/slider';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
// import { Checkbox } from '@workspace/ui/components/checkbox';
import { useState } from 'react';
import Link from 'next/link';
// import Image from 'next/image';
import { ExternalLink } from 'lucide-react'; // 添加外部链接图标

// Rarity color mapping
const RARITY_COLORS = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

// Theme color definition
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
    onColor: 'text-white' // Text color on colored backgrounds
  }
};

// Mock item data (all English)
const MOCK_ITEMS = [
  {
    id: '1',
    name: 'Fire Sword',
    image: '/assets/images/items/fire_sword.png',
    rarity: 'legendary',
    price: 1200,
    wear: 0.03,
    seller: '0x7a16fF8270133F063aAb6C9977183D9e72835428',
    category: 'weapon',
  },
  {
    id: '2',
    name: 'Ice Armor',
    image: '/assets/images/items/ice_armor.png',
    rarity: 'epic',
    price: 850,
    wear: 0.12,
    seller: '0x3F2e2afa7F5D0C1184c7f4a6D893f5C9AC6bA5D7',
    category: 'armor',
  },
  {
    id: '3',
    name: 'Lightning Staff',
    image: '/assets/images/items/lightning_staff.png',
    rarity: 'rare',
    price: 560,
    wear: 0.25,
    seller: '0x9B8E8c9F0e3a58384c0E6b3Fb9d7178e3C0F5D1A',
    category: 'weapon',
  },
  {
    id: '4',
    name: 'Wind Boots',
    image: '/assets/images/items/wind_boots.png',
    rarity: 'uncommon',
    price: 320,
    wear: 0.45,
    seller: '0x5F2e2afa7F5D0C1184c7f4a6D893f5C9AC6bA8E9',
    category: 'accessory',
  },
  {
    id: '5',
    name: 'Health Potion',
    image: '/assets/images/items/health_potion.png',
    rarity: 'common',
    price: 50,
    wear: 0.01,
    seller: '0x8A16fF8270133F063aAb6C9977183D9e72835B2C',
    category: 'consumable',
  },
  {
    id: '6',
    name: 'Dragon Shield',
    image: '/assets/images/items/dragon_shield.png',
    rarity: 'legendary',
    price: 1500,
    wear: 0.08,
    seller: '0xD4C0B0E1D5352D7c9B350F9B6B4fA6c5422D55a8',
    category: 'armor',
  },
  {
    id: '7',
    name: 'Invisibility Cloak',
    image: '/assets/images/items/invisibility_cloak.png',
    rarity: 'epic',
    price: 980,
    wear: 0.15,
    seller: '0x2B8E8c9F0e3a58384c0E6b3Fb9d7178e3C0F5E2B',
    category: 'accessory',
  },
  {
    id: '8',
    name: 'Magic Scroll',
    image: '/assets/images/items/magic_scroll.png',
    rarity: 'rare',
    price: 420,
    wear: 0.05,
    seller: '0xA1C0B0E1D5352D7c9B350F9B6B4fA6c5422D66F7',
    category: 'consumable',
  },
  {
    id: '9',
    name: 'Magic',
    image: '/assets/images/items/magic_scroll.png',
    rarity: 'rare',
    price: 420,
    wear: 0.05,
    seller: '0xA1C0B0E1D5352D7c9B350F9B6B4fA6c5422D66F7',
    category: 'consumable',
  },
];

export default function MarketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 每页显示的物品数量

  // 筛选物品
  const filteredItems = MOCK_ITEMS.filter(item => {
    // 搜索词筛选
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // 价格范围筛选
    if (item.price < priceRange[0] || item.price > priceRange[1]) {
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
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'wear-asc':
        return a.wear - b.wear;
      case 'wear-desc':
        return b.wear - a.wear;
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
  const currentItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          <Link href="/" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            Home
          </Link>
          <Link href="/market/inventory" className={`${THEME.text.secondary} text-sm hover:text-yellow-400`}>
            My Inventory
          </Link>
          <Link href="/market/my-orders" className={`${THEME.secondary} ${THEME.text.onColor} text-sm px-4 py-1 rounded-full font-medium`}>
            My Orders
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 市场标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Game Asset Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Trade your in-game items safely and easily</p>
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左侧筛选器 */}
          <div className="w-full md:w-64 bg-[#0a1525] rounded-lg p-4 h-fit">
            <h2 className="font-bold mb-4 text-yellow-300">Filters</h2>
            
            {/* 搜索框 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Search Item</label>
              <Input 
                placeholder="Enter item name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0a0b17] border-gray-700"
              />
            </div>
            
            {/* 价格范围 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Price Range</label>
              <div className="px-2">
                <Slider 
                  defaultValue={[0, 2000]} 
                  max={2000} 
                  step={10}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{priceRange[0]} Diamonds</span>
                  <span>{priceRange[1]} Diamonds</span>
                </div>
              </div>
            </div>
            
            {/* 物品类别 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-[#0a0b17] border-gray-700">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1525] border-gray-700">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="weapon">Weapon</SelectItem>
                  <SelectItem value="armor">Armor</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="consumable">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 稀有度 */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Rarity</label>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="bg-[#0a0b17] border-gray-700">
                  <SelectValue placeholder="Select Rarity" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1525] border-gray-700">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="common" className="text-gray-300">Common</SelectItem>
                  <SelectItem value="uncommon" className="text-green-400">Uncommon</SelectItem>
                  <SelectItem value="rare" className="text-blue-400">Rare</SelectItem>
                  <SelectItem value="epic" className="text-purple-400">Epic</SelectItem>
                  <SelectItem value="legendary" className="text-yellow-400">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 重置筛选器 */}
            <Button 
              variant="outline" 
              className="w-full mt-2 border-gray-700 hover:bg-gray-800"
              onClick={() => {
                setSearchTerm('');
                setPriceRange([0, 2000]);
                setSelectedCategory('all');
                setSelectedRarity('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
          
          {/* 右侧物品列表 */}
          <div className="flex-1">
            {/* 排序和视图控制 */}
            <div className="flex justify-between items-center mb-4 bg-[#0a1525] p-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm mr-2">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-[#0a0b17] border-gray-700 w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1525] border-gray-700">
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                    <SelectItem value="wear-asc">Wear (Low to High)</SelectItem>
                    <SelectItem value="wear-desc">Wear (High to Low)</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-gray-400">
                Showing {sortedItems.length} items
              </div>
            </div>
            
            {/* 物品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#0a1525] rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all"
                >
                  {/* 物品图片 */}
                  <div className="h-40 bg-[#0a2040] relative flex items-center justify-center p-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-md"></div>
                  </div>
                  
                  {/* 物品信息 */}
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-medium ${RARITY_COLORS[item.rarity]}`}>{item.name}</h3>
                      <span className="text-yellow-400 font-bold">{item.price} Diamonds</span>
                    </div>
                    
                    <div className="flex flex-col space-y-1 text-xs text-gray-400">
                      <div>Wear: {item.wear.toFixed(2)}</div>
                      <div className="flex items-center">
                        <span className="mr-1">Seller:</span>
                        <span className="truncate" title={item.seller}>
                          {item.seller.substring(0, 6)}...{item.seller.substring(item.seller.length - 4)}
                        </span>
                        <a 
                          href={`https://suiscan.xyz/testnet/account/${item.seller}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-400 hover:text-blue-300"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    
                    <Button className={`w-full mt-3 ${THEME.primary} text-sm`}>
                      Buy
                    </Button>
                  </div>
                </div>
              ))}
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
                    className="border-gray-700 hover:bg-gray-800 h-8 w-8 p-0"
                  >
                    &lt;
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`h-8 w-8 p-0 ${
                        currentPage === page 
                          ? `${THEME.secondary} ${THEME.text.onColor}` 
                          : `${THEME.border.light} hover:bg-gray-800`
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
                    className="border-gray-700 hover:bg-gray-800 h-8 w-8 p-0"
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}
            
            {/* 空状态 */}
            {sortedItems.length === 0 && (
              <div className="bg-[#0a1525] rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">No items found</div>
                <Button 
                  variant="outline" 
                  className="border-gray-700 hover:bg-gray-800"
                  onClick={() => {
                    setSearchTerm('');
                    setPriceRange([0, 2000]);
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
      <footer className="w-full py-4 px-6 bg-[#0a1525] mt-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <div className="text-lg font-bold text-yellow-300">NUMERON MARKET</div>
            <div className="text-xs text-gray-400 mt-1">© 2023 Numeron World Deck</div>
          </div>
          
          <div className="text-xs text-gray-400">
            Trading Fee: 5% | 24h Volume: 125,780 Diamonds | Online Players: 1,245
          </div>
        </div>
      </footer>
    </div>
  );
}