// https://doc.rust-lang.org/std/net/struct.TcpStream.html
// https://de.wikipedia.org/wiki/JSON-RPC#Version_2.0

use std::io::prelude::*;
use std::net::TcpStream;
use std::env;

fn main() -> std::io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:12037")?;

    let args: Vec<String> = env::args().collect();

    let formatted = format!(
        "{{ \"jsonrpc\": \"2.0\", \"method\": \"{}\", \"params\": [{}, {}], \"id\": 1 }}",
        args[1],
        args[2],
        args[3]
    );

    stream.write(formatted.as_bytes())?;
    stream.read(&mut [0; 128])?;
    Ok(())
}
