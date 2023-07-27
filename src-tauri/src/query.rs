use serde::Deserialize;
use surrealdb::{Surreal, engine::remote::ws::{Ws, Client}, sql::Object};
use tauri::async_runtime::Mutex;

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
	let db = Surreal::new::<Ws>(info.endpoint).await?;
	let mut instance = state.0.lock().await;

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
	let instance = state.0.lock().await;
	let client = instance.as_ref().unwrap();

	let mut response = client.query(query).await?.check()?;
	
	let records: Vec<Object> = response.take(0).unwrap();
	
	return Ok(serde_json::to_string(&records).unwrap());
}