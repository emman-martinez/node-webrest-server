import * as http2 from "http2";
import * as fs from "fs";

// This code creates an HTTP/2 server using the http2 module in Node.js.
// The server listens for incoming requests and generates responses based on the request URL.
// It serves an HTML file for the root URL ("/") and serves JavaScript and CSS files based on their extensions.
// The server logs each incoming request to the console and sends the appropriate response back to the client.

// http2: The http2 module in Node.js provides an implementation of the HTTP/2 protocol, which is a major revision of the HTTP protocol that offers improved performance and efficiency.
// It allows for multiplexing multiple requests and responses over a single connection, reducing latency and improving overall web performance.
// createSecureServer: The createSecureServer method of the http2 module is used to create an HTTP/2 server that supports secure connections (HTTPS).
//                     - It requires SSL/TLS certificates to establish secure communication between the server and clients.
//                     - In this code, we are using createServer instead of createSecureServer, which creates a non-secure HTTP/2 server.
//                     - If you want to enable HTTPS, you would need to use createSecureServer and provide the necessary SSL/TLS certificates.
// options: The options object passed to createSecureServer contains the key and cert properties, which are placeholders for the SSL/TLS certificate and private key.
//          - key: This property should contain the private key for the SSL/TLS certificate. It is used to establish a secure connection between the server and clients.
//          - cert: This property should contain the SSL/TLS certificate itself. It is used to authenticate the server to clients and establish a secure connection.
// req: The req parameter in the callback function represents the incoming HTTP request from the client. It contains information about the request, such as the method (GET, POST, etc.) and the URL.
// res: The res parameter in the callback function represents the HTTP response that will be sent back to the client. It provides methods for setting headers, writing data to the response body, and ending the response.
const server = http2.createSecureServer(
  {
    key: fs.readFileSync("./keys/server.key"), // Read the private key for the SSL/TLS certificate from the specified file path and include it in the options object for creating a secure server.
    cert: fs.readFileSync("./keys/server.crt"), // Read the SSL/TLS certificate from the specified file path and include it in the options object for creating a secure server.
  },
  (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    // Server as renderer: In this example, the server is acting as a renderer by generating an HTML response
    // based on the incoming request URL.
    // res.writeHead(200, { "Content-Type": "text/html" }); // Set the response status code to 200 (OK) and the Content-Type header to text/html.
    // res.write(`<h1>URL: ${req.url}</h1>`); //
    // res.end(); // End the response and send it back to the client. The response will contain an HTML heading with the URL of the request.

    // const data = {
    //   name: "John Doe",
    //   age: 30,
    //   city: "New York",
    // };

    // res.writeHead(200, { "Content-Type": "application/json" }); // Set the response status code to 200 (OK) and the Content-Type header to application/json.
    // res.write(JSON.stringify(data)); // Convert the data object to a JSON string and write it to the response body.
    // res.end(); // End the response and send it back to the client. The response will contain the JSON representation of the data object.

    if (req.url === "/") {
      const htmlFile = fs.readFileSync("./public/index.html", "utf-8"); // Read the contents of the index.html file synchronously and store it in the htmlFile variable.
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(htmlFile);
      res.end();

      return;
    }

    if (req.url?.endsWith(".js")) {
      res.writeHead(200, { "Content-Type": "application/javascript" });
    } else if (req.url?.endsWith(".css")) {
      res.writeHead(200, { "Content-Type": "text/css" });
    }

    try {
      const responseContent = fs.readFileSync(`./public${req.url}`, "utf-8"); // Read the contents of the requested file synchronously based on the URL of the request and store it in the responseContent variable.
      res.write(responseContent); // Write the contents of the requested file to the response body.
      res.end(); // End the response and send it back to the client. The response will contain the contents of the requested file.
    } catch (error) {
      res.writeHead(404, { "Content-Type": "text/html" }); // If an error occurs (e.g., the requested file is not found), set the response status code to 404 (Not Found) and the Content-Type header to text/plain.
      res.write("<h1>404 Not Found</h1>"); // Write a simple 404 message to the response body.
      res.end(); // End the response and send it back to the client.
    }
  },
);

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080/");
});
