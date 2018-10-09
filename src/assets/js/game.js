var game = (function() {
	var c = document.getElementById('game'),
		ctx = c.getContext('2d');
	
	var PLAYER_INPUT_ALLOWED = false,
		GAME_PLAYING = false,
		PIPE_SPAWN_DIS = c.width / 2 + 52,
		PIPE_STARTING_OFFSET = c.width * 2,
		PIPE_SPACE = c.height / 5,
		PIPE_HEIGHT_RANGE_START = 150,
		PIPE_HEIGHT_RANGE_END = 512 - 112 - 200,
		GRAVITY = 4;
	
	var speed = 1, spanwedPipes = 0;

	var score = {
		_score: 0,
		inc: function() {
			this._score++;
			console.log('Score: ' + this._score);
		},
		get: function() {
			return this._score;
		},
		reset: function() {
			this._score = 0;
		}
	};

	// Background
	function Background(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}
	Background.prototype.update = function() {
		this.x -= speed;
		if(this.x <= -assets.background.width) {
			this.x = c.width;
		}
	};
	Background.prototype.draw = function() {
		ctx.drawImage(assets.background, this.x, this.y);
	};
	Background.prototype.reset = function() {

	};

	// Base
	function Base(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}
	Base.prototype.update = function() {
		this.x -= speed;
		if(this.x <= -assets.base.width) {
			this.x = assets.base.width;
		}
	};
	Base.prototype.draw = function() {
		ctx.drawImage(assets.base, this.x, this.y);
	};
	Base.prototype.reset = function() {

	};

	// Player
	function Player(x, y) {
		this.x = x || 65;
		this.y = y || 50;
		this.width = 34;
		this.height = 24;
		this.velocity = 2;
		this.animationTimer = Date.now();
		this.animationDuration = 450;
		this.animationIndex = 0;
	}
	Player.prototype.jump = function() {
		this.velocity = -3;
		this.animationIndex = 0;
	};
	Player.prototype.hasCollidedWithGround = function() {
		if(this.y + this.height > c.height - assets.base.height) {
			// Player hit ground
			return true;
		}
		return false;
	};
	Player.prototype.hasCollided = function() {
		if(this.hasCollidedWithGround()) {
			return true;
		}

		var playerX = this.x + this.width,
            playerTopY = this.y,
			playerBottomY = this.y + this.height;
			
		
		var hasCollided = false;

		objects.pipes.forEach((pipe) => {
			var pipeFrontX = pipe.x,
				pipeBackX = pipe.x + assets.pipe.width; 
			
			if(playerX > pipeFrontX  && playerX < pipeBackX) {
				if(playerBottomY > pipe.y) {				
					hasCollided = true;
				}
				if(playerTopY < pipe.y - PIPE_SPACE) {
					hasCollided = true;
				}
			}
		});

		return hasCollided;
	};
	Player.prototype.update = function() {
		if(this.velocity < 8) {
			this.velocity += GRAVITY / 1000 * deltaTime;
		}
		if(!this.hasCollidedWithGround()) {
			this.y += this.velocity;
		}

		if(this.hasCollided() && PLAYER_INPUT_ALLOWED) {
			PLAYER_INPUT_ALLOWED = false;
			speed = 0;
			setTimeout(() => {
				GAME_PLAYING = false;
			}, 500);
		}

		// Animation
		if(this.animationTimer < now && PLAYER_INPUT_ALLOWED) {
			this.animationIndex += 1;
			this.animationTimer = now + this.animationDuration;
			if(this.animationIndex > assets.bird.length - 1) {
				this.animationIndex = 0;
			}
		}
	};
	Player.prototype.draw = function() {
		console.log(this.animationIndex);
		ctx.drawImage(assets.bird[this.animationIndex], 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
	};
	Player.prototype.reset = function() {
		this.velocity = 2;
		this.y = 50;
	};

	// Pipe
	function Pipe() {
		this.x = this.calculateNewXPos();
		this.y = this.calculateNewYPos();
		this.pipeNumber = spanwedPipes;
		this.scored = false;
		spanwedPipes++;
	}
	Pipe.prototype.calculateNewXPos = function() {
		return spanwedPipes * PIPE_SPAWN_DIS;
	};
	Pipe.prototype.calculateNewYPos = function() {
		return Math.floor(Math.random() * PIPE_HEIGHT_RANGE_END) + PIPE_HEIGHT_RANGE_START;
	};
	Pipe.prototype.update = function() {
		this.x -= speed;
		if(!this.scored && this.x < objects.player.x) {
			score.inc();
			this.scored = true;
		}
		if(this.x <= -assets.pipe.width) {
			this.x = this.calculateNewXPos();
			this.y = this.calculateNewYPos();
			this.scored = false;
		}
	};
	Pipe.prototype.reset = function() {
		this.x = this.pipeNumber * PIPE_SPAWN_DIS + PIPE_STARTING_OFFSET;
		this.y = this.calculateNewYPos();
		this.scored = false;
	};
	Pipe.prototype.draw = function() {
		ctx.drawImage(assets.pipe, this.x, this.y);
		ctx.save();
		ctx.rotate(180 * Math.PI / 180);
		ctx.drawImage(assets.pipe, -this.x - assets.pipe.width, -this.y + PIPE_SPACE);
		ctx.restore();
	};

	function ScoreBoard(y) {
		this.y = y || 50;
		this.frontSpacing = 3;
	}
	ScoreBoard.prototype.update = function() {
		// Nothing to do
	};
	ScoreBoard.prototype.reset = function() {
		// Nothing to do
	};
	ScoreBoard.prototype.draw = function() {
		var str = score.get().toString();
		var sprites = [];
		for(var i = 0; i < str.length; i++) {
			var dig = str.charCodeAt(i);
			if(dig >= 48 && dig <= 57) {
				sprites.push(assets.font[dig - 48]);
			}
		}
		var totalWidth = 0;
		sprites.forEach((sprite) => {
			totalWidth += sprite.width;
			totalWidth += this.frontSpacing;
		});
		totalWidth -= this.frontSpacing;

		var curX = (c.width / 2) - (totalWidth / 2);
		sprites.forEach((letter) => {
			ctx.drawImage(letter, curX, this.y);
			curX += this.frontSpacing + letter.width;
		});
	};

	// Assets
	var assets = {};
	function loadAssets() {
		assets.background = loadImage('assets/sprites/background.png', 512, 288);
		assets.bird = [
			loadImage('assets/sprites/downflap.png', 24, 34),
			loadImage('assets/sprites/midflap.png', 24, 34),
			loadImage('assets/sprites/upflap.png', 24, 34)
		];
		assets.pipe = loadImage('assets/sprites/pipe.png', 320, 52);
		assets.base = loadImage('assets/sprites/base.png', 112, 336);
		assets.gameover = loadImage('assets/sprites/gameover.png', 42, 192);
		assets.font = {
			0: loadImage('assets/sprites/font/0.png', 36, 24),
			1: loadImage('assets/sprites/font/1.png', 36, 16),
			2: loadImage('assets/sprites/font/2.png', 36, 24),
			3: loadImage('assets/sprites/font/3.png', 36, 24),
			4: loadImage('assets/sprites/font/4.png', 36, 24),
			5: loadImage('assets/sprites/font/5.png', 36, 24),
			6: loadImage('assets/sprites/font/6.png', 36, 24),
			7: loadImage('assets/sprites/font/7.png', 36, 24),
			8: loadImage('assets/sprites/font/8.png', 36, 24),
			9: loadImage('assets/sprites/font/9.png', 36, 24)
		};
	}
	function loadImage(url, heiht, width) {
		var i = new Image(width, heiht);
		i.src = url;
		return i;
	}

	// Rendering / drawing
	function draw() {
		forEachNode(objects, (node) => {
			node.draw();
		});
	}

	function drawGameOverScene() {
		ctx.drawImage(assets.gameover, (c.width / 2) - (assets.gameover.width / 2), c.height / 4);
	}

	// Game loop
	var lastFrame = Date.now(), deltaTime = 0, now = Date.now();

	function update() {
		now = Date.now();
		deltaTime = now - lastFrame;
		forEachNode(objects, (node) => {
			node.update();
		});
		draw();
		if(!GAME_PLAYING) {
			drawGameOverScene();
		}
		lastFrame = now;
		window.requestAnimationFrame(update);
	}

	function resetGame() {
		// Reset game to inital
		score.reset();
		forEachNode(objects, (node) => {
			node.reset();
		});
		GAME_PLAYING = true;
		PLAYER_INPUT_ALLOWED = true;
		speed = 1;
	}

	function forEachNode(nodes, callback) {
		for(var key in nodes) {
			var node = nodes[key];
			if(Array.isArray(node)) {
				node.forEach((node) => {
					callback(node);
				});
			} else {
				callback(node);
			}
		}
	}

	var objects;
	function loadGame() {
		loadAssets();

		// Create Game Objects
		objects = {
			bg1: new Background(),
			bg2: new Background(c.width),
			pipes: [],
			ba1: new Base(0, c.height - assets.base.height),
			ba2: new Base(assets.base.width, c.height - assets.base.height),
			player: new Player(),
			board: new ScoreBoard()
		};

		for(var i = 0; i < 3; i++) {
			objects.pipes.push(new Pipe());
		}

		resetGame();
		update(); // Start game loop
	}

	window.onload = function() {
		// Input handeling
		c.addEventListener('click', function() {
			if(PLAYER_INPUT_ALLOWED && GAME_PLAYING) {
				objects.player.jump();
			}
			if(!GAME_PLAYING) {
				// Start / Restart game
				resetGame();
			}
		});
		loadGame();
	};

	return {
		// Im too bad in this game...
		godmod: function() {
			objects.player.hasCollided = () => {
				return false;
			};
		}
	};
})();
