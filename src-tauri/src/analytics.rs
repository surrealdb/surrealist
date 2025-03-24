use reqwest::header::{HeaderMap, HeaderName, HeaderValue, ORIGIN};
use url::Url;

#[tauri::command]
pub async fn track_event(
    url: String,
    cookie: String,
    user_agent: String,
    preview_header: Option<String>,
) -> Result<Vec<String>, String> {
    let url = Url::parse(&url).map_err(|e| format!("Failed to parse URL: {}", e))?;
    let host = url.host_str().ok_or("URL has no host")?;
    let origin = format!("https://{}", host);

    let client = reqwest::Client::new();

    // Create a header map
    let mut headers = HeaderMap::new();

    // Add the Origin header
    headers.insert(
        ORIGIN,
        HeaderValue::from_str(&origin)
            .map_err(|e| format!("Failed to set Origin header: {}", e))?,
    );

    // Add the Cookie header
    headers.insert(
        reqwest::header::COOKIE,
        HeaderValue::from_str(&cookie)
            .map_err(|e| format!("Failed to set Cookie header: {}", e))?,
    );

    // Add the User-Agent header
    headers.insert(
        reqwest::header::USER_AGENT,
        HeaderValue::from_str(&user_agent)
            .map_err(|e| format!("Failed to set User-Agent header: {}", e))?,
    );

    // no-cors
    headers.insert(
        reqwest::header::REFERER,
        HeaderValue::from_str(&origin)
            .map_err(|e| format!("Failed to set Referer header: {}", e))?,
    );

    // sec-fetch-mode
    let sec_fetch_mode_header = HeaderName::from_static("sec-fetch-mode");
    headers.insert(sec_fetch_mode_header, HeaderValue::from_static("cors"));

    // sec-fetch-site
    let sec_fetch_site_header = HeaderName::from_static("sec-fetch-site");
    headers.insert(
        sec_fetch_site_header,
        HeaderValue::from_static("same-origin"),
    );

    // Add Content-Type header
    headers.insert(
        reqwest::header::CONTENT_TYPE,
        HeaderValue::from_static("text/plain;charset=UTF-8"),
    );

    // Add Content-Length header
    headers.insert(
        reqwest::header::CONTENT_LENGTH,
        HeaderValue::from_static("0"),
    );

    if let Some(preview_header) = preview_header {
        // Add the custom header
        let x_gtm_server_preview_header = HeaderName::from_static("x-gtm-server-preview");
        headers.insert(
            x_gtm_server_preview_header,
            HeaderValue::from_str(&preview_header)
                .map_err(|e| format!("Failed to set X-Gtm-Server-Preview header: {}", e))?,
        );
    }

    // Make the request with the custom header
    let request = client
        .post(url.to_string())
        .headers(headers)
        .body("")
        .send()
        .await
        .map_err(|e| format!("Failed to track event: {e}"))?;

    let cookies: Vec<String> = response
        .headers()
        .get_all("Set-Cookie")
        .iter()
        .filter_map(|v| v.to_str().ok().map(String::from))
        .collect();

    Ok(cookies)
}
