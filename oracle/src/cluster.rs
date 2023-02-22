use std::str::FromStr;

#[derive(Clone, Debug)]
pub struct Cluster(String);

impl FromStr for Cluster {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let url = match s {
            "devnet" => String::from("http://api.devnet.solana.com"),
            "mainnet" => String::from("http://api.mainnet-beta.solana.com"),
            "testnet" => String::from("http://api.testnet.solana.com"),
            "localnet" => String::from("http://127.0.0.1:8899"),
            _ => Err(format!("{} is unrecognized for cluster type", s))?,
        };
        Ok(Cluster(url))
    }
}

impl ToString for Cluster {
    fn to_string(&self) -> String {
        self.0.clone()
    }
}
