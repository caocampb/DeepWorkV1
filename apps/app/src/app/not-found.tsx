export default function NotFound() {
  return (
    <html>
      <head>
        <title>Page Not Found - Deep Work</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f7f7f7;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
          }
          .container {
            max-width: 600px;
            padding: 2rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
          }
          a {
            color: #0070f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <a href="/">Go back home</a>
        </div>
      </body>
    </html>
  );
} 