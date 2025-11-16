# Knowledge Base Searcher
Intelligent Document Analysis and Search Platform

This Next.js application, designed for a serverless environment (Vercel), provides a comprehensive solution for uploading, AI-analyzing, and searching various documents (PDFs, DOCX, XLSX, images). It utilizes Vercel Blob for persistent storage and MongoDB Atlas Search for advanced indexing.

# Project Setup and Deployment

Prerequisites:

 Node.js (version 20.9+), a MongoDB Atlas cluster, and specific API Keys:
 
 Node.js: Must be version 20.9 or later.
 
 MongoDB Atlas: Active cluster required for data persistence.
 
 API Keys: OpenRouter API Key (for LLM summarization) and OCR.space API Key (for PDF processing).
 
 Vercel Account (Required for production deployment).

Local Installation and Execution

Repository Cloning:

 git clone <your-repo-url>

 cd knowledge-search

# Dependency Installation:

 npm install

Environment Variable Configuration:

 MONGODB_URI=<Your MongoDB Atlas Connection String)>

 OPENROUTER_API_KEY=<Your OpenRouter API Key>
 
 OCR_SPACE_API_KEY=<Your OCR.space API Key>
 
 BLOB_READ_WRITE_TOKEN is required for local testing of Blob functions.

# Development Server Initialization:

 npm run dev
 The application will be accessible at http://localhost:3000.

# Vercel Deployment Protocol

The architecture is built for Vercel, requiring cloud storage due to the serverless environment's read-only filesystem.
Vercel Blob Resource Provisioning: Create the Vercel Blob Store prior to deployment to generate the necessary BLOB_READ_WRITE_TOKEN.

Project Import: Import the Git repository into Vercel Dashboard.

Environment Variable Configuration (Vercel): Define all critical environment variables (MONGODB_URI, OPENROUTER_API_KEY, OCR_SPACE_API_KEY, BLOB_READ_WRITE_TOKEN) in Project Settings > Environment Variables, scoped to Production.

Deployment Execution: Trigger a new deployment.

# Decisions:

 MongoDB for scalable storage of metadata (summaries, tags) and extracted text, ideal for heterogeneous file analysis results.
 
 Vercel Blob for Serverless storage. Replaces non-persistent local file operations with a dedicated CDN, ensuring reliable storage and public accessibility.
 
 MongoDB Atlas Search as it overcomes standard query performance issues for large text fields; provides an indexed solution for high-performance fuzzy matching and relevance ranking.
 
 OpenRouter (Qwen) for multimodal capabilities and its ability to enforce a structured JSON output (summary, tags), vital for reliable backend processing.
 
 OCR.space API for robust extraction from all PDF types, including scanned or image-only files. This circumvents the instability of server-side PDF parsing libraries.

# Application Workflow Overview

Uploading:

 Client-Side Encoding: File is encoded into a Base64 string and submitted to the /api/upload endpoint.
 
 Cloud Storage: The file buffer is uploaded to Vercel Blob (put()), and the public URL is recorded.
 
 Content Analysis: The content is directed to the appropriate processing service: OCR.space (PDF), Local Parser (Mammoth/XLSX) (Documents), or AI Vision Module (Images).
 
 LLM Processing: Extracted content generates a concise summary and 3 key tags using the OpenRouter LLM.
 
 Database Commit: File metadata, public URL, summary, and tags are persisted to the MongoDB Atlas cluster.
 
Searching and Management:

 Search Query Handling: Queries use MongoDB Atlas Search to efficiently search and rank results across metadata, tags, and full scannedText.
 
 Filtering: Users can refine results using non-indexed filters like date range or file category.
 
 Access & Deletion: The sidebar provides access via the Vercel Blob URL (file.path). The /api/delete endpoint handles deletion of both the physical file from Vercel Blob (del()) and the corresponding metadata from MongoDB, simultaneously updating global usage statistics.

# Future Scope and Proposed Enhancements

 Authentication Implementation: Integrate a user authentication system (e.g., NextAuth.js) to enforce access control and establish private user namespaces.
 
 Redundancy and Cost Optimization: Implement a tiered parsing strategy: attempt local PDF parsing first, using the external OCR API only as a reliable fallback.
 
 Operational Reliability: Introduce standardized retry mechanisms with exponential backoff for all dependent external API calls (LLM, OCR).
 
 System Maintenance: Convert manual credit cycle reset logic into a scheduled Vercel Cron Job.
 
 Performance Optimization: Integrate dynamic image handling services for improved client-side rendering speed of file previews.
