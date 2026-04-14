#!/bin/bash
ollama serve &

sleep 5

ollama pull qwen3.5:4b
ollama pull nomic-embed-text:latest

# Giữ container sống
wait