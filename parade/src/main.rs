use parade::{simulate};
mod parade;
use std::fs::File;
use std::io::prelude::*;
use std::io::BufWriter;
use rayon::prelude::*;
use clap::Parser;

#[derive(Parser, Debug, Clone)]
#[clap(author, version, about, long_about = None)]
pub struct Config {
    /// number of suits
    #[clap(long, default_value_t = 6)]
    pub suits: u8,

    /// number of ranks per suit
    #[clap(long, default_value_t = 11)]
    pub ranks: u8,

    /// number of players
    #[clap(long, default_value_t = 2)]
    pub players: usize,

    /// output file
    #[clap(short, long, default_value = "output.csv")]
    pub output: String,

    /// number of iterations
    #[clap(short, long, default_value_t = 10000)]
    pub iters: usize,
}

fn main() {
    let cfg = Config::parse();

    let mut wtr = BufWriter::with_capacity(1024, File::create(&cfg.output).unwrap());

    let scores = (0..cfg.iters).into_par_iter().map(|_|{
        let parade = simulate(&cfg);
        parade.final_score()
    }).collect::<Vec<_>>();

    // let mut row = vec![
    //     cfg.suits.to_string(),
    //     cfg.ranks.to_string(),
    //     cfg.players.to_string(),
    // ];
    for score in scores {
        wtr.write_all(score.iter().map(|s| s.to_string()).collect::<Vec<_>>().join(",").as_bytes()).unwrap();
        wtr.write_all("\n".as_bytes()).unwrap();
    }

    wtr.flush().unwrap();
}
