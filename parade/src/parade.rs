use rand::{prelude::SliceRandom, thread_rng};

use crate::Config;

#[derive(Clone, Copy, Debug)]
pub struct Card {
    suit: u8, 
    rank: u8,
}

#[derive(Debug)]
pub struct Deck {
    cards: Vec<Card>,
    remaining: usize,
}

impl Deck {
    pub fn new(cfg: &Config) -> Self {
        let mut cards = vec![];
        for suit in 0..cfg.suits {
            for rank in 0..cfg.ranks {
                cards.push(Card{suit, rank});
            }
        }

        let mut rng = thread_rng();
        cards.shuffle(&mut rng);

        Self {
            cards,
            remaining: (cfg.suits as usize) * (cfg.ranks as usize),
        }
    }

    pub fn draw(&mut self, n: usize) -> Option<Vec<Card>> {
        if n > self.remaining {
            return None;
        }

        let ret = self.cards.split_off(self.remaining - n);
        self.remaining -= n;
        Some(ret)
    }
}

#[derive(Debug)]
pub struct Parade {
    deck: Deck,
    parade: Vec<Card>,
    hands: Vec<Vec<Card>>,
    boards: Vec<Vec<Card>>,
    cfg: Config,
}

impl Parade {
    pub fn new(cfg: &Config) -> Self {
        let mut deck = Deck::new(cfg);
        let parade = deck.draw(6).unwrap();
        let hands = (0..cfg.players).map(|_|deck.draw(5).unwrap()).collect();
        let boards = vec![vec![]; cfg.players];
        Self {
            deck,
            parade,
            hands,
            boards,
            cfg: cfg.clone(),
        }
    }

    fn add_to_end(&self, card: Card) -> Vec<Card> {
        self.parade
            .iter()
            .skip(card.rank as usize)
            .filter(|c| c.suit == card.suit || c.rank < card.rank)
            .copied()
            .collect()
    }

    fn commit(&mut self, player: usize, card_to_play: usize) -> Option<()> {
        let card = self.hands[player][card_to_play];

        self.parade = self.parade
            .iter()
            .skip(card.rank as usize)
            .take_while(|c| c.suit != card.suit && c.rank >= card.rank)
            .copied()
            .collect();

        self.hands[player].remove(card_to_play);
        self.hands[player].extend(self.deck.draw(1)?);
        self.boards[player].push(card);

        Some(())
    }

    pub fn final_score(&self) -> Vec<usize> {
        let mut suits_count = vec![0_usize; self.cfg.suits as usize];
        for suit in 0..self.cfg.suits {
            let max_player_idx = self.boards
                .iter()
                .map(|b| b.iter().filter(|c|c.suit == suit).count())
                .enumerate()
                .min_by_key(|(_idx, count)|*count)
                .map(|(idx, _count)| idx)
                .unwrap();
            suits_count[suit as usize] = max_player_idx;
        }

        let mut ret = vec![0; self.cfg.players];
        (0..self.cfg.players).for_each(|player| {
            let mut score = 0;
            for suit in 0..self.cfg.suits {
                let cards_of_suit = self.boards[player].iter().filter(|c|c.suit == suit);
                score += if suits_count[suit as usize] == player {
                    cards_of_suit.count()
                } else {
                    cards_of_suit.map(|c|c.rank as usize).sum()
                };
            }
            ret[player] = score;
        });

        ret
    }
}

trait Strategy {
    fn play(&self, game: &Parade, player: usize) -> usize;
}

struct TakeMin;
impl Strategy for TakeMin {
    fn play(&self, parade: &Parade, player: usize) -> usize {
        let hand = &parade.hands[player];
        hand
            .iter()
            .enumerate()
            .min_by_key(|(_, c)| parade.add_to_end(**c).iter().map(|c| c.rank as usize).sum::<usize>())
            .map(|(idx, _)| idx)
            .unwrap()
    }
}

struct FirstCard;
impl Strategy for FirstCard {
    fn play(&self, _parade: &Parade, _player: usize) -> usize {
        0
    }
}

struct TakeSmallCardsVoluntarily;
impl Strategy for TakeSmallCardsVoluntarily {
    fn play(&self, parade: &Parade, player: usize) -> usize {
        let hand = &parade.hands[player];
        hand
            .iter()
            .enumerate()
            .min_by_key(|(_, c)|
                parade.add_to_end(**c)
                .iter()
                .map(|c| {
                    let r = c.rank as i32;
                    if r < 3 { -r } else { r }
                }).sum::<i32>()
            )
            .map(|(idx, _)| idx)
            .unwrap()
    }
}


pub fn simulate(cfg: &Config) -> Parade {
    let mut parade = Parade::new(cfg);
    let take_min = TakeMin;
    while parade.deck.remaining > 0 {
        for player in 0..cfg.players {
            let card_to_play = take_min.play(&parade, player);
            if parade.commit(player, card_to_play).is_none() {
                return parade;
            }
        }
    }

    parade
}