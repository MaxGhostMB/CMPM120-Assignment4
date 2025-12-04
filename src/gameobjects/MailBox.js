export class MailBox extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "mailbox");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setImmovable(true);
        this.body.setAllowGravity(false);

        // Proximity zone
        this.interactionZone = scene.add.zone(x, y, 16, 16);
        scene.physics.add.existing(this.interactionZone);
        this.interactionZone.body.setAllowGravity(false);
        this.interactionZone.body.setImmovable(true);

        // Arrow indicator (HUD)
        this.arrow = scene.add.image(0, 0, "arrow");
        this.arrow.setDisplaySize(16, 16);
        this.arrow.setScrollFactor(0);   // IMPORTANT
        this.arrow.setDepth(9999);       // ALWAYS ON TOP
        this.arrow.setVisible(false);

        this.nearPlayer = false;

        // Listen for interaction
        scene.input.keyboard.on("keydown-E", () => {
            if (this.nearPlayer) {
                this.onInteract();
            }
        });
    }

    onInteract() {
        console.log("Mailbox interacted — LEVEL COMPLETE.");
        this.scene.events.emit("level-complete");
    }

    update(time, delta, player, camera) {
        this.arrow.setVisible(true);
        this.arrow.x = 100;
        this.arrow.y = 100;
        // Reset each frame — scene can also reset
        this.nearPlayer = false;

        // Check overlap manually (no collider needed)
        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
        this.nearPlayer = dist < 24;

        // Update arrow visibility & position
        this.updateArrow(player, camera);
    }

    updateArrow(player, cam) {
        // TODO: MAKE THIS WORK!!!
    }
}
