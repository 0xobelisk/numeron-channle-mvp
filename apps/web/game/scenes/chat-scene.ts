import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys';
import { SCENE_KEYS } from './scene-keys';
import { BaseScene } from './base-scene';
import { animateText } from '../utils/text-utils';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager';
import { UI_ASSET_KEYS } from '../assets/asset-keys';
import { MENU_COLOR } from '../config';
import { exhaustiveGuard } from '../utils/guard';
import { MenuColorOptions } from '../common/options';

const UI_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#ffffff',
  fontSize: '18px',
  align: 'left',
  lineSpacing: 5, // Increased line spacing
  wordWrap: {
    width: 0,
    useAdvancedWrap: true,
  },
});

const UI_INPUT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: 'white',
  fontSize: '24px',
  wordWrap: { width: 0 },
  padding: { left: 10, right: 10, top: 5, bottom: 5 },
});

const MAX_MESSAGES = 5; // Maximum number of messages to display
const MESSAGE_FADE_TIME = 5000; // Time before messages start to fade (ms)
const AUTO_HIDE_TIME = 3000; // Time before chat panel auto-hides (ms)

// Message types
export enum MessageType {
  SYSTEM = 'system',
  PLAYER = 'player',
  OTHER = 'other',
  ITEM = 'item',
}

const MESSAGE_COLORS = {
  [MessageType.SYSTEM]: '#ffff00', // Yellow
  [MessageType.ITEM]: '#00ff00', // Green
  [MessageType.PLAYER]: '#ffffff', // Changed to white, was #00ff00
  [MessageType.OTHER]: '#ffffff', // White
};

interface ChatMessage {
  text: string;
  type: MessageType;
  timestamp: number;
  sender?: string;
  continuation?: boolean; // Flag indicating if this is a continuation of previous message
}

export class ChatScene extends BaseScene {
  #padding: number;
  #width: number;
  #height: number;
  #container: Phaser.GameObjects.Container;
  #inputField: Phaser.GameObjects.DOMElement;
  #messages: ChatMessage[] = [];
  #messageTexts: Phaser.GameObjects.Text[] = [];
  #isVisible: boolean = true;
  #isInputActive: boolean = false;
  #lastActivityTime: number = 0;
  #initialOpacity: number = 0.9;
  #inputContainer: Phaser.GameObjects.Container;
  #inputBackground: Phaser.GameObjects.Rectangle;
  #autoFadeEnabled: boolean = true;
  #isTyping: boolean = false;
  #uKey: Phaser.Input.Keyboard.Key;
  #escKey: Phaser.Input.Keyboard.Key;
  #inputBlockingKeys: Phaser.Input.Keyboard.Key[] = [];
  #handleGlobalKeyDown: (event: KeyboardEvent) => void;

  // Add a static instance reference for global access
  static instance: ChatScene;
  // Add static flag to mark if welcome message has been shown
  static welcomeMessageShown: boolean = false;

  constructor() {
    super({
      key: SCENE_KEYS.CHAT_SCENE,
    });
    // Save instance reference
    ChatScene.instance = this;
  }

  get isVisible(): boolean {
    return this.#isVisible;
  }

  get isInputActive(): boolean {
    return this.#isInputActive;
  }

  async create() {
    try {
      this.#padding = 10;
      this.#width = 400;
      this.#height = 230; // Increased height to accommodate more messages

      // Get menu color
      const menuColor = this.#getMenuColorsFromDataManager();

      // Create background
      const background = this.add.rectangle(0, 0, this.#width, this.#height, 0x000000, 0.8).setOrigin(0);

      // Create main container
      const panel = this.add
        .rectangle(0, 0, this.#width, this.#height, menuColor.main, 0)
        .setOrigin(0)
        .setStrokeStyle(2, menuColor.border, 1)
        .setInteractive();

      this.#container = this.add.container(0, 0, [background, panel]);

      // Set container depth to ensure it's always above other UI elements
      this.#container.setDepth(100);

      // Add title
      const titleText = this.add
        .text(this.#width / 2, 5, 'Game Chat', {
          ...UI_TEXT_STYLE,
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0);

      this.#container.add(titleText);

      // Add message text area - bottom to top arrangement
      this.#messageTexts = [];
      const lineHeight = 36; // Increased line height to accommodate potential multi-line text
      const messageAreaStartY = this.#height - 60; // Increased space above input field

      for (let i = 0; i < MAX_MESSAGES; i++) {
        // Bottom-up layout, index 0 is the bottom-most message box
        const yPos = messageAreaStartY - i * lineHeight;

        const messageText = this.add
          .text(10, yPos, '', {
            ...UI_TEXT_STYLE,
            wordWrap: {
              width: this.#width - 20,
              useAdvancedWrap: true,
            },
            color: '#ffffff', // Set default text color to white
          })
          .setDepth(1); // Ensure message text is always on top in z-axis

        this.#messageTexts.push(messageText);
        this.#container.add(messageText);
      }

      // Create input field background and container
      this.#inputBackground = this.add
        .rectangle(0, this.#height - 40, this.#width, 40, menuColor.main, 0.8)
        .setOrigin(0)
        .setStrokeStyle(2, menuColor.border, 1);

      this.#inputContainer = this.add.container(0, 0, [this.#inputBackground]);
      this.#container.add(this.#inputContainer);

      // Set initial position
      const { width, height } = this.cameras.main;
      const startX = 10;
      const startY = height - this.#height - 10;

      this.#container.setPosition(startX, startY);

      // Initial state
      this.#lastActivityTime = this.time.now;
      this.scene.bringToTop();

      // Set keyboard keys
      this.#uKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
      this.#escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      // Initialize list of keys to block propagation
      this.#inputBlockingKeys = [
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      ];

      // Initially disable key blocking
      this.#setInputBlockingKeysEnabled(false);

      // Only show welcome message when scene is first created
      if (!ChatScene.welcomeMessageShown) {
        setTimeout(() => {
          if (this.scene.isActive()) {
            this.addMessage('Welcome to numeron!', MessageType.SYSTEM);
            ChatScene.welcomeMessageShown = true;
          }
        }, 500);
      }

      // Only try to create DOM element after complete initialization
      setTimeout(() => this.#createInputField(), 1000);
    } catch (error) {
      console.error('Error in ChatScene create method:', error);
    }
  }

  update(time: number): void {
    super.update(time);

    // Handle auto fade in/out effect
    if (this.#autoFadeEnabled && !this.#isTyping) {
      const timeSinceActivity = time - this.#lastActivityTime;

      if (timeSinceActivity > AUTO_HIDE_TIME) {
        // Time exceeded, fade out panel
        const opacity = Math.max(0.3, this.#initialOpacity - (timeSinceActivity - AUTO_HIDE_TIME) / 2000);
        this.#container.setAlpha(opacity);
      } else {
        // Active state, maintain full visibility
        this.#container.setAlpha(this.#initialOpacity);
      }
    }

    // Handle U key to activate chat - only check when inactive
    if (!this.#isInputActive) {
      if (Phaser.Input.Keyboard.JustDown(this.#uKey)) {
        this.activateChatInput();
        return;
      }
    }

    // Check ESC key to cancel chat - only check when active
    if (this.#isInputActive) {
      if (Phaser.Input.Keyboard.JustDown(this.#escKey)) {
        this.deactivateChatInput();
      }
    }
  }

  // Add new message and update display
  addMessage(text: string, type: MessageType, sender?: string): void {
    try {
      if (!text) return;

      // Split very long messages into multiple parts
      const maxSingleMessageLength = 80; // Maximum length for a single message

      if (text.length > maxSingleMessageLength) {
        // Message too long, split into multiple parts
        const chunks = [];
        let currentIndex = 0;

        while (currentIndex < text.length) {
          // Look for suitable break points, preferably at spaces or punctuation
          let endIndex = Math.min(currentIndex + maxSingleMessageLength, text.length);

          // If not at the end of text, try to find a suitable break point
          if (endIndex < text.length) {
            // Look back from current max position to find spaces or punctuation
            const lookbackRange = 15; // Maximum range to look back
            for (let j = 0; j < lookbackRange; j++) {
              const checkPos = endIndex - j;
              if (checkPos <= currentIndex) break;

              const char = text.charAt(checkPos);
              if (/\s|，|。|,|\.|!|\?|，|。|！|？|;|；/.test(char)) {
                endIndex = checkPos + 1; // Include this punctuation mark
                break;
              }
            }
          }

          chunks.push(text.substring(currentIndex, endIndex));
          currentIndex = endIndex;
        }

        // Add the split messages
        for (let i = 0; i < chunks.length; i++) {
          this.#messages.push({
            text: chunks[i],
            type,
            timestamp: this.time.now,
            sender: i === 0 ? sender : undefined,
            continuation: i > 0, // All after the first are continuation messages
          });
        }
      } else {
        // Message length is normal, add directly
        this.#messages.push({
          text,
          type,
          timestamp: this.time.now,
          sender,
          continuation: false,
        });
      }

      // Keep the most recent MAX_MESSAGES messages
      while (this.#messages.length > MAX_MESSAGES) {
        this.#messages.shift();
      }

      // Only update display when scene is active
      if (this.scene.isActive()) {
        this.#updateMessageDisplay();
        this.showChatPanel();
      }
    } catch (error) {
      console.error('Error in addMessage:', error);
    }
  }

  // Update message display
  #updateMessageDisplay(): void {
    try {
      // Ensure message area has been created
      if (!this.#messageTexts || this.#messageTexts.length === 0) {
        console.warn('Message text objects not initialized');
        return;
      }

      // Clear all text
      this.#messageTexts.forEach(text => {
        if (text && text.setText) {
          try {
            text.setText('');
            text.setColor('#ffffff'); // Default reset to white
          } catch (error) {
            console.error('Error clearing text:', error);
          }
        }
      });

      // Get messages to display
      const messagesCount = Math.min(this.#messages.length, MAX_MESSAGES);
      const startIdx = this.#messages.length - messagesCount;

      // Display messages from bottom (newest messages at bottom)
      for (let i = 0; i < messagesCount; i++) {
        // Message array index, old to new
        const messageIndex = startIdx + i;
        // Display position index, starting from bottom, index 0 is bottom
        const displayIndex = messagesCount - 1 - i;

        const message = this.#messages[messageIndex];
        const messageText = this.#messageTexts[displayIndex];

        if (!message || !messageText || !messageText.setText) continue;

        let displayText = '';

        // Add prefix based on message type
        try {
          // Check if it's a continuation message
          if (message.continuation) {
            displayText = `  └─ ${message.text}`;
          } else {
            switch (message.type) {
              case MessageType.SYSTEM:
                displayText = `[System] ${message.text}`;
                break;
              case MessageType.PLAYER:
                displayText = `[You] ${message.text}`;
                break;
              case MessageType.OTHER:
                displayText = `[${message.sender || 'You'}] ${message.text}`;
                break;
              case MessageType.ITEM:
                displayText = `[${message.sender || 'You'}] ${message.text}`;
                break;
              default:
                exhaustiveGuard(message.type);
            }
          }

          messageText.setColor(MESSAGE_COLORS[message.type]);

          // Ensure text has auto-wrap
          messageText.setWordWrapWidth(this.#width - 20, true);

          // Ensure scene is active before rendering
          if (this.scene.isActive() && messageText.active !== false) {
            messageText.setText(displayText);

            // Ensure message text is always on top in z-axis
            messageText.setDepth(1);
          }
        } catch (error) {
          console.error(`Error setting text for message ${i}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in updateMessageDisplay:', error);
    }
  }

  // Send message
  #sendMessage(): void {
    try {
      if (!this.#inputField || !this.#inputField.node) {
        console.error('Input field object does not exist');
        return;
      }

      // Use type assertion to resolve TypeScript error
      const inputNode = this.#inputField.node as any;
      const message = inputNode.value.trim();

      if (message) {
        // Add to message box display
        this.addMessage(message, MessageType.PLAYER);
      }

      // Update activity time
      this.#lastActivityTime = this.time.now;
    } catch (error) {
      console.error('Exception occurred during message sending:', error);
    }
  }

  // Show chat panel
  showChatPanel(): void {
    if (this.#container) {
      this.#container.setAlpha(this.#initialOpacity);
      this.#isVisible = true;
      this.#lastActivityTime = this.time.now;
    }
  }

  // Hide chat panel
  hideChatPanel(): void {
    if (this.#container) {
      this.#container.setAlpha(0);
      this.#isVisible = false;
    }
  }

  // Toggle auto-fade feature
  toggleAutoFade(enabled: boolean): void {
    this.#autoFadeEnabled = enabled;
    if (!enabled && this.#container) {
      this.#container.setAlpha(this.#initialOpacity);
    }
  }

  #getMenuColorsFromDataManager(): { main: number; border: number } {
    const chosenMenuColor: MenuColorOptions = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR);
    if (chosenMenuColor === undefined) {
      return MENU_COLOR[1];
    }

    switch (chosenMenuColor) {
      case 0:
        return MENU_COLOR[1];
      case 1:
        return MENU_COLOR[2];
      case 2:
        return MENU_COLOR[3];
      default:
        exhaustiveGuard(chosenMenuColor);
    }
  }

  // Activate chat input
  activateChatInput(): void {
    if (!this.#inputField) {
      console.error('Input field object does not exist, cannot activate');
      return;
    }

    if (!this.#inputField.node) {
      console.error('Input field DOM node does not exist, cannot activate');
      return;
    }

    this.#isInputActive = true;

    // Ensure chat panel is fully visible
    this.showChatPanel();
    this.#container.setAlpha(1);

    // Use Phaser's addCapture method to prevent key events from propagating to the game
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.F1,
      Phaser.Input.Keyboard.KeyCodes.F2,
      Phaser.Input.Keyboard.KeyCodes.F3,
      Phaser.Input.Keyboard.KeyCodes.F4,
      Phaser.Input.Keyboard.KeyCodes.F5,
      Phaser.Input.Keyboard.KeyCodes.F6,
      Phaser.Input.Keyboard.KeyCodes.F7,
      Phaser.Input.Keyboard.KeyCodes.F8,
      Phaser.Input.Keyboard.KeyCodes.F9,
      Phaser.Input.Keyboard.KeyCodes.F10,
      Phaser.Input.Keyboard.KeyCodes.F11,
      Phaser.Input.Keyboard.KeyCodes.F12,
    ]);

    // Disable all keyboard controls
    this.#setInputBlockingKeysEnabled(true);

    // Focus input field (using type assertion to resolve TypeScript error)
    const inputNode = this.#inputField.node as any;
    if (inputNode.focus) {
      inputNode.focus();
    }

    // Prevent browser default behavior for function keys
    this.input.keyboard.on('keydown-F11', event => {
      if (this.#isInputActive) {
        if (event && event.preventDefault) event.preventDefault();
        return false;
      }
    });

    // Add system message prompt
    this.addMessage('Chat mode activated, press ESC to exit', MessageType.SYSTEM);
  }

  // Deactivate chat input
  deactivateChatInput(): void {
    if (!this.#inputField) {
      console.error('Input field object does not exist, cannot deactivate');
      return;
    }

    this.#isInputActive = false;

    // Remove Phaser key capture
    this.input.keyboard.clearCaptures();

    // Enable keyboard controls
    this.#setInputBlockingKeysEnabled(false);

    // Blur input field
    const inputNode = this.#inputField.node as any;
    if (inputNode && inputNode.blur) {
      inputNode.blur();
    }

    // Update activity time
    this.#lastActivityTime = this.time.now;
  }

  // Set whether blocking keys are enabled
  #setInputBlockingKeysEnabled(enabled: boolean): void {
    this.#inputBlockingKeys.forEach(key => {
      // Use setCaptureEnabled method to control if key is captured
      // When a key is captured, other scenes won't receive that key event
      key.enabled = enabled;
    });
  }

  // Separate input field creation to its own method
  #createInputField(): void {
    if (!this.scene.isActive()) return;

    try {
      // Create text object to display current input, ensure using white
      const displayText = this.add.text(15, this.#height - 35, '', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        fontSize: '18px',
        color: '#ffffff', // Ensure input text is white
      });

      // Create visual cursor
      const cursor = this.add.rectangle(15, this.#height - 35, 2, 20, 0xffffff);

      let currentInput = '';
      let cursorVisible = true;

      // Create input placeholder text
      const placeholderText = this.add.text(15, this.#height - 35, 'Enter message...', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        fontSize: '18px',
        color: '#888888',
      });

      // Create a rectangle as input area background
      const inputBackground = this.add
        .rectangle(10, this.#height - 35, this.#width - 20, 30, 0x000000, 0.5)
        .setOrigin(0, 0);

      inputBackground.setStrokeStyle(1, 0x666666, 1);
      inputBackground.setInteractive();

      // Add to container
      if (this.#inputContainer) {
        this.#inputContainer.add([inputBackground, displayText, placeholderText, cursor]);
      }

      // Cursor blink effect
      this.time.addEvent({
        delay: 500,
        callback: () => {
          if (this.#isInputActive) {
            cursorVisible = !cursorVisible;
            cursor.setVisible(cursorVisible);
          } else {
            cursor.setVisible(false);
          }
        },
        loop: true,
      });

      // Save global event handler reference
      this.#handleGlobalKeyDown = (event: KeyboardEvent): void => {
        if (this.#isInputActive && event.key.match(/^F\d+$/i)) {
          event.preventDefault();
        }
      };

      // Add global event listener
      window.addEventListener('keydown', this.#handleGlobalKeyDown, true);

      // Use Phaser's event system to add cleanup logic
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener('keydown', this.#handleGlobalKeyDown, true);
        this.input.keyboard.removeAllListeners();
      });

      // Use scene's keyboard input events capture
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (!this.#isInputActive) return;

        // Prevent browser default behaviors like F11 fullscreen, F5 refresh, etc.
        if (event.key.match(/^F\d+$/i) || event.ctrlKey || event.altKey || event.metaKey) {
          event.preventDefault();
        }

        if (event.key === 'Enter') {
          // Send message
          if (currentInput.trim()) {
            this.addMessage(currentInput.trim(), MessageType.PLAYER);
            currentInput = '';
            displayText.setText('');
            cursor.setPosition(15, this.#height - 35);
            placeholderText.setVisible(true);
          }
        } else if (event.key === 'Escape') {
          // Cancel input
          this.deactivateChatInput();
          currentInput = '';
          displayText.setText('');
          cursor.setPosition(15, this.#height - 35);
          placeholderText.setVisible(true);
        } else if (event.key === 'Backspace') {
          // Delete character
          currentInput = currentInput.slice(0, -1);
          displayText.setText(currentInput);
          placeholderText.setVisible(currentInput === '');
          cursor.setPosition(15 + displayText.width, this.#height - 35);
        } else if (event.key.length === 1) {
          // Add character
          currentInput += event.key;
          displayText.setText(currentInput);
          placeholderText.setVisible(false);
          cursor.setPosition(15 + displayText.width, this.#height - 35);
        }

        // Update input field content mapping
        if (this.#inputField && this.#inputField.node) {
          (this.#inputField.node as any).value = currentInput;
        }

        // Prevent event propagation to browser
        event.stopPropagation();
      });

      // Activate when input field is clicked
      inputBackground.on('pointerdown', () => {
        if (!this.#isInputActive) {
          this.activateChatInput();
        }
      });

      // Update inputField reference to work like a DOM input field
      this.#inputField = {
        node: {
          value: currentInput,
          focus: () => {
            cursor.setVisible(true);
            this.#isTyping = true;
          },
          blur: () => {
            cursor.setVisible(false);
            this.#isTyping = false;
          },
          click: () => {},
        },
      } as any;

      // Initial state setup
      this.#isInputActive = false;
      cursor.setVisible(false);
    } catch (error) {
      console.error('Failed to create input field, error details:', error);
      // If creation fails, add a text prompt
      if (this.#inputContainer) {
        const inputPlaceholder = this.add.text(10, this.#height - 35, ' Chat function unavailable ', {
          ...UI_TEXT_STYLE,
          backgroundColor: '#333333',
        });
        this.#inputContainer.add(inputPlaceholder);
      }
    }
  }
}
