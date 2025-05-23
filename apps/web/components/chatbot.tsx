import { useState, useEffect, useRef } from 'react';
import { streamText, Message, tool } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DubheService } from '@/contexts/DubheService';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { z } from 'zod';

const tools = {
  getAddress: tool({
    description: 'Get user address',
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
    description: 'Get user balance',
    parameters: z.object({
      address: z.string().describe("User's sui address"),
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
    description: 'Get all digital creatures owned by the user',
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
    description: "Get user's current position",
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
    description: 'Get all items owned by the user',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const items = await dubheService.getOwnedItems();
      return {
        items,
      };
    },
  }),
  getItemMetadatas: tool({
    description: 'Get all item metadatas',
    parameters: z.object({}),
    execute: async () => {
      const dubheService = new DubheService();
      const itemMetadatas = await dubheService.itemMetadatas();
      return {
        itemMetadatas,
      };
    },
  }),
  craftItem: tool({
    description: 'Craft an item',
    parameters: z.object({
      itemId: z.string().describe('Item ID to craft, must be a numeric ID (e.g., 5, 12, 100), not an item name'),
    }),
    execute: async ({ itemId }) => {
      try {
        const dubheService = new DubheService();
        const result = await dubheService.craftItem(itemId);
        return {
          success: true,
          message: `Successfully started crafting item ${itemId}, Please check ${result.txUrl} on Sui Explorer`,
        };
      } catch (error: any) {
        console.error('Failed to craft item:', error);
        // Extract error message
        let errorMessage = 'Failed to craft item';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        if (error.details) {
          errorMessage += `\nDetails: ${JSON.stringify(error.details, null, 2)}`;
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
    description: 'Query item crafting paths',
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

const SYSTEM_PROMPT = `You are a professional Numeron game assistant. Numeron is a fully on-chain game running on the Sui blockchain, combining elements similar to Pokemon such as collection, training, and battling.

Important rules:
1. If users ask about content unrelated to the game, politely remind them: "Sorry, I can only answer questions related to the Numeron game. Is there anything about the game I can help you with?"
2. Discussion of politics, religion, sensitive topics, or other content unrelated to the game is prohibited
3. If users attempt to engage in casual conversation unrelated to the game, guide them back to game topics
4. **Whenever you need to display any item (in inventory, crafting paths, crafting results, etc.), you must first call getItemMetadatas to obtain all item metadata. For every itemId, find its corresponding itemName from the metadata, and always display as: **ItemName**(itemId). If itemName is missing, use **Unknown**(itemId). Never display only itemId or Item itemId.**
5. **IMPORTANT: Currently, only data query and item crafting features are supported. Battle features are NOT yet available. If users ask about battles, politely inform them that this feature is coming soon.**

Game background:
In the world of Numeron, players can collect and train unique digital creatures (called Numerons). Each Numeron is a unique NFT on the blockchain, with its own unique attributes and abilities. This world is filled with mysterious digital powers, and players enhance their Numeron teams through exploration, battles, and trading.

Current available features:
1. **Data Query**: Check wallet address, balance, owned monsters, items, and player position
2. **Item Crafting**: View crafting paths and craft items using available resources
3. **Game Information**: Learn about game mechanics and upcoming features

When users ask about game-related information:
1. Patiently explain Numeron's game mechanics and gameplay
2. Provide advice on Numeron collection and item crafting
3. Explain the significance and methods of on-chain operations
4. If users ask about battling, explain that this feature is still under development and not yet available

When users ask about item crafting:
1. Use getOwnedItems to get the items currently owned by the user
2. Use queryItemCraftPath to get available crafting paths
3. Determine if crafting is possible based on the user's item quantities and crafting paths
4. If crafting is possible, use craftItem to execute the crafting operation
5. Explain the crafting results and consumed items to the user

Crafting system explanation:
- Each crafting path has input items, input quantities, output items, and output quantities
- Crafting consumes specified input items
- Successful crafting yields corresponding output items
- If item quantities are insufficient, crafting will not be possible

When users ask about their address:
1. Use the getAddress function to get the user's address
2. After the tool call completes, use the returned address to generate a reply: "Your Sui address is: [address]"

When users ask about their balance:
1. Use the balanceOf function to get the user's balance
2. After the tool call completes, use the returned balance to generate a reply: "Your current balance is: [balance] SUI"

Game features:
- Fully on-chain game: All game data and logic are on the Sui blockchain
- True ownership: Each Numeron is a unique NFT, truly owned by players
- Digital attributes: Each Numeron has unique digital characteristics that will affect its future capabilities
- Item crafting: Players can craft various items that will be used in future gameplay
- Community-driven: Players can participate in the development and decision-making of the game

Important notes:
- Keep conversations friendly and professional
- Prioritize answering user questions about game mechanics
- Encourage users to explore available aspects of the game (data query and crafting)
- Provide valuable game strategy advice within the current feature set
- Explain the significance and impact of each operation
- Strictly limit conversation content to game-related topics
- When users ask about unavailable features like battles, politely inform them these features are coming soon
- When users deviate from the topic, promptly guide them back to game topics`;

// Function to generate unique id
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom
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
        maxSteps: 6,
        tools,
      });

      // Insert an empty assistant message first
      const assistantId = generateUniqueId();
      setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

      let responseText = '';
      for await (const textPart of result.textStream) {
        responseText += textPart;
        // Real-time update of the last assistant message
        setMessages(prev => prev.map(msg => (msg.id === assistantId ? { ...msg, content: responseText } : msg)));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again later.', id: generateUniqueId() },
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
                      h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold mt-4 mb-2" />,
                      h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-bold mt-3 mb-2" />,
                      h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-bold mt-3 mb-1" />,
                      h4: ({ node, ...props }) => <h4 {...props} className="text-base font-bold mt-2 mb-1" />,
                      h5: ({ node, ...props }) => <h5 {...props} className="text-base font-bold mt-2 mb-1" />,
                      h6: ({ node, ...props }) => <h6 {...props} className="text-base font-bold mt-2 mb-1" />,
                      ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 mt-2 mb-2" />,
                      ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 mt-2 mb-2" />,
                      li: ({ node, ...props }) => <li {...props} className="mt-1" />,
                      table: ({ node, ...props }) => (
                        <table {...props} className="border-collapse table-auto w-full mt-3 mb-3" />
                      ),
                      th: ({ node, ...props }) => (
                        <th {...props} className="border border-gray-300 px-4 py-2 text-left font-bold bg-gray-100" />
                      ),
                      td: ({ node, ...props }) => <td {...props} className="border border-gray-300 px-4 py-2" />,
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-t-2 border-gray-100 bg-white">
          <div className="flex gap-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your question or command..."
              className="flex-1 rounded-lg border-2 border-gray-300 p-4 text-lg placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
