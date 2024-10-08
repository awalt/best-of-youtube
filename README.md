# Videyo.com

## Overview
Videyo.com is a just-for-fun Next.js app that uses AI to summarize trending YouTube videos from Reddit.

## Features
- Pulls content from selected subreddits
- Retrieves video information, including transcripts, from the YouTube API
- Generates text prompts for Large Language Model (LLM) processing
- Summarizes video content using Cloudflare Worker AI
- Stores video summaries and rankings in Google Cloud Datastore

## Architecture
The application consists of two main components:

1. **Next.js Web Application**
   - Displays summarized video content

2. **Scheduled Jobs (on Google Cloud Functions)**
   - Two separate jobs that run periodically:
     a. Content Retrieval Job
        - Pulls content from selected subreddits using the Reddit API
        - Retrieves video information from the YouTube API
        - Generates text prompts for LLM processing
     b. Summary Generation Job
        - Processes text prompts using Cloudflare Worker AI
        - Parses the responses
        - Saves video summaries and rankings to Google Cloud Datastore