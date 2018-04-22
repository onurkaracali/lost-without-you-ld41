const env = require('./env.js');
const Calc = require('./utils/calc');
const Ease = require('./utils/ease');
const Keys = require('./input/keys');
const LevelManager = require('./level/manager');
const StateManager = require('./state/manager');
const Time = require('./core/time');
const World = require('./core/world');

require('howler');

class Game {

  constructor() {
    this.build();
  }

  build() {
    this.env = env;
    this.calc = new Calc();
    this.ease = new Ease();

    this.debug = location.hash.indexOf('debug') > -1;
    this.resolution = {};

    this.setupDOM();
    this.setupTime();
    this.setupWorld();
    this.setupStates();
    this.setupFireflies();
    this.setupLevels();
    this.setupInputs();
    this.setupSounds();
    this.onResize();
    this.start();
    this.observe();
  }

  setupDOM() {
    this.dom = {};
    this.dom.container = document.querySelector('.container');
  }

  setupTime() {
    this.time = new Time();
  }

  setupWorld() {
    this.world = new World({ game: this });
  }

  setupStates() {
    this.stateManager = new StateManager(this);
    this.stateManager.set('play');
  }

  setupFireflies() {
    this.fireflyGeometry = new THREE.SphereBufferGeometry(0.01, 0.01, 72, 72);
    this.fireflyMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let size = 512;
    canvas.width = size;
    canvas.height = size;
    let glow_gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    let steps = 20;
    for(let i = 0; i < steps; i++) {
      let p = i / (steps - 1);
      let a = this.calc.map(this.ease.outExpo(p, 0, 1, 1), 0, 1, 1, 0);
      glow_gradient.addColorStop(p, `hsla(60, 100%, 40%, ${a})`);
    }
    ctx.fillStyle = glow_gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    this.fireflyGlowMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    this.fireflies = [];
  }

  setupLevels() {
    this.wallGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    this.wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      specular: 0x666666,
      shininess: 20
    });

    this.levelManager = new LevelManager(this);
    this.levelManager.build('alpha');

    this.heroA.setActive(true);
    this.activeHero = this.heroA;
  }

  setupInputs() {
    this.keys = new Keys();
    this.dir = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  setupSounds() {
    this.sounds = {};
  }

  playSound(sound, config = null) {
    if(!this.muted) {
      if(config && config.volume) {
        sound.volume(config.volume);
      }
      if(config && config.rate) {
        sound.rate(config.rate);
      }
      sound.play();
    }
  }

  observe() {
    window.addEventListener('resize', () => this.onResize());

    this.env.eventful.on('dir-pressed', (e) => this.onDirPressed(e));
    this.env.eventful.on('dir-released', (e) => this.onDirReleased(e));
  }

  onResize() {
    let ratioWin = window.innerWidth / window.innerHeight;
    let ratioGame = 16 / 9;

    if(ratioWin > ratioGame) {
      this.resolution.x = window.innerHeight * ratioGame;
      this.resolution.y = window.innerHeight;
    } else {
      this.resolution.x = window.innerWidth;
      this.resolution.y = window.innerWidth / ratioGame;
    }

    this.aspect = this.resolution.x / this.resolution.y;
    this.dpr = window.devicePixelRatio > 1 ? 2 : 1;

    this.dom.container.style.width = `${this.resolution.x}px`;
    this.dom.container.style.height = `${this.resolution.y}px`;

    this.domOffset = {
      x: Math.round(this.dom.container.offsetLeft),
      y: Math.round(this.dom.container.offsetTop)
    };

    this.env.eventful.trigger('game-resize', {
      resolution: this.resolution,
      aspect: this.aspect,
      dpr: this.dpr,
      domOffset: this.domOffset
    });
  }

  onDirPressed(e) {
    this.dir[e.dir] = true;
  }

  onDirReleased(e) {
    this.dir[e.dir] = false;
  }

  start() {
    this.raf = this.animate();
  }

  stop() {
    window.cancelAnimationFrame(this.raf);
  }

  update() {
  }

  animate() {
    this.update();
    this.env.eventful.trigger('game-animate');
    this.raf = window.requestAnimationFrame(() => this.animate());
  }

}

module.exports = new Game();