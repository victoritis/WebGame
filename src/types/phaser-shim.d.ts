// Shim muy laxo para permitir compilar sin los tipos completos de Phaser
// (los tipos reales vienen en el paquete 'phaser'; esto evita errores de namespace
// si el resolver en modo Bundler no los encuentra todavía.)
// TODO: eliminar este shim cuando el editor reconozca correctamente las d.ts de phaser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Phaser: any;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace Phaser {
  const Physics: any;
  const Input: any;
  const Cameras: any;
  const Math: any;
  const Types: any;
  const GameObjects: any;
  class Scene { constructor(config?: any); }
}
declare module "phaser" { export default Phaser; }
