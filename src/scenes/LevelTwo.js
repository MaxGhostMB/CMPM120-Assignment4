import { Player } from '../gameobjects/Player.js';
import { MailBox } from '../gameobjects/MailBox.js';
import { Enemy } from '../gameobjects/Enemy.js';
import { PowerUp } from '../gameobjects/Powerup.js';

export class leveltwo extends Phaser.Scene {
    constructor() {
        super('leveltwo');
    }

    preload() {
        this.load.tilemapTiledJSON('base_map', 'assets/basemap_level_two.tmj');
        this.load.image('tilemap', 'assets/tilemap.png');
        this.load.spritesheet('player', 'assets/Player.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('redcar', 'assets/redcar.png');
        this.load.image('taxicar', 'assets/taxicar.png');
        this.load.image('dot', 'assets/pointer.png');
        this.load.image('pp', 'assets/Skateboard.png');
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
        this.map = this.make.tilemap({ key: 'base_map', tileWidth: 16, tileHeight: 16});
        this.tileset = this.map.addTilesetImage('tilemap', 'tilemap', 16, 16);
        this.bglayer = this.map.createLayer("bg", this.tileset);
        this.grounglayer = this.map.createLayer("ground", this.tileset);
        this.mailboxlayer = this.map.createLayer("mailbox", this.tileset);
        this.roadlayer = this.map.createLayer("roads", this.tileset);
        this.pbclayer = this.map.createLayer("plants_behind_cars", this.tileset);
        this.waterlayer = this.map.createLayer("water", this.tileset);
        //this.plantlayer = this.map.createLayer("plants", this.tileset);
        //dis is what i added for enemies to track
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

        this.plantlayer = this.map.createLayer("plants", this.tileset);
        this.buildinglayer = this.map.createLayer("buildings", this.tileset);
        this.decorlayer = this.map.createLayer("decor", this.tileset);
        this.plantlayer.setDepth(8);
        this.buildinglayer.setDepth(9);
        this.decorlayer.setDepth(10);


        this.spawnpoint = [this.map.widthInPixels/2, this.map.heightInPixels - 50 + 2 * this.map.tileHeight];
        this.mailboxspawnpoint = [0,0];

        this.colisions = this.physics.add.staticGroup();
        this.buildings = this.physics.add.staticGroup();
        this.powerups = this.physics.add.group({
            classType: PowerUp,
            runChildUpdate: true
        });

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // this.add.graphics()
        //     .lineStyle(2, 0xff0000)
        //     .strokeRectShape(this.physics.world.bounds);

        if (this.objlayer) {
            this.objlayer.objects.forEach(objData => { 
                const {x = 0, y = 0, name, width = 0, height = 0} = objData;
                if (name === "Spawn") {
                    // spawn
                    this.spawnpoint = [x + 8, y + 8];
                }
                if (name === "Mailbox") {
                    // spawn
                    this.mailboxspawnpoint = [x + 8, y + 8];
                }
                if (name === "Object" || name === "Building") {
                    const shrink = 2;  // you can tweak this

                    // Add zone slightly smaller
                    const zone = this.add.zone(
                        x + width / 2,   // center X
                        y + height / 2,  // center Y
                        width - shrink * 2,   // new width
                        height - shrink * 2   // new height
                    );

                    // Add a static Arcade Physics body
                    this.physics.add.existing(zone, true);  // `true` = static body

                    // Optional: hide the zone
                    zone.setVisible(false);
                    // Add to the right array/group
                    if (name === "Object") this.colisions.add(zone);
                    if (name === "Building") this.buildings.add(zone);
                }
                if (name === "Power-up") {
                    const pu = new PowerUp(this, x + 8, y + 8, 'pp');
                    this.powerups.add(pu);

                }
            });
        }

        this.player = new Player(this, this.spawnpoint[0], this.spawnpoint[1], 'player', 0);
        this.playerStartedMoving = false;
        this.playerLastTileY = this.player.y;

        this.playerHit = false;
        this.inputEnabled = true;
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.colisions);
        this.physics.add.collider(this.player, this.buildings);

        this.mailbox = new MailBox(this, this.mailboxspawnpoint[0], this.mailboxspawnpoint[1], this.player);
        
        this.cameraScrollSpeed = 4; 

        this.cameras.main.setZoom(4);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        //this.cameras.main.scrollY = this.map.heightInPixels - this.cameras.main.height;
        this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2;

        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, null, this);

        this.cameraScrollY = this.player.y - this.cameras.main.height / 2; // starting camera Y
        this.cameras.main.scrollY = this.cameraScrollY;

        // remove me later
        this.delay = 0;
        this.delayMax = .02;

        this.physics.add.overlap(this.player, this.powerups, (player, powerUp) => {
            console.log('power up detected')
            powerUp.collect(player);
        });
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
            spawnCordX = this.map.widthInPixels + 50;
        }

        // adjusts right lane cars more so that the player can stand in middle of road and also on sides without getting hit by hit boxes
        let spawnY = laneY;
        if (direction === -1) {
            spawnY = laneY - 1;
        } else if (direction === 1) {
            // adjusts right lane cars more so that the player can stand in middle of road
            spawnY = laneY - 1;
        }

        if (!this.isLaneClear(laneY, spawnCordX, direction)) {
            return;}

        const speed = 100;

        let enemy = this.enemies.getFirstDead(false);
        if (!enemy) {
            enemy = new Enemy(this, spawnCordX, spawnY);
            this.enemies.add(enemy);
        }

        // pass the original laneY so the enemy keeps a reference to its lane
        enemy.spawn(spawnCordX, spawnY, direction, speed, laneY);
    }

    isLaneClear(laneY, spawnCordX, direction) {
        const activeCars = this.enemies.getChildren().filter(enemy => {
            const enemyLane = (enemy.laneY !== undefined) ? enemy.laneY : enemy.y;
            return enemy.active && Math.abs(enemyLane - laneY) < 5 && enemy.direction === direction;
        });

        for (let car of activeCars) {
            const distance = Math.abs(car.x - spawnCordX);
            if (distance < this.minCarSpacing) {
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
                return
            }
        }

        this.playerHit = true;

        this.sound.play('car_hit');
        const cam = this.cameras.main;

        // STOP all player movement immediately
        player.inputEnabled = false;
        player.setVelocity(0, 0);
        player.isMoving = false;
        player.anims.stop();

        // Fade Out
        cam.fadeOut(300, 0, 0, 0);

        cam.once('camerafadeoutcomplete', () => {
            this.time.delayedCall(500, () => { // 500ms = half a second
                this.sound.stopAll();
                this.scene.restart();
            });
        });
    }

    update(time, dt) {
        if (!this.inputEnabled) {
            this.setVelocity(0, 0);
            return; // completely stop movement + ignore keys
        }

        if (!this.playerStartedMoving) {
            if (this.player.y !== this.playerLastTileY) { // player has moved vertically
                this.playerStartedMoving = true;
            }
        }
        this.playerLastTileY = this.player.y; 


        if (this.playerStartedMoving) {
            const deltaMili = dt / 1000;
            this.delay += deltaMili;
            if (this.delay > this.delayMax) {
                this.cameras.main.scrollY -= this.cameraScrollSpeed * deltaMili;
                this.delay = 0;
            }

            const camBottom = this.cameras.main.scrollY + this.cameras.main.height - 100;

            if (this.player.y > camBottom ) {  // 20px buffer
                this.sound.stopAll();
                this.scene.restart();
            }

        }

        this.last_time = time;
        this.player.update(time, dt);
        this.mailbox.update(time, dt, this.player);
    }
}
