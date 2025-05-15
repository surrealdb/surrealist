use std::{
    path::PathBuf,
    sync::{Mutex, OnceLock},
};

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{MetaNameValue, Token, parse_macro_input, punctuated::Punctuated};

/// Event attribute macro
///
/// This macro is used to automatically generate a const EVENT field for a struct
/// based on the provided name.
///
/// # Example
///
/// ```
/// #[event(name = "ssh:unknown-host-fingerprint:ask")]
/// pub struct UnknownHostFingerprintAsk {}
/// ```
///
/// Will generate:
///
/// ```
/// pub struct UnknownHostFingerprintAsk {}
///
/// impl UnknownHostFingerprintAsk {
///     pub const EVENT: &str = "ssh:unknown-host-fingerprint:ask";
/// }
/// ```
#[proc_macro_attribute]
pub fn event(attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input as a struct
    let input = parse_macro_input!(item as syn::ItemStruct);
    let meta =
        parse_macro_input!(attr with Punctuated::<MetaNameValue, Token![,]>::parse_terminated);

    let struct_name = &input.ident;
    let mut event_name: Option<syn::LitStr> = None;
    let properties = meta.iter().for_each(|arg| {
        let syn::MetaNameValue { path, value, .. } = arg;

        if path.is_ident("name") {
            if let syn::Expr::Lit(lit) = value {
                if let syn::Lit::Str(lit_str) = &lit.lit {
                    event_name = Some(lit_str.clone());
                }
            }
        }
    });

    let event_name = event_name.expect("Expected #[event(name = \"event_name\")]");

    // Generate the test function name for ts-rs
    let test_fn = format_ident!(
        "export_bindings_{}_constants",
        struct_name.to_string().to_lowercase().replace("r#", "")
    );

    // Generate the output
    let output = quote! {
        use std::io::Write ;

        #[derive(ts_rs::TS)]
        #[ts(export)]
        #input

        impl #struct_name -> Result<(), std::io::Error> {
            pub const EVENT: &'static str = #event_name;
        }


        // #[cfg(test)]
        // #[test]
        // fn #test_fn() {
        //     let path = PathBuf::from(env!("TS_RS_OUT_DIR")).join("src/constants.ts");
        //     let mut file = std::fs::File::options().append(true).open(path).unwrap();
        //     writeln!(&mut file, "export const #struct_name = \"#struct_name::EVENT\";")?;

        //     // #ty::export_all().expect("could not export type");
        // }
    };

    println!("output: {:#?}", output.to_string());

    output.into()
}
