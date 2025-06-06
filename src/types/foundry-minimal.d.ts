// Global type declarations for FoundryVTT
// This is a minimal set of types to make the module compile
// In a production environment, you'd use @league-of-foundry-developers/foundry-vtt-types

declare global {
  const game: {
    settings: {
      register: (module: string, key: string, config: any) => void;
      get: (module: string, key: string) => any;
      set: (module: string, key: string, value: any) => Promise<any>;
    };
    system: {
      id: string;
    };
    modules: {
      get: (id: string) => any;
    };
  };

  const ui: {
    notifications: {
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string) => void;
    };
  };

  const Hooks: {
    once: (event: string, callback: (...args: any[]) => void) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
  };

  interface Window {
    game: typeof game;
    ui: typeof ui;
    Hooks: typeof Hooks;
  }
}

export {};
