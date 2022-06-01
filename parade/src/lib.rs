mod parade;
mod config;
mod strategy;
use parade::Parade;
use config::Config;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn parade_new() -> JsValue {
    let cfg = Config {
        suits: 6,
        ranks: 11,
        players: 2,
        initial_parade: 6,
        output: "".to_owned(),
        initial_hand_size: 5,
        iters: 0,
        strats: vec![],
    };

    let parade = Parade::new(&cfg, 0);
    JsValue::from_serde(&parade).unwrap()
}

#[wasm_bindgen]
pub fn parade_play(parade: JsValue, card_to_play: usize) -> JsValue {
    let mut parade = parade.into_serde::<Parade>().unwrap();
    parade.commit(0, card_to_play);
    JsValue::from_serde(&parade).unwrap()
}


#[wasm_bindgen]
pub fn parade_opponent_play(parade: JsValue) -> JsValue {
    let strat = strategy::from_usize(&2_usize);
    let mut parade = parade.into_serde::<Parade>().unwrap();
    let card_to_play = strat.play(&parade, 1);
    parade.commit(1, card_to_play);
    JsValue::from_serde(&parade).unwrap()
}