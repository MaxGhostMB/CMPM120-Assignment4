export class MailBox extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player) {
        super(scene, x, y);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setImmovable(true);
        this.body.setAllowGravity(false);

        // Proximity zone
        player;
        this.interactionZone = scene.add.zone(x, y, 16, 16);
        scene.physics.add.existing(this.interactionZone);
        scene.physics.add.overlap(player, this.interactionZone, (playerObj, zoneObj) => {
            console.log("Overlap!");
            this.nearPlayer = true;
        });
        this.interactionZone.body.setAllowGravity(false);
        this.interactionZone.body.setImmovable(true);

        this.nearPlayer = false;

        this.dot = scene.add.sprite(x, y, "dot");
        this.dot.setScale(0.025);
        this.dot.setDepth(15);

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

    update(time, delta, player) {
        const cam = this.scene.cameras.main;
        const view = cam.worldView;

        let arrowX = this.x;
        let arrowY = this.y;
        let offscreen = false;

        if (this.x < view.x) {
            arrowX = view.x + 5;
            offscreen = true;
        } else if (this.x > view.x + view.width) {
            arrowX = view.x + view.width - 5;
            offscreen = true;
        }

        if (this.y < view.y) {
            arrowY = view.y + 5;
            offscreen = true;
        } else if (this.y > view.y + view.height) {
            arrowY = view.y + view.height - 5;
            offscreen = true;
        }

        if (offscreen) {
            // Clamp to edge
            this.dot.setPosition(arrowX, arrowY);
        } else {
            // Mailbox is visible → place arrow above player
            this.dot.setPosition(player.x, player.y - 20);
        }

        this.dot.setVisible(true);

        const angle = Phaser.Math.Angle.Between(
            this.dot.x,
            this.dot.y,
            this.x,       // mailbox.x
            this.y        // mailbox.y
        );

        this.dot.rotation = angle;
    }
}
