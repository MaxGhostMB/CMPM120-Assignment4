export class MailBox extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, player, targetScene = null) {
        super(scene, x, y, 'dot');
        this.setVisible(false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.player = player;
        this.targetScene = targetScene; //transiiton scene
        this.nearPlayer = false;
        this.hasInteracted = false;

        // arrow more logic down below
        this.dot = scene.add.sprite(x, y, "dot");
        this.dot.setScale(0.025);
        this.dot.setDepth(15);

        // e
        scene.input.keyboard.on("keydown-E", () => {
            if (this.nearPlayer && !this.hasInteracted) {
                this.onInteract();
            } }); }

    onInteract() {
        this.hasInteracted = true;
        //console.log(`Loading ${this.targetScene || 'broke'}`);
        
        // fod audio logistics and not funky
        this.scene.sound.stopAll();
        
        // scne trans
        if (this.targetScene) {
            this.scene.scene.start(this.targetScene);
        }
    }

    update(time, delta, player) {
        const cam = this.scene.cameras.main;
        const view = cam.worldView;

        // check if player close to mail box (i did 1.5 tiles you can change it if you want)
        const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
        this.nearPlayer = distance < 24;

        // arrow logic
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

        // arrow pos
        if (offscreen) {
            this.dot.setPosition(arrowX, arrowY);
        } else {
            this.dot.setPosition(player.x, player.y - 20);
        }

        this.dot.setVisible(true);

        // Rotate arrow to point toward mailbox
        const angle = Phaser.Math.Angle.Between(this.dot.x, this.dot.y, this.x, this.y);
        this.dot.rotation = angle;
    }
}
