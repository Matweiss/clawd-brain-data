#!/usr/bin/env python3
"""
ChromaDB Memory Search - Semantic search for your memories
Requires: pip install chromadb sentence-transformers
"""

import os
import sys
import glob
from pathlib import Path

# Check if ChromaDB is installed
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("📦 Installing required packages...")
    os.system("pip install -q chromadb sentence-transformers")
    import chromadb
    from sentence_transformers import SentenceTransformer

MEMORY_DIR = "/root/.openclaw/workspace/memory"
CHROMA_PATH = "/root/.openclaw/workspace/memory/chroma_db"

def init_chroma():
    """Initialize ChromaDB client"""
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Get or create collection
    try:
        collection = client.get_collection("memories")
        print("📚 Using existing memory collection")
    except:
        collection = client.create_collection(
            name="memories",
            metadata={"description": "Semantic memory search"}
        )
        print("📚 Created new memory collection")
    
    return client, collection

def chunk_text(text, chunk_size=500, overlap=100):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def index_memories():
    """Index all memory files into ChromaDB"""
    print("🔄 Initializing ChromaDB...")
    client, collection = init_chroma()
    
    print("🧠 Loading embedding model (this may take a minute)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Find all markdown files
    memory_files = glob.glob(f"{MEMORY_DIR}/**/*.md", recursive=True)
    print(f"📁 Found {len(memory_files)} memory files\n")
    
    total_chunks = 0
    
    for file_path in memory_files:
        file_name = os.path.basename(file_path)
        print(f"  Indexing: {file_name}...", end=" ")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip():
                print("(empty)")
                continue
            
            # Chunk the content
            chunks = chunk_text(content)
            
            # Create embeddings
            embeddings = model.encode(chunks).tolist()
            
            # Add to ChromaDB
            ids = [f"{file_name}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "source": file_name,
                    "file_path": file_path,
                    "chunk_index": i
                }
                for i in range(len(chunks))
            ]
            
            collection.add(
                ids=ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            total_chunks += len(chunks)
            print(f"✓ ({len(chunks)} chunks)")
            
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print(f"\n✅ Indexed {total_chunks} chunks from {len(memory_files)} files!")
    print(f"📍 Database saved to: {CHROMA_PATH}")

def search_memories(query, n_results=5):
    """Search memories semantically"""
    print(f"\n🔍 Searching: \"{query}\"\n")
    
    client, collection = init_chroma()
    
    print("🧠 Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Create query embedding
    query_embedding = model.encode([query]).tolist()
    
    # Search
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    if not results['ids'][0]:
        print("No results found.")
        return
    
    print(f"Found {len(results['ids'][0])} results:\n")
    
    for i, (doc_id, document, metadata, distance) in enumerate(zip(
        results['ids'][0],
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        relevance = max(0, min(100, int((1 - distance) * 100)))
        print(f"{i+1}. [{metadata['source']}] (relevance: {relevance}%)")
        
        # Show first 200 chars of result
        preview = document.replace('\n', ' ')[:200]
        if len(document) > 200:
            preview += "..."
        print(f"   {preview}\n")

def main():
    if len(sys.argv) < 2:
        print("""
🧠 ChromaDB Memory Search

Usage:
  python3 chroma_memory.py index              # Index all memories
  python3 chroma_memory.py search <query>     # Search memories

Examples:
  python3 chroma_memory.py search "ESP32 optimization"
  python3 chroma_memory.py search "Arizona trip"
  python3 chroma_memory.py search "what did we decide about cameras"
        """)
        sys.exit(0)
    
    command = sys.argv[1]
    
    if command == "index":
        index_memories()
    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: python3 chroma_memory.py search <query>")
            sys.exit(1)
        query = " ".join(sys.argv[2:])
        search_memories(query)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
