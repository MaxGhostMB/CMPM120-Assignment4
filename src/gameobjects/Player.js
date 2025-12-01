
export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setImmovable(true);
        this.body.setAllowGravity(false);

        this.up = scene.input.keyboard.addKey("W");
        this.left = scene.input.keyboard.addKey("A");
        this.right = scene.input.keyboard.addKey("D");
        this.down = scene.input.keyboard.addKey("S");

        this.isMoving = false;

        this.moveCooldown = 180; // milliseconds
        this.lastMoveTime = 0;

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

    move(dir, time) {
        this.isMoving = true;
        this.lastMoveTime = time;

        const TILE = 16

        let dx = 0, dy = 0;

        if (dir === 'up')    dy = -TILE;
        if (dir === 'down')  dy =  TILE;
        if (dir === 'left')  dx = -TILE;
        if (dir === 'right') dx =  TILE;

        this.anims.play("moving_" + dir);

        this.scene.tweens.add({
            targets: this,
            x: this.x + dx,
            y: this.y + dy,
            duration: 90,  
            onComplete: () => {
                this.isMoving = false;
            }
        });
    }

    update(time, dt) {
        if (this.isMoving) return;

        if (time - this.lastMoveTime < this.moveCooldown) return;

        if (this.up.isDown) {
            this.move('up', time);
        } else if (this.down.isDown) {
            this.move('down', time);
        } else if (this.left.isDown) {
            this.move('left', time);
        } else if (this.right.isDown) {
            this.move('right', time);
        }
    }
}
