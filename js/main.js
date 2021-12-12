//Basisconfiguratie
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 300,
      },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

//Inladen van de variabelen
var player;
var mouse;
var dog;
var platforms;
var cursors;
var score = 0;
var gameWon = false;
var gameLost = false;
var scoreText;
var winText;
var points;
var resize;
var spikes;
var health = 1;

//Het opzetten van de game met de gegevens uit de basisconfiguratie
var game = new Phaser.Game(config);

//Voorladen van de afbeeldingen, spiresheets en audio
function preload() {
  this.load.image("sky", "assets/sky4.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("ground-small", "assets/platform-small.png");
  this.load.image("ground-extra-small", "assets/platform-extra-small.png");
  this.load.image("mouse", "assets/mouse.png");
  this.load.image("points", "assets/chicken.png");
  this.load.image("spikes", "assets/spikey.png");
  this.load.image("resize", "assets/resize.png");

  this.load.image("dog", "assets/dog.png");
  this.load.spritesheet("cat", "assets/cat.png", {
    frameWidth: 55,
    frameHeight: 60,
  });

  //Het voorladen van de audio
  this.load.audio("collectSound", "assets/audio/p-ping.mp3");
  this.load.audio("gameSound", "assets/audio/oedipus_ark_pandora.mp3");
  this.load.audio("winSound", "assets/audio/win-sound.mp3");
  this.load.audio("loseSound", "assets/audio/lose-sound.mp3");
  this.load.audio("collectPoints", "assets/audio/collect-points.mp3");
  this.load.audio("collectResize", "assets/audio/collect-resize.mp3");
}

function create() {
  //Deze code zorgt ervoor dat er een achtergrondmuziekje wordt afgespeeld zodra je de kat begint te bewegen
  gameSound = this.sound.add("gameSound");
  gameSound.setLoop(true);
  gameSound.play();

  //Dit stukje code zorgt voor een statische achtergrond, 'de sky'
  this.add.image(400, 400, "sky");
  platforms = this.physics.add.staticGroup();

  //Dit stukje code zorgt voor de platforms in het spel.
  platforms.create(400, 800, "ground");
  platforms.create(900, 625, "ground");
  platforms.create(-50, 550, "ground");
  platforms.create(900, 380, "ground");
  platforms.create(90, 125, "ground-small");
  platforms.create(320, 220, "ground-extra-small");

  //Dit stukje code zorgt ervoor dat de speler, de kat, wordt ingeladen.
  //Ik vond de spritesheet net iets te klein, daarom heb ik de scale een stukje opgevoerd naar 1.2
  player = this.physics.add.sprite(100, 650, "cat").setScale(1.2);

  //Dit stukje code zorgt ervoor dat de speler een klein stukje stuitert na een sprongt
  //De tweede regel code zorgt ervoor dat de speler niet uit de map kan lopen. Je kan niet buiten het canvas komen
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //'this.anims.create' zorgen ervoor dat de juiste stukjes van de spritesheets worden afgespeeld
  //Wanneer je op het linkerpijltje op je toetsenbord klikt, zie je een andere spritesheet dan wanneer je naar rechts gaat
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("cat", {
      start: 0,
      end: 1,
    }),
    frameRate: 5,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [
      {
        key: "cat",
        frame: 2,
      },
    ],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("cat", {
      start: 3,
      end: 4,
    }),
    frameRate: 5,
    repeat: -1,
  });

  //Dit stukje code zorgt ervoor dat de input van de pijltjes toetsen wordt geaccepteerd (left, up, right en down)
  //Pijltje omlaag heeft tevens geen functie in mijn game
  cursors = this.input.keyboard.createCursorKeys();

  //Het bepalen van de positie van de vijand, de hond
  dog = this.physics.add.group({
    key: "dog",
    setXY: {
      x: 100,
      y: 20,
    },
  });

  //Het bepalen van de posities van de muisjes, doordat ik deze 4x repeat krijg ik er uiteindelijk 5 stuks
  //'stepX' zorgt ervoor dat er tussen elk muisje 170 pixels zit, waardoor het mooi over de map is verdeeld
  mouse = this.physics.add.group({
    key: "mouse",
    repeat: 4,
    setXY: {
      x: 50,
      y: 40,
      stepX: 170,
    },
  });

  //Het bepalen van de positie van het kippenboutje
  points = this.physics.add.group({
    key: "points",
    setXY: {
      x: 100,
      y: 450,
    },
  });

  //Het bepalen van de positie van het rode flesje
  resize = this.physics.add.group({
    key: "resize",
    setXY: {
      x: 650,
      y: 550,
    },
  });

  //Het bepalen van de positie van het obstakel, de spikes
  spikes = this.physics.add.group({
    key: "spikes",
    setXY: {
      x: 645,
      y: 330,
    },
  });

  //Zorgt ervoor dat het hondje kan lopen en binnen het canvas van het spel blijft door 'setColliderWorldBounds(true)'
  //De snelheid van de hond is gezet op 85 op de x-as
  dog.getChildren().forEach(function (dog) {
    dog.body.setBounceX(1);
    dog.body.setCollideWorldBounds(true);
    dog.body.setVelocityX(85);
  });

  //Maakt het scorebord bovenin het scherm aan, deze wordt geupdate door een functie, deze staat in onderin de code, in het update() gedeelte
  scoreText = this.add.text(575, 20, "Score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  //Zorgt voor de tekst onderin het scherm dat uitlegt hoe je het spel moet bedienen
  playText = this.add.text(
    10,
    778,
    "Use the arrows on your keyboard to move the cat. Good luck!",
    {
      fontSize: "16px",
      fill: "#FFF",
    }
  );

  //Wanneer je 50 of 75 punten hebt gepakt, zie je bovenin het scherm dat je hebt gewonnen
  winText = this.add.text(50, 16, "You win! Click the screen to retry.", {
    fontSize: "32px",
    fill: "#000",
  });
  winText.visible = false;

  //Zorgt ervoor dat je een melding in beeld krijgt wanneer je 'dood' bent, dan zie je bovenin het scherm dat je hebt verloren, waarna je vervolgens op 'Retry' kunt klikken door ergens in het spel te klikken
  loseText = this.add.text(50, 16, "You lose! Click the screen to retry.", {
    fontSize: "32px",
    fill: "#000",
  });
  loseText.visible = false;

  //De colliders zorgen ervoor dat je alle elementen op de platforms blijven staan
  //Wanneer ik een van deze regels zou weglaten, zou bijvoorbeeld de kat, het hondje of de muisjes voor de map vallen
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(mouse, platforms);
  this.physics.add.collider(dog, platforms);
  this.physics.add.collider(points, platforms);
  this.physics.add.collider(spikes, platforms);
  this.physics.add.collider(resize, platforms);

  //Bekijkt of de speler overlapt met de muisjes, waarna de functie collectMouse wordt aangeroepen
  this.physics.add.overlap(player, mouse, collectMouse, null, this);

  //Bekijkt of de speler overlapt met het hondje, waarna de functie dogHit wordt aangeroepen
  this.physics.add.overlap(player, mouse, dogHit, null, this);
  this.physics.add.collider(player, dog, dogHit, null, this);

  //Bekijkt of de speler overlapt met het kippenboutje waarna de functie pointsUse wordt aangeroepen
  this.physics.add.overlap(player, mouse, pointsUse, null, this);
  this.physics.add.collider(player, points, pointsUse, null, this);

  //Bekijkt of de speler overlapt met het rode flesje waarna de functie pointsUse wordt aangeroepen
  this.physics.add.overlap(player, mouse, resizeUse, null, this);
  this.physics.add.collider(player, resize, resizeUse, null, this);

  //Bekijkt of de speler overlapt met de spikes, waarna de functie hitSpikewordt aangeroepen
  this.physics.add.overlap(player, spikes, hitSpike, null, this);
  this.physics.add.collider(player, spikes, hitSpike, null, this);

  // this.physics.add.collider(player, dog, hitdog, mouse, this);
}

//Update is verantwoordelijk voor het bijwerken en opnieuw tekenen van de spelobjecten. Phaser ververst dit 60 frames per seconde, dat betekent dat het je spel 60 keer per seconde bijwerkt, zolang de status actief is.
function update() {
  if (gameWon) {
    gameWon = false;
    score = 0;
    health = 1;
    return;
  }

  if (gameLost) {
    gameLost = false;
    score = 0;
    health = 1;
    return;
  }

  //Zorgt voor de snelheid van de kat wanneer een van de pijltjes toetsen worden ingedrukt
  //Wanneer ik een hogere waarde invoer bij 'setVelocityX(WAARDE), gaat de kat sneller rennen... of hoger springen
  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);

    player.anims.play("turn");
  }

  //Zorgt ervoor dat ik kan bewegen terwijl ik ga springen, wel zo handig in een platform game :-)
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-350);
  }
}

//De funcite collectMouse zorgt ervoor dat er 10 punten bij je score worden opgetelt wanneer je een muis oppakt
//Ook wordt er een geluid afgespeeld wanneer je een muisje oppakt
//Wanneer je score 50 of 75 is, wordt je score onzichtbaard en stop de muziek, waarna de kat groen wordt en niet van zijn plek af kan komen, zodat je niet door een lege map rondloopt
function collectMouse(player, mouse) {
  mouse.disableBody(true, true);

  score += 10;
  scoreText.setText("Score: " + score);

  let collectSound = this.sound.add("collectSound");
  collectSound.play();

  if (score == 50 || score == 75) {
    winText.visible = true;
    scoreText.visible = false;
    let winSound = this.sound.add("winSound");
    winSound.play();

    gameSound.stop();

    this.physics.pause();
    player.setTint(0x27e727);
    player.anims.play("turn");
    gameWon = true;
    this.input.on("pointerdown", () => this.scene.start());
  }
}

//De functie hitSpike wordt aangesproken wanneer de speler de spikes aanraakt, waardoor de speler dood gaat
//Het health systeem staat standaard op 0, dit is te zien bovenin bij de variabelen
//Wanneer je de spikes aanraakt gaat er 1 waarde af (min dus)
//De if-statement checkt constant je levens, wanneer deze op 0 staat, speelt er een 'lose sound' af, deze laat je weten dat je hebt verloren
//Daarna komt er een melding in beeld (loseText), dat je laat weten dat je het spel kan herstarten door ergens willekeurig op het scherm te klikken
function hitSpike(player, spikes) {
  health -= 1;

  if (health == 0) {
    let loseSound = this.sound.add("loseSound");
    loseSound.play();
    gameSound.stop();

    loseText.visible = true;
    scoreText.visible = false;
    // healthText.visible = false;

    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameLost = true;
    this.input.on("pointerdown", () => this.scene.start());
  }
}
//De functie hitDog wordt aangesproken wanneer de speler de hond aanraakt, waardoor de speler dood gaat
//Het health systeem staat standaard op 0, dit is te zien bovenin bij de variabelen
//Wanneer je de hond aanraakt gaat er 1 waarde af (min dus)
//De if-statement checkt constant je levens, wanneer deze op 0 staat, speelt er een 'lose sound' af, deze laat je weten dat je hebt verloren
//Daarna komt er een melding in beeld (loseText), dat je laat weten dat je het spel kan herstarten door ergens willekeurig op het scherm te klikken
function dogHit(player, dog) {
  health -= 1;

  if (health == 0) {
    let loseSound = this.sound.add("loseSound");
    loseSound.play();
    gameSound.stop();

    loseText.visible = true;
    scoreText.visible = false;

    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameLost = true;
    this.input.on("pointerdown", () => this.scene.start());
  }
}

//De functie pointsUse wordt aangesproken wanneer de speler het kippenboutje aanraakt
//Het stukje 'disableBody(true, true)' zorgt ervoor dat het kippenboutje verdwijnt zodra deze wordt opgepakt
//Ook wordt er een speciaal geluidje afgespeeld bij het oppakken van het kippenboutje
//Vervolgens worden er 25 punten toegevoegd aan je scoreboard
function pointsUse(player, points) {
  points.disableBody(true, true);

  let collectPoints = this.sound.add("collectPoints");
  collectPoints.play();

  score += 25;
  scoreText.setText("Score: " + score);
}

//De functie resizeUse wordt aangesproken wanneer de speler het rode flesje aanraakt
//Het stukje 'disableBody(true, true)' zorgt ervoor dat het flesje verdwijnt zodra deze wordt opgepakt
//Ook wordt er een speciaal geluidje afgespeeld bij het oppakken van het flesje
//Zorgt ervoor dat de speler verkleind om door smalle doorgangen te kunnen lopen (niet in deze map beschikbaar)
function resizeUse(player, resize) {
  resize.disableBody(true, true);
  let collectResize = this.sound.add("collectResize");
  collectResize.play();
  player.displayWidth = (40, 40);
  player.displayHeight = (40, 40);
}
