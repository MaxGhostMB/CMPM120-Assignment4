import { Start } from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    title: 'Delivery Boy',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    physics: {default: "arcade", 
        //arcade:{debug:true}
    },
    scene: [
        Start
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            