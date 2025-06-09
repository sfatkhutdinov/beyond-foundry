/**
 * Type augmentation for FoundryVTT global objects
 */

declare global {
  interface Game {
    version: string;
    world: {
      id: string;
    };
    user?: {
      name: string;
      id: string;
    };
    socket?: {
      on: (event: string, callback: (data: any) => void) => void;
      emit: (event: string, data: any) => void;
    };
    packs: {
      find: (predicate: (pack: any) => boolean) => any;
      get: (id: string) => any;
    };
    actors?: {
      get(id: string): any;
      find(predicate: (actor: any) => boolean): any;
    };
    system: {
      id: string;
      version: string;
    };
  }

  interface GameSystem {
    version: string;
  }

  interface Item {
    create(data: any, options?: { parent?: any }): Promise<any>;
  }

  interface Actor {
    create(data: any, options?: any): Promise<any>;
  }

  const game: Game;
  const Item: typeof Item;
  const Actor: typeof Actor;
}

export {};
