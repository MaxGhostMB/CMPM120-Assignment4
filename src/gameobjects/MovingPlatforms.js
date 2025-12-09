export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, props) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0);
        this.setImmovable(true);
        this.body.setAllowGravity(false);

        this.reverseCooldown = 0; 
        this.vx = this.body.deltaX();
        this.vy = this.body.deltaY();

        // Tiled properties
        this.startX = x;
        this.startY = y;
        this.distance = props.distance || 64;
        this.speed = props.speed || 60;
        this.direction = props.direction || "horizontal";
        this.currentSpeed = this.speed;

        this.reverseDirection = false;
    }

    update(dt) {
        this.vx = this.body.deltaX();
        this.vy = this.body.deltaY();

        if (this.reverseCooldown > 0) {
        this.reverseCooldown -= dt;
        }

        // Apply reversal only once
        if (this.reverseDirection && this.reverseCooldown <= 0) {
            this.currentSpeed *= -1;
            this.reverseDirection = false;
            this.reverseCooldown = 2000;  // 200 ms buffer so it doesn't flip again immediately
        }

        // Move horizontally
        if (this.direction === "horizontal") {
            // keep currentSpeed in pixels / second
            this.body.setVelocityX(this.currentSpeed);

            if (this.x > this.startX + this.distance) {
                this.currentSpeed = -Math.abs(this.speed);
            } else if (this.x < this.startX - this.distance) {
                this.currentSpeed = Math.abs(this.speed);
            }
        }
        // Move vertically incase we want this 
        else if (this.direction === "vertical") {
            this.body.setVelocityY(this.currentSpeed);

            if (this.y > this.startY + this.distance) {
                this.currentSpeed = -Math.abs(this.speed);
            } else if (this.y < this.startY - this.distance) {
                this.currentSpeed = Math.abs(this.speed);
            }
        }
    }
}