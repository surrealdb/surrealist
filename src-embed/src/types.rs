use futures::stream::{AbortHandle, Abortable};
use serde::{Deserialize, Serialize};
use surrealdb::{method::QueryStream, sql::Value};

pub struct LiveQuery {
    stream: Option<Abortable<QueryStream<Value>>>,
    abort: AbortHandle,
}

impl LiveQuery {
    pub fn new(stream: QueryStream<Value>) -> Self {
        let (handle, registration) = AbortHandle::new_pair();
        let stream = Abortable::new(stream, registration);

        Self {
            stream: Some(stream),
            abort: handle,
        }
    }

    pub fn cancel(&self) {
        self.abort.abort();
    }

    pub fn take_stream(&mut self) -> Option<Abortable<QueryStream<Value>>> {
        self.stream.take()
    }
}

#[derive(Deserialize)]
pub struct ScopeField {
    pub subject: String,
    pub value: String,
}

#[derive(Deserialize)]
pub struct ConnectionInfo {
    pub namespace: String,
    pub database: String,
    pub protocol: String,
    pub hostname: String,
    pub username: String,
    pub password: String,
    pub auth_mode: String,
    pub scope: String,
    pub token: String,
    pub scope_fields: Vec<ScopeField>,
}

#[derive(Serialize)]
pub struct SurrealVersion {
    pub major: u64,
    pub minor: u64,
    pub patch: u64,
}
