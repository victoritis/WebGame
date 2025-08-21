// Stub mínimo para silenciar errores de editor si los tipos reales de Phaser
// no se resuelven todavía (las definiciones reales vienen con el paquete phaser).
declare module "phaser" {
  const Phaser: any;
  export default Phaser;
}
