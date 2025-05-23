/**
 * Uses the Phaser 3 built in drag events to allow a game object to be moved around a Phaser 3 Scene instance.
 * The method will listen for the GameObject Destroy event and cleanup the various event listeners that
 * were registered.
 */
export function makeDraggable(gameObject: Phaser.GameObjects.Image, enableLogs: boolean = false) {
  gameObject.setInteractive();

  function log(message: string) {
    if (enableLogs) {
      console.debug(message);
    }
  }

  function onDrag(pointer: Phaser.Input.Pointer) {
    log(`[makeDraggable:onDrag] invoked for game object: ${gameObject.name}`);
    gameObject.x = pointer.x;
    gameObject.y = pointer.y;
  }

  function stopDrag() {
    log(`[makeDraggable:stopDrag] invoked for game object: ${gameObject.name}`);
    gameObject.on(Phaser.Input.Events.POINTER_DOWN, startDrag);
    gameObject.off(Phaser.Input.Events.POINTER_MOVE, onDrag);
    gameObject.off(Phaser.Input.Events.POINTER_UP, stopDrag);
    gameObject.x = Math.round(gameObject.x);
    gameObject.y = Math.round(gameObject.y);
  }

  function startDrag() {
    log(`[makeDraggable:startDrag] invoked for game object: ${gameObject.name}`);
    gameObject.off(Phaser.Input.Events.POINTER_DOWN, startDrag);
    gameObject.on(Phaser.Input.Events.POINTER_MOVE, onDrag);
    gameObject.on(Phaser.Input.Events.POINTER_UP, stopDrag);
  }

  function destroy() {
    log(`[makeDraggable:destroy] invoked for game object: ${gameObject.name}`);
    gameObject.off(Phaser.Input.Events.POINTER_DOWN, startDrag);
    gameObject.off(Phaser.Input.Events.POINTER_MOVE, onDrag);
    gameObject.off(Phaser.Input.Events.POINTER_UP, stopDrag);
  }

  gameObject.on(Phaser.Input.Events.POINTER_DOWN, startDrag);
  gameObject.once(Phaser.GameObjects.Events.DESTROY, destroy);
}
