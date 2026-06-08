# Google Docs Lite

A real-time document editor built with Node.js, Express, MongoDB, and Socket.io. This project demonstrates real-time document synchronization and persistence, allowing connected users to view and edit shared documents with changes broadcast across clients.

## Features

- 📝 **Real-time Updates** - Changes made by one connected user are broadcast to other users viewing the same document using Socket.io
- 💾 **Auto-save** - Document changes are automatically persisted to MongoDB
- 🔗 **Document Management** - Create, retrieve, and update documents
- 🚀 **Lightweight Architecture** - Express, MongoDB, and Socket.io for efficient document synchronization
- 🌐 **CORS Enabled** - Support for cross-origin requests

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io
- **Environment Management**: dotenv

## Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GajulaSamatha/google-docs-lite.git
   cd google-docs-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   ```

## Running the Application

Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000` (or the port specified in your `.env`)

## API Endpoints

### Documents

**Create a Document**
- `POST /document`
- Request body:
  ```json
  {
    "title": "Document Title",
    "content": "Initial content",
    "owner": "username"
  }
  ```
- Response: Returns the created document with MongoDB ID

**Get a Document**
- `GET /document/:id`
- Returns the document with the specified ID

**Update a Document**
- `PUT /document/:id`
- Request body:
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content"
  }
  ```
- Response: Returns the updated document

## WebSocket Events

### Client → Server Events

- `join-document` - Join a document's collaborative editing room
  - Data: `documentId` (string)

- `load-document` - Load the initial content of a document
  - Data: `docId` (string)

- `send-changes` - Broadcast changes to other connected users
  - Data: `{ docId, content }`

- `auto-save` - Save document changes to the database
  - Data: `{ docId, content }`

### Server → Client Events

- `load-content` - Send the initial document content
- `receive-changes` - Receive changes from other users
- `bad-request` - Error response for invalid requests
- `not-found` - Error response when document is not found
- `server-error` - Error response for server errors

## How It Works

1. **User connects** - Client connects via WebSocket and emits `load-document` event
2. **Content loaded** - Server fetches document from MongoDB and sends initial content to client
3. **Join room** - Client joins a Socket.io room identified by the document ID
4. **User edits** - Client sends changes via `send-changes` event
5. **Changes broadcast** - Server broadcasts changes to all other clients in the document room
6. **Auto-save** - Changes are automatically persisted to MongoDB via the `auto-save` event

## Project Structure

```
google-docs-lite/
├── models/           # MongoDB Mongoose models
├── src/              # Frontend source files
├── server.js         # Main server file
├── package.json      # Project dependencies
├── .env              # Environment variables (not included)
└── README.md         # This file
```

## Error Handling

The application handles various error scenarios:
- Missing required fields (returns 400)
- Document not found (returns 404)
- Server errors (returns 500)
- Invalid socket requests (emits error events)

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Document sharing and permissions
- [ ] Presence indicators (show who's editing)
- [ ] Operational Transform (OT) or CRDT for conflict resolution
- [ ] Change history and version control
- [ ] Rich text editing features
- [ ] Comments and collaborative feedback
- [ ] Cursor position tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built to demonstrate real-time document synchronization using Socket.IO.** 🚀
