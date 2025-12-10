export class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'pp') {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
    }

    collect(player) {
        this.destroy(); // remove the power-up
        player.activateInvincibility(2000);
    }
}