mod parade;
mod strategy;

use parade::{simulate};
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

    /// initial parade length
    #[clap(long, default_value_t = 6)]
    pub initial_parade: usize,

    /// initial hand size
    #[clap(long, default_value_t = 5)]
    pub initial_hand_size: usize,

    /// number of iterations
    #[clap(short, long, default_value_t = 10000)]
    pub iters: usize,

    pub strats: Vec<usize>,
}

fn main() {
    let cfg = Config::parse();

    let mut wtr = BufWriter::with_capacity(1024, File::create(&cfg.output).unwrap());

    let scores = (0..cfg.iters).into_par_iter().map(|i|{
        let (parade, stats) = simulate(&cfg, i);
        (parade.final_score(), stats)
    }).collect::<Vec<_>>();

    for (score, stats) in scores {
        wtr.write_all(score.iter().map(|s| s.to_string()).collect::<Vec<_>>().join(",").as_bytes()).unwrap();
        wtr.write_all(",".as_bytes()).unwrap();
        wtr.write_all(stats.iter().map(|s| s.forced_taking.to_string()).collect::<Vec<_>>().join(",").as_bytes()).unwrap();
        wtr.write_all("\n".as_bytes()).unwrap();
    }

    wtr.flush().unwrap();
}
