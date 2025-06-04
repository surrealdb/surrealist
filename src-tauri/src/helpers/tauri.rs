use serde::{de::DeserializeOwned, ser::Serialize};
use std::marker::{Send, Sync};
use tauri::{AppHandle, Listener};

pub trait AsyncEmitter {
    /// Emit an event to the app asynchronously. And wait for a response.
    async fn ask_async<E, R>(&self, event: E) -> Result<R, String>
    where
        E: Serialize + Clone,
        R: DeserializeOwned + Sync + Send + 'static;

    // async fn emit_event<E>(&self, event: E) -> Result<(), String>
    // where
    //     E: Serialize + Clone;
}

impl AsyncEmitter for AppHandle {
    async fn ask_async<E, R>(&self, event: E) -> Result<R, String>
    where
        E: Serialize + Clone,
        R: DeserializeOwned + Sync + Send + Into<R> + 'static,
    {
        let event_name = serde_json::to_value(event.clone())
            .map_err(|e| format!("Failed to serialize event: {}", e))?;
        let event_name = event_name.get("type").ok_or("Failed to get event name")?;
        let event_name = event_name.as_str().unwrap();

        let (tx, rx) = tokio::sync::oneshot::channel::<Result<R, String>>();

        let _id = self.once(event_name, move |e| {
            println!("Received event: {:#?}", e);
            let payload = e.payload();
            let parsed = serde_json::from_str::<R>(&payload).map_err(|e| e.to_string());
            tx.send(parsed);
        });

        let result = rx.await;
        match result {
            Ok(Ok(result)) => Ok(result),
            Ok(Err(e)) => Err(e),
            Err(e) => Err(e.to_string()),
        }
    }

    // async fn emit_event<E>(&self, event: E) -> Result<(), String>
    // where
    //     E: Serialize + Clone,
    // {
    //     let event_name = serde_json::to_value(event.clone())
    //         .map_err(|e| format!("Failed to serialize event: {}", e))?;
    //     let event_name = event_name.get("type").ok_or("Failed to get event name")?;
    //     let event_name = event_name.as_str().unwrap();
    //     let _ = self.emit(event_name, event);
    //     Ok(())
    // }

    // /// Listen to an event on this app asynchronously.
    // ///
    // /// # Examples
    // ///
    // /// ```
    // ///    let result = app.once_async(ClientEvent::UnknownHostFingerprintReply).await;
    // /// ```
    // async fn once_async<E, R>(&self, event: E) -> Result<R, String>
    // where
    //     E: IntoEventName,
    //     R: DeserializeOwned + Sync + Send + 'static,
    // {
    //     let (tx, rx) = tokio::sync::oneshot::channel::<Result<R, String>>();
    //     let _id = self.once(event.event_name(), move |e| {
    //         let payload = e.payload();
    //         let parsed = serde_json::from_str::<R>(&payload).map_err(|e| e.to_string());
    //         tx.send(parsed);
    //     });

    //     let result = rx.await;
    //     match result {
    //         Ok(Ok(result)) => Ok(result),
    //         Ok(Err(e)) => Err(e),
    //         Err(e) => Err(e.to_string()),
    //     }
    // }
}

// pub trait AsyncListener {
//     async fn once_async<E, R>(&self, event: E) -> Result<R, String>
//     where
//         R: DeserializeOwned + Sync + Send + 'static;
// }

// impl AsyncListener for AppHandle {
//     async fn once_async<E, R>(&self, event: E) -> Result<R, String>
//     where
//         R: DeserializeOwned + Sync + Send + 'static,
//     {
//         let event_name = serde_json::to_value(event.clone())
//             .map_err(|e| format!("Failed to serialize event: {}", e))?;
//         let event_name = event_name.get("type").ok_or("Failed to get event name")?;
//         let event_name = event_name.as_str().unwrap();

//         let (tx, rx) = tokio::sync::oneshot::channel::<Result<R, String>>();
//         let _id = self.once(event.event_name(), move |e| {
//             let payload = e.payload();
//             let parsed = serde_json::from_str::<R>(&payload).map_err(|e| e.to_string());
//             tx.send(parsed);
//         });

//         let result = rx.await;
//         match result {
//             Ok(Ok(result)) => Ok(result),
//             Ok(Err(e)) => Err(e),
//             Err(e) => Err(e.to_string()),
//         }
//     }
// }
