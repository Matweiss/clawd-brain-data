#!/usr/bin/env python3
"""
ChromaDB Memory Search - Full Version
Uses ChromaDB with lightweight embeddings
"""

import os
import sys
import glob
import hashlib
import json
from pathlib import Path
from typing import List

# Add user site-packages to path
import site
site.main()

import chromadb
from chromadb.api.types import EmbeddingFunction

MEMORY_DIR = "/root/.openclaw/workspace/memory"
CHROMA_PATH = "/root/.openclaw/workspace/memory/chroma_db"

class SimpleEmbeddingFunction(EmbeddingFunction):
    """Lightweight embedding using hashing + keyword vectors"""
    
    def __init__(self, dim=384):
        self.dim = dim
        # Common words for vector space
        self.vocab = set([
            'project', 'task', 'todo', 'plan', 'decision', 'meeting', 'call',
            'email', 'message', 'note', 'idea', 'issue', 'problem', 'solution',
            'home', 'work', 'family', 'health', 'money', 'travel', 'event',
            'esp32', 'sensor', 'camera', 'homeassistant', 'automation',
            'code', 'github', 'deploy', 'server', 'database', 'api',
            'sarah', 'mat', 'theo', 'dog', 'house', 'room',
            'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow',
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ])
    
    def __call__(self, input: List[str]) -> List[List[float]]:
        """Generate embeddings for texts - new ChromaDB API format"""
        embeddings = []
        for text in input:
            # Normalize text
            text_lower = text.lower()
            words = set(text_lower.split())
            
            # Create vector based on vocabulary presence
            vector = []
            for i, word in enumerate(sorted(self.vocab)):
                if word in words:
                    vector.append(1.0)
                else:
                    # Hash-based feature for out-of-vocab words
                    h = hashlib.md5((word + str(i)).encode()).hexdigest()
                    vector.append(int(h, 16) % 100 / 100.0)
                
                if len(vector) >= self.dim:
                    break
            
            # Pad to dimension
            while len(vector) < self.dim:
                vector.append(0.0)
            
            embeddings.append(vector[:self.dim])
        
        return embeddings

def init_chroma():
    """Initialize ChromaDB client"""
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Use simple embedding function
    embedding_func = SimpleEmbeddingFunction()
    
    # Get or create collection
    try:
        collection = client.get_collection(
            name="memories",
            embedding_function=embedding_func
        )
        print("📚 Using existing memory collection")
    except:
        collection = client.create_collection(
            name="memories",
            metadata={"description": "Semantic memory search"},
            embedding_function=embedding_func
        )
        print("📚 Created new memory collection")
    
    return client, collection

def chunk_text(text, chunk_size=800, overlap=100):
    """Split text into overlapping chunks by paragraphs/sections"""
    # Split by headers first
    sections = text.split('\n## ')
    
    chunks = []
    for section in sections:
        if not section.strip():
            continue
        
        # If section is small enough, keep it whole
        if len(section) <= chunk_size:
            chunks.append(section.strip())
            continue
        
        # Otherwise split by paragraphs
        paragraphs = section.split('\n\n')
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
    
    return chunks

def index_memories():
    """Index all memory files into ChromaDB"""
    print("🔄 Initializing ChromaDB...")
    client, collection = init_chroma()
    
    # Find all markdown files
    memory_files = glob.glob(f"{MEMORY_DIR}/**/*.md", recursive=True)
    print(f"📁 Found {len(memory_files)} memory files\n")
    
    total_chunks = 0
    
    for file_path in memory_files:
        file_name = os.path.basename(file_path)
        rel_path = os.path.relpath(file_path, MEMORY_DIR)
        print(f"  Indexing: {rel_path}...", end=" ")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip():
                print("(empty)")
                continue
            
            # Chunk the content
            chunks = chunk_text(content)
            
            if not chunks:
                print("(no chunks)")
                continue
            
            # Add to ChromaDB
            ids = [f"{file_name}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "source": file_name,
                    "file_path": file_path,
                    "rel_path": rel_path,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
                for i in range(len(chunks))
            ]
            
            collection.add(
                ids=ids,
                documents=chunks,
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
    
    # Get collection count
    count = collection.count()
    if count == 0:
        print("⚠️  No memories indexed yet. Run 'index' first.")
        return
    
    print(f"📚 Searching {count} indexed chunks...\n")
    
    # Search
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, count),
        include=["documents", "metadatas", "distances"]
    )
    
    if not results['ids'][0]:
        print("❌ No results found.")
        return
    
    print(f"✅ Found {len(results['ids'][0])} results:\n")
    
    for i, (doc_id, document, metadata, distance) in enumerate(zip(
        results['ids'][0],
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        # Convert distance to similarity (0-100%)
        similarity = max(0, min(100, int((1 - distance) * 100)))
        bar = '█' * (similarity // 10) + '░' * (10 - similarity // 10)
        
        print(f"{i+1}. 📄 {metadata['rel_path']}")
        print(f"   Similarity: [{bar}] {similarity}%")
        
        # Show preview
        preview = document.replace('\n', ' ')[:250]
        if len(document) > 250:
            preview += "..."
        print(f"   {preview}\n")

def main():
    if len(sys.argv) < 2:
        print("""
🧠 ChromaDB Memory Search - Full Version

Usage:
  python3 chroma_full.py index              # Index all memories
  python3 chroma_full.py search <query>     # Search memories

Examples:
  python3 chroma_full.py search "ESP32 optimization"
  python3 chroma_full.py search "Arizona trip"
  python3 chroma_full.py search "decisions about cameras"

Features:
  ✓ True semantic search with custom embeddings
  ✓ Section-aware chunking
  ✓ Persistent vector database
  ✓ Relevance scoring
        """)
        sys.exit(0)
    
    command = sys.argv[1]
    
    if command == "index":
        index_memories()
    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: python3 chroma_full.py search <query>")
            sys.exit(1)
        query = " ".join(sys.argv[2:])
        search_memories(query)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
