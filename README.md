# Numeron OS

Numeron OS is an experimental open-source operating system for blockchain gaming – essentially an AI-powered RPG built on the Sui network using a custom on-chain engine (code-named Dubhe). Initially developed during a hackathon as a proof-of-concept for fully on-chain game mechanics, Numeron OS combines smart contracts, a game engine, and a web UI to create a decentralized monster-collecting RPG where all core gameplay logic runs on the blockchain. Our mission is to push the boundaries of Web3 gaming by demonstrating an on-chain "operating system" that coordinates game state, asset management, and player interactions in a trustless environment.

## Overview

Numeron OS introduces a Pokémon-inspired monster universe on the blockchain. Players can collect unique blockchain monsters, train and evolve them over time, engage in battles with other players' monsters, and trade assets in a decentralized marketplace – all without relying on a centralized server. Key features of Numeron OS include:

### Fully On-Chain Gameplay
- Game mechanics (monster stats, item drops, battles, etc.) are enforced by Sui Move smart contracts
- This ensures complete transparency and verifiability on-chain, from random loot generation to monster battle outcomes
- For instance, when players encounter wild monsters, they can capture them and have them recorded in the on-chain state, ensuring true ownership
- Even random events like item drops leverage on-chain randomness for guaranteed fairness

### Collectible Monsters
- Each monster is a unique on-chain entity with its own attributes and growth stats
- Players begin by encountering wild monsters and can capture them to build their collection
- Monsters can be trained and evolved through gameplay and items, with all progress permanently recorded on-chain
- Your monster roster is tied to your blockchain address, ensuring true ownership and persistence

### Battle System
- Numeron features a battle system where you can pit your monsters against NPC enemies or other players' monsters
- Battle outcomes are determined by on-chain logic (considering monster stats, levels, and randomness), ensuring complete transparency
- Future updates will enable PvP battles and tournaments fully mediated by smart contracts for cheat-proof competition

### Item and Crafting System
- The game world features items (potions, power-ups, crafting materials, etc.) that drop from encounters or can be crafted
- A random loot mechanism rewards players with on-chain items during exploration and battles
- Crafting recipes allow combining items to create new ones – all handled by smart contract logic
- (For example, certain items can restore monster health or boost stats, with crafting paths available to upgrade materials)

### In-Game Currency (Dubhe Token)
- Numeron OS includes a native token, DUBHE, which powers the game economy
- The Dubhe token can be minted and used for various in-game actions or fees
- It's introduced via the Dubhe engine module as a Sui-based coin and may be utilized for marketplace transactions or player rewards

### Marketplace and Trading
- A decentralized marketplace is being built where players can buy, sell, or trade their monsters and items with others
- Since assets are on-chain, trades are trustless and can occur peer-to-peer
- The market_system smart contract will manage listings, purchases, and ownership transfers of monsters/items securely

### Cross-Chain Bridge (Experimental)
- As part of exploring interoperability, Numeron OS's Dubhe protocol lays the groundwork for bridging assets across chains
- The system includes a bridge module for transferring tokens or game assets between Sui and other blockchains
- This means your in-game currency or certain items could move beyond Sui in the future, ensuring your assets aren't confined to one network
- (This feature is in early stages and was included to demonstrate hackathon innovation)

### AI-Powered Gameplay
- Numeron OS is integrating AI to enhance the gaming experience
- For example, NPC dialogue or quest generation leverages AI models to make non-player characters feel more dynamic and responsive
- An in-game Chatbot (accessible via the Chat interface) is planned to allow players to converse with an AI guide or lore characters
- This is powered by the AI SDKs in the project, making the RPG world more immersive and interactive

Overall, Numeron OS functions as an "operating system" for a decentralized game world – the smart contracts act as the kernel providing game rules and state management, while the web client serves as the user interface for players to interact with the on-chain world.

## Current Status

Numeron OS is in an alpha stage of development. While core components are in place, the project is actively evolving. Here's what's currently working and what's still in progress:

### Smart Contracts
- The backbone of Numeron is a set of Sui Move modules implementing the game logic
- Contracts for monster collection, item management, battles (encounters), player inventory/storage schema, and the Dubhe token are written and deployed on Sui testnet
- Basic functionality like capturing monsters, using healing items, and generating random loot has been implemented and tested on-chain
- (For example, you can capture a wild monster and it will be added to your on-chain collection, or use a potion item to heal your monster during an encounter)
- Advanced battle mechanics and marketplace trades are under development or in stub form

### Web Game Client
- We have a web application (built with Next.js and integrated with the Phaser game engine) serving as the front-end
- Currently, the client lets you explore a simple game world map, view your monsters and inventory, and initiate basic battles
- The UI is still rudimentary but demonstrates the concept:
  - A World Map scene for moving your character around and triggering encounters
  - Battle scenes for fighting wild monsters (turn-based combat prototype)
  - Inventory and Market screens to display items and potentially list them (the marketplace UI is mostly placeholder at the moment)
  - Chat interface where eventually an AI guide or player chat will be available (a basic chat window is implemented)
- The web app connects to the Sui blockchain via a wallet connector – currently, you can use a Sui wallet (like Suiet or Ethos wallet) to connect on testnet
- Once connected, your on-chain data (monsters, etc.) loads in the game
- Actions in-game trigger transactions (e.g., capturing a monster or using an item will prompt a blockchain transaction)
- The front-end is tested on Sui testnet and uses a custom indexer (at testnet-indexer.numeron.world) to efficiently query game data

### Dubhe Engine
- The underlying Dubhe protocol (or engine) is functional for core needs – it handles the creation of the DUBHE token and provides a schema for storing game data on-chain
- It also includes the skeleton of a cross-chain bridge and other utility systems
- Think of Dubhe as the game engine on-chain that Numeron uses
- While fully working in the context of Numeron gameplay, it's not yet packaged for reuse by other projects (though that's a future goal)

### AI Integration
- The groundwork for AI features is present (AI SDK dependencies and a chat interface), but in the current version, AI is not yet fully hooked up
- We plan to integrate an AI-driven NPC or assistant in upcoming updates, so stay tuned – the hooks are there, but you might not notice the AI doing much in the alpha release

### Testing & Debugging
- As an early-stage project, expect bugs and incomplete features
- We have some basic unit tests for the Move contracts (e.g., testing market transactions and item functions), but more testing is needed
- Use caution when performing on-chain actions – since it's on testnet, there's no real economic risk, but the game logic might have edge cases still being ironed out

### Live Demo
- The project is deployed on Sui testnet
- If you want to see Numeron OS in action, you can visit our testnet demo site (when available) and connect your Sui wallet
- The demo will allow you to roam the world, encounter a monster, and try capturing it
- This gives a taste of the fully on-chain gameplay
- (If the testnet demo is offline or you prefer local setup, see below for running the project locally)

## Building and Running the Project

We welcome you to try out Numeron OS locally or contribute to its development. Below are instructions to set up the development environment:

### Prerequisites
- Node.js 18+ and PNPM: The front-end is a Next.js app using PNPM workspaces in a monorepo. Ensure you have Node v18 (or higher) and PNPM v9 installed
- Sui Wallet or Dev Environment: To interact with the on-chain game, you'll need a Sui wallet (for testnet) or a local Sui network. For local testing, installing the Sui CLI and configuring a local network (sui sandbox) is recommended if you want to deploy the contracts locally. (By default, the app connects to Sui testnet where our contracts are already deployed)
- Rust (optional): If you plan to modify or redeploy the Move smart contracts, you should have the Move toolkit (which comes with the Sui CLI) and Rust installed

### Getting the Code
Clone the repository:
```bash
git clone https://github.com/NumeronOS/numeron.git
cd numeron
```

Install dependencies:
```bash
pnpm install
```
This will install all packages in the monorepo (the web app, contracts package, UI components, etc.)

### Running the Development Server
Front-End Dev Server: Run the web client in development mode with hot-reloading:
```bash
pnpm dev
```
This will start the Next.js development server (and possibly other processes via our mprocs setup). By default, the app will be accessible at http://localhost:3000. You should see the Numeron OS game interface load in your browser.

Note: The development server expects to connect to Sui testnet (default). Make sure to configure your wallet to use Sui testnet and have some test SUI tokens for gas. If you prefer to run against a local Sui network, set the environment variable NETWORK=localnet (and ensure you have a local indexer and Sui node running). See packages/contracts/deployment.ts for network configuration.

### Smart Contracts (Move) Deployment
The Move contracts are located in the packages/contracts directory. They are already deployed on testnet (and the front-end is configured to use those addresses). If you want to deploy them yourself (for localnet or if making changes):

1. Install the Sui CLI tool (sui) and initialize a local network or connect to devnet
2. Build the Move packages by running:
```bash
sui move build --package-path packages/contracts/src/numeron
```
(and similarly for dubhe if needed) – this checks that the contracts compile
3. Publish the packages to your desired network:
```bash
sui client publish --gas-budget 100000000 packages/contracts/src
```
This will output new package IDs for Numeron and Dubhe. You'll need to update those in the front-end config (see contracts/deployment.ts) so the app knows where to find the contracts.
4. (Optional) Run any init scripts if required (e.g., a genesis script to set up initial game state). Our genesis.move scripts set up default schema and should have run on publish if using deploy_hook.move. On custom deployment, ensure you invoke any necessary initialization entry functions defined in the modules.

### Running the Indexer (optional)
Numeron OS uses a custom indexer for game data to power the UI (for example, to list your inventory quickly). We have an indexer running at our testnet site. If you're running on a local network, you might want to run a local indexer. Our project includes configuration for the 0xObelisk Sui indexer. You can set it up by installing the indexer package and pointing it to your local node. (This is advanced usage – for most contributors, testnet with our hosted indexer will suffice, or you can rely on direct RPC calls through the wallet)

After starting the front-end, open the site and connect your Sui wallet. You should be able to create a new game account (the first time you sign in, an on-chain profile may be created for you), then explore the world. Try moving around to possibly trigger a random encounter, and check your inventory/market screens.

### Build for Production
To build the web app for production (optimizations, etc.), use pnpm run build in the root or in apps/web. This will generate an optimized Next.js build. Then run pnpm start (which starts the Next.js server in production mode). When deploying to a platform like Vercel, these build steps are handled automatically. Ensure to set the environment variables for NETWORK (and any keys if needed for localnet) in your deployment environment.

## Project Roadmap

Numeron OS is at an early stage, but we have big plans for its future. Our roadmap includes:

### Expanded Monster Mechanics
- More monster varieties with unique abilities
- An evolution system (e.g., monsters leveling up and evolving into new forms on-chain)
- Breeding or fusion mechanics to create new monsters
- We also plan to introduce element/typing for monsters to add depth to battles (think fire vs water advantages, etc.)

### Full Battle System
- Implementing a comprehensive turn-based combat system on-chain
- This includes multiple moves/attacks per monster, status effects
- A real-time battle coordinator so that player-vs-player battles can take place entirely through smart contract calls
- We'll optimize to reduce the number of transactions needed (possibly off-chain computation for minor details but final outcomes on-chain) to keep battles fun but decentralized

### Marketplace & Trading Launch
- Bringing the marketplace out of "in progress" to a live feature
- You'll be able to list monsters or rare items for sale for DUBHE tokens or even SUI, and buy from others
- We'll integrate this with the UI and ensure escrow and trade logic are secure
- Cross-player trading (direct swaps or gifts) is also on the table

### AI-Driven Content
- Leverage AI to generate dynamic content such as quest lines, NPC dialog, or even new monster designs
- An example on the roadmap is an AI quest master NPC – players can talk to it (using the chat interface) to receive procedural quests or tips
- The AI can tailor challenges based on your on-chain progress
- We also consider AI-generated lore or descriptions for monsters and items to enrich the game world

### Cross-Chain Expansion
- Currently, all gameplay is on Sui
- In the future, we envision Numeron OS bridging to other chains: for instance, allowing certain assets (like a special monster or item represented as an NFT) to be moved to Ethereum or other networks
- The Dubhe bridge will be expanded to support these scenarios
- This could enable Numeron to interact with other ecosystems (imagine using an Ethereum NFT as a monster skin in Numeron, etc.)

### Improved User Experience
- Beyond core features, we want to polish the player experience
- This involves better graphics and animations in the web client (leveraging Phaser)
- Mobile-friendly interfaces, and possibly desktop applications
- We'll also work on reducing the friction of blockchain transactions (batching actions, meta-transactions, or gas sponsorship) so the game feels smooth

### Security Audits and Mainnet Launch
- Once the game features are complete and thoroughly tested on testnet, we plan to audit the smart contracts for security
- The ultimate goal is to launch Numeron OS on the Sui mainnet, allowing players to truly own their monsters and items
- A mainnet launch will come with robust documentation, likely a token economy plan for DUBHE, and community events (maybe an initial monster airdrop or tournament to kick things off)

This roadmap is ambitious, and we're aware that some challenges (like fully on-chain PvP battles or AI integration) will require careful design. We'll proceed incrementally and welcome community input on these priorities. Have an idea or feature request? Feel free to open an issue or start a discussion – Numeron OS is an open collaboration.

## Contributing

Contributions are not only welcome, they're highly encouraged! Numeron OS began as a hackathon project, but we envision it growing into a community-driven endeavor at the intersection of blockchain, gaming, and AI. Here's how you can get involved:

### Find an Issue
- Check our GitHub issue tracker for open issues
- We label issues for difficulty and topic (e.g., "good first issue" for newcomers, or categories like "frontend", "smart-contract", "gameplay")
- If you're new, picking up a small feature or bugfix is a great way to start
- If you spot a problem that's not filed yet, please open a new issue describing it

### Contribute Code
- Whether you're a smart contract guru or a web developer (or both), there's plenty to do
- For Move smart contracts, ensure you test your changes on a local Sui network
- For the front-end, you can run the dev server and see your changes live
- We use a typical Fork & PR workflow on GitHub:
  1. Fork the repository to your account
  2. Create a new branch for your feature/fix: git checkout -b feature/my-improvement
  3. Commit your changes with clear messages. Try to follow our coding style (we have ESLint/Prettier for front-end, and a certain structure for Move code)
  4. Push to your fork and open a Pull Request to the main NumeronOS/numeron repo. Describe what your PR does and reference any issue it fixes
- Our team will review your PR, provide feedback, and merge it when it's ready
- All contributors will be added to our contributors list – you'll be a part of Numeron's history!

### Discuss and Propose
- We have a Discord/Matrix (to be announced) and use GitHub Discussions for design talks
- If you have a big idea (e.g., a new gameplay system or a refactor of an existing one), start a discussion thread
- We'd love to brainstorm with you
- The earlier you involve the core maintainers, the better we can help integrate your idea into the roadmap

### Testing and Feedback
- Not a developer? You can still help by play-testing the game and giving feedback
- Try out the latest version on testnet and let us know if you encounter any bugs or if you have suggestions to improve gameplay
- Player feedback is incredibly valuable, as it guides us to make the game more fun and user-friendly

### Documentation
- You can also contribute by improving documentation – whether it's this README, a future wiki, or code comments
- If you had to figure something out the hard way, consider adding that knowledge to the docs for the next person

Please note that we have a Contributor Code of Conduct (see CODE_OF_CONDUCT.md if available, or in the .github folder) – in short, we expect everyone to be respectful and constructive. This project is all about learning and pushing boundaries together, so let's keep the community positive and inclusive.

## Contact & Community

You can reach the maintainers by opening an issue or via our upcoming community channels (to be listed in the organization README). We're active on Twitter as well – follow @NumeronWorld for updates. If you're working on a contribution, feel free to tag us or ask for help. We're excited to collaborate!