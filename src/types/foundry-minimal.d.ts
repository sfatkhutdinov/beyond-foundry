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
    actors?: {
      find: (predicate: (actor: any) => boolean) => any;
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

  class Actor {
    static create(data: any): Promise<Actor>;
    name: string;
    items: any; // Collection of items
    update(data: any): Promise<Actor>;
    getFlag(module: string, key: string): any;
    createEmbeddedDocuments(type: string, data: any[]): Promise<any[]>;
  }

  class Application {
    static get defaultOptions(): any;
    constructor(options?: any);
    render(force?: boolean): any;
    close(): Promise<void>;
    activateListeners(html: any): void;
    getData(): any;
    element: any;
  }

  interface ApplicationOptions {
    id?: string;
    title?: string;
    template?: string;
    width?: number | string;
    height?: number | string;
    classes?: string[];
    resizable?: boolean;
    minimizable?: boolean;
    closeOnSubmit?: boolean;
    submitOnChange?: boolean;
    submitOnClose?: boolean;
  }

  class Dialog {
    constructor(data: any);
    render(force?: boolean): any;
  }

  function mergeObject(target: any, source: any, options?: any): any;

  interface Window {
    game: typeof game;
    ui: typeof ui;
    Hooks: typeof Hooks;
    Actor: typeof Actor;
    Application: typeof Application;
    Dialog: typeof Dialog;
    mergeObject: typeof mergeObject;
  }
}

export {};
