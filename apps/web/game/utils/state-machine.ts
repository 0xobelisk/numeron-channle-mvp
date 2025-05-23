interface State {
  name: string;
  onEnter?: () => Promise<void>;
}

export class StateMachine {
  #states: Map<string, State>;
  #currentState: State | undefined;
  #id: string;
  #context: Object | undefined;
  #isChangingState: boolean;
  #changingStateQueue: string[];

  constructor(id: string, context?: Object) {
    this.#id = id;
    this.#context = context;
    this.#isChangingState = false;
    this.#changingStateQueue = [];
    this.#currentState = undefined;
    this.#states = new Map();
  }

  get currentStateName(): string | undefined {
    return this.#currentState?.name;
  }

  async update() {
    if (this.#changingStateQueue.length > 0) {
      await this.setState(this.#changingStateQueue.shift());
    }
  }

  async setState(name: string) {
    const methodName = 'setState';

    if (!this.#states.has(name)) {
      console.warn(`[${StateMachine.name}-${this.#id}:${methodName}] tried to change to unknown state: ${name}`);
      return;
    }

    if (this.#isCurrentState(name)) {
      return;
    }

    if (this.#isChangingState) {
      this.#changingStateQueue.push(name);
      return;
    }

    this.#isChangingState = true;
    console.log(
      `[${StateMachine.name}-${this.#id}:${methodName}] change from ${this.#currentState?.name ?? 'none'} to ${name}`,
    );

    this.#currentState = this.#states.get(name);

    if (this.#currentState.onEnter) {
      console.log(`[${StateMachine.name}-${this.#id}:${methodName}] ${this.#currentState.name} on enter invoked`);
      await this.#currentState.onEnter();
    }

    this.#isChangingState = false;
  }

  addState(state: State) {
    this.#states.set(state.name, {
      name: state.name,
      onEnter: this.#context ? state.onEnter?.bind(this.#context) : state.onEnter,
    });
  }

  #isCurrentState(name: string): boolean {
    if (!this.#currentState) {
      return false;
    }
    return this.#currentState.name === name;
  }
}
