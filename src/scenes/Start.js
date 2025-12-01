import { Player } from '../gameobjects/Player.js';

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.tilemapTiledJSON('base_map', 'assets/basemap2.tmj');
        this.load.image('tilemap', 'assets/tilemap.png');
        this.load.spritesheet('player', 'assets/Player.png', {frameWidth: 16, frameHeight: 16}); // startFrame: 0, endFrame: 11, margin: 0, spacing: 1

    }

    create() {
        this.last_time = 0;
        this.physics.world.TILE_BIAS = 48;

        this.map = this.make.tilemap({ key: 'base_map', tileWidth: 16, tileHeight: 16, spacing: 1});
        this.tileset = this.map.addTilesetImage('tilemap');

        this.bglayer = this.map.createLayer("ground", this.tileset, 0, 0);
        this.platlayer = this.map.createLayer("platforms", this.tileset, 0, 0);
        this.obslayer = this.map.createLayer("obstacles", this.tileset, 0, 0);
        this.mailboxlayer = this.map.createLayer("mailbox", this.tileset, 0, 0);
        this.objlayer = this.map.getObjectLayer("Objects");

        this.spawnpoint = [0,0];

        this.objlayer.objects.forEach(objData => {
            const {x = 0, y = 0, name, width = 0, height = 0} = objData;
            switch(name) {
                case "Spawn":
                    this.spawnpoint = [x + 8, y + 8];
                    break;
                default:
                    console.log("Unknown object: " + name);
            }
        });


        this.player = new Player(this, this.spawnpoint[0], this.spawnpoint[1], 'player', 0);
        
        this.cameras.main.setZoom(4);

        this.cameras.main.startFollow(this.player);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;
        this.player.update(time, dt);
    }
    
}
