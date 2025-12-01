export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.up = scene.input.keyboard.addKey("W");
        this.left = scene.input.keyboard.addKey("A");
        this.right = scene.input.keyboard.addKey("D");
        this.down = scene.input.keyboard.addKey("S");

        this.createAnimations(scene);

        // this.setCollideWorldBounds(true);
    }

    createAnimations(scene) {
        scene.anims.create({
            key: 'moving_up',
            frames: scene.anims.generateFrameNumbers('player', { start: 9, end: 10 }),
            frameRate: 16,
            repeat: -1
        });

        scene.anims.create({
            key: 'moving_left',
            frames: scene.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: 16,
            repeat: -1
        });

        scene.anims.create({
            key: 'moving_right',
            frames: scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 16,
            repeat: -1
        });

        scene.anims.create({
            key: 'moving_down',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 16,
            repeat: -1
        });
    }

    update(dt) {

        // Always reset velocity first
        this.body.setVelocity(0);
        let moving = false;

        // Horizontal movement
        if (this.left.isDown) {
            this.body.setVelocityX(-200);
            this.setFlipX(false);  // flip the frames
            this.anims.play("moving_right", true); // same animation!
        }
        else if (this.right.isDown) {
            this.body.setVelocityX(200);
            this.setFlipX(true); // normal orientation
            this.anims.play("moving_right", true); // same animation!
        }

        // Vertical movement (handled separately)
        if (this.up.isDown) {
            this.body.setVelocityY(-200);
            this.setFlipX(false);
            this.anims.play("moving_up", true);
            moving = true;
        } else if (this.down.isDown) {
            this.body.setVelocityY(200);
            this.setFlipX(false);
            this.anims.play("moving_down", true);
            moving = true;
        }

        // TODO: fix the animations 
        if (!moving) {
            this.anims.stop();
        }
    }
}
