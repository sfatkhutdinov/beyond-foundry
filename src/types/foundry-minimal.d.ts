// Global type declarations for FoundryVTT
// This is a minimal set of types to make the module compile
// In a production environment, you'd use @league-of-foundry-developers/foundry-vtt-types

declare global {
  const game: {
    settings: {
      register: (_module: string, _key: string, _config: any) => void;
      get(_module: string, _key: string): any;
      set(_module: string, _key: string, _value: any): Promise<any>;
    };
    system: {
      id: string;
      version?: string;
    };
    modules: {
      get(_id: string): any;
    };
    actors?: {
      find(_predicate: (_actor: any) => boolean): any;
    };
    version?: string;
    world?: {
      id: string;
    };
    user?: {
      name?: string;
    };
  };

  const ui: {
    notifications: {
      info(_message: string): void;
      warn(_message: string): void;
      error(_message: string): void;
    };
  };

  const Hooks: {
    once(_event: string, _callback: (..._args: any[]) => void): void;
    on(_event: string, _callback: (..._args: any[]) => void): void;
  };

  class Actor {
    static create(_data: any): Promise<Actor>;
    name: string;
    items: any; // Collection of items
    update(_data: any): Promise<Actor>;
    getFlag(_module: string, _key: string): any;
    createEmbeddedDocuments(_type: string, _data: any[]): Promise<any[]>;
  }

  class Application {
    static get defaultOptions(): any;
    constructor(_options?: any);
    render(_force?: boolean): any;
    close(): Promise<void>;
    activateListeners(_html: any): void;
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
    constructor(_data: any);
    render(_force?: boolean): any;
  }

  function mergeObject(_target: any, _source: any, _options?: any): any;

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
