const rust = import('./pkg');
import cards from './static/cards.jpg';
import back from './static/back.png';
import * as PIXI from 'pixi.js'
import './index.css';

async function play(parade, i) {
  let m = await rust;
  // console.log(parade, i);
  parade = m.parade_play(parade, i);
  return parade;
}

async function opponent_play(parade) {
  let m = await rust;
  parade = m.parade_opponent_play(parade);
  return parade;
}


async function start() {
  let m = await rust;
  let parade = m.parade_new();
  return parade;
}

async function run() {

  let parade = await start();

  let app = new PIXI.Application({ height: window.innerHeight, width: window.innerWidth });
  document.body.appendChild(app.view);

  // load sprites
  var img = PIXI.BaseTexture.from(cards);
  const W = 295;
  const H = 456;
  const rows = 7;
  const cols = 10;
  let nth = 0;
  let suit = [];
  let deck = [];
  let sprites = [];
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var tex = new PIXI.Texture(img, new PIXI.Rectangle(j * W, i * H, W, H));
      let sp = new PIXI.Sprite(tex);
      suit.push(sp);
      sprites.push(sp);

      nth++;
      if (nth == 11) {
        nth = 0;
        deck.push(suit);
        suit = [];
      }
    }
  }

  let card_back = PIXI.Texture.from(back);

  let graphics = new PIXI.Graphics();
  app.stage.addChild(graphics);

  const w = 90;
  const h = 150;

  function render() {
    graphics.clear();
    graphics.drawRect(0, 0, app.renderer.width, app.renderer.height);
    sprites.forEach((i) => i.off('click'));

    let x0 = app.renderer.width / 2 - w * parade.parade.length / 2;
    let y0 = app.renderer.height / 2 - h / 2;

    for (var i = 0; i < parade.parade.length; i++) {
      let card = parade.parade[i];
      let sp = deck[card.suit][card.rank];
      sp.width = w;
      sp.height = h;
      sp.x = x0 + i * w;
      sp.y = y0;
      graphics.addChild(sp);
    }

    y0 = app.renderer.height - h;
    x0 = app.renderer.width / 2 - w * parade.hands[0].length / 2;
    for (var i = 0; i < parade.hands[0].length; i++) {
      var card = parade.hands[0][i];

      let sp = deck[card.suit][card.rank];
      sp.width = w;
      sp.height = h;
      sp.x = x0 + i * w;
      sp.y = y0;
      sp.interactive = true;
      let temp = i;
      sp.on('click', async () => {
        parade = await play(parade, temp);
        render();
        setTimeout(async () => {
          parade = await opponent_play(parade);
          render();
        }, 1000);
      })
      graphics.addChild(sp);
    }

    // draw opponent back
    y0 = 0;
    x0 = app.renderer.width / 2 - w * parade.hands[1].length / 2;
    for (var i = 0; i < parade.hands[1].length; i++) {
      var card = parade.hands[1][i];

      let sp = new PIXI.Sprite(card_back);
      sp.width = w;
      sp.height = h;
      sp.x = x0 + i * w;
      sp.y = y0;
      sp.interactive = true;
      let temp = i;
      graphics.addChild(sp);
    }
  }

  render()
}

run();