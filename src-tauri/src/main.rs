#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use database::DatabaseState;
use query::ConnectionState;
use tauri::{Manager, RunEvent};

mod config;
mod database;
mod query;
mod schema;

fn main() {
    tauri::Builder::default()
        .manage(DatabaseState(Default::default()))
        .manage(ConnectionState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::save_config,
            schema::extract_scope_definition,
            schema::extract_table_definition,
            schema::extract_field_definition,
            schema::extract_index_definition,
            schema::extract_analyzer_definition,
            schema::extract_event_definition,
            schema::extract_user_definition,
            schema::validate_query,
            schema::validate_where_clause,
            database::start_database,
            database::stop_database,
            query::open_connection,
            query::close_connection,
            query::execute_query,
        ])
        .build(tauri::generate_context!())
        .expect("tauri should start successfully")
        .run(move |app, event| {
            if let RunEvent::Exit = event {
                let state = app.state::<DatabaseState>();
                let process = state.0.lock().unwrap().take();

                if let Some(child) = process {
                    database::kill_surreal_process(child.id())
                }
            }
        })
}
