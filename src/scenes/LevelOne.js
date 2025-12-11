import { Player } from '../gameobjects/Player.js';
import { MailBox } from '../gameobjects/MailBox.js';
import { Enemy } from '../gameobjects/Enemy.js';
import { WaterObstacle } from '../gameobjects/WaterObstacle.js';

export class LevelOne extends Phaser.Scene {
    constructor() {
        super('levelone');
    }

    preload() {
        this.load.tilemapTiledJSON('level_one_map', 'assets/basemap_level_one.tmj');
        this.load.image('tilemap', 'assets/tilemap.png');
        this.load.spritesheet('player', 'assets/Player.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('redcar', 'assets/redcar.png');
        this.load.image('taxicar', 'assets/taxicar.png');
        this.load.image('dot', 'assets/pointer.png');
        this.load.image('trashforwater', 'assets/trashforwater.png');
        this.load.audio('car_noise', 'assets/sounds/Street0.ogg');
        this.load.audio('music', 'assets/sounds/Sunlight Through Leaves.mp3');
        this.load.audio('car_hit', 'assets/sounds/Vehicle_Car_Trunk_Close_Impact_Mono.wav');
    }

    create() {
        this.sound.play('car_noise', {
            loop:true,
            volume:0.3
        });
        this.sound.play('music', {
            loop:true,
            volume:0.5
        });

        this.last_time = 0;
        this.physics.world.TILE_BIAS = 48;
        this.map = this.make.tilemap({ key: 'level_one_map', tileWidth: 16, tileHeight: 16});
        this.tileset = this.map.addTilesetImage('tilemap', 'tilemap', 16, 16, 0, 1);
        this.bglayer = this.map.createLayer("ground", this.tileset, 0, 0);
        this.roadlayer = this.map.createLayer("roads", this.tileset, 0, 0);
        this.mailboxlayer = this.map.createLayer("mailbox", this.tileset, 0, 0);
        this.waterlayer = this.map.createLayer("water_moving", this.tileset, 0, 0);
        this.pbclayer = this.map.createLayer("plants_behind_cars", this.tileset, 0, 0);
        this.plantlayer = this.map.createLayer("plants", this.tileset, 0, 0);
        this.buildinglayer = this.map.createLayer("buildings", this.tileset, 0, 0);
        this.decorlayer = this.map.createLayer("decor", this.tileset, 0, 0);
        
        this.plantlayer.setDepth(8);
        this.buildinglayer.setDepth(9);
        this.decorlayer.setDepth(10);

        // obj layer just like getting other layers
        this.objlayer = this.map.getObjectLayer("Objects");
        
        // lanes of the roads for cars
        this.roadLanes = this.getRoadLanes();
        
        // spawning 200 cars atta time
        this.enemies = this.physics.add.group({
            classType: Enemy,
            maxSize: 200,
            runChildUpdate: true
        });

        this.minCarSpacing = 80;
        this.startEnemySpawning();

        // setting up water trash
        this.waterObstacles = this.physics.add.group({
            classType: WaterObstacle,
            maxSize: 20,
            runChildUpdate: true
        });
        this.waterLanes = this.getWaterLanes();
        this.startWaterObstacleSpawning();

        // spawn
        this.spawnpoint = [this.map.widthInPixels/2, this.map.heightInPixels - 50 + 2 * this.map.tileHeight];
        this.mailboxspawnpoint = [0,0];

        // collision
        this.colisions = this.physics.add.staticGroup();
        this.buildings = this.physics.add.staticGroup();

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // tiled shtuff objs
        if (this.objlayer) {
            this.objlayer.objects.forEach(objData => { 
                const {x = 0, y = 0, name, width = 0, height = 0} = objData;
                if (name === "Spawn") {
                    this.spawnpoint = [x + 8, y + 8];
                }
                
                if (name === "Mailbox") {
                    this.mailboxspawnpoint = [x + 8, y + 8];
                }
                if (objData.text) {
                    // text
                    const { text, x, y } = objData;
                    const { text: textContent, pixelsize, fontfamily } = text;
                    
                    const textObj = this.add.text(x, y, textContent, {
                        fontSize: (pixelsize) + 'px',
                        fontFamily: fontfamily || 'Sans-serif',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 8, y: 4 },
                        stroke: '#000000',
                        strokeThickness: 4
                    });
                 //
                    textObj.setOrigin(0, 0);
                    textObj.setDepth(15);
                   
                    this.tweens.add({
                        targets: textObj,
                        alpha: 0.4,
                        duration: 800,
                        yoyo: true,
                        repeat: -1
                    });
                }

                if (name === "Object" || name === "Building") {
                    const shrink = 2;
                    const zone = this.add.zone( x + width / 2, y + height / 2, width - shrink * 2, height - shrink * 2);

                    this.physics.add.existing(zone, true);
                    zone.setVisible(false);
                    
                    if (name === "Object") this.colisions.add(zone);
                    if (name === "Building") this.buildings.add(zone);
                }});}

        // player spawn stuff from our old start.js that we removed
        this.player = new Player(this, this.spawnpoint[0], this.spawnpoint[1], 'player', 0);
        this.playerStartedMoving = false;
        this.playerLastTileY = this.player.y;
        this.playerHit = false;
        this.inputEnabled = true;
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.colisions);
        this.physics.add.collider(this.player, this.buildings);

        // collison PLEASE work
        this.physics.add.collider(this.player, this.waterObstacles);
// works
        // mailbox system
        this.mailbox = new MailBox(this, this.mailboxspawnpoint[0], this.mailboxspawnpoint[1], this.player, 'leveltwo');
        
        // camera
        this.cameraScrollSpeed = 4; 
        this.cameras.main.setZoom(4);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2;

        // enemy collision
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, null, this);

        // camera janky stuff for phaser thanks max for figuring out cause omg
        this.delay = 0;
        this.delayMax = .02;

        this.events.on('shutdown', () => {
            if (this.waterObstacleSpawnEvent) {
                this.waterObstacleSpawnEvent.remove();
            }
            if (this.enemySpawnEvent) {
                this.enemySpawnEvent.remove();
            }
        });
    }

    getRoadLanes() {
        const lanes = [];
        if (!this.roadlayer) return lanes;
        
        let insideRoadBlocks = false;
        let roadstartHeight = -1;
        
        // tmj roads
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
                insideRoadBlocks = true;
                roadstartHeight = y;
            } else if (!hasRoad && insideRoadBlocks) {
                insideRoadBlocks = false;
                const roadendHeight = y - 1;
                
                // top lane left bottom right
                lanes.push({ y: (roadstartHeight + 1) * this.map.tileHeight, direction: -1 });
                lanes.push({ y: (roadendHeight + 1) * this.map.tileHeight, direction: 1 });
            }
        }
        
        if (insideRoadBlocks) {
            const roadendHeight = this.map.height - 1;
            lanes.push({ y: (roadstartHeight + 1) * this.map.tileHeight, direction: -1 });
            lanes.push({ y: (roadendHeight + 1) * this.map.tileHeight, direction: 1 });
        }
        return lanes;
    }

    getWaterLanes() {
        const lanes = [];
        if (!this.waterlayer) return lanes;
        
        let insideWaterBlocks = false;
        let waterStartHeight = -1;
        
        // tmj water layer
        for (let y = 0; y < this.map.height; y++) {
            let hasWater = false;
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.waterlayer.getTileAt(x, y);
                if (tile && tile.index !== -1 && tile.index !== 0) {
                    hasWater = true;
                    break;
                }}
            
            if (hasWater && !insideWaterBlocks) {
                insideWaterBlocks = true;
                waterStartHeight = y;
            } else if (!hasWater && insideWaterBlocks) {
                insideWaterBlocks = false;
                const waterEndHeight = y - 1;
                
                // 6 high tile find the y center
                const startY = waterStartHeight * this.map.tileHeight;
                const endY = (waterEndHeight + 1) * this.map.tileHeight;
                const centerY = startY + (endY - startY) / 2;
                
                lanes.push({ 
                    y: centerY, 
                    direction: Phaser.Math.RND.pick([-1, 1])
                });
}
        }
        
        if (insideWaterBlocks) {
            const waterEndHeight = this.map.height - 1;
            const startY = waterStartHeight * this.map.tileHeight;
            const endY = (waterEndHeight + 1) * this.map.tileHeight;
            const centerY = startY + (endY - startY) / 2;
            
            lanes.push({  y: centerY, direction: Phaser.Math.RND.pick([-1, 1])});
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
            loop: true});
    }

    startWaterObstacleSpawning() {
        this.time.delayedCall(100, () => this.spawnWaterObstacle());
        
        this.waterObstacleSpawnEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                this.spawnWaterObstacle();
                this.waterObstacleSpawnEvent.delay = Phaser.Math.Between(66, 133);
            },
            loop: true});
    }

    spawnEnemy() {
        if (this.roadLanes.length === 0) return;
        
        const lane = Phaser.Math.RND.pick(this.roadLanes);
        const laneY = lane.y;
        const direction = lane.direction;
        let spawnCordX;
        if (direction === 1) {
            spawnCordX = -50;
        } else {
            spawnCordX = this.map.widthInPixels + 50;
        }
        let spawnY = laneY - 1;

        if (!this.isLaneClear(laneY, spawnCordX, direction)) {
            return;
        }

        const speed = 100;
        let enemy = this.enemies.getFirstDead(false);
        if (!enemy) {
            enemy = new Enemy(this, spawnCordX, spawnY);
            this.enemies.add(enemy);
        }
        enemy.spawn(spawnCordX, spawnY, direction, speed, laneY);
    }

    spawnWaterObstacle() {
        if (this.waterLanes.length === 0) return;
        
        const lane = Phaser.Math.RND.pick(this.waterLanes);
        const laneY = lane.y;
        const direction = lane.direction;
        let spawnX;

        if (direction === 1) {
        spawnX = -100;
        } else {
        spawnX = this.map.widthInPixels + 100;
        }
        
        if (!this.isWaterLaneClear(laneY, spawnX, direction)) {
            return;
        }
        
        const speed = 40;
        
        let obstacle = this.waterObstacles.getFirstDead(false);
        if (!obstacle) {
            obstacle = new WaterObstacle(this, spawnX, laneY);
            this.waterObstacles.add(obstacle);
        }
        obstacle.spawn(spawnX, laneY, direction, speed, laneY);
    }
// lane clear so no overlap
    isLaneClear(laneY, spawnCordX, direction) {
        const activeCars = this.enemies.getChildren().filter(enemy => {
            let enemyLane;
            if (enemy.laneY !== undefined) {
                enemyLane = enemy.laneY;
            } else {
                enemyLane = enemy.y;
            }
            return enemy.active && Math.abs(enemyLane - laneY) < 5 && enemy.direction === direction;});
//
        for (let car of activeCars) {
            //const distance = Math.abs(spawnCordX - car.x);
            const distance = Math.abs(car.x - spawnCordX);
            if (distance < this.minCarSpacing) {
                return false;
            }
        }
        return true;
    }

    isWaterLaneClear(laneY, spawnX, direction) {
        const activeObstacles = this.waterObstacles.getChildren().filter(obstacle => {
            let obstacleLane;
            if (obstacle.laneY !== undefined) {
                obstacleLane = obstacle.laneY;
            } else {
                obstacleLane = obstacle.y;
            }
            return obstacle.active && Math.abs(obstacleLane - laneY) < 5 && obstacle.direction === direction;
        });
        
        for (let obs of activeObstacles) {
            const distance = Math.abs(obs.x - spawnX);
            if (distance < 150) {
                return false;
            }
        }
        return true;
    }

    handlePlayerHit(player, enemy) {
        if (this.playerHit) return;

        if (player.isInvincible) {
            if (enemy) {
                enemy.destroy();
                return;
            }}

        this.playerHit = true;
        this.sound.play('car_hit');
        const cam = this.cameras.main;

        player.inputEnabled = false;
        player.setVelocity(0, 0);
        player.isMoving = false;
        player.anims.stop();

        cam.fadeOut(300, 0, 0, 0);

        cam.once('camerafadeoutcomplete', () => {
            this.time.delayedCall(500, () => {
                this.sound.stopAll();
                this.scene.restart();
            });
        });
    }

    checkWaterCollision() {
        if (this.playerHit) return;
        
        const playerTileX = Math.floor(this.player.x / this.map.tileWidth);
        const playerTileY = Math.floor(this.player.y / this.map.tileHeight);
        
        const waterTile = this.waterlayer.getTileAt(playerTileX, playerTileY);
        
        //player on water
        if (waterTile && waterTile.index !== -1 && waterTile.index !== 0) {
            // full png is a safe zone
            const onPlatform = this.waterObstacles.getChildren().some(obs => {
                if (!obs.active) return false;
                
                // safety buffer because this is hard
                const buffa = 4;
                const lefttrash = obs.x - 40 - buffa; //40
                const righttrash = obs.x + 40+ buffa;
                const trashHAT = obs.y- 48 - buffa;//48
                const trashShoes = obs.y + 48 + buffa;
                
                // player bonds
                return this.player.x >= lefttrash && this.player.x <= righttrash && this.player.y >= trashHAT && this.player.y <= trashShoes;
            });
            
            if (!onPlatform) {
                this.handleWaterHit();
        }
        }}

    handleWaterHit() {
        if (this.playerHit) return;
        this.playerHit = true;
        this.sound.play('car_hit');
        const cam = this.cameras.main;
        const player = this.player;
        player.inputEnabled = false;
        player.setVelocity(0, 0);
        player.isMoving = false;
        player.anims.stop(); 
        cam.fadeOut(300, 0, 0, 0);
        cam.once('camerafadeoutcomplete', () => {
            this.time.delayedCall(500, () => { this.sound.stopAll(); this.scene.restart();
            }); });}


    update(time, dt) {
        if (!this.inputEnabled) {
            this.player.setVelocity(0, 0);
            return;
        }
        // water collsison
        if (!this.player.isInvincible && !this.playerHit) {
            this.checkWaterCollision();}

        if (!this.playerStartedMoving) {
            if (this.player.y !== this.playerLastTileY) {
                this.playerStartedMoving = true;
            }
        }
        this.playerLastTileY = this.player.y; 

        if (this.playerStartedMoving) {
            const deltaMili = dt / 1000;
            this.delay += deltaMili;
            // SO FAST IF I DO this.delay = delatMili + 1; 
            if (this.delay > this.delayMax) {
                //this.cameras.main.scrollY = this.cameras.main.scrollY - this.cameraScrollSpeed * deltaMili;
                this.cameras.main.scrollY -= this.cameraScrollSpeed * deltaMili;
                this.delay = 0;}

            const camBottom = this.cameras.main.scrollY + this.cameras.main.height - 100;
            if (this.player.y > camBottom) {
                this.sound.stopAll();
                this.scene.restart();}}

        this.last_time = time;
        this.player.update(time, dt);
        this.mailbox.update(time, dt, this.player);
    }
}
