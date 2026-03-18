import * as http from "http";
import * as fs from "fs";

// Create an HTTP server that listens on port 8080 and responds with "Hello, World!" to any request.
// This is a simple example of an HTTP server using Node.js.
// You can run this code in a Node.js environment, and it will start a server that listens on port 8080.
// When you access http://localhost:8080 in your browser or send a request to that URL.
// You will receive a response with the message "Hello, World!".
// http: The built-in Node.js module for creating HTTP servers and handling HTTP requests and responses.
// createServer: A method from the http module that creates an HTTP server.
//               It takes a callback function as an argument, which is called every time a request is received by the server.
// request: The incoming HTTP request object, which contains information about the request such as headers, URL, and method.
// response: The HTTP response object, which is used to send a response back to the client.
//           You can set the status code, headers, and body of the response using this object.
const server = http.createServer((req, res) => {
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

  const responseContent = fs.readFileSync(`./public${req.url}`, "utf-8"); // Read the contents of the requested file synchronously based on the URL of the request and store it in the responseContent variable.
  res.write(responseContent); // Write the contents of the requested file to the response body.
  res.end(); // End the response and send it back to the client. The response will contain the contents of the requested file.
});

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080/");
});
