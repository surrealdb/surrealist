use surrealdb::sql::{parse, Statement, statements::DefineStatement};
use serde::Serialize;

#[derive(Serialize)]
pub struct ScopeFields {
	pub name: String,
	pub signup: String,
	pub signin: String,
	pub session: String
}

#[tauri::command]
pub fn extract_scope_fields(definition: &str) -> Result<ScopeFields, String> {
	let parsed = parse(definition)?;
	let query = &parsed[0];

	if let Statement::Define(d) = query {
		if let DefineStatement::Scope(s) = d {
			let signup_query = s.signup.clone();
			let signin_query = s.signin.clone();

			let signup = match signup_query {
				Some(q) => q.to_string(),
				None => "()".to_string()
			};

			let signin = match signin_query {
				Some(q) => q.to_string(),
				None => "()".to_string()
			};

			return Ok(ScopeFields {
				name: s.name.to_string(),
				signup: signup[1..signup.len() - 1].to_string(),
				signin: signin[1..signin.len() - 1].to_string(),
				session: s.session.clone().unwrap_or_default().to_string()
			});
		}
	}

	Err(String::from("Failed to extract scope"))
}