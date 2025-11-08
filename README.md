# 🎭 Shakespearean Translator

A simple web application that transforms modern English into eloquent Shakespearean English using AI.

## Features

- Clean, modern UI with gradient design
- Real-time text translation using OpenAI's GPT-3.5-Turbo
- Responsive design that works on all devices
- Keyboard shortcut (Ctrl+Enter) for quick translation
- Ready for deployment on Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deploying to Vercel

### Method 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add your environment variable in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `OPENAI_API_KEY` with your API key

### Method 2: Deploy via GitHub

1. Push your code to a GitHub repository

2. Go to [vercel.com](https://vercel.com)

3. Click "Import Project" and select your repository

4. Add environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

5. Click "Deploy"

## Usage

1. Enter your text in the input box
2. Click "Translate to Shakespearean" or press Ctrl+Enter
3. View your translated text in Shakespearean English
4. Use the "Clear" button to start over

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI API**: OpenAI GPT-3.5-Turbo
- **Styling**: Custom CSS
- **Deployment**: Vercel

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

