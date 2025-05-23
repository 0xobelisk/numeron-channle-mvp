'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Crown, Trophy, Medal, Award, Star, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// 排行榜类型定义
type RankingType = 'gold' | 'diamond' | 'battle' | 'transaction' | 'spirit' | 'god';

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
  }
};

// 排行榜条件定义
const RANKING_CONDITIONS = {
  gold: {
    name: 'Gold Collector',
    icon: <Crown className="h-5 w-5 text-yellow-400" />,
    conditions: ['Participate with at least 100,000 Gold'],
    description: 'Players with a large amount of gold',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
  },
  diamond: {
    name: 'Diamond Tycoon',
    icon: <Trophy className="h-5 w-5 text-blue-400" />,
    conditions: ['Participate with at least 10,000 Diamonds'],
    description: 'Players with a large amount of diamonds',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
  },
  battle: {
    name: 'Battle Maniac',
    icon: <Medal className="h-5 w-5 text-red-400" />,
    conditions: ['Participate in more than 1,000 battles'],
    description: 'Players who participate in many battles',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
  },
  transaction: {
    name: 'Transaction King',
    icon: <Award className="h-5 w-5 text-purple-400" />,
    conditions: ['1,000,000 blockchain transactions'],
    description: 'Players who make many transactions',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
  },
  spirit: {
    name: 'Spirit King',
    icon: <Star className="h-5 w-5 text-green-400" />,
    conditions: ['Own more than 100 spirits'],
    description: 'Players who collect many spirits',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
  },
  god: {
    name: 'God Slayer',
    icon: <Star className="h-5 w-5 text-orange-400" />,
    conditions: ['Defeat 1,000 spirits'],
    description: 'Players who defeat many spirits',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
  },
};

// 模拟排行榜数据
const generateMockRankingData = (type: RankingType) => {
  const data = [];
  const valueRange = type === 'gold' ? [100000, 500000] :
                    type === 'diamond' ? [10000, 50000] :
                    type === 'battle' ? [1000, 5000] :
                    type === 'transaction' ? [1000000, 5000000] :
                    type === 'spirit' ? [100, 500] :
                    [1000, 5000];
  
  // 生成50个随机玩家数据，增加数据量以便分页
  for (let i = 0; i < 50; i++) {
    const value = Math.floor(Math.random() * (valueRange[1] - valueRange[0])) + valueRange[0];
    data.push({
      rank: i + 1,
      username: `Player${1000 + i}`,
      avatar: `/assets/avatars/avatar${(i % 10) + 1}.png`,
      value: value,
      reward: i < 3 ? (3 - i) * 1000 : i < 10 ? 100 : 0, // 前三名有额外奖励
    });
  }
  
  // 按值排序
  return data.sort((a, b) => b.value - a.value);
};

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<RankingType>('gold');
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 每页显示10条数据
  
  // 确保页面可以滚动
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  // 当选项卡变化时更新排行榜数据
  useEffect(() => {
    setRankingData(generateMockRankingData(activeTab));
    setCurrentPage(1); // 切换标签时重置为第一页
  }, [activeTab]);
  
  // 获取当前排行榜的单位
  const getValueUnit = () => {
    switch (activeTab) {
      case 'gold': return 'Gold';
      case 'diamond': return 'Diamonds';
      case 'battle': return 'Battles';
      case 'transaction': return 'Transactions';
      case 'spirit': return 'Spirits';
      case 'god': return 'Kills';
      default: return '';
    }
  };
  
  // 计算总页数
  const totalPages = Math.ceil(rankingData.length / itemsPerPage);
  
  // 获取当前页的数据
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return rankingData.slice(startIndex, endIndex);
  };
  
  // 页面导航函数
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 滚动到表格顶部
      document.querySelector('.ranking-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="bg-[#0a0b17] text-gray-200" style={{ height: 'auto', minHeight: '100vh', overflowY: 'visible' }}>
      {/* 顶部导航栏 */}
      <header className="w-full py-3 px-6 flex justify-between items-center z-10 sticky top-0 bg-[#0a1525] border-b border-gray-800">
        <div className="text-xl font-bold text-yellow-300">NUMERON RANKING</div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-300 text-sm hover:text-yellow-300">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ranking</h1>
            <p className="text-gray-400 text-sm mt-1">View the top players in the game</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
        
        {/* 排行榜选项卡 */}
        <Tabs defaultValue="gold" value={activeTab} onValueChange={(value) => setActiveTab(value as RankingType)} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 bg-[#0a1525] border border-gray-800 rounded-lg p-1">
            {Object.entries(RANKING_CONDITIONS).map(([key, condition]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className={`data-[state=active]:${condition.bgColor} data-[state=active]:${condition.color}`}
              >
                <div className="flex items-center">
                  {condition.icon}
                  <span className="ml-2 hidden md:inline">{condition.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* 排行榜内容 */}
          {Object.keys(RANKING_CONDITIONS).map((key) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className={`p-4 rounded-lg mb-6 ${RANKING_CONDITIONS[key as RankingType].bgColor} border border-gray-800`}>
                <div className="flex items-center">
                  {RANKING_CONDITIONS[key as RankingType].icon}
                  <h2 className={`text-xl font-bold ml-2 ${RANKING_CONDITIONS[key as RankingType].color}`}>
                    {RANKING_CONDITIONS[key as RankingType].name}
                  </h2>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <p>Participation Condition: {RANKING_CONDITIONS[key as RankingType].conditions.join(', ')}</p>
                  <p className="mt-1">Top 10 periodically receive NUM Token rewards</p>
                </div>
              </div>
              
              {/* 排行榜表格 */}
              <div className="bg-[#0a1525] rounded-lg border border-gray-800 overflow-hidden ranking-table">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-800/50">
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">
                        {activeTab === 'gold' ? 'Gold' : 
                         activeTab === 'diamond' ? 'Diamonds' : 
                         activeTab === 'battle' ? 'Battles' : 
                         activeTab === 'transaction' ? 'Transactions' : 
                         activeTab === 'spirit' ? 'Spirits' : 
                         'Kills'}
                      </TableHead>
                      <TableHead className="text-right">Reward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData().map((player) => (
                      <TableRow key={player.rank} className="hover:bg-gray-800/50">
                        <TableCell className="font-medium text-center">
                          {player.rank <= 3 ? (
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                              ${player.rank === 1 ? 'bg-yellow-500' : 
                                player.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'} ${THEME.text.onColor} font-bold`}>
                              {player.rank}
                            </div>
                          ) : player.rank}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-700 rounded-full mr-2"></div>
                            <span>{player.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {player.value.toLocaleString()} {getValueUnit()}
                        </TableCell>
                        <TableCell className="text-right">
                          {player.reward > 0 ? (
                            <span className="text-yellow-400">{player.reward} NUM</span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-2">
                  <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, rankingData.length)} of {rankingData.length} entries
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* 页码按钮 */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // 显示当前页附近的页码
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className={currentPage === pageNum 
                              ? `bg-yellow-500 ${THEME.text.onColor} hover:bg-yellow-600` 
                              : "border-gray-700 hover:bg-gray-800"}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* 页脚 */}
      <footer className="w-full py-6 px-6 bg-[#0a1525] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <div className="text-lg font-bold text-yellow-300">NUMERON</div>
            <div className="text-xs text-gray-400 mt-1">© 2023 Numeron World Deck</div>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}