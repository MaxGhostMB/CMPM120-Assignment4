export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.tilemapTiledJSON('base_map', 'assets/basemap2.tmj');
        this.load.image('tilemap', 'assets/tilemap.png');

    }

    create() {
        this.last_time = 0;
        this.physics.world.TILE_BIAS = 16;

        this.map = this.make.tilemap({ key: 'base_map', tileWidth: 16, tileHeight: 16 });
        this.tileset = this.map.addTilesetImage('tilemap');

        this.bglayer = this.map.createLayer("ground", this.tileset, 0, 0);
        this.platlayer = this.map.createLayer("platforms", this.tileset, 0, 0);
        this.obslayer = this.map.createLayer("obstacles", this.tileset, 0, 0);
        this.wallayer = this.map.createLayer("mailbox", this.tileset, 0, 0);

    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;
        
    }
    
}
