import { useState, useEffect, useRef } from 'react';
import { streamText, Message, tool } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DubheService } from '@/contexts/DubheService';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { z } from 'zod';

const tools = {
  getAddress: tool({
    description: '获取用户的地址',
    parameters: z.object({}),
    execute: async () => {
      console.log('--------- start getAddress ---------');
      const dubheService = new DubheService();
      const address = dubheService.getWalletAddress();
      console.log('address', address);
      console.log('--------- end getAddress ---------');
      return {
        address,
      };
    },
  }),
  balanceOf: tool({
    description: '获取用户的余额',
    parameters: z.object({
      address: z.string().describe('用户的sui地址'),
    }),
    execute: async () => {
      const dubheService = new DubheService();
      const balance = await dubheService.blanceOf();
      return {
        balance,
      };
    },
  }),
  getOwnedMonsters: tool({
    description: '获取用户拥有的所有数字生物',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const monsters = await dubheService.getOwnedMonsters();
      return {
        monsters,
      };
    },
  }),
  getPlayerPosition: tool({
    description: '获取用户当前的位置',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const position = await dubheService.getPlayerPosition();
      return {
        position,
      };
    },
  }),
  getOwnedItems: tool({
    description: '获取用户拥有的所有物品',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const items = await dubheService.getOwnedItems();
      return {
        items,
      };
    },
  }),
  craftItem: tool({
    description: '合成物品',
    parameters: z.object({
      itemId: z.string().describe('要合成的物品ID，必须是数字ID（如5、12、100），不能是物品名称'),
    }),
    execute: async ({ itemId }) => {
      try {
        const dubheService = new DubheService();
        await dubheService.craftItem(itemId);
        return {
          success: true,
          message: `成功开始合成物品 ${itemId}`,
        };
      } catch (error: any) {
        console.error('合成物品失败:', error);
        // 提取错误信息
        let errorMessage = '合成物品失败';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        if (error.details) {
          errorMessage += `\n详细信息: ${JSON.stringify(error.details, null, 2)}`;
        }
        return {
          success: false,
          message: errorMessage,
          error: error.toString(),
        };
      }
    },
  }),
  queryItemCraftPath: tool({
    description: '查询物品合成路径',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const craftPaths = await dubheService.queryItemCraftPath();
      return {
        craftPaths,
      };
    },
  }),
};

const deepseek = createDeepSeek({
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
});

const model = deepseek('deepseek-chat');

const SYSTEM_PROMPT = `你是一个专业的Numeron游戏助手。Numeron是一个在Sui区块链上运行的全链游戏，融合了类似Pokemon的收集、培养和对战元素。

重要规则：
1. 你只能回答与Numeron游戏直接相关的问题
2. 如果用户询问与游戏无关的内容，请礼貌地提醒用户："抱歉，我只能回答与Numeron游戏相关的问题。请问有什么关于游戏的问题我可以帮您解答吗？"
3. 禁止讨论政治、宗教、敏感话题等与游戏无关的内容
4. 如果用户试图进行与游戏无关的闲聊，请引导他们回到游戏话题

游戏背景：
在Numeron的世界中，玩家可以收集、培养独特的数字生物（称为Numerons）。每个Numeron都是链上的独特NFT，具有其独特的属性和能力。这个世界充满了神秘的数字力量，玩家通过探索、对战和交易来增强自己的Numeron团队。

当用户询问游戏相关信息时：
1. 耐心解释Numeron的游戏机制和玩法
2. 提供关于Numeron收集、培养和对战的建议
3. 解释链上操作的意义和方法

当用户询问物品合成相关问题时：
1. 使用getOwnedItems获取用户当前拥有的物品
2. 使用queryItemCraftPath获取可用的合成路径
3. 根据用户的物品数量和合成路径，判断是否可以合成
4. 如果可以合成，使用craftItem执行合成操作
5. 向用户解释合成结果和消耗的物品

合成系统说明：
- 每个合成路径都有输入物品、输入数量、输出物品和输出数量
- 合成需要消耗指定的输入物品
- 合成成功后可以获得对应的输出物品
- 如果物品数量不足，将无法进行合成

当用户询问他的地址时:
1. 使用getAddress函数获取用户的地址
2. 等待工具调用完成后，使用返回的地址生成回复："您的Sui地址是：[地址]"

当用户询问他的余额时:
1. 使用balanceOf函数获取用户的余额
2. 等待工具调用完成后，使用返回的余额生成回复："您当前的余额是：[余额] SUI"

游戏特色：
- 全链游戏：所有游戏数据和逻辑都在Sui区块链上
- 真实所有权：每个Numeron都是独特的NFT，由玩家真实拥有
- 数字属性：每个Numeron都有独特的数字特性，影响其战斗能力
- 链上对战：所有对战都在链上进行，确保公平性和透明度
- 社区驱动：玩家可以参与游戏的发展和决策

重要提示：
- 保持对话友好和专业
- 优先解答用户关于游戏机制的疑问
- 鼓励用户探索游戏的各个方面
- 提供有价值的游戏策略建议
- 解释每个操作的意义和影响
- 严格限制对话内容在游戏相关话题范围内
- 当用户偏离主题时，及时引导回游戏话题`;

// 生成唯一id的函数
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 自动滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: input, id: generateUniqueId() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const result = streamText({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT, id: 'system-1' }, ...messages, userMessage],
        maxSteps: 5,
        tools,
      });

      // 先插入一条空的 assistant 消息
      const assistantId = generateUniqueId();
      setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

      let responseText = '';
      for await (const textPart of result.textStream) {
        responseText += textPart;
        // 实时更新最后一条 assistant 消息
        setMessages(prev => prev.map(msg => (msg.id === assistantId ? { ...msg, content: responseText } : msg)));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '抱歉，发生了错误，请稍后重试。', id: generateUniqueId() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex h-[600px] max-w-5xl mx-auto p-4 gap-4">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-6">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-lg p-5 shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-blue-50 text-gray-800 border-2 border-blue-200'
                    : 'bg-green-50 text-gray-800 border-2 border-green-200'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ node, ...props }) => (
                        <div className="overflow-auto rounded-md bg-gray-900 p-4 my-2">
                          <pre {...props} className="text-sm text-gray-200" />
                        </div>
                      ),
                      code: ({ node, inline, className, children, ...props }: any) =>
                        inline ? (
                          <code {...props} className="bg-gray-200 rounded px-1 py-0.5">
                            {children}
                          </code>
                        ) : (
                          <code {...props} className="text-sm">
                            {children}
                          </code>
                        ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-t-2 border-gray-100 bg-white">
          <div className="flex gap-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="输入您的问题或指令..."
              className="flex-1 rounded-lg border-2 border-gray-300 p-4 text-lg placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              发送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
