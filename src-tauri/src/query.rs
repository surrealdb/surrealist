use std::collections::HashMap;

use serde::Deserialize;
use surrealdb::{Surreal, engine::remote::ws::{Ws, Client, Wss}, opt::auth::{Namespace, Database, Scope, Root}, sql::Value};
use tauri::{async_runtime::Mutex, regex::Regex};

#[derive(Deserialize)]
pub struct ScopeField {
	pub subject: String,
	pub value: String
}

#[derive(Deserialize)]
pub struct ConnectionInfo {
    pub namespace: String,
	pub database: String,
	pub endpoint: String,
	pub username: String,
	pub password: String,
	pub auth_mode: String,
	pub scope: String,
	pub scope_fields: Vec<ScopeField>
}

pub struct ConnectionState(pub Mutex<Option<Surreal<Client>>>);

#[tauri::command]
pub async fn open_connection(
	info: ConnectionInfo,
	state: tauri::State<'_, ConnectionState>,
) -> Result<(), surrealdb::Error> {
	let regex = Regex::new(r"^(https?://)?(.+?)$").unwrap();
	let matches = regex.captures(&info.endpoint).unwrap();
	let endpoint = matches.get(2).unwrap().as_str();
	let is_secure = info.endpoint.starts_with("https");

	println!("Connecting to {}", endpoint);

	let db = if is_secure {
		Surreal::new::<Wss>(endpoint).await?
	} else {
		Surreal::new::<Ws>(endpoint).await?
	};

	let mut instance = state.0.lock().await;

	match info.auth_mode.as_str() {
		"root" => {
			db.signin(Root {
				username: info.username.as_str(),
				password: info.password.as_str()
			}).await?;
		},
		"namespace" => {
			db.signin(Namespace {
				namespace: info.namespace.as_str(),
				username: info.username.as_str(),
				password: info.password.as_str()
			}).await?;
		},
		"database" => {
			db.signin(Database {
				namespace: info.namespace.as_str(),
				database: info.database.as_str(),
				username: info.username.as_str(),
				password: info.password.as_str()
			}).await?;
		},
		"scope" => {
			let field_map = info.scope_fields.iter()
				.map(|field| (field.subject.as_str(), field.value.as_str()))
				.collect::<HashMap<&str, &str>>();

			db.signin(Scope {
				namespace: info.namespace.as_str(),
				database: info.database.as_str(),
				scope: info.scope.as_str(),
				params: field_map
			}).await?;
		},
		_ => {}
	};

	db.use_ns(info.namespace).await?;
	db.use_db(info.database).await?;

	*instance = Some(db);

	return Ok(());
}

#[tauri::command]
pub async fn close_connection(
	state: tauri::State<'_, ConnectionState>,
) -> Result<(), surrealdb::Error> {
	let mut instance = state.0.lock().await;

	*instance = None;

	return Ok(());
}

#[tauri::command]
pub async fn execute_query(
	query: String,
	state: tauri::State<'_, ConnectionState>,
) -> Result<String, surrealdb::Error> {
	println!("Executing query {}", query);

	let instance = state.0.lock().await;
	let client = instance.as_ref().unwrap();

	println!("0");

	let a = client.query(query);

	println!("1");

	let b = a.await?;

	println!("2");

	let mut response = b.check()?;

	println!("3");

	let result: Value = response.take(0).unwrap();

	println!("4");

	let result_json = serde_json::to_string(&result.into_json()).unwrap();

	println!("5");
	println!("Query: {}", result_json);

	return Ok(result_json);
}