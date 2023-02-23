use std::str::FromStr;

use solana_client::client_error::reqwest::Url;

#[derive(Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum Cluster {
    Testnet,
    Mainnet,
    Devnet,
    Localnet,
    Custom(String, String),
}

impl Cluster {
    pub fn url(&self) -> &str {
        match self {
            Cluster::Devnet => "https://api.devnet.solana.com",
            Cluster::Testnet => "https://api.testnet.solana.com",
            Cluster::Mainnet => "https://api.mainnet-beta.solana.com",
            Cluster::Localnet => "http://127.0.0.1:8899",
            Cluster::Custom(url, _) => url,
        }
    }
}

impl FromStr for Cluster {
    type Err = &'static str;
    fn from_str(s: &str) -> Result<Cluster, Self::Err> {
        match s.to_lowercase().as_str() {
            "t" | "testnet" => Ok(Cluster::Testnet),
            "m" | "mainnet" => Ok(Cluster::Mainnet),
            "d" | "devnet" => Ok(Cluster::Devnet),
            "l" | "localnet" => Ok(Cluster::Localnet),
            _ if s.starts_with("http") => {
                let http_url = s;

                let mut ws_url = Url::parse(http_url)?;
                if let Some(port) = ws_url.port() {
                    ws_url
                        .set_port(Some(port + 1))
                        .map_err(|_| anyhow!("Unable to set port"))?;
                }
                if ws_url.scheme() == "https" {
                    ws_url.set_scheme("wss").map_err(|_| anyhow!("Unable to set scheme"))?;
                } else {
                    ws_url.set_scheme("ws").map_err(|_| anyhow!("Unable to set scheme"))?;
                }

                Ok(Cluster::Custom(http_url.to_string(), ws_url.to_string()))
            }
            _ => Err(anyhow::Error::msg(
                "Cluster must be one of [localnet, testnet, mainnet, devnet] or be an http or https url\n",
            )),
        }
    }
}

impl Default for Cluster {
    fn default() -> Self {
        Self::Devnet
    }
}

impl std::fmt::Display for Cluster {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let cluster = match self {
            Cluster::Testnet => "testnet",
            Cluster::Mainnet => "mainnet",
            Cluster::Devnet => "devnet",
            Cluster::Localnet => "localnet",
            Cluster::Custom(url, _ws_url) => url,
        };
        write!(f, "{cluster}")
    }
}
