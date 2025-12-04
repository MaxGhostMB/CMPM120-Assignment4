export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const texture = Phaser.Math.RND.pick(['redcar', 'taxicar']);
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.setOrigin(0.5, 1);
        
        if (this.width > 16) {
            this.body.setSize(16, 14);
            this.body.setOffset((this.width - 16)/2, this.height - 14);
        }
        // lag reduction
        this.setActive(false);
        this.setVisible(false);
    }
    
    spawn(x, y, direction, speed) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        const textures = ['redcar','taxicar'];
        this.setTexture(Phaser.Math.RND.pick(textures));
        
        this.direction =direction;
        this.speed = speed;
        this.body.setVelocityX(speed * direction);
        this.setFlipX(direction === -1);
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (!this.active) return;
        
        const worldLength = this.scene.map.widthInPixels;
        const buffa = 100;
        
        if ((this.direction === 1 && this.x > worldLength + buffa) || (this.direction === -1 && this.x < -buffa)) {
            this.setActive(false);
            this.setVisible(false);
            this.body.setVelocityX(0);
        }
    }
}