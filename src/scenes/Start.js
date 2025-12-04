import { Player } from '../gameobjects/Player.js';
import { Enemy } from '../gameobjects/Enemy.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.tilemapTiledJSON('base_map', 'assets/basemap_withroads_2.tmj');
        this.load.image('tilemap', 'assets/tilemap.png');
        this.load.spritesheet('player', 'assets/Player.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('redcar', 'assets/redcar.png');
        this.load.image('taxicar', 'assets/taxicar.png');
    }

    create() {
        this.last_time = 0;
        this.physics.world.TILE_BIAS = 48;
        this.map = this.make.tilemap({ key: 'base_map', tileWidth: 16, tileHeight: 16});
        this.tileset = this.map.addTilesetImage('tilemap', 'tilemap', 16, 16, 0, 1);
        this.bglayer = this.map.createLayer("ground", this.tileset, 0, 0);
        this.platlayer = this.map.createLayer("platforms", this.tileset, 0, 0);
        this.obslayer = this.map.createLayer("obstacles", this.tileset, 0, 0);
        this.mailboxlayer = this.map.createLayer("mailbox", this.tileset, 0, 0);
        //dis is what i added for enemies to track
        this.roadlayer = this.map.createLayer("roads", this.tileset, 0, 0);
        this.objlayer = this.map.getObjectLayer("Objects");
        // top lane is left lane bottom lane is right lane
        this.roadLanes = this.getRoadLanes();
        //just checking
        //console.log('roads lanes found ', this.roadLanes);
        // tons of cars (200) available
        this.enemies = this.physics.add.group({
            classType: Enemy,
            maxSize: 200,
            runChildUpdate: true
        });


        //we can change this per level or something idk if we wanna change difficulty
        this.minCarSpacing = 80;
        this.startEnemySpawning();
        this.spawnpoint = [this.map.widthInPixels/2, this.map.heightInPixels - 50 + 2 * this.map.tileHeight];


        if (this.objlayer) {
            this.objlayer.objects.forEach(objData => { const {x = 0, y = 0, name} = objData;
                if (name === "Spawn") {
                    // spawn
                    this.spawnpoint = [x + 8, y + 8];
                }
            });}

        this.player = new Player(this, this.spawnpoint[0], this.spawnpoint[1], 'player', 0);
        this.cameras.main.setZoom(4);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, null, this);
    }

    getRoadLanes() {
        const lanes = [];
        if (!this.roadlayer) return lanes;
        
        let insideRoadBlocks = false;
        let roadstartHeight = -1;
        
        // check tmj for roads
        for (let y = 0; y < this.map.height; y++) {
            let hasRoad = false;
            for (let x = 0; x < Math.min(3, this.map.width); x++) {
                const tile = this.roadlayer.getTileAt(x, y);
                if (tile && tile.index !== -1) {
                    hasRoad = true;
                    break;
                }
            }
            
            if (hasRoad && !insideRoadBlocks) {
                // road starts
                insideRoadBlocks = true;
                roadstartHeight = y;
            } else if (!hasRoad && insideRoadBlocks) {
                // road ends
                insideRoadBlocks = false;
                const roadendHeight = y - 1;
                
                // Top lane aka left lane has left moving cars
                lanes.push({ y: (roadstartHeight + 1) * this.map.tileHeight, direction: -1 });
                
                // bottom lane aka right lane has right moving cars
                lanes.push({ y: (roadendHeight + 1) * this.map.tileHeight, direction: 1 });
            }
        }
        
        if (insideRoadBlocks) {
            // if road goes to end of map
            const roadendHeight = this.map.height - 1;
            lanes.push({ y: (roadstartHeight + 1) * this.map.tileHeight, direction: -1 });
            lanes.push({ y: (roadendHeight + 1) * this.map.tileHeight, direction: 1 });
        }
        return lanes;
    }

    startEnemySpawning() {
        this.time.delayedCall(100, () => this.spawnEnemy());
        
        this.enemySpawnEvent = this.time.addEvent({
            delay: 50,
            callback: () => {
                this.spawnEnemy();
                this.enemySpawnEvent.delay = Phaser.Math.Between(33, 66);
            },
            loop: true
    });}

    spawnEnemy() {
        if (this.roadLanes.length === 0) return;
        
        // for picking a lane for the car
        const lane = Phaser.Math.RND.pick(this.roadLanes);
        const laneY = lane.y;
        const direction = lane.direction;
        let spawnCordX;
        if (direction === 1) {
            spawnCordX = -50;
        } else {
            spawnCordX = this.map.widthInPixels + 50;}
        
        if (!this.isLaneClear(laneY, spawnCordX, direction)) {
            return;}
        
        const speed = 100;
        
        let enemy = this.enemies.getFirstDead(false);
        if (!enemy) {
            enemy = new Enemy(this, spawnCordX, laneY);
            this.enemies.add(enemy);
        }
        
        enemy.spawn(spawnCordX, laneY, direction, speed);
    }

    isLaneClear(laneY, spawnCordX, direction) {
        const activeCars = this.enemies.getChildren().filter(enemy => enemy.active && Math.abs(enemy.y - laneY) < 5 && enemy.direction === direction
        );

        for (let car of activeCars) {
            const distance = Math.abs(car.x - spawnCordX);
            if (distance< this.minCarSpacing) {
                return false;
            }}
        return true; }

    handlePlayerHit(player, enemy) {
        player.setPosition(this.spawnpoint[0], this.spawnpoint[1]);
        if (player.body) {
            player.body.setVelocity(0, 0);
        }
        player.isMoving = false;
        player.anims.stop();
    }

    update(time, dt) {
        this.last_time = time;
        this.player.update(time, dt);
    }
}
