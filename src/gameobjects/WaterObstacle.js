export class WaterObstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'trashforwater');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.setOrigin(0.5, 0.5);
        
        this.setDisplaySize(80, 96);
        this.body.setSize(80, 96);
        this.body.setOffset(-40, -48);
        
        this.setActive(false);
        this.setVisible(false);
    }
    
    spawn(x, y, direction, speed, laneY) {
        this.setPosition(x, laneY);
        this.setActive(true);
        this.setVisible(true);
        
        this.laneY = laneY;
        this.direction = direction;
        this.speed = speed;
        this.body.setVelocityX(speed * direction);
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (!this.active) return;
        
// lag preventing
        const buffer = 100;
        if ((this.direction === 1 && this.x > this.scene.map.widthInPixels + buffer) || 
            (this.direction === -1 && this.x < -buffer)) {
            this.setActive(false);
            this.setVisible(false);
            this.body.setVelocityX(0);
        }
    }
}