
export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.up = scene.input.keyboard.addKey("W");
        this.left = scene.input.keyboard.addKey("A");
        this.right = scene.input.keyboard.addKey("D");
        this.down = scene.input.keyboard.addKey("S");

        this.upArrow = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downArrow = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.leftArrow = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightArrow = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        this.isMoving = false;

        this.moveCooldown = 180; // milliseconds
        this.lastMoveTime = 0;

        this.isInvincible = false;

        this.createAnimations(scene);
    }

    createAnimations(scene) {
        scene.anims.create({
            key: 'moving_up',
            frames: scene.anims.generateFrameNumbers('player', { start: 9, end: 11 }),
            frameRate: 20,
            repeat: 0
        });

        scene.anims.create({
            key: 'moving_right',
            frames: scene.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: 20,
            repeat: 0
        });

        scene.anims.create({
            key: 'moving_left',
            frames: scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 20,
            repeat: 0
        });

        scene.anims.create({
            key: 'moving_down',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 0
        });
    }

    canMoveTo(targetX, targetY) {
        const TILE = 16;

        // Shrink player rectangle slightly, but clamp to tile
        const width = Math.min(this.width - 6, TILE);
        const height = Math.min(this.height - 6, TILE);

        const playerRect = new Phaser.Geom.Rectangle(
            targetX, 
            targetY, 
            width, 
            height
        );

        let blocked = false;

        this.scene.colisions.getChildren().forEach(obj => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, obj.getBounds())) {
                blocked = true;
            }
        });

        this.scene.buildings.getChildren().forEach(obj => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, obj.getBounds())) {
                blocked = true;
            }
        });

        return !blocked;
    }

    move(dir, time) {
        if (this.isMoving) return;

        const TILE = 16;
        let dx = 0, dy = 0;

        if (dir === 'up')    dy = -TILE;
        if (dir === 'down')  dy =  TILE;
        if (dir === 'left')  dx = -TILE;
        if (dir === 'right') dx =  TILE;

        const targetX = this.x + dx;
        const targetY = this.y + dy;

        if (!this.canMoveTo(targetX, targetY)) return; // stop if blocked

        this.isMoving = true;
        this.lastMoveTime = time;
        this.anims.play("moving_" + dir);

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: 90,
            onComplete: () => { this.isMoving = false; }
        });
    }

    activateInvincibility(duration) {
        this.isInvincible = true;

        // Flash effect to show invincibility
        this.invincibilityTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            yoyo: true,
            repeat: duration,
            duration: 200
        });

        // Remove invincibility after duration
        this.scene.time.delayedCall(duration, () => {
            this.isInvincible = false;

            // Stop the tween
            if (this.invincibilityTween) {
                this.invincibilityTween.stop();
                this.invincibilityTween = null;
            }

            this.setAlpha(1);
        });
    }
    
    update(time, dt) {
        if (this.isMoving) return;

        if (time - this.lastMoveTime < this.moveCooldown) return;

        if ((this.up.isDown || this.upArrow.isDown)) {
            this.move('up', time);
        } else if ((this.down.isDown || this.downArrow.isDown)) {
            this.move('down', time);
        } else if ((this.left.isDown || this.leftArrow.isDown)) {
            this.move('left', time);
        } else if ((this.right.isDown || this.rightArrow.isDown)) {
            this.move('right', time);
        }
    }
}
