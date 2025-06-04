use events::{UnknownHostFingerprintAsk, UnknownHostFingerprintReply};
use log::info;
use russh::keys::PrivateKeyWithHashAlg;
use serde::{Deserialize, Serialize};
use std::{
    fmt::Display,
    net::{IpAddr, SocketAddr, ToSocketAddrs},
    str::FromStr,
    sync::Arc,
};
use tauri::{Emitter, Listener};

use crate::helpers::tauri::AsyncEmitter;

pub mod events;
pub struct SshSessionManager;

pub struct Client {}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    #[serde(rename = "authMethod")]
    pub auth_method: AuthMethod,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AuthMethod {
    #[serde(rename = "password")]
    Password { password: String },
    #[serde(rename = "publicKey")]
    PublicKey {
        private_key: String,
        passphrase: String,
    },
    // #[serde(rename = "agent")]
    // Agent { agent: String },
}

#[tauri::command]
pub async fn test_ssh_connection(app: tauri::AppHandle, config: SshConfig) -> Result<(), String> {
    let socket_addr = resolve_host(app, format!("{}:{}", config.host, config.port)).await?;

    // let ssh_client_config = Arc::new(russh::client::Config::default());
    // let ssh_server_address: SocketAddr =
    //     format!("{}:{}", config.host, config.port).parse().unwrap();
    // let handler = SshHandler {
    //     host: config.host.clone(),
    //     port: config.port,
    //     window,
    // };
    // let mut connection = russh::client::connect(ssh_client_config, ssh_server_address, handler)
    //     .await
    //     .map_err(|e| e.to_string())?;

    // let auth_result = match config.auth_method {
    //     AuthMethod::Password { password } => connection
    //         .authenticate_password(config.username, password)
    //         .await
    //         .map_err(|e| e.to_string())?,
    //     AuthMethod::PublicKey {
    //         private_key,
    //         passphrase,
    //     } => {
    //         let private_key = Arc::new(
    //             russh::keys::PrivateKey::from_str(&private_key).map_err(|e| e.to_string())?,
    //         );
    //         let key = PrivateKeyWithHashAlg::new(private_key, None);

    //         connection
    //             .authenticate_publickey(config.username, key)
    //             .await
    //             .map_err(|e| e.to_string())?
    //     } // AuthMethod::Agent { agent } => {
    //       //     connection.authenticate_publickey_with(user, key, hash_alg, signer)
    //       // }
    // };

    // let _ = connection
    //     .disconnect(russh::Disconnect::ByApplication, "Testing connection", "en")
    //     .await
    //     .map_err(|e| e.to_string());

    // match auth_result.success() {
    //     true => {
    //         println!("Connection successful");
    //         Ok(())
    //     }
    //     false => {
    //         println!("Connection failed");
    //         Err("Connection failed".to_string())
    //     }
    // }

    Ok(())
}

async fn resolve_host<T: ToSocketAddrs + Display>(
    app: tauri::AppHandle,
    host: T,
) -> Result<String, String> {
    // let ip: IpAddr = host.parse();
    // if let Ok(ip) = ip {
    // 	return Ok(SocketAddr::new(ip, port));
    // }

    // let host_name = host.split(':').next().unwrap();
    // let port = host.split(':').nth(1).unwrap_or("22").parse().unwrap();
    // let addr = format!("{}:{}", host_name, port);
    // addr.parse().unwrap()
    let socket_addrs = host.to_socket_addrs().map_err(|e| e.to_string())?;
    let socket_addrs = socket_addrs.collect::<Vec<SocketAddr>>();
    println!("Resolving host: {:#?}", host.to_string());
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    println!("Resolved host: {:#?}", socket_addrs);
    println!("Waiting for fingerprint");
    let reply = app
        .ask_async::<ServerEvent, UnknownHostFingerprintResponse>(
            ServerEvent::UnknownHostFingerprint {
                fingerprints: vec![
                    "MyTestFingerprint".to_string(),
                    "MyTestFingerprint2".to_string(),
                    "MyTestFingerprint3".to_string(),
                ],
            },
        )
        .await?;

    // let response: ClientEvent = app
    //     .once_async(ClientEvent::UnknownHostFingerprintReply)
    //     .await?;
    // let fingerprint = match response {
    //     ClientEvent::UnknownHostFingerprintReply { fingerprint } => fingerprint,
    // };
    // let fingerprint = String::from("MyTestFingerprint");
    println!("Selected fingerprint: {:?}", reply.fingerprint);

    Ok(reply.fingerprint)
}

pub struct SshHandler {
    host: String,
    port: u16,
    window: tauri::Window,
}

impl russh::client::Handler for SshHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        server_public_key: &russh::keys::ssh_key::PublicKey,
    ) -> Result<bool, Self::Error> {
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        let fingerprint = server_public_key.fingerprint(Default::default());
        println!("Server fingerprint: {}", fingerprint);
        let known_host =
            russh::keys::check_known_hosts(self.host.as_str(), self.port, server_public_key)?;
        println!("Known host: {}", known_host);
        self.window
            .emit(
                "ssh:test-connection:unknown-host-fingerprint",
                fingerprint.to_string(),
            )
            .expect("unknown host fingerprint should be delivered");
        Ok(true)
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerEvent {
    #[serde(rename = "ssh:unknown-host-fingerprint")]
    UnknownHostFingerprint { fingerprints: Vec<String> },
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientEvent {
    UnknownHostFingerprintReply { fingerprint: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnknownHostFingerprintResponse {
    fingerprint: String,
}
