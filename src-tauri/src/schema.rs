use surrealdb::sql::{parse, Statement, statements::DefineStatement};
use serde::Serialize;

#[derive(Serialize)]
pub struct ScopeFields {
	pub name: String,
	pub signup: String,
	pub signin: String,
	pub session: String
}

#[derive(Serialize)]
pub struct TableViewFields {
	pub expr: String,
	pub what: String,
	pub cond: String,
	pub group: String,
}

#[derive(Serialize)]
pub struct TablePermissionFields {
	pub select: String,
	pub create: String,
	pub update: String,
	pub delete: String,
}

#[derive(Serialize)]
pub struct TableFields {
	pub name: String,
	pub drop: bool,
	pub schemafull: bool,
	pub view: Option<TableViewFields>,
	pub permissions: TablePermissionFields
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
				None => "()".to_owned()
			};

			let signin = match signin_query {
				Some(q) => q.to_string(),
				None => "()".to_owned()
			};

			return Ok(ScopeFields {
				name: s.name.to_raw(),
				signup: signup[1..signup.len() - 1].to_owned(),
				signin: signin[1..signin.len() - 1].to_owned(),
				session: s.session.clone().unwrap_or_default().to_string()
			});
		}
	}

	Err(String::from("Failed to extract scope"))
}

#[tauri::command]
pub fn extract_table_fields(definition: &str) -> Result<TableFields, String> {
	let parsed = parse(definition)?;
	let query = &parsed[0];

	if let Statement::Define(d) = query {
		if let DefineStatement::Table(t) = d {
			let view = match &t.view {
				Some(v) => Some(TableViewFields {
					expr: v.expr.to_string(),
					what: v.what.to_string(),
					cond: v.cond.as_ref().map_or("".to_owned(), |c| c.to_string()),
					group: v.group.as_ref().map_or("".to_owned(), |c| c.to_string())
				}),
				None => None
			};

			let perms = &t.permissions;

			let permissions = TablePermissionFields {
				select: perms.select.to_string(),
				create: perms.create.to_string(),
				update: perms.update.to_string(),
				delete: perms.delete.to_string()
			};

			return Ok(TableFields {
				name: t.name.to_raw(),
				drop: t.drop,
				schemafull: t.full,
				permissions,
				view
			});
		}
	}

	Err(String::from("Failed to extract table"))
}