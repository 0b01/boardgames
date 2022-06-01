const rust = import('./pkg');
import { Ease, ease } from 'pixi-ease'
import cards from './static/cards.jpg';
import back from './static/back.png';
import * as PIXI from 'pixi.js'
import './index.css';
import { SimplePlane } from 'pixi.js';

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

const sleep = (t) => new Promise(resolve => setTimeout(resolve, t));

let is_my_turn = true;

async function run() {
  let m = await rust;
  let parade = m.parade_new();

  async function play(i) {
    if (!is_my_turn) { return; }
    is_my_turn = false;
    // console.log(parade, i);
    let ret = m.parade_play(parade, i);
    parade = ret[0];
    let ejected = ret[1];
    return ejected;
  }

  async function opponent_play() {
    let ret = m.parade_opponent_play(parade);
    parade = ret[0];
    let ejected = ret[1];
    let selected = ret[2];
    console.log(selected);
    is_my_turn = true;
    return {ejected, selected};
  }

  async function test_card(i) {
   return m.parade_test_card(parade, i);
  }

  let app = new PIXI.Application({ resizeTo: window });
  document.body.appendChild(app.view);
  let graphics = new PIXI.Graphics();
  graphics.sortableChildren = true;
  app.stage.addChild(graphics);

  // load sprites
  var img = PIXI.BaseTexture.from(cards);
  const W = 295;
  const H = 456;
  const w = 90;
  const h = 150;
  const rows = 7;
  const cols = 10;
  let nth = 0;
  let suit = [];
  let deck = [];
  let sprites = [];
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var sp = new PIXI.Sprite(new PIXI.Texture(img, new PIXI.Rectangle(j * W, i * H, W, H)));
      sp.width = w;
      sp.height = h;
      sp.x = 0;
      sp.y = app.renderer.height/2 - h/2;
      suit.push(sp);
      sprites.push(sp);

      graphics.addChild(sp);

      nth++;
      if (nth == 11) {
        nth = 0;
        deck.push(suit);
        suit = [];
      }
    }
  }

  let card_back = PIXI.Texture.from(back);

  function add_to_board(card, is_me, i) {
    let sp = deck[card.suit][card.rank];
    let target;
    if (is_me) {
      target = {x: app.renderer.width/2-w*5 + parade.boards[0].length * w /2 + i*w/2, y: 530};
    }
    else {
      target = {x: app.renderer.width/2-w*5 + parade.boards[1].length * w/2 + i * w/2, y: 170};
    }
    ease.add(sp, target, {duration: 400});
  }

  function renderCards(x0, y0, cards) {
    for (var i = 0; i < cards.length; i++) {
      let card = cards[i];
      let sp = deck[card.suit][card.rank];
      sp.interactive = false;
      ease.add(sp, {x: x0 + i * w/2, y: y0}, {duration: 400});
      graphics.addChild(sp);
    }
  }

  let opponent = [];
  for (var i = 0; i < 5; i++) {
    let sp = new PIXI.Sprite(card_back);
    sp.width = w;
    sp.height = h;
    opponent.push(sp);
    graphics.addChild(sp);
  }

  let count = new PIXI.Text(parade.deck.remaining, {fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center'})
  count.y = app.renderer.height/2 + h/2;
  count.x = w/2 - 15;
  graphics.addChild(count);

  function render() {
    // graphics.removeChildren();
    count.text = parade.deck.remaining;

    // render parade
    let parade_x = app.renderer.width / 2 - w * parade.parade.length / 4;
    let parade_y = app.renderer.height / 2 - h / 2;
    renderCards(parade_x, parade_y, parade.parade);

    // render boards
    renderCards(app.renderer.width/2-w*5, 170, parade.boards[1]);
    renderCards(app.renderer.width/2-w*5, 530, parade.boards[0]);

    // render opponent hand
    let y0 = 0;
    let x0 = app.renderer.width / 2 - w * parade.hands[1].length / 2;
    for (var i = 0; i < 5; i++) {
      sp = opponent[i];
      sp.x = x0 + i * w;
      sp.y = y0;
    }

    // render my hand
    y0 = app.renderer.height - h;
    x0 = app.renderer.width / 2 - w * parade.hands[0].length / 2;
    for (var i = 0; i < parade.hands[0].length; i++) {
      var card = parade.hands[0][i];

      let sp = deck[card.suit][card.rank];
      ease.add(sp, {x: x0 + i * w, y: y0}, {duration: 400});
      sp.interactive = true;
      sp.buttonmode = true;
      let temp = i;

      sp.pointerover = async () => {
        ease.add(sp, {y: y0 - h*0.2}, {duration: 400});

        let cards = await test_card(temp);
        cards.forEach(card => {
          let card_sp = deck[card.suit][card.rank];
          ease.add(card_sp, {y: card_sp.y - h*0.2}, {duration: 400});
        })
        // sp.height = h*1.2;
        // sp.width = w*1.2;
        // sp.y = y0;
      };

      sp.pointerout = async () => {
        ease.add(sp, {y: y0}, {duration: 400});
        let cards = await test_card(temp);
        cards.forEach(card => {
          let card_sp = deck[card.suit][card.rank];
          ease.add(card_sp, {y: card_sp.y + h*0.2}, {duration: 400});
        })
        // sp.height = h;
        // sp.width = w;
        // sp.y = y0;
      };

      sp.click = async () => {
        if (!is_my_turn) return;
        sp.interactive = false;
        console.log('click', temp);
        
        let ejected = await play(temp);
        ejected.map((e,i) => add_to_board(e, true, i));
        ease.add(sp, { x: parade_x + parade.parade.length*w/2-w/2, y: app.renderer.height / 2 - h / 2 }, { duration: 400 });
        await sleep(1000);

        let opponenthand = choose(opponent);
        opponenthand.zIndex = 1;
        ease.add(opponenthand, { x: parade_x + parade.parade.length*w/2, y: app.renderer.height / 2 - h / 2 }, { duration: 400 });
        await sleep(1100);
        let {ejected: ej, selected} = await opponent_play();
        ej.forEach((e,i) => add_to_board(e, false, i));
        let sel = deck[selected.suit][selected.rank];
        sel.x = opponenthand.x;
        sel.y = opponenthand.y;

        await sleep(1000);
        render();
      };

      graphics.addChild(sp);
    }
  }

  render()
}

run();